import { describe, expect, it } from 'vitest';
import { CrawlEngine } from '@/lib/crawler/crawl-engine';
import { RobotsTxtPolicy } from '@/lib/crawler/link-discovery';
import { URLValidator } from '@/lib/security/url-validator';

class AdvancedBrowserPool {
  async withCleanPage<T>(deviceType: 'desktop' | 'mobile', callback: (session: any) => Promise<T>): Promise<T> {
    const html = deviceType === 'mobile'
      ? '<html><head><meta name="generator" content="Next.js"><script src="/_next/static/chunk.js"></script></head><body>mobile</body></html>'
      : '<html><head><meta name="generator" content="WordPress"><script src="/_next/static/chunk.js"></script></head><body>desktop</body></html>';

    const page = {
      on() {},
      async goto(url: string) {
        return {
          url: () => url,
          status: () => 200,
          headers: () => ({ server: 'Vercel', 'content-type': 'text/html' }),
          request: () => ({ method: () => 'GET', resourceType: () => 'document' })
        };
      },
      async content() {
        return html;
      },
      async title() {
        return deviceType;
      },
      async screenshot() {
        return undefined;
      },
      async addInitScript() {
        return undefined;
      },
      async evaluate(fn: any) {
        const fnStr = typeof fn === 'function' ? fn.toString() : String(fn);
        if (fnStr.includes('__ALIEN_EYES_RENDERED_SNAPSHOT__')) {
          return {
            metaTags: { title: deviceType, generator: deviceType === 'mobile' ? 'Next.js' : 'WordPress' },
            headings: [{ level: 1, text: deviceType }],
            links: [],
            images: [],
            ariaLandmarks: [],
            interactiveElements: [],
            contrastIssues: [],
            structuredData: [],
            visibleText: deviceType
          };
        }
        if (fnStr.includes('__ALIEN_EYES_CWV__')) {
          return {};
        }
        if (fnStr.includes('__ALIEN_EYES_BLOCKING__')) {
          return 0;
        }
        if (fnStr.includes('innerHTML') && fnStr.includes('length')) {
          return html.length;
        }
        return [];
      }
    };

    return callback({
      context: { newPage: async () => page },
      page,
      deviceType,
      viewport: deviceType === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 }
    });
  }

  async closeAll() {
    return undefined;
  }
}

describe('CrawlEngine advanced capabilities', () => {
  it('captures a supplemental mobile snapshot and richer stack signals', async () => {
    const engine = new CrawlEngine({
      browserPool: new AdvancedBrowserPool() as any,
      validator: new URLValidator({ lookupFn: async () => [{ address: '93.184.216.34', family: 4 }] }),
      robotsPolicy: new RobotsTxtPolicy({ fetchFn: async () => new Response('', { status: 404 }) }),
      maxRetries: 0
    });

    const result = await engine.crawl('https://example.com', { pageLimit: 1 });

    expect(result.mobileSnapshot?.deviceType).toBe('mobile');
    expect(result.detectedStack).toContain('next.js');
    expect(result.detectedStack).toContain('wordpress');
    expect(result.detectedStack).toContain('vercel');
  });
});
