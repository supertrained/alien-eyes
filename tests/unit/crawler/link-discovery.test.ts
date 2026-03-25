import { describe, expect, it } from 'vitest';
import { RobotsTxtPolicy, discoverInternalLinks, prioritizeLinks } from '@/lib/crawler/link-discovery';

describe('discoverInternalLinks', () => {
  it('returns only internal http links without fragments', () => {
    const html = `
      <nav>
        <a href="/pricing#plans">Pricing</a>
        <a href="https://example.com/docs">Docs</a>
        <a href="https://other.com">External</a>
        <a href="mailto:test@example.com">Mail</a>
      </nav>
    `;

    expect(discoverInternalLinks(html, 'https://example.com/')).toEqual([
      'https://example.com/pricing',
      'https://example.com/docs'
    ]);
  });
});

describe('RobotsTxtPolicy', () => {
  it('blocks disallowed paths and reports blocked_some_pages', async () => {
    const fetchFn: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith('/robots.txt')) {
        return new Response('User-agent: *\nDisallow: /private', { status: 200 });
      }
      return new Response('', { status: 404 });
    };

    const policy = new RobotsTxtPolicy({ fetchFn });
    await expect(policy.isAllowed('https://example.com/private/report')).resolves.toBe(false);
    await expect(policy.isAllowed('https://example.com/docs')).resolves.toBe(true);
    await expect(policy.getStatus('https://example.com')).resolves.toBe('blocked_some_pages');
  });

  it('extracts sitemap urls when present', async () => {
    const fetchFn: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith('/robots.txt')) {
        return new Response('', { status: 404 });
      }
      if (url.endsWith('/sitemap.xml')) {
        return new Response('<urlset><url><loc>https://example.com/docs</loc></url></urlset>', { status: 200 });
      }
      return new Response('', { status: 404 });
    };

    const policy = new RobotsTxtPolicy({ fetchFn });
    await expect(policy.getSitemapUrls('https://example.com')).resolves.toEqual(['https://example.com/docs']);
  });
});

describe('prioritizeLinks', () => {
  it('keeps seed first and de-duplicates discovered and sitemap links', () => {
    expect(
      prioritizeLinks('https://example.com', ['https://example.com/about'], ['https://example.com/about', 'https://example.com/docs'])
    ).toEqual(['https://example.com', 'https://example.com/about', 'https://example.com/docs']);
  });
});
