import type { AccessibilityNode, ConsoleEntry, CrawledPage, CoreWebVitals, NetworkEntry, RenderedSnapshot } from '@/types';
import { InputSanitizer } from '@/lib/security/input-sanitizer';
import type { URLValidator } from '@/lib/security/url-validator';
import type { CrawlDeviceType } from '@/lib/crawler/browser-pool';
import type { RobotsTxtPolicy } from '@/lib/crawler/link-discovery';

export interface PageLike {
  on(event: 'console', handler: (message: ConsoleMessageLike) => void): void;
  on(event: 'response', handler: (response: ResponseLike) => void): void;
  goto(url: string, options?: { waitUntil?: 'domcontentloaded' | 'networkidle'; timeout?: number }): Promise<ResponseLike | null>;
  content(): Promise<string>;
  title(): Promise<string>;
  screenshot(options: { path: string; fullPage: boolean }): Promise<unknown>;
  addInitScript?(script: string): Promise<void>;
  close?(): Promise<void>;
  /** Execute a function in the browser context. Required for rendered-DOM extraction. */
  evaluate<T>(pageFunction: string | ((...args: any[]) => T | Promise<T>), ...args: any[]): Promise<T>;
  accessibility?: {
    snapshot(options?: { interestingOnly?: boolean }): Promise<AccessibilityNode | null>;
  };
}

export interface ConsoleMessageLike {
  type(): string;
  text(): string;
}

export interface ResponseLike {
  url(): string;
  status(): number;
  headers(): Record<string, string>;
  request(): RequestLike;
}

export interface RequestLike {
  method(): string;
  resourceType(): string;
  sizes?(): Promise<{ responseBodySize: number }>;
  timing?(): { responseEnd?: number; startTime?: number };
}

export interface CollectPageOptions {
  page: PageLike;
  url: string;
  validator: URLValidator;
  robotsPolicy: RobotsTxtPolicy;
  screenshotPath: string;
  deviceType: CrawlDeviceType;
  viewport: { width: number; height: number };
  timeoutMs?: number;
  sanitizer?: InputSanitizer;
}

/** Maximum time to wait for DOM to stabilize after networkidle (ms) */
const DOM_STABILITY_TIMEOUT_MS = 3000;
/** Interval between DOM stability checks (ms) */
const DOM_STABILITY_POLL_MS = 200;
/** Number of consecutive stable polls required */
const DOM_STABILITY_CHECKS = 3;

export async function collectPage(options: CollectPageOptions): Promise<CrawledPage> {
  const sanitizer = options.sanitizer ?? new InputSanitizer();
  const validation = await options.validator.validate(options.url);
  if (!validation.valid) {
    throw new Error(validation.blockReason ?? 'URL validation failed');
  }

  const allowed = await options.robotsPolicy.isAllowed(options.url);
  if (!allowed) {
    throw new Error(`robots.txt blocks ${options.url}`);
  }

  const consoleLogs: ConsoleEntry[] = [];
  const networkRequests: NetworkEntry[] = [];

  await installCoreWebVitalsObservers(options.page);

  options.page.on('console', (message) => {
    consoleLogs.push({
      level: toConsoleLevel(message.type()),
      message: message.text().slice(0, 500),
      timestamp: new Date().toISOString()
    });
  });

  options.page.on('response', async (response) => {
    try {
      const request = response.request();
      const headers = response.headers();
      const contentType = headers['content-type'] ?? headers['Content-Type'] ?? 'unknown';
      const size = request.sizes ? (await request.sizes()).responseBodySize : 0;
      const timing = request.timing?.();
      const durationMs = timing?.responseEnd && timing.startTime ? Math.max(0, Math.round(timing.responseEnd - timing.startTime)) : 0;

      networkRequests.push({
        url: response.url(),
        method: request.method(),
        statusCode: response.status(),
        contentType,
        size,
        durationMs,
        resourceType: toResourceType(request.resourceType())
      });
    } catch {
      return;
    }
  });

  const startedAt = Date.now();
  const response = await options.page.goto(options.url, {
    waitUntil: 'networkidle',
    timeout: options.timeoutMs ?? 30_000
  });
  const loadTimeMs = Date.now() - startedAt;

  // Wait for DOM to stabilize (SPA hydration, lazy rendering)
  await waitForDomStability(options.page);

  // Extract from rendered DOM via page.evaluate() instead of Cheerio on raw HTML
  const [renderedSnapshot, accessibilityTree, coreWebVitals, renderBlockingResourceCount] = await Promise.all([
    extractRenderedSnapshot(options.page),
    options.page.accessibility?.snapshot?.({ interestingOnly: false }) ?? Promise.resolve(null),
    collectCoreWebVitals(options.page),
    countRenderBlockingResources(options.page)
  ]);

  const html = await options.page.content();
  const dom = sanitizer.sanitizeHtml(html);

  await options.page.screenshot({ path: options.screenshotPath, fullPage: true });

  return {
    url: options.url,
    html,
    dom,
    screenshot: options.screenshotPath,
    consoleLogs,
    networkRequests,
    responseHeaders: response?.headers() ?? {},
    metaTags: renderedSnapshot.metaTags,
    statusCode: response?.status() ?? 0,
    loadTimeMs,
    viewport: options.viewport,
    deviceType: options.deviceType,
    renderedSnapshot,
    accessibilityTree,
    coreWebVitals,
    renderBlockingResourceCount
  };
}

