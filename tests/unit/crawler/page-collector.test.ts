import { describe, expect, it } from 'vitest';
import { collectPage, type PageLike } from '@/lib/crawler/page-collector';
import { RobotsTxtPolicy } from '@/lib/crawler/link-discovery';
import { URLValidator } from '@/lib/security/url-validator';

function createMockPage(): PageLike {
  const handlers: Record<string, Array<(payload: any) => void>> = { console: [], response: [] };
  const html = '<html><head><meta name="description" content="Demo"><title>Home</title></head><body><main><h1>Hello</h1><p style="display:none">Hidden</p></main></body></html>';

  return {
    on(event, handler) {
      handlers[event].push(handler);
    },
    async goto(url) {
      handlers.console.forEach((handler) => handler({ type: () => 'error', text: () => 'broken script' }));
      handlers.response.forEach((handler) => handler({
        url: () => url,
        status: () => 200,
        headers: () => ({ 'content-type': 'text/html; charset=utf-8', server: 'cloudflare' }),
        request: () => ({
          method: () => 'GET',
          resourceType: () => 'document',
          sizes: async () => ({ responseBodySize: 1024 }),
          timing: () => ({ startTime: 0, responseEnd: 12 })
        })
      }));
      return {
        url: () => url,
        status: () => 200,
        headers: () => ({ 'content-type': 'text/html; charset=utf-8', server: 'cloudflare' }),
        request: () => ({ method: () => 'GET', resourceType: () => 'document' })
      };
    },
    async content() {
      return html;
    },
    async title() {
      return 'Home';
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
    accessibility: {
      async snapshot() {
        return {
          role: 'WebArea',
          name: 'Home',
          children: [
            { role: 'main', name: 'Main content', children: [] },
            { role: 'button', name: 'Start audit', children: [] }
          ]
        } as any;
      }
    },
    async evaluate(fn: any, ...args: any[]) {
      const fnStr = typeof fn === 'function' ? fn.toString() : String(fn);
      if (fnStr.includes('__ALIEN_EYES_RENDERED_SNAPSHOT__')) {
        return {
          metaTags: { description: 'Demo', title: 'Home', canonical: 'https://example.com/' },
          headings: [{ level: 1, text: 'Rendered heading' }],
          links: [{ href: '/pricing', text: 'Pricing', isInternal: true, nofollow: false }],
          images: [{ src: '/hero.png', alt: 'Hero image', hasAlt: true, isDecorative: false }],
          ariaLandmarks: [{ role: 'main', label: 'Main content', isNative: true }],
          interactiveElements: [{ tag: 'a', text: 'Pricing', href: '/pricing', accessibleName: 'Pricing' }],
          contrastIssues: [],
          structuredData: [{ '@type': 'SoftwareApplication', name: 'Alien Eyes' }],
          visibleText: 'Rendered visible text'
        };
      }
      if (fnStr.includes('innerHTML') && fnStr.includes('length')) {
        return html.length;
      }
      if (fnStr.includes('__ALIEN_EYES_CWV__')) {
        return { lcpMs: 1400, cls: 0.03 };
      }
      if (fnStr.includes('__ALIEN_EYES_BLOCKING__')) {
        return 1;
      }
      return undefined as any;
    }
  };
}

describe('collectPage', () => {
  it('collects sanitized html, response metadata, and log summaries', async () => {
    const validator = new URLValidator({
      lookupFn: async () => [{ address: '93.184.216.34', family: 4 }]
    });
    const robotsPolicy = new RobotsTxtPolicy({
      fetchFn: async () => new Response('', { status: 404 })
    });

    const page = await collectPage({
      page: createMockPage(),
      url: 'https://example.com',
      validator,
      robotsPolicy,
      screenshotPath: '/tmp/example.png',
      deviceType: 'desktop',
      viewport: { width: 1440, height: 900 }
    });

    expect(page.statusCode).toBe(200);
    expect(page.responseHeaders.server).toBe('cloudflare');
    expect(page.consoleLogs[0]?.level).toBe('error');
    expect(page.networkRequests[0]?.resourceType).toBe('document');
    expect(page.dom).not.toContain('Hidden');
    expect(page.renderedSnapshot?.headings[0]?.text).toBe('Rendered heading');
    expect(page.renderedSnapshot?.structuredData).toHaveLength(1);
    expect(page.accessibilityTree?.children?.[1]?.name).toBe('Start audit');
    expect(page.coreWebVitals?.lcpMs).toBe(1400);
    expect(page.renderBlockingResourceCount).toBe(1);
  });
});
