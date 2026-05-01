export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  images?: string[];
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  };
}

export interface ModelOptions {
  temperature?: number;
  top_p?: number;
  num_predict?: number;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
}

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }

  async chat(
    model: string,
    messages: OllamaMessage[],
    onChunk?: (chunk: string) => void,
    options?: ModelOptions,
    tools?: ToolDefinition[],
    toolExecutor?: (name: string, args: Record<string, unknown>) => Promise<string>,
  ): Promise<string> {
    try {
      if (tools && tools.length > 0 && toolExecutor) {
        return await this.chatWithTools(model, messages, tools, toolExecutor, onChunk, options);
      }
      return await this.chatStreamed(model, messages, onChunk, options);
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw error;
    }
  }

  private async chatStreamed(
    model: string,
    messages: OllamaMessage[],
    onChunk?: (chunk: string) => void,
    options?: ModelOptions,
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: !!onChunk, options }),
    });

    if (!response.ok) throw new Error(`Error Ollama: ${response.status}`);

    if (onChunk) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream no disponible');

      let fullContent = '';
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              fullContent += json.message.content;
              onChunk(json.message.content);
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
      return fullContent;
    } else {
      const data = await response.json();
      return data.message.content;
    }
  }

  private async chatWithTools(
    model: string,
    messages: OllamaMessage[],
    tools: ToolDefinition[],
    toolExecutor: (name: string, args: Record<string, unknown>) => Promise<string>,
    onChunk?: (chunk: string) => void,
    options?: ModelOptions,
  ): Promise<string> {
    const workingMessages: OllamaMessage[] = [...messages];

    // Max 5 tool-call rounds to prevent infinite loops
    for (let round = 0; round < 5; round++) {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: workingMessages, stream: false, tools, options }),
      });

      if (!response.ok) throw new Error(`Error Ollama: ${response.status}`);

      const data = await response.json();
      const assistantMessage: OllamaMessage = data.message;

      // No tool calls → deliver final response
      if (!assistantMessage.tool_calls?.length) {
        if (onChunk && assistantMessage.content) {
          onChunk(assistantMessage.content);
        }
        return assistantMessage.content ?? '';
      }

      // Add assistant message with tool_calls to history
      workingMessages.push(assistantMessage);

      // Notify the UI that a tool is being called
      if (onChunk) {
        const names = assistantMessage.tool_calls.map(tc => tc.function.name).join(', ');
        onChunk(`\n> 🔧 *Ejecutando herramienta: \`${names}\`...*\n\n`);
      }

      // Execute every tool call and feed results back
      for (const toolCall of assistantMessage.tool_calls) {
        const result = await toolExecutor(toolCall.function.name, toolCall.function.arguments);
        workingMessages.push({ role: 'tool', content: result });
      }
    }

    throw new Error('Se superó el límite de llamadas a herramientas (5 rondas).');
  }
}