/**
 * Wait until the DOM body's innerHTML length stabilizes.
 * Catches SPA hydration, deferred renders, and lazy content injection.
 */
async function waitForDomStability(page: PageLike): Promise<void> {
  let stableCount = 0;
  let previousLength = -1;
  const deadline = Date.now() + DOM_STABILITY_TIMEOUT_MS;

  while (Date.now() < deadline && stableCount < DOM_STABILITY_CHECKS) {
    const currentLength = await page.evaluate(() => document.body?.innerHTML?.length ?? 0);

    if (currentLength === previousLength) {
      stableCount += 1;
    } else {
      stableCount = 0;
    }

    previousLength = currentLength;

    if (stableCount < DOM_STABILITY_CHECKS) {
      await new Promise((resolve) => setTimeout(resolve, DOM_STABILITY_POLL_MS));
    }
  }
}

/**
 * Extract meta tags from the rendered DOM via page.evaluate().
 * Captures JS-injected meta tags that Cheerio on source HTML misses.
 */
async function installCoreWebVitalsObservers(page: PageLike): Promise<void> {
  if (!page.addInitScript) {
    return;
  }

  await page.addInitScript(`
    (() => {
      if ((window).__alienEyesVitalsInstalled) return;
      (window).__alienEyesVitalsInstalled = true;
      (window).__alienEyesVitals = { cls: 0 };
      try {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            (window).__alienEyesVitals.lcpMs = Math.round(lastEntry.startTime || 0);
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}
      try {
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              (window).__alienEyesVitals.cls += entry.value || 0;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {}
    })();
  `);
}

