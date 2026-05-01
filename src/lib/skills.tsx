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
    description: 'Ejecuta comandos de linux en un entorno seguro.',
    icon: <Terminal size={18} />,
    active: true,
  },
  {
    id: 'files',
    name: 'Gestor de Archivos',
    description: 'Accede y modifica archivos del proyecto.',
    icon: <Folder size={18} />,
    active: true,
  },
  {
    id: 'system',
    name: 'Monitor de Sistema',
    description: 'Visualiza recursos y procesos en tiempo real.',
    icon: <Activity size={18} />,
    active: true,
  },
  {
    id: 'coder',
    name: 'Editor Pro',
    description: 'Asistente de codificación con análisis estático.',
    icon: <Code size={18} />,
    active: true,
  },
  {
    id: 'web',
    name: 'Buscador Web',
    description: 'Busca información actualizada en internet via SearXNG.',
    icon: <Search size={18} />,
    active: false,
    toolName: 'search_web',
  },
  {
    id: 'cloud',
    name: 'Ollama Cloud',
    description: 'Conecta con modelos remotos de Ollama.',
    icon: <Globe size={18} />,
    active: false,
  },
];

// ---------------------------------------------------------------------------
// Tool definitions (Ollama tool-calling format)
// ---------------------------------------------------------------------------

const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  search_web: {
    type: 'function',
    function: {
      name: 'search_web',
      description:
        'Busca información actualizada en internet. Usa esta herramienta cuando el usuario pregunte sobre noticias recientes, eventos actuales, datos que pueden haber cambiado después de tu entrenamiento, o cualquier información que requiera búsqueda web. Devuelve títulos, URLs y resúmenes de los resultados encontrados.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'La consulta de búsqueda optimizada. Usa inglés para obtener más resultados; usa español si la pregunta es muy específica de habla hispana.',
          },
          num_results: {
            type: 'string',
            description: 'Número de resultados a obtener, entre 3 y 10. Por defecto 5.',
          },
        },
        required: ['query'],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Tool executor — called by OllamaService when the model invokes a tool
// ---------------------------------------------------------------------------

const SEARCH_PROXY_URL = 'http://localhost:3001';

export async function executeSkillTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  if (name === 'search_web') {
    const query = String(args.query ?? '').trim();
    const num = Math.min(Math.max(parseInt(String(args.num_results ?? '5'), 10), 1), 10);

    if (!query) {
      return JSON.stringify({ error: 'La consulta de búsqueda está vacía.' });
    }

    try {
      const response = await fetch(
        `${SEARCH_PROXY_URL}/api/search?q=${encodeURIComponent(query)}&num=${num}`,
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

      // Return a structured payload the model can reason about
      return JSON.stringify({
        query: data.query,
        source: data.source,
        results: data.results.map((r, i) => ({
          index: i + 1,
          title: r.title,
          url: r.url,
          snippet: r.snippet,
        })),
      });
    } catch (err) {
      return JSON.stringify({
        error: `No se pudo conectar con el proxy de búsqueda en ${SEARCH_PROXY_URL}. Asegúrate de que el servidor esté arrancado.`,
        detail: String(err),
      });
    }
  }

  return JSON.stringify({ error: `Herramienta desconocida: ${name}` });
}

// ---------------------------------------------------------------------------
// Helper: build the tool list to pass to OllamaService from active skills
// ---------------------------------------------------------------------------

export function getActiveTools(skills: Skill[]): ToolDefinition[] {
  return skills
    .filter(s => s.active && s.toolName && TOOL_DEFINITIONS[s.toolName])
    .map(s => TOOL_DEFINITIONS[s.toolName!]);
}

