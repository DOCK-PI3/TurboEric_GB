import express from 'express';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const app = express();
const PORT = 3001;

// Allow requests from the local Vite dev server
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  if (_.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});
app.use(express.json());

// ---------------------------------------------------------------------------
// SQLite — Chat History
// ---------------------------------------------------------------------------
const db = new Database('./chat_history.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Nueva conversación',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT,
    created_at TEXT NOT NULL
  );
`);

// GET /api/conversations
app.get('/api/conversations', (_, res) => {
  const rows = db.prepare('SELECT * FROM conversations ORDER BY created_at DESC').all();
  res.json(rows);
});

// POST /api/conversations
app.post('/api/conversations', (_, res) => {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO conversations (id, title, created_at) VALUES (?, ?, ?)').run(id, 'Nueva conversación', now);
  res.json({ id, title: 'Nueva conversación', created_at: now });
});

// PATCH /api/conversations/:id/title
app.patch('/api/conversations/:id/title', (req, res) => {
  const { title } = req.body as { title: string };
  if (!title) { res.status(400).json({ error: 'title required' }); return; }
  db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(title.slice(0, 60), req.params.id);
  res.json({ ok: true });
});

// DELETE /api/conversations/:id
app.delete('/api/conversations/:id', (req, res) => {
  db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/conversations/:id/messages
app.get('/api/conversations/:id/messages', (req, res) => {
  const rows = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.id);
  const parsed = rows.map((r: any) => ({
    ...r,
    images: r.images ? JSON.parse(r.images) : undefined,
  }));
  res.json(parsed);
});

// POST /api/conversations/:id/messages
app.post('/api/conversations/:id/messages', (req, res) => {
  const { role, content, images } = req.body as { role: string; content: string; images?: string[] };
  if (!role || !content) { res.status(400).json({ error: 'role and content required' }); return; }
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO messages (id, conversation_id, role, content, images, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.params.id, role, content, images ? JSON.stringify(images) : null, now);
  res.json({ id, ok: true });
});

// DELETE /api/conversations/:id/messages
app.delete('/api/conversations/:id/messages', (req, res) => {
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(req.params.id);
  res.json({ ok: true });
});

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  engine: string;
}

// ---------------------------------------------------------------------------
// Serper.dev — Google Search API (2500 gratis/mes, sin tarjeta)
// ---------------------------------------------------------------------------
async function searchSerper(query: string, key: string, num: number): Promise<SearchResult[]> {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Serper.dev HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json() as { organic?: { title: string; link: string; snippet: string }[] };

  return (data.organic ?? [])
    .slice(0, num)
    .map(r => ({
      title: r.title?.trim() ?? '',
      url: r.link?.trim() ?? '',
      snippet: r.snippet?.trim() ?? '',
      engine: 'serper',
    }))
    .filter(r => r.title && r.url);
}

// ---------------------------------------------------------------------------
// Brave Search API (requires API key — free tier: 2000 queries/mes)
// ---------------------------------------------------------------------------
async function searchBrave(query: string, key: string, num: number): Promise<SearchResult[]> {
  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.append('q', query);
  url.searchParams.append('count', String(Math.min(num, 10)));

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': key,
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Brave Search HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json() as { web?: { results?: { title: string; url: string; description: string }[] } };

  return (data.web?.results ?? [])
    .slice(0, num)
    .map(r => ({
      title: r.title?.trim() ?? '',
      url: r.url?.trim() ?? '',
      snippet: r.description?.trim() ?? '',
      engine: 'brave',
    }))
    .filter(r => r.title && r.url);
}

// ---------------------------------------------------------------------------
// DuckDuckGo HTML scraper (no API key needed)
// ---------------------------------------------------------------------------
/**
 * Parses un bloque individual de resultado de DuckDuckGo extrayendo
 * título, URL y snippet de un mismo contenedor <div class="result">.
 * Esto elimina la fragilidad de usar dos regex independientes que
 * podían desincronizarse si había anuncios o resultados especiales.
 */
function parseResultBlock(block: string): SearchResult | null {
  // Saltar anuncios (tienen clase result--ad)
  if (/result--ad/.test(block)) return null;

  const linkMatch = block.match(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  if (!linkMatch) return null;

  const url = linkMatch[1];
  const title = linkMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (!title || !url.startsWith('http')) return null;

  // El snippet puede estar en <div>, <span> o <a> con clase result__snippet
  const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/(?:div|span|a)>/i);
  const snippet = snippetMatch
    ? snippetMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    : '';

  return { title, url, snippet, engine: 'duckduckgo' };
}

async function searchDuckDuckGo(query: string, num: number): Promise<SearchResult[]> {
  const body = new URLSearchParams({ q: query, kl: 'es-es' });
  const response = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Origin': 'https://html.duckduckgo.com',
      'Referer': 'https://html.duckduckgo.com/',
    },
    signal: AbortSignal.timeout(10000),
    body: body.toString(),
  });

  if (!response.ok) throw new Error(`DuckDuckGo HTTP ${response.status}`);

  const html = await response.text();
  const results: SearchResult[] = [];

  // Dividir el HTML por cada bloque <div class="result..."> usando lookahead
  // para preservar el opening tag en cada fragmento
  const rawBlocks = html.split(/(?=<div[^>]+class="result[^"]*"[^>]*>)/g);

  for (const block of rawBlocks) {
    if (results.length >= num) break;
    // Saltar fragmentos que no son realmente bloques de resultado
    if (!/class="result__a"/.test(block)) continue;

    const parsed = parseResultBlock(block);
    if (parsed) results.push(parsed);
  }

  return results;
}

// ---------------------------------------------------------------------------
// SearXNG fallback (public instances)
// ---------------------------------------------------------------------------
const SEARXNG_INSTANCES = [
  'https://searx.tiekoetter.com',
  'https://search.ononoki.org',
  'https://searx.be',
  'https://searx.oloke.xyz',
  'https://searxng.site',
  'https://search.sapti.me',
];

async function searchSearXNG(query: string, num: number): Promise<{ results: SearchResult[]; source: string }> {
  const errors: string[] = [];
  for (const instance of SEARXNG_INSTANCES) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general&language=auto`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
          'Accept': 'application/json',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) { errors.push(`${instance}: HTTP ${response.status}`); continue; }
      const data = await response.json() as { results?: any[] };
      const results: SearchResult[] = (data.results ?? [])
        .slice(0, num)
        .map((r: any) => ({
          title: String(r.title ?? '').trim(),
          url: String(r.url ?? '').trim(),
          snippet: String(r.content ?? r.snippet ?? '').trim(),
          engine: String(r.engine ?? '').trim(),
        }))
        .filter((r: SearchResult) => r.title && r.url);
      if (results.length > 0) return { results, source: instance };
      errors.push(`${instance}: sin resultados`);
    } catch (err) {
      errors.push(`${instance}: ${String(err)}`);
    }
  }
  throw new Error(`SearXNG fallback falló: ${errors.join(' | ')}`);
}

