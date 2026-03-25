import { describe, expect, it } from 'vitest';
import { CrawlEngine } from '@/lib/crawler/crawl-engine';
import { RobotsTxtPolicy } from '@/lib/crawler/link-discovery';
import { URLValidator } from '@/lib/security/url-validator';

class StubBrowserPool {
  async withCleanPage<T>(deviceType: 'desktop' | 'mobile', callback: (session: any) => Promise<T>): Promise<T> {
    const pages = new Map<string, string>([
      ['https://example.com', '<html><head><title>Home</title><meta name="title" content="Home"></head><body><nav><a href="/about">About</a></nav><script id="__NEXT_DATA__"></script></body></html>'],
      ['https://example.com/about', '<html><head><title>About</title></head><body><a href="/contact">Contact</a></body></html>'],
      ['https://example.com/contact', '<html><head><title>Contact</title></head><body>Contact us</body></html>']
    ]);

    let currentUrl = 'https://example.com';
    const createPage = () => ({
      on() {
        return undefined;
      },
      async goto(url: string) {
        currentUrl = url;
        return {
          url: () => url,
          status: () => 200,
          headers: () => ({ 'content-type': 'text/html', server: 'cloudflare' }),
          request: () => ({ method: () => 'GET', resourceType: () => 'document' })
        };
      },
      async content() {
        return pages.get(currentUrl) ?? '<html><body>Missing</body></html>';
      },
      async title() {
        return 'title';
      },
      async screenshot() {
        return undefined;
      },
      async close() {
        return undefined;
      },
      async evaluate(fn: any, ...args: any[]) {
        const fnStr = typeof fn === 'function' ? fn.toString() : String(fn);
        // Rendered snapshot extraction
        if (fnStr.includes('__ALIEN_EYES_RENDERED_SNAPSHOT__')) {
          const html = pages.get(currentUrl) ?? '';
          const links: Array<{ href: string; text: string; isInternal: boolean; nofollow: boolean }> = [];
          const matches = html.matchAll(/href="([^"]+)"/g);
          for (const match of matches) {
            const href = match[1];
            if (href && !href.startsWith('#')) {
              links.push({ href, text: href, isInternal: true, nofollow: false });
            }
          }
          return {
            metaTags: { title: currentUrl.endsWith('/about') ? 'About' : currentUrl.endsWith('/contact') ? 'Contact' : 'Home' },
            headings: [{ level: 1, text: currentUrl.endsWith('/about') ? 'About' : currentUrl.endsWith('/contact') ? 'Contact' : 'Home' }],
            links,
            images: [],
            ariaLandmarks: [],
            interactiveElements: [],
            contrastIssues: [],
            structuredData: [],
            visibleText: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          };
        }
        // DOM stability
        if (fnStr.includes('innerHTML')) {
          return 100;
        }
        // CWV
        if (fnStr.includes('__ALIEN_EYES_CWV__')) {
          return {};
        }
        // Render-blocking
        if (fnStr.includes('__ALIEN_EYES_BLOCKING__')) {
          return 0;
        }
        // Link discovery from rendered DOM
        if (fnStr.includes('a[href]')) {
          const html = pages.get(currentUrl) ?? '';
          const links: string[] = [];
          const matches = html.matchAll(/href="([^"]+)"/g);
          for (const match of matches) {
            const href = match[1];
            if (href && !href.startsWith('#')) {
              try {
                const resolved = new URL(href, currentUrl);
                if (resolved.origin === new URL(currentUrl).origin) {
                  links.push(resolved.toString());
                }
              } catch {}
            }
          }
          return links;
        }
        return undefined as any;
      }
    });

    const session = {
      deviceType,
      viewport: { width: 1440, height: 900 },
      context: {
        async newPage() {
          return createPage();
        }
      },
      page: createPage()
    };

    return callback(session);
  }

  async closeAll(): Promise<void> {
    return undefined;
  }
}

describe('CrawlEngine', () => {
  it('crawls discoverable internal pages up to the configured page limit', async () => {
    const validator = new URLValidator({ lookupFn: async () => [{ address: '93.184.216.34', family: 4 }] });
    const robotsPolicy = new RobotsTxtPolicy({
      fetchFn: async (input) => {
        const url = String(input);
        if (url.endsWith('/robots.txt')) {
          return new Response('', { status: 404 });
        }
        if (url.endsWith('/sitemap.xml')) {
          return new Response('<urlset><url><loc>https://example.com/contact</loc></url></urlset>', { status: 200 });
        }
        return new Response('', { status: 404 });
      }
    });

    const engine = new CrawlEngine({
      browserPool: new StubBrowserPool() as never,
      validator,
      robotsPolicy,
      screenshotDir: '/tmp/alien-eyes-test'
    });

    const result = await engine.crawl('https://example.com', { pageLimit: 2 });
    expect(result.pages).toHaveLength(2);
    expect(result.pagesSkipped).toBeGreaterThanOrEqual(1);
    expect(result.detectedStack).toContain('next.js');
    expect(result.browserProfile).toBe('clean');
  });

  it('records actual retry attempts in crawl errors', async () => {
    let attempts = 0;

    class RetryBrowserPool extends StubBrowserPool {
      override async withCleanPage<T>(deviceType: 'desktop' | 'mobile', callback: (session: any) => Promise<T>): Promise<T> {
        const createPage = () => ({
          on() {
            return undefined;
          },
          async goto() {
            attempts += 1;
            throw new Error('timeout exceeded');
          },
          async content() {
            return '<html></html>';
          },
          async title() {
            return 'Timeout';
          },
          async screenshot() {
            return undefined;
          },
          async close() {
            return undefined;
          },
          async addInitScript() {
            return undefined;
          },
          async evaluate() {
            return undefined as any;
          }
        });

        return callback({
          deviceType,
          viewport: { width: 1440, height: 900 },
          context: {
            async newPage() {
              return createPage();
            }
          },
          page: createPage()
        });
      }
    }

    const validator = new URLValidator({ lookupFn: async () => [{ address: '93.184.216.34', family: 4 }] });
    const robotsPolicy = new RobotsTxtPolicy({
      fetchFn: async () => new Response('', { status: 404 })
    });

    const engine = new CrawlEngine({
      browserPool: new RetryBrowserPool() as never,
      validator,
      robotsPolicy,
      screenshotDir: '/tmp/alien-eyes-test',
      maxRetries: 2
    });

    const result = await engine.crawl('https://example.com', { pageLimit: 1 });
    expect(result.pages).toHaveLength(0);
    expect(result.errors[0]?.retryCount).toBe(2);
    expect(attempts).toBe(3);
  });
});
