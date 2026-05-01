import express from 'express';

const app = express();
const PORT = 3001;

// Allow requests from the local Vite dev server
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Public SearXNG instances with JSON API enabled (fallback chain)
const SEARXNG_INSTANCES = [
  'https://searx.be',
  'https://search.ononoki.org',
  'https://priv.au',
  'https://searx.tiekoetter.com',
];

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  engine: string;
}

async function searchSearXNG(query: string, num: number): Promise<{ results: SearchResult[]; source: string }> {
  const errors: string[] = [];

  for (const instance of SEARXNG_INSTANCES) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general&language=auto`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TurboEric_GB/1.0 (local search proxy)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        errors.push(`${instance}: HTTP ${response.status}`);
        continue;
      }

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

      if (results.length > 0) {
        console.log(`[search] "${query}" → ${results.length} resultados de ${instance}`);
        return { results, source: instance };
      }

      errors.push(`${instance}: sin resultados`);
    } catch (err) {
      errors.push(`${instance}: ${String(err)}`);
    }
  }

  throw new Error(`Todos los motores fallaron: ${errors.join(' | ')}`);
}

app.get('/api/search', async (req, res) => {
  const query = (req.query.q as string | undefined)?.trim();
  const num = Math.min(Math.max(parseInt((req.query.num as string) || '5', 10), 1), 10);

  if (!query) {
    res.status(400).json({ error: 'Parámetro "q" requerido' });
    return;
  }

  try {
    const data = await searchSearXNG(query, num);
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
