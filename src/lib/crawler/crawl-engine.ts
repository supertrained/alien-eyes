import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { CrawlResult, CrawledPage, CrawlError } from '@/types';
import type { AuditConfig } from '@/types';
import { BrowserPool, type CrawlDeviceType } from '@/lib/crawler/browser-pool';
import { collectPage } from '@/lib/crawler/page-collector';
import { RobotsTxtPolicy, discoverInternalLinks, discoverInternalLinksFromPage, prioritizeLinks } from '@/lib/crawler/link-discovery';
import { URLValidator } from '@/lib/security/url-validator';

export interface PageCrawledEvent {
  url: string;
  pageNumber: number;
  totalQueued: number;
  loadTimeMs: number;
  errorCount: number;
  pageWeight?: number;
}

export interface CrawlEngineOptions {
  browserPool?: BrowserPool;
  validator?: URLValidator;
  robotsPolicy?: RobotsTxtPolicy;
  screenshotDir?: string;
  deviceType?: CrawlDeviceType;
  /** Maximum retries per page (default: 2) */
  maxRetries?: number;
  /** Fires after each page is collected */
  onPageCrawled?: (event: PageCrawledEvent) => void;
}

/** Initial backoff delay in ms, doubled on each retry */
const BASE_BACKOFF_MS = 1000;

export class CrawlEngine {
  private readonly browserPool: BrowserPool;
  private readonly validator: URLValidator;
  private readonly robotsPolicy: RobotsTxtPolicy;
  private readonly screenshotDir: string;
  private readonly deviceType: CrawlDeviceType;
  private readonly maxRetries: number;
  private onPageCrawledCallback?: (event: PageCrawledEvent) => void;

  constructor(options: CrawlEngineOptions = {}) {
    this.browserPool = options.browserPool ?? new BrowserPool();
    this.validator = options.validator ?? new URLValidator();
    this.robotsPolicy = options.robotsPolicy ?? new RobotsTxtPolicy();
    this.screenshotDir = options.screenshotDir ?? join(process.cwd(), '.tmp', 'screenshots');
    this.deviceType = options.deviceType ?? 'desktop';
    this.maxRetries = options.maxRetries ?? 2;
    this.onPageCrawledCallback = options.onPageCrawled;
  }

  setOnPageCrawled(callback: (event: PageCrawledEvent) => void): void {
    this.onPageCrawledCallback = callback;
  }

  async crawl(url: string, config: Pick<AuditConfig, 'pageLimit'>): Promise<CrawlResult> {
    const startedAt = Date.now();
    await mkdir(this.screenshotDir, { recursive: true });

    const visited = new Set<string>();
    const pages: CrawledPage[] = [];
    const errors: CrawlError[] = [];
    const discoveredQueue: string[] = [url];
    let pagesSkipped = 0;

    const sitemapUrls = await this.robotsPolicy.getSitemapUrls(url);

    await this.browserPool.withCleanPage(this.deviceType, async (session) => {
      while (discoveredQueue.length > 0 && pages.length < config.pageLimit) {
        const nextUrl = discoveredQueue.shift()!;
        if (visited.has(nextUrl)) {
          continue;
        }
        visited.add(nextUrl);

        const result = await this.crawlPageWithRetry(session, nextUrl, url, sitemapUrls, pages, discoveredQueue, visited);
        if (result.page) {
          pages.push(result.page);
          if (this.onPageCrawledCallback) {
            const errorCount = result.page.consoleLogs?.filter((e) => e.level === 'error').length ?? 0;
            const pageWeight = result.page.html ? Buffer.byteLength(result.page.html, 'utf8') : undefined;
            this.onPageCrawledCallback({
              url: nextUrl,
              pageNumber: pages.length,
              totalQueued: discoveredQueue.length,
              loadTimeMs: result.page.loadTimeMs ?? 0,
              errorCount,
              pageWeight,
            });
          }
        }
        if (result.error) {
          errors.push(result.error);
          pagesSkipped += 1;
        }
      }
    });

    const mobileSnapshot = pages.length > 0 ? await this.captureMobileSnapshot(url) : undefined;

    if (discoveredQueue.length > 0) {
      pagesSkipped += discoveredQueue.length;
    }

    return {
      url,
      pages,
      timestamp: new Date(startedAt).toISOString(),
      browserProfile: 'clean',
      totalDurationMs: Date.now() - startedAt,
      pagesSkipped,
      errors,
      sitemapUrls,
      detectedStack: detectStack(pages),
      robotsTxtStatus: await this.robotsPolicy.getStatus(url),
      mobileSnapshot
    };
  }

