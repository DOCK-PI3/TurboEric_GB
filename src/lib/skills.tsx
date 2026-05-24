import React from 'react';
import { Terminal, Folder, Activity, Code, Search, Globe } from 'lucide-react';
import type { ToolDefinition } from './ollama';

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  /** Name of the Ollama tool function this skill maps to (if any). */
  toolName?: string;
}

export const INITIAL_SKILLS: Skill[] = [
  {
    id: 'terminal',
    name: 'Terminal Linux',
    description: 'Ejecuta comandos del sistema en tiempo real.',
    icon: <Terminal size={18} />,
    active: true,
    toolName: 'execute_terminal',
  },
  {
    id: 'files',
    name: 'Gestor de Archivos',
    description: 'Lee, escribe, lista y elimina archivos del proyecto.',
    icon: <Folder size={18} />,
    active: true,
    toolName: 'file_manager',
  },
  {
    id: 'system',
    name: 'Monitor de Sistema',
    description: 'Obtiene CPU, memoria, plataforma y procesos del sistema.',
    icon: <Activity size={18} />,
    active: true,
    toolName: 'system_monitor',
  },
  {
    id: 'coder',
    name: 'Editor Pro',
    description: 'Analiza, genera y refactoriza código con acceso al proyecto.',
    icon: <Code size={18} />,
    active: true,
    toolName: 'code_assistant',
  },
  {
    id: 'web',
    name: 'Buscador Web',
    description: 'Busca información actualizada en internet.',
    icon: <Search size={18} />,
    active: true,
    toolName: 'search_web',
  },
  {
    id: 'cloud',
    name: 'Ollama Cloud',
    description: 'Conecta y gestiona instancias remotas de Ollama.',
    icon: <Globe size={18} />,
    active: true,
    toolName: 'ollama_cloud',
  },
];

// ---------------------------------------------------------------------------
// Tool definitions (Ollama tool-calling format) — UNA POR CADA SKILL
// ---------------------------------------------------------------------------

