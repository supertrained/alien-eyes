/**
 * Minimal robots.txt parser. Fetches and checks Disallow rules for our user agent.
 * Falls back to allowing all paths if robots.txt is unavailable.
 */

const cache = new Map<string, { disallowed: string[]; fetchedAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

async function fetchRobotsTxt(domain: string): Promise<string[]> {
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.disallowed;
  }

  try {
    const res = await fetch(`https://${domain}/robots.txt`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      cache.set(domain, { disallowed: [], fetchedAt: Date.now() });
      return [];
    }

    const text = await res.text();
    const disallowed = parseRobotsTxt(text);
    cache.set(domain, { disallowed, fetchedAt: Date.now() });
    return disallowed;
  } catch {
    // robots.txt unavailable — allow all
    cache.set(domain, { disallowed: [], fetchedAt: Date.now() });
    return [];
  }
}

function parseRobotsTxt(text: string): string[] {
  const lines = text.split("\n");
  const disallowed: string[] = [];
  let inWildcardBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("#") || !line) continue;

    if (/^user-agent:\s*\*/i.test(line)) {
      inWildcardBlock = true;
      continue;
    }
    if (/^user-agent:/i.test(line)) {
      inWildcardBlock = false;
      continue;
    }

    if (inWildcardBlock && /^disallow:\s+/i.test(line)) {
      const path = line.replace(/^disallow:\s+/i, "").trim();
      if (path) disallowed.push(path);
    }
  }

  return disallowed;
}

/** Check if a URL path is allowed by robots.txt for the given domain. */
export async function isPathAllowed(domain: string, urlPath: string): Promise<boolean> {
  const disallowed = await fetchRobotsTxt(domain);
  for (const rule of disallowed) {
    if (urlPath.startsWith(rule)) {
      return false;
    }
  }
  return true;
}
