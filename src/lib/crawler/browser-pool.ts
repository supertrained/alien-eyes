import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

export type CrawlDeviceType = 'desktop' | 'mobile';

export interface BrowserPoolOptions {
  maxConcurrentBrowsers?: number;
  launchBrowser?: () => Promise<Browser>;
}

async function launchServerlessBrowser(): Promise<Browser> {
  const sparticuz = await import('@sparticuz/chromium');
  sparticuz.default.setGraphicsMode = false;
  return chromium.launch({
    args: sparticuz.default.args,
    executablePath: await sparticuz.default.executablePath('/tmp/chromium'),
    headless: true,
  });
}

function launchLocalBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled'
    ]
  });
}

export interface BrowserSession {
  context: BrowserContext;
  page: Page;
  deviceType: CrawlDeviceType;
  viewport: { width: number; height: number };
}

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };

const DESKTOP_USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
];

const MOBILE_USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36'
];

export class BrowserPool {
  private readonly maxConcurrentBrowsers: number;
  private readonly launchBrowser: () => Promise<Browser>;
  private browserPromise?: Promise<Browser>;
  private activeContexts = 0;
  private waiters: Array<() => void> = [];

  constructor(options: BrowserPoolOptions = {}) {
    this.maxConcurrentBrowsers = options.maxConcurrentBrowsers ?? 1;
    this.launchBrowser = options.launchBrowser ?? (
      process.env.VERCEL ? launchServerlessBrowser : launchLocalBrowser
    );
  }

  async withCleanPage<T>(
    deviceType: CrawlDeviceType,
    callback: (session: BrowserSession) => Promise<T>
  ): Promise<T> {
    await this.acquireSlot();
    const browser = await this.getBrowser();
    const viewport = deviceType === 'mobile' ? MOBILE_VIEWPORT : DESKTOP_VIEWPORT;
    const context = await browser.newContext({
      viewport,
      ignoreHTTPSErrors: false,
      locale: 'en-US',
      userAgent: this.pickUserAgent(deviceType)
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
      if (!(window as Window & { chrome?: { runtime: object } }).chrome) {
        (window as Window & { chrome?: { runtime: object } }).chrome = { runtime: {} };
      }
    });

    const page = await context.newPage();

    try {
      return await callback({ context, page, deviceType, viewport });
    } finally {
      await context.close().catch(() => undefined);
      this.releaseSlot();
    }
  }

  async closeAll(): Promise<void> {
    const browser = await this.browserPromise;
    await browser?.close().catch(() => undefined);
    this.browserPromise = undefined;
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = this.launchBrowser();
    }

    return this.browserPromise;
  }

  private pickUserAgent(deviceType: CrawlDeviceType): string {
    const pool = deviceType === 'mobile' ? MOBILE_USER_AGENTS : DESKTOP_USER_AGENTS;
    const index = Math.floor(Math.random() * pool.length);
    return pool[index] ?? pool[0]!;
  }

  private async acquireSlot(): Promise<void> {
    if (this.activeContexts < this.maxConcurrentBrowsers) {
      this.activeContexts += 1;
      return;
    }

    await new Promise<void>((resolve) => {
      this.waiters.push(() => {
        this.activeContexts += 1;
        resolve();
      });
    });
  }

  private releaseSlot(): void {
    this.activeContexts = Math.max(0, this.activeContexts - 1);
    const next = this.waiters.shift();
    next?.();
  }
}