const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {

  // ── 1. Búsqueda Web ──────────────────────────────────────────────────────
  search_web: {
    type: 'function',
    function: {
      name: 'search_web',
      description:
        'Busca información actualizada en internet. DEBES usar esta herramienta SIEMPRE que el usuario pregunte sobre: clima/tiempo (hoy, mañana, esta semana), noticias recientes o de última hora, precios actuales de productos/acciones/criptomonedas, eventos deportivos (resultados, próximos partidos), información sobre personas/empresas actuales, datos que cambian con el tiempo, o cualquier cosa que haya ocurrido después de tu fecha de entrenamiento. NO respondas basándote en tu conocimiento interno si puedes buscar la información actualizada. Devuelve títulos, URLs y resúmenes de los resultados encontrados. Si el usuario pregunta por el clima, genera una consulta como "weather [ciudad] [fecha]" o "tiempo [ciudad] [fecha] previsión".',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'La consulta de búsqueda optimizada. Para clima: "weather [city] [date] forecast". Para noticias: "latest [topic] 2026". Para información general: usa el idioma que mejor se ajuste a la consulta.',
          },
          num_results: {
            type: 'integer',
            description: 'Número de resultados a obtener, entre 3 y 10. Por defecto 5.',
          },
        },
        required: ['query'],
      },
    },
  },

  // ── 2. Terminal Linux ────────────────────────────────────────────────────
  execute_terminal: {
    type: 'function',
    function: {
      name: 'execute_terminal',
      description:
        'Ejecuta comandos de terminal en el servidor. Devuelve stdout, stderr y código de salida. Útil para compilar, instalar dependencias, ejecutar scripts, git, y cualquier operación de línea de comandos.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'El comando a ejecutar (bash). Ej: "ls -la", "npm install", "git status"',
          },
          timeout: {
            type: 'integer',
            description: 'Timeout máximo en segundos. Mínimo 1, máximo 60. Por defecto 15.',
          },
        },
        required: ['command'],
      },
    },
  },

  // ── 3. Gestor de Archivos ────────────────────────────────────────────────
  file_manager: {
    type: 'function',
    function: {
      name: 'file_manager',
      description:
        'Gestiona archivos del proyecto: leer contenido, escribir/crear archivos, listar directorios, y eliminar archivos. Todas las rutas son relativas a la raíz del proyecto.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Acción a realizar: "read" (leer archivo), "write" (escribir/crear), "list" (listar directorio), "delete" (eliminar archivo).',
          },
          path: {
            type: 'string',
            description: 'Ruta del archivo o directorio (relativa al proyecto). Ej: "src/index.ts"',
          },
          content: {
            type: 'string',
            description: 'Contenido a escribir (obligatorio si action="write").',
          },
        },
        required: ['action', 'path'],
      },
    },
  },

  // ── 4. Monitor de Sistema ────────────────────────────────────────────────
  system_monitor: {
    type: 'function',
    function: {
      name: 'system_monitor',
      description:
        'Obtiene información del sistema en tiempo real: uso de CPU, memoria disponible/total, plataforma, arquitectura, y procesos activos. No requiere permisos especiales.',
      parameters: {
        type: 'object',
        properties: {
          info_type: {
            type: 'string',
            description: 'Tipo de información: "cpu" (núcleos/arquitectura), "memory" (RAM total/disponible), "platform" (SO/versión), "all" (todo).',
          },
        },
        required: ['info_type'],
      },
    },
  },

  // ── 5. Editor Pro / Code Assistant ──────────────────────────────────────
  code_assistant: {
    type: 'function',
    function: {
      name: 'code_assistant',
      description:
        'Analiza, genera o refactoriza código con acceso al proyecto. Puede leer archivos, analizar sintaxis, y generar código listo para producción. Usa esta herramienta para tareas de programación complejas.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Acción: "analyze" (analizar código existente), "generate" (generar nuevo código), "refactor" (refactorizar código).',
          },
          language: {
            type: 'string',
            description: 'Lenguaje de programación (opcional). Ej: "typescript", "python", "rust", "go".',
          },
          code: {
            type: 'string',
            description: 'Código a analizar o transformar (opcional si se provee file_path).',
          },
          file_path: {
            type: 'string',
            description: 'Ruta del archivo del proyecto a leer/modificar (opcional si se provee code).',
          },
          instructions: {
            type: 'string',
            description: 'Instrucciones específicas para la generación o refactorización.',
          },
        },
        required: ['action'],
      },
    },
  },

  // ── 6. Ollama Cloud ──────────────────────────────────────────────────────
  ollama_cloud: {
    type: 'function',
    function: {
      name: 'ollama_cloud',
      description:
        'Gestiona conexiones a instancias de Ollama locales o remotas. Permite listar modelos disponibles, probar conectividad, y cambiar de modelo activo.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Acción: "list_models" (lista modelos disponibles), "test_connection" (prueba conexión a una URL), "switch_model" (cambia al modelo especificado).',
          },
          url: {
            type: 'string',
            description: 'URL del servidor Ollama (opcional, requerido para test_connection). Ej: "http://192.168.1.100:11434"',
          },
          model: {
            type: 'string',
            description: 'Nombre del modelo (requerido para switch_model). Ej: "llama3.1:8b", "codellama:13b"',
          },
        },
        required: ['action'],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Server base URL
// ---------------------------------------------------------------------------
const PROXY_URL = 'http://localhost:3001';

// ---------------------------------------------------------------------------
// Tool executor — called by OllamaService when the model invokes a tool
// ---------------------------------------------------------------------------

