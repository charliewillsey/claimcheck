// Q5: the hard allowlist. This is the only file that decides what counts as reputable.
export const ALLOWED_SUFFIXES = ['.gov', '.edu'];

export const ALLOWED_DOMAINS = [
  'apnews.com',
  'reuters.com',
  'bbc.com',
  'bbc.co.uk',
  'nature.com',
  'science.org',
  'nejm.org',
  'britannica.com',
  'who.int',
];

// Firecrawl cannot filter by .gov or .edu, so targeted search names the big ones.
// Each still has to pass isReputable, which is what actually decides.
export const SEARCH_DOMAINS = [
  ...ALLOWED_DOMAINS,
  'nih.gov', 'cdc.gov', 'fda.gov', 'nasa.gov', 'noaa.gov', 'weather.gov', 'usgs.gov', 'usda.gov',
  'archives.gov', 'congress.gov', 'loc.gov', 'census.gov', 'bls.gov', 'dol.gov', 'ssa.gov',
  'irs.gov', 'treasury.gov', 'state.gov', 'energy.gov', 'epa.gov',
  'harvard.edu', 'stanford.edu', 'mit.edu', 'berkeley.edu', 'yale.edu',
];

export function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return '';
  }
}

export function isReputable(url) {
  const host = hostOf(url);
  if (!host) return false;
  if (ALLOWED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  return ALLOWED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}
