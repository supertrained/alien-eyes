import { describe, expect, it } from 'vitest';
import type { CrawlResult } from '@/types';

describe('CrawlResult shape', () => {
  it('asserts the shared crawl contract remains intact', () => {
    const crawl: CrawlResult = {
      url: 'https://example.com',
      pages: [
        {
          url: 'https://example.com',
          html: '<html></html>',
          dom: '<html></html>',
          screenshot: '/tmp/example.png',
          consoleLogs: [],
          networkRequests: [],
          responseHeaders: {},
          metaTags: { title: 'Home' },
          statusCode: 200,
          loadTimeMs: 100,
          viewport: { width: 1440, height: 900 },
          deviceType: 'desktop',
          renderedSnapshot: {
            metaTags: { title: 'Home' },
            headings: [{ level: 1, text: 'Home' }],
            links: [],
            images: [],
            ariaLandmarks: [],
            interactiveElements: [],
            contrastIssues: [],
            structuredData: [],
            visibleText: 'Home'
          }
        }
      ],
      timestamp: new Date().toISOString(),
      browserProfile: 'clean',
      totalDurationMs: 100,
      pagesSkipped: 0,
      errors: [],
      sitemapUrls: ['https://example.com/sitemap-page'],
      detectedStack: ['next.js'],
      robotsTxtStatus: 'found',
      mobileSnapshot: {
        url: 'https://example.com',
        html: '<html></html>',
        dom: '<html></html>',
        screenshot: '/tmp/example-mobile.png',
        consoleLogs: [],
        networkRequests: [],
        responseHeaders: {},
        metaTags: { title: 'Home' },
        statusCode: 200,
        loadTimeMs: 120,
        viewport: { width: 390, height: 844 },
        deviceType: 'mobile'
      }
    };

    expect(crawl.browserProfile).toBe('clean');
    expect(crawl.pages[0]?.renderedSnapshot?.headings[0]?.text).toBe('Home');
    expect(crawl.sitemapUrls).toEqual(['https://example.com/sitemap-page']);
    expect(crawl.mobileSnapshot?.deviceType).toBe('mobile');
  });
});
