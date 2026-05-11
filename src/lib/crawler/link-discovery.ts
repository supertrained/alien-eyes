import { load } from 'cheerio';
import type { AICrawlerDirective } from '@/types';
import type { PageLike } from '@/lib/crawler/page-collector';

export interface RobotsTxtPolicyOptions {
  fetchFn?: typeof fetch;
}

interface RuleSet {
  status: 'found' | 'not_found';
  disallow: string[];
}

const AI_CRAWLERS: Array<{ botName: string; platform: string }> = [
  { botName: 'GPTBot', platform: 'OpenAI / ChatGPT' },
  { botName: 'ChatGPT-User', platform: 'OpenAI / ChatGPT' },
  { botName: 'ClaudeBot', platform: 'Anthropic / Claude' },
  { botName: 'anthropic-ai', platform: 'Anthropic / Claude' },
  { botName: 'PerplexityBot', platform: 'Perplexity' },
  { botName: 'Google-Extended', platform: 'Google / Gemini' },
  { botName: 'CCBot', platform: 'Common Crawl (AI training)' },
  { botName: 'cohere-ai', platform: 'Cohere' },
];

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

  async getAICrawlerDirectives(rawUrl: string): Promise<AICrawlerDirective[]> {
    const url = new URL(rawUrl);
    const robotsText = await this.getRawRobotsText(url);
    if (!robotsText) return [];
    return parseAICrawlerDirectives(robotsText);
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

  private readonly robotsTextCache = new Map<string, string | null>();

  private async getRawRobotsText(url: URL): Promise<string | null> {
    const cacheKey = url.origin;
    if (this.robotsTextCache.has(cacheKey)) {
      return this.robotsTextCache.get(cacheKey)!;
    }

    const robotsUrl = new URL('/robots.txt', url.origin).toString();
    try {
      const response = await this.fetchFn(robotsUrl, {
        headers: { 'user-agent': 'AlienEyesBot/0.1 (+https://alieneyes.dev)' }
      });
      if (!response.ok) {
        this.robotsTextCache.set(cacheKey, null);
        return null;
      }
      const text = await response.text();
      this.robotsTextCache.set(cacheKey, text);
      return text;
    } catch {
      this.robotsTextCache.set(cacheKey, null);
      return null;
    }
  }

  private async getRules(url: URL): Promise<RuleSet> {
    const cacheKey = url.origin;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const text = await this.getRawRobotsText(url);
    if (!text) {
      const rules = { status: 'not_found' as const, disallow: [] };
      this.cache.set(cacheKey, rules);
      return rules;
    }

    const rules = parseRobots(text);
    this.cache.set(cacheKey, rules);
    return rules;
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

function parseAICrawlerDirectives(text: string): AICrawlerDirective[] {
  const lines = text.split(/\r?\n/);
  const agentBlocks = new Map<string, string[]>();
  let currentAgents: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [directive, ...rest] = trimmed.split(':');
    const value = rest.join(':').trim();

    if (/^user-agent$/i.test(directive)) {
      currentAgents = [value];
      for (const agent of currentAgents) {
        if (!agentBlocks.has(agent)) agentBlocks.set(agent, []);
      }
    } else if (/^disallow$/i.test(directive) && value) {
      for (const agent of currentAgents) {
        agentBlocks.get(agent)?.push(value);
      }
    }
  }

  const wildcardDisallows = agentBlocks.get('*') ?? [];

  return AI_CRAWLERS.map(({ botName, platform }) => {
    const specificDisallows = agentBlocks.get(botName);
    const hasSpecificBlock = specificDisallows !== undefined;
    const disallowedPaths = hasSpecificBlock ? specificDisallows : wildcardDisallows;
    const blocked = disallowedPaths.includes('/');

    return {
      botName,
      platform,
      blocked,
      disallowedPaths: blocked ? [] : disallowedPaths,
    };
  });
}