export async function executeSkillTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  switch (name) {

    // ═════════════════════════════════════════════════════════════════════
    // 1. Búsqueda Web
    // ═════════════════════════════════════════════════════════════════════
    case 'search_web': {
      const query = String(args.query ?? '').trim();
      const num = Math.min(Math.max(parseInt(String(args.num_results ?? '5'), 10) || 5, 1), 10);

      if (!query) {
        return JSON.stringify({ error: 'La consulta de búsqueda está vacía.' });
      }

      // Leer API Keys de localStorage si existen
      const readKey = (key: string) => {
        try {
          return typeof localStorage !== 'undefined'
            ? (localStorage.getItem(key) || '').trim()
            : '';
        } catch {
          return '';
        }
      };
      const braveKey = readKey('braveApiKey');
      const serperKey = readKey('serperApiKey');
      const searchProvider = readKey('searchProvider') || 'auto';
      const braveParam = braveKey ? `&brave_key=${encodeURIComponent(braveKey)}` : '';
      const serperParam = serperKey ? `&serper_key=${encodeURIComponent(serperKey)}` : '';
      const providerParam = `&preferred=${encodeURIComponent(searchProvider)}`;

      try {
        const response = await fetch(
          `${PROXY_URL}/api/search?q=${encodeURIComponent(query)}&num=${num}${braveParam}${serperParam}${providerParam}`,
        );

        if (!response.ok) {
          return JSON.stringify({ error: `El proxy de búsqueda respondió con HTTP ${response.status}. ¿Está corriendo el servidor proxy?` });
        }

        const data = await response.json() as {
          query: string;
          source: string;
          results: { title: string; url: string; snippet: string; engine: string }[];
        };

        if (!data.results?.length) {
          return JSON.stringify({ query, error: 'No se encontraron resultados.' });
        }

        return JSON.stringify({
          query: data.query,
          source: data.source,
          count: data.results.length,
          results: data.results.map((r, i) => ({
            index: i + 1,
            title: r.title,
            url: r.url,
            snippet: r.snippet,
          })),
        });
      } catch (err) {
        return JSON.stringify({
          error: `No se pudo conectar con el proxy de búsqueda en ${PROXY_URL}. Asegúrate de que el servidor esté arrancado.`,
          detail: String(err),
        });
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // 2. Terminal Linux
    // ═════════════════════════════════════════════════════════════════════
    case 'execute_terminal': {
      const command = String(args.command ?? '').trim();
      const timeout = Math.min(Math.max(parseInt(String(args.timeout ?? '15'), 10) || 15, 1), 60);

      if (!command) {
        return JSON.stringify({ error: 'El comando está vacío.' });
      }

      try {
        const response = await fetch(`${PROXY_URL}/api/exec`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command, timeout }),
        });

        if (!response.ok) {
          return JSON.stringify({ error: `El servidor respondió con HTTP ${response.status}` });
        }

        const result = await response.json() as {
          stdout: string;
          stderr: string;
          error: string | null;
          code: number;
        };

        return JSON.stringify(result);
      } catch (err) {
        return JSON.stringify({
          error: `No se pudo ejecutar el comando. ¿Está corriendo el servidor proxy?`,
          detail: String(err),
        });
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // 3. Gestor de Archivos
    // ═════════════════════════════════════════════════════════════════════
    case 'file_manager': {
      const action = String(args.action ?? '').trim();
      const path = String(args.path ?? '').trim();
      const content = String(args.content ?? '');

      if (!['read', 'write', 'list', 'delete'].includes(action)) {
        return JSON.stringify({ error: `Acción inválida: "${action}". Usa: read, write, list, delete.` });
      }
      if (!path) {
        return JSON.stringify({ error: 'Se requiere una ruta (path).' });
      }

      try {
        const response = await fetch(`${PROXY_URL}/api/files/${encodeURIComponent(path)}`, {
          method: action === 'write' ? 'POST' : action === 'delete' ? 'DELETE' : 'GET',
          headers: action === 'write' ? { 'Content-Type': 'application/json' } : undefined,
          body: action === 'write' ? JSON.stringify({ content }) : undefined,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          return JSON.stringify({ error: `HTTP ${response.status}`, detail: (err as any).error });
        }

        const data = await response.json();
        return JSON.stringify(data);
      } catch (err) {
        return JSON.stringify({
          error: `No se pudo conectar con el servidor proxy para la operación de archivos.`,
          detail: String(err),
        });
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // 4. Monitor de Sistema
    // ═════════════════════════════════════════════════════════════════════
    case 'system_monitor': {
      const infoType = String(args.info_type ?? 'all').trim();

      const platform = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: (navigator as any).platform || 'unknown',
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: (navigator as any).deviceMemory || 'unknown',
        cookiesEnabled: navigator.cookieEnabled,
        online: navigator.onLine,
      };

      // Get memory info from performance API if available
      const memory = (performance as any).memory
        ? {
            jsHeapSizeLimit: ((performance as any).memory.jsHeapSizeLimit / 1048576).toFixed(1) + ' MB',
            totalJSHeapSize: ((performance as any).memory.totalJSHeapSize / 1048576).toFixed(1) + ' MB',
            usedJSHeapSize: ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(1) + ' MB',
          }
        : { note: 'API de memoria no disponible en este navegador' };

      const cpu = {
        cores: navigator.hardwareConcurrency,
        architecture: 'desconocido (depende del navegador)',
      };

      const result: Record<string, unknown> = {};

      switch (infoType) {
        case 'cpu':
          result.cpu = cpu;
          break;
        case 'memory':
          result.memory = memory;
          break;
        case 'platform':
          result.platform = platform;
          break;
        default:
          result.platform = platform;
          result.cpu = cpu;
          result.memory = memory;
          break;
      }

      return JSON.stringify(result, null, 2);
    }

    // ═════════════════════════════════════════════════════════════════════
    // 5. Editor Pro / Code Assistant
    // ═════════════════════════════════════════════════════════════════════
    case 'code_assistant': {
      const action = String(args.action ?? '').trim();
      const filePath = String(args.file_path ?? '').trim();
      const code = String(args.code ?? '').trim();
      const language = String(args.language ?? '').trim();
      const instructions = String(args.instructions ?? '').trim();

      // If a file_path is given, read the file content from the project
      let fileContent = '';
      if (filePath) {
        try {
          const readResp = await fetch(`${PROXY_URL}/api/files/${encodeURIComponent(filePath)}`);
          if (readResp.ok) {
            const data = await readResp.json() as { content?: string };
            fileContent = data.content || '';
          }
        } catch {
          // fall through
        }
      }

      const combinedCode = fileContent || code;

      // For "generate" and "refactor", store instructions + code for the model to process
      // The response here gets fed back as a tool result, so be descriptive
      return JSON.stringify({
        action,
        language: language || (filePath ? filePath.split('.').pop() : 'unknown'),
        file_path: filePath || null,
        has_existing_code: !!combinedCode,
        code_length: combinedCode.length,
        instructions: instructions || 'Sin instrucciones adicionales',
        preview: combinedCode.slice(0, 2000), // first 2000 chars as context
        note: 'El contenido del archivo se ha cargado. Usa esta información junto con tu conocimiento para generar la respuesta final.',
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // 6. Ollama Cloud
    // ═════════════════════════════════════════════════════════════════════
    case 'ollama_cloud': {
      const action = String(args.action ?? '').trim();
      const url = String(args.url ?? '').trim();
      const model = String(args.model ?? '').trim();

      switch (action) {
        case 'test_connection': {
          if (!url) return JSON.stringify({ error: 'Se requiere una URL para test_connection.' });
          try {
            const resp = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) });
            if (resp.ok) {
              const data = await resp.json() as { models?: { name: string }[] };
              return JSON.stringify({
                status: 'connected',
                url,
                models: (data.models || []).map((m: { name: string }) => m.name),
                model_count: (data.models || []).length,
              });
            }
            return JSON.stringify({ status: 'error', url, http_status: resp.status });
          } catch (err) {
            return JSON.stringify({ status: 'error', url, detail: String(err) });
          }
        }

        case 'list_models': {
          try {
            const resp = await fetch(`${PROXY_URL}/api/ollama/models`);
            if (resp.ok) {
              const data = await resp.json() as { models?: string[] };
              return JSON.stringify({ models: data.models || [] });
            }
            return JSON.stringify({ error: 'No se pudieron listar los modelos.' });
          } catch (err) {
            return JSON.stringify({ error: String(err) });
          }
        }

        case 'switch_model': {
          if (!model) return JSON.stringify({ error: 'Se requiere un nombre de modelo para switch_model.' });
          return JSON.stringify({
            action: 'switch_model',
            model,
            instruction: 'El usuario quiere cambiar al modelo: ' + model + '. Informa al usuario que el cambio se ha solicitado y que ajuste la selección en la interfaz si es necesario.',
          });
        }

        default:
          return JSON.stringify({ error: `Acción inválida: "${action}". Usa: list_models, test_connection, switch_model.` });
      }
    }

    default:
      return JSON.stringify({ error: `Herramienta desconocida: ${name}` });
  }
}

// ---------------------------------------------------------------------------
// Helper: build the tool list to pass to OllamaService from active skills
// ---------------------------------------------------------------------------

export function getActiveTools(skills: Skill[]): ToolDefinition[] {
  return skills
    .filter(s => s.active && s.toolName && TOOL_DEFINITIONS[s.toolName])
    .map(s => TOOL_DEFINITIONS[s.toolName!]);
}