// ---------------------------------------------------------------------------
// Combined search: Brave > Serper > DDG > SearXNG
// ---------------------------------------------------------------------------
async function search(
  query: string,
  num: number,
  braveKey?: string,
  serperKey?: string,
  preferred?: string,
): Promise<{ results: SearchResult[]; source: string }> {
  // ── Build provider list based on preference ────────────────────────
  type ProviderFn = () => Promise<{ results: SearchResult[]; source: string } | null>;

  const providers: { name: string; fn: ProviderFn }[] = [];

  // Helper to add a provider
  const addBrave = () => providers.push({
    name: 'brave',
    fn: async () => {
      if (!braveKey) return null;
      const results = await searchBrave(query, braveKey, num);
      return results.length > 0 ? { results, source: 'brave' } : null;
    },
  });

  const addSerper = () => providers.push({
    name: 'serper',
    fn: async () => {
      if (!serperKey) return null;
      const results = await searchSerper(query, serperKey, num);
      return results.length > 0 ? { results, source: 'serper' } : null;
    },
  });

  const addDuckDuckGo = () => providers.push({
    name: 'duckduckgo',
    fn: async () => {
      const results = await searchDuckDuckGo(query, num);
      return results.length > 0 ? { results, source: 'duckduckgo' } : null;
    },
  });

  const addSearXNG = () => providers.push({
    name: 'searxng',
    fn: async () => {
      const result = await searchSearXNG(query, num);
      return { results: result.results, source: result.source };
    },
  });

  switch (preferred) {
    case 'serper':
      addSerper();
      addBrave();
      addDuckDuckGo();
      addSearXNG();
      break;
    case 'duckduckgo':
      addDuckDuckGo();
      addSearXNG();
      break;
    default: // 'auto' | 'brave' | undefined
      addBrave();
      addSerper();
      addDuckDuckGo();
      addSearXNG();
      break;
  }

  // ── Execute providers in order ─────────────────────────────────────
  for (const provider of providers) {
    try {
      const result = await provider.fn();
      if (result) {
        console.log(`[search] "${query}" → ${result.results.length} resultados de ${provider.name}`);
        return result;
      }
      console.warn(`[search] ${provider.name} sin resultados, probando siguiente...`);
    } catch (err) {
      console.warn(`[search] ${provider.name} falló: ${err}, probando siguiente...`);
    }
  }

  throw new Error('Todos los motores de búsqueda fallaron.');
}

