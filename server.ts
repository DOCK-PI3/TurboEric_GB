import express from 'express';

const app = express();
const PORT = 3001;

// Allow requests from the local Vite dev server
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  engine: string;
}

// ---------------------------------------------------------------------------
// DuckDuckGo HTML scraper (no API key needed)
// ---------------------------------------------------------------------------
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

  // Match each result link: class="result__a" href="URL">Title</a>
  const linkRe = /class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  // Match snippets: class="result__snippet">text</a>
  const snippetRe = /class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|span)>/g;

  const snippets: string[] = [];
  let sm: RegExpExecArray | null;
  while ((sm = snippetRe.exec(html)) !== null) {
    snippets.push(sm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
  }

  let lm: RegExpExecArray | null;
  let idx = 0;
  while ((lm = linkRe.exec(html)) !== null && results.length < num) {
    const url = lm[1];
    const title = lm[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!title || !url.startsWith('http')) { idx++; continue; }
    results.push({ title, url, snippet: snippets[idx] ?? '', engine: 'duckduckgo' });
    idx++;
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
// Combined search: DDG first, SearXNG as fallback
// ---------------------------------------------------------------------------
async function search(query: string, num: number): Promise<{ results: SearchResult[]; source: string }> {
  try {
    const results = await searchDuckDuckGo(query, num);
    if (results.length > 0) {
      console.log(`[search] "${query}" → ${results.length} resultados de DuckDuckGo`);
      return { results, source: 'duckduckgo' };
    }
    console.warn('[search] DuckDuckGo sin resultados, probando SearXNG...');
  } catch (err) {
    console.warn(`[search] DuckDuckGo falló: ${err}, probando SearXNG...`);
  }
  return await searchSearXNG(query, num);
}

app.get('/api/search', async (req, res) => {
  const query = (req.query.q as string | undefined)?.trim();
  const num = Math.min(Math.max(parseInt((req.query.num as string) || '5', 10), 1), 10);

  if (!query) { res.status(400).json({ error: 'Parámetro "q" requerido' }); return; }

  try {
    const data = await search(query, num);
    res.json({ query, ...data });
  } catch (error) {
    console.error('[search] Error:', error);
    res.status(503).json({ error: String(error) });
  }
});

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', port: PORT });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🔍 Proxy de búsqueda activo → http://localhost:${PORT}`);
});