  private async crawlPageWithRetry(
    session: { context: { newPage?: () => Promise<any> }; page: any; deviceType: CrawlDeviceType; viewport: { width: number; height: number } },
    nextUrl: string,
    seedUrl: string,
    sitemapUrls: string[],
    pages: CrawledPage[],
    discoveredQueue: string[],
    visited: Set<string>
  ): Promise<{ page?: CrawledPage; error?: CrawlError }> {
    let lastError: Error | undefined;
    let attemptsUsed = 0;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      attemptsUsed = attempt;
      if (attempt > 0) {
        const delay = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const pageHandle = 'newPage' in session.context && typeof session.context.newPage === 'function'
        ? await session.context.newPage()
        : session.page;

      try {
        const page = await collectPage({
          page: pageHandle,
          url: nextUrl,
          validator: this.validator,
          robotsPolicy: this.robotsPolicy,
          screenshotPath: join(this.screenshotDir, sanitizeFilename(nextUrl) + '.png'),
          deviceType: session.deviceType,
          viewport: session.viewport
        });

        // Discover links from rendered DOM (catches SPA routes, dynamic nav)
        // then merge with Cheerio-based discovery for completeness
        let renderedLinks: string[] = [];
        try {
          renderedLinks = await discoverInternalLinksFromPage(pageHandle, nextUrl);
        } catch {
          // Fall back to Cheerio-only if evaluate() fails
        }
        const cheerioLinks = discoverInternalLinks(page.html, nextUrl);

        // Merge: rendered DOM links first (more complete), then Cheerio as supplement
        const allLinks = [...new Set([...renderedLinks, ...cheerioLinks])];
        const orderedLinks = prioritizeLinks(
          seedUrl,
          allLinks,
          pages.length === 0 ? sitemapUrls : []
        );

        for (const discoveredUrl of orderedLinks) {
          if (!visited.has(discoveredUrl) && !discoveredQueue.includes(discoveredUrl)) {
            discoveredQueue.push(discoveredUrl);
          }
        }

        return { page };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Only retry on timeout or transient navigation errors
        if (!isRetryable(lastError)) {
          break;
        }
      } finally {
        if (pageHandle !== session.page && 'close' in pageHandle && typeof pageHandle.close === 'function') {
          await pageHandle.close().catch(() => undefined);
        }
      }
    }

    return {
      error: {
        url: nextUrl,
        error: lastError?.message ?? 'Unknown error',
        errorType: classifyError(lastError),
        retryCount: attemptsUsed,
        timestamp: new Date().toISOString()
      }
    };
  }

  private async captureMobileSnapshot(seedUrl: string): Promise<CrawledPage | undefined> {
    try {
      return await this.browserPool.withCleanPage('mobile', async (session) => collectPage({
        page: session.page,
        url: seedUrl,
        validator: this.validator,
        robotsPolicy: this.robotsPolicy,
        screenshotPath: join(this.screenshotDir, `${sanitizeFilename(seedUrl)}-mobile.png`),
        deviceType: session.deviceType,
        viewport: session.viewport
      }));
    } catch {
      return undefined;
    }
  }

  async close(): Promise<void> {
    await this.browserPool.closeAll();
  }
}

function sanitizeFilename(url: string): string {
  return url.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 120) || 'page';
}

function detectStack(pages: CrawledPage[]): string[] {
  const stack = new Set<string>();
  for (const page of pages) {
    const html = page.html.toLowerCase();
    const generator = page.metaTags?.generator?.toLowerCase?.() ?? page.renderedSnapshot?.metaTags?.generator?.toLowerCase?.() ?? '';

    if (html.includes('__next_data__') || html.includes('/_next/') || generator.includes('next.js')) {
      stack.add('next.js');
    }
    if (html.includes('wp-content') || generator.includes('wordpress')) {
      stack.add('wordpress');
    }
    if (page.responseHeaders['server']?.toLowerCase().includes('cloudflare')) {
      stack.add('cloudflare');
    }
    if (page.responseHeaders['server']?.toLowerCase().includes('vercel')) {
      stack.add('vercel');
    }
    if (html.includes('react') || html.includes('/_next/') || page.consoleLogs.some((entry) => /react/i.test(entry.message))) {
      stack.add('react');
    }
  }

  return [...stack];
}

function isRetryable(error: Error | undefined): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return message.includes('timeout') ||
    message.includes('net::err_') ||
    message.includes('navigation failed') ||
    message.includes('connection refused') ||
    message.includes('econnreset');
}

function classifyError(error: Error | undefined): CrawlError['errorType'] {
  if (!error) return 'unknown';
  const message = error.message.toLowerCase();
  if (message.includes('timeout')) return 'timeout';
  if (message.includes('robots.txt')) return 'robots';
  if (message.includes('url validation') || message.includes('block')) return 'validation';
  if (message.includes('nav') || message.includes('net::')) return 'navigation';
  return 'unknown';
}