app.get('/api/search', async (req, res) => {
  const query = (req.query.q as string | undefined)?.trim();
  const num = Math.min(Math.max(parseInt((req.query.num as string) || '5', 10), 1), 10);
  const braveKey = (req.query.brave_key as string | undefined)?.trim() || undefined;
  const serperKey = (req.query.serper_key as string | undefined)?.trim() || undefined;
  const preferred = (req.query.preferred as string | undefined)?.trim() || undefined;

  if (!query) { res.status(400).json({ error: 'Parámetro "q" requerido' }); return; }

  try {
    const data = await search(query, num, braveKey, serperKey, preferred);
    res.json({ query, ...data });
  } catch (error) {
    console.error('[search] Error:', error);
    res.status(503).json({ error: String(error) });
  }
});

// Health check
// ---------------------------------------------------------------------------
// Terminal Execution — ejecuta comandos en el servidor
// ---------------------------------------------------------------------------
app.post('/api/exec', async (req, res) => {
  const { command, timeout } = req.body as { command: string; timeout?: number };
  if (!command) { res.status(400).json({ error: 'command required' }); return; }

  const maxTimeout = Math.min(Math.max(timeout ?? 15, 1), 60) * 1000;

  try {
    const { exec } = await import('child_process');
    exec(command, { timeout: maxTimeout, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
      res.json({
        stdout: String(stdout ?? ''),
        stderr: String(stderr ?? ''),
        error: err ? err.message : null,
        code: err?.code ?? 0,
        killed: err?.killed ?? false,
      });
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ---------------------------------------------------------------------------
// File System API — leer, escribir, listar, eliminar archivos
// ---------------------------------------------------------------------------
import { readFile, writeFile, readdir, mkdir, unlink, stat, access } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname);

// Utility: ensure path stays within project root
function safeResolve(userPath: string): string {
  const resolved = resolve(PROJECT_ROOT, userPath);
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error('Acceso denegado: la ruta está fuera del proyecto.');
  }
  return resolved;
}

// GET /api/files/:path(*) — leer archivo o listar directorio
app.get('/api/files/:path(*)', async (req, res) => {
  try {
    const fullPath = safeResolve(req.params.path);

    try {
      await access(fullPath);
    } catch {
      res.status(404).json({ error: 'Archivo o directorio no encontrado.' });
      return;
    }

    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      const entries = await readdir(fullPath, { withFileTypes: true });
      const children = entries.map(e => ({
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file',
        size: e.isFile() ? undefined : undefined,
      }));
      res.json({ path: req.params.path, type: 'directory', children });
    } else {
      const content = await readFile(fullPath, 'utf-8');
      res.json({ path: req.params.path, type: 'file', content, size: stats.size });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Acceso denegado')) {
      res.status(403).json({ error: msg });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

// POST /api/files/:path(*) — crear/sobrescribir archivo
app.post('/api/files/:path(*)', async (req, res) => {
  try {
    const { content } = req.body as { content?: string };
    if (content === undefined || content === null) {
      res.status(400).json({ error: 'Se requiere "content" en el body.' });
      return;
    }

    const fullPath = safeResolve(req.params.path);
    const dir = resolve(fullPath, '..');

    // Create parent directory if it doesn't exist
    await mkdir(dir, { recursive: true });

    await writeFile(fullPath, content, 'utf-8');
    res.json({ path: req.params.path, written: true, size: Buffer.byteLength(content, 'utf-8') });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Acceso denegado')) {
      res.status(403).json({ error: msg });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

// DELETE /api/files/:path(*) — eliminar archivo
app.delete('/api/files/:path(*)', async (req, res) => {
  try {
    const fullPath = safeResolve(req.params.path);
    await unlink(fullPath);
    res.json({ path: req.params.path, deleted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Acceso denegado')) {
      res.status(403).json({ error: msg });
    } else if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).json({ error: 'Archivo no encontrado.' });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

// GET /api/ollama/models — lista modelos disponibles
app.get('/api/ollama/models', async (_, res) => {
  try {
    const resp = await fetch('http://localhost:11434/api/tags');
    if (!resp.ok) { res.status(502).json({ error: 'Ollama no responde' }); return; }
    const data = await resp.json() as { models?: { name: string }[] };
    res.json({ models: (data.models ?? []).map((m: { name: string }) => m.name) });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// GET /api/search/test — prueba directa de búsqueda (debug)
app.get('/api/search/test', async (req, res) => {
  const query = (req.query.q as string | undefined)?.trim() || 'tiempo Las Palmas Gran Canaria';
  const braveKey = (req.query.brave_key as string | undefined)?.trim() || undefined;
  const serperKey = (req.query.serper_key as string | undefined)?.trim() || undefined;
  const preferred = (req.query.preferred as string | undefined)?.trim() || undefined;
  const num = Math.min(Math.max(parseInt((req.query.num as string) || '3', 10), 1), 5);

  const results: Record<string, any> = {};

  // Test each provider individually
  if (serperKey) {
    try {
      const r = await searchSerper(query, serperKey, num);
      results.serper = { success: true, count: r.length, results: r };
    } catch (e) {
      results.serper = { success: false, error: String(e) };
    }
  } else {
    results.serper = { success: false, error: 'No se proporcionó API key' };
  }

  if (braveKey) {
    try {
      const r = await searchBrave(query, braveKey, num);
      results.brave = { success: true, count: r.length, results: r };
    } catch (e) {
      results.brave = { success: false, error: String(e) };
    }
  } else {
    results.brave = { success: false, error: 'No se proporcionó API key' };
  }

  // DDG always works without keys
  try {
    const r = await searchDuckDuckGo(query, num);
    results.duckduckgo = { success: true, count: r.length, results: r };
  } catch (e) {
    results.duckduckgo = { success: false, error: String(e) };
  }

  // Full pipeline test
  let fullPipeline: any = { success: false, error: 'No se pudo ejecutar' };
  try {
    const data = await search(query, num, braveKey, serperKey, preferred);
    fullPipeline = { success: true, source: data.source, count: data.results.length, firstResult: data.results[0] || null };
  } catch (e) {
    fullPipeline = { success: false, error: String(e) };
  }

  res.json({
    query,
    preferred: preferred || 'auto',
    individual: results,
    full_pipeline: fullPipeline,
  });
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', port: PORT });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🔍 Proxy de búsqueda activo → http://localhost:${PORT}`);
});