async function extractRenderedSnapshot(page: PageLike): Promise<RenderedSnapshot> {
  return page.evaluate<RenderedSnapshot>(`
    (() => {
      const __ALIEN_EYES_RENDERED_SNAPSHOT__ = true;
      const tags = {};
      const isTransparent = (color) => color === 'transparent' || color === 'rgba(0, 0, 0, 0)';
      const toRgb = (color) => {
        const match = color.match(/rgba?\\(([^)]+)\\)/i);
        if (!match) return null;
        const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
        if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null;
        return [parts[0], parts[1], parts[2]];
      };
      const resolveBackground = (element) => {
        let current = element;
        while (current) {
          const color = window.getComputedStyle(current).backgroundColor;
          const parsed = toRgb(color);
          if (parsed && !isTransparent(color)) return { raw: color, rgb: parsed };
          current = current.parentElement;
        }
        return { raw: 'rgb(255, 255, 255)', rgb: [255, 255, 255] };
      };
      const relativeLuminance = (rgb) => {
        const srgb = rgb.map((value) => {
          const normalized = value / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
      };
      const contrastRatio = (foreground, background) => {
        const fgL = relativeLuminance(foreground);
        const bgL = relativeLuminance(background.rgb);
        const lighter = Math.max(fgL, bgL);
        const darker = Math.min(fgL, bgL);
        return (lighter + 0.05) / (darker + 0.05);
      };
      const collectContrastIssues = () => {
        const issues = [];
        const seen = new Set();
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const textNode = walker.currentNode;
          const text = textNode.textContent?.replace(/\\s+/g, ' ').trim();
          const parent = textNode.parentElement;
          if (!text || !parent) continue;
          const style = window.getComputedStyle(parent);
          if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;
          const foreground = toRgb(style.color);
          if (!foreground) continue;
          const background = resolveBackground(parent);
          const ratio = contrastRatio(foreground, background);
          const fontSizePx = Number.parseFloat(style.fontSize || '16');
          const fontWeight = Number.parseInt(style.fontWeight || '400', 10);
          const largeText = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
          const threshold = largeText ? 3 : 4.5;
          if (ratio >= threshold) continue;
          const key = text + '|' + Math.round(ratio * 100);
          if (seen.has(key)) continue;
          seen.add(key);
          issues.push({
            text: text.slice(0, 160),
            ratio: Math.round(ratio * 100) / 100,
            foreground: style.color,
            background: background.raw,
            largeText
          });
        }
        return issues.slice(0, 10);
      };

      document.querySelectorAll('meta').forEach((el) => {
        const key = el.getAttribute('name') ?? el.getAttribute('property') ?? el.getAttribute('http-equiv');
        const value = el.getAttribute('content');
        if (key && value) tags[key] = value;
      });

      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
      if (canonical) tags.canonical = canonical;

      const titleEl = document.querySelector('title');
      if (titleEl?.textContent) tags.title = titleEl.textContent.replace(/\\s+/g, ' ').trim();

      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map((element) => {
          const level = Number(element.tagName.slice(1));
          const text = element.textContent?.replace(/\\s+/g, ' ').trim() ?? '';
          return text ? { level, text } : null;
        })
        .filter(Boolean);

      const links = Array.from(document.querySelectorAll('a[href]'))
        .map((element) => {
          const href = element.getAttribute('href')?.trim();
          if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return null;
          const resolved = new URL(href, document.baseURI);
          const current = new URL(document.baseURI);
          return {
            href,
            text: element.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
            isInternal: resolved.origin === current.origin,
            nofollow: (element.getAttribute('rel') ?? '').split(/\\s+/).includes('nofollow')
          };
        })
        .filter(Boolean);

      const images = Array.from(document.querySelectorAll('img')).map((element) => {
        const alt = element.getAttribute('alt');
        return {
          src: element.getAttribute('src') ?? '',
          alt: alt ?? null,
          hasAlt: alt !== null,
          isDecorative: alt === '',
          width: element.getAttribute('width') ? Number(element.getAttribute('width')) : undefined,
          height: element.getAttribute('height') ? Number(element.getAttribute('height')) : undefined
        };
      });

      const ariaLandmarks = Array.from(document.querySelectorAll('main, nav, header, footer, aside, form, [role]')).map((element) => {
        const tagName = element.tagName.toLowerCase();
        let role = element.getAttribute('role') ?? tagName;
        if ((tagName === 'nav' || tagName === 'footer') && element.closest('main')) role = role + '-inside-main';
        return {
          role,
          label: element.getAttribute('aria-label') ?? element.getAttribute('aria-labelledby') ?? undefined,
          isNative: ['main', 'nav', 'header', 'footer', 'aside', 'form'].includes(tagName)
        };
      });

      const interactiveElements = Array.from(document.querySelectorAll('a[href], button, input[type="submit"], input[type="button"], [role="button"], [role="link"]')).map((element) => {
        const tag = element.tagName.toLowerCase();
        const text = (element.textContent ?? element.getAttribute('value') ?? '').replace(/\\s+/g, ' ').trim();
        return {
          tag,
          role: element.getAttribute('role') ?? undefined,
          text,
          accessibleName: (element.getAttribute('aria-label') ?? text).trim() || undefined,
          href: tag === 'a' ? element.getAttribute('href') ?? undefined : undefined,
          type: tag === 'input' ? element.getAttribute('type') ?? undefined : undefined
        };
      });

      const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((element) => element.textContent?.trim() ?? '')
        .filter(Boolean)
        .map((raw) => {
          try {
            return JSON.parse(raw);
          } catch {
            return { type: 'invalid-json-ld', raw: raw.slice(0, 500) };
          }
        });

      return {
        metaTags: tags,
        headings,
        links,
        images,
        ariaLandmarks,
        interactiveElements,
        contrastIssues: collectContrastIssues(),
        structuredData,
        visibleText: document.body?.innerText?.replace(/\\s+/g, ' ').trim() ?? ''
      };
    })()
  `);
}

/**
 * Collect Core Web Vitals (LCP, CLS) from the browser's performance API.
 * Reads entries that the browser accumulated during page load.
 */
async function collectCoreWebVitals(page: PageLike): Promise<CoreWebVitals> {
  return page.evaluate(() => {
    const __ALIEN_EYES_CWV__ = true;
    const snapshot = (window as Window & { __alienEyesVitals?: { lcpMs?: number; cls?: number } }).__alienEyesVitals ?? {};
    return {
      lcpMs: snapshot.lcpMs,
      cls: snapshot.cls !== undefined ? Math.round(snapshot.cls * 1000) / 1000 : undefined
    };
  });
}

/**
 * Count render-blocking resources in the rendered DOM.
 * Only counts scripts without async/defer/module and stylesheets without media="print".
 */
async function countRenderBlockingResources(page: PageLike): Promise<number> {
  return page.evaluate(() => {
    const __ALIEN_EYES_BLOCKING__ = true;
    const blockingScripts = document.querySelectorAll(
      'script[src]:not([async]):not([defer]):not([type="module"])'
    );
    const blockingStylesheets = document.querySelectorAll(
      'link[rel="stylesheet"]:not([media="print"]):not([disabled])'
    );
    return blockingScripts.length + blockingStylesheets.length;
  });
}

function toConsoleLevel(level: string): ConsoleEntry['level'] {
  if (level === 'warning' || level === 'warn') {
    return 'warning';
  }
  if (level === 'error') {
    return 'error';
  }
  if (level === 'debug') {
    return 'debug';
  }
  if (level === 'info') {
    return 'info';
  }
  return 'log';
}

function toResourceType(resourceType: string): NetworkEntry['resourceType'] {
  switch (resourceType) {
    case 'document':
    case 'script':
    case 'stylesheet':
    case 'image':
    case 'font':
    case 'xhr':
    case 'fetch':
      return resourceType;
    default:
      return 'other';
  }
}
