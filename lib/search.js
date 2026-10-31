// Finds and reads reputable pages through Firecrawl.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isReputable, SEARCH_DOMAINS } from './allowlist.js';

const API = 'https://api.firecrawl.dev/v2';
const ENV_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.local');

if (!process.env.FIRECRAWL_API_KEY) process.loadEnvFile(ENV_FILE);

async function firecrawl(route, body) {
  const response = await fetch(`${API}/${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Firecrawl ${route} returned ${response.status}`);
  return (await response.json()).data;
}

async function search(body) {
  try {
    const data = await firecrawl('search', body);
    return data.web ?? [];
  } catch {
    return [];
  }
}

// Open search reaches any .gov or .edu page; targeted search reaches the named outlets.
export async function searchReputable(query) {
  const [open, targeted] = await Promise.all([
    search({ query, limit: 10 }),
    search({ query, limit: 8, includeDomains: SEARCH_DOMAINS }),
  ]);
  const byUrl = new Map();
  for (const result of [...targeted, ...open]) {
    if (isReputable(result.url) && !byUrl.has(result.url)) byUrl.set(result.url, result);
  }
  return [...byUrl.values()].map(({ url, title, description }) => ({ url, title, description }));
}

export async function readPage(url) {
  const data = await firecrawl('scrape', { url, formats: ['markdown'], onlyMainContent: true });
  const status = data.metadata?.statusCode;
  if (status && status >= 400) throw new Error(`Page returned ${status}`);
  return data.markdown ?? '';
}
