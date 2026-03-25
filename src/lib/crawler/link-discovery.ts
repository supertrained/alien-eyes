import { load } from 'cheerio';
import type { PageLike } from '@/lib/crawler/page-collector';

export interface RobotsTxtPolicyOptions {
  fetchFn?: typeof fetch;
}

interface RuleSet {
  status: 'found' | 'not_found';
  disallow: string[];
}

export class RobotsTxtPolicy {
  private readonly fetchFn: typeof fetch;
  private readonly cache = new Map<string, RuleSet>();
  private blockedPages = false;

  constructor(options: RobotsTxtPolicyOptions = {}) {
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async isAllowed(rawUrl: string): Promise<boolean> {
    const url = new URL(rawUrl);
    const rules = await this.getRules(url);
    if (rules.status === 'not_found' || rules.disallow.length === 0) {
      return true;
    }

    const blocked = rules.disallow.some((rule) => {
      if (rule === '/') {
        return true;
      }

      return url.pathname.startsWith(rule);
    });

    if (blocked) {
      this.blockedPages = true;
    }

    return !blocked;
  }

  async getStatus(rawUrl: string): Promise<'found' | 'not_found' | 'blocked_some_pages'> {
    const url = new URL(rawUrl);
    const rules = await this.getRules(url);
    if (this.blockedPages) {
      return 'blocked_some_pages';
    }

    return rules.status;
  }

  async getSitemapUrls(rawUrl: string): Promise<string[]> {
    const url = new URL(rawUrl);
    const sitemapUrl = new URL('/sitemap.xml', url.origin).toString();

    try {
      const response = await this.fetchFn(sitemapUrl, {
        headers: { 'user-agent': 'AlienEyesBot/0.1 (+https://alieneyes.dev)' }
      });
      if (!response.ok) {
        return [];
      }

      const xml = await response.text();
      return Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g))
        .map((match) => match[1]?.trim() ?? '')
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private async getRules(url: URL): Promise<RuleSet> {
    const cacheKey = url.origin;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const robotsUrl = new URL('/robots.txt', url.origin).toString();

    try {
      const response = await this.fetchFn(robotsUrl, {
        headers: { 'user-agent': 'AlienEyesBot/0.1 (+https://alieneyes.dev)' }
      });
      if (!response.ok) {
        const rules = { status: 'not_found' as const, disallow: [] };
        this.cache.set(cacheKey, rules);
        return rules;
      }

      const text = await response.text();
      const rules = parseRobots(text);
      this.cache.set(cacheKey, rules);
      return rules;
    } catch {
      const rules = { status: 'not_found' as const, disallow: [] };
      this.cache.set(cacheKey, rules);
      return rules;
    }
  }
}

export function discoverInternalLinks(html: string, currentUrl: string): string[] {
  const current = new URL(currentUrl);
  const $ = load(html);
  const links = new Set<string>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return;
    }

    try {
      const resolved = new URL(href, current);
      if (resolved.origin !== current.origin) {
        return;
      }

      resolved.hash = '';
      if (!['http:', 'https:'].includes(resolved.protocol)) {
        return;
      }
      links.add(resolved.toString());
    } catch {
      return;
    }
  });

  return [...links];
}

/**
 * Discover internal links from the rendered DOM via page.evaluate().
 * Catches client-side-rendered navigation, dynamic menus, and SPA routes
 * that Cheerio on source HTML misses.
 */
export async function discoverInternalLinksFromPage(page: PageLike, currentUrl: string): Promise<string[]> {
  const origin = new URL(currentUrl).origin;
  return page.evaluate((pageOrigin: string) => {
    const links = new Set<string>();
    document.querySelectorAll('a[href]').forEach((el) => {
      const href = el.getAttribute('href')?.trim();
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return;
      }
      try {
        const resolved = new URL(href, document.baseURI);
        if (resolved.origin !== pageOrigin) return;
        if (!['http:', 'https:'].includes(resolved.protocol)) return;
        resolved.hash = '';
        links.add(resolved.toString());
      } catch {
        // skip malformed
      }
    });
    return [...links];
  }, origin);
}

export function prioritizeLinks(seedUrl: string, discovered: string[], sitemap: string[] = []): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const push = (url: string) => {
    if (seen.has(url)) {
      return;
    }
    seen.add(url);
    ordered.push(url);
  };

  push(seedUrl);
  for (const url of discovered) {
    push(url);
  }
  for (const url of sitemap) {
    push(url);
  }

  return ordered;
}

function parseRobots(text: string): RuleSet {
  const lines = text.split(/\r?\n/);
  let appliesToAll = false;
  const disallow: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const [directive, ...rest] = trimmed.split(':');
    const value = rest.join(':').trim();

    if (/^user-agent$/i.test(directive)) {
      appliesToAll = value === '*';
      continue;
    }

    if (appliesToAll && /^disallow$/i.test(directive) && value) {
      disallow.push(value);
    }
  }

  return { status: 'found', disallow };
}
