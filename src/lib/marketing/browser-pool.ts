import { chromium, type Browser, type Page, type BrowserContext } from "playwright";
import { isPathAllowed } from "./robots";

interface BrowserInstance {
  browser: Browser;
  pageCount: number;
}

const MAX_CONCURRENT = process.env.VERCEL ? 1 : 2;
const RECYCLE_AFTER = 50;
const MAX_ACQUIRE_RETRIES = 10;
const pool: BrowserInstance[] = [];
let launching = 0;

const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar';

async function launchBrowserInstance(): Promise<Browser> {
  if (process.env.VERCEL) {
    const sparticuz = await import('@sparticuz/chromium-min');
    sparticuz.default.setGraphicsMode = false;
    return chromium.launch({
      args: sparticuz.default.args,
      executablePath: await sparticuz.default.executablePath(CHROMIUM_PACK_URL),
      headless: true,
    });
  }
  return chromium.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
    ],
  });
}

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 375, height: 812 };

// Rotating user agent pools — current versions as of early 2026
const DESKTOP_USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

const MOBILE_USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDelay(min = 100, max = 500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireBrowser(retries = 0): Promise<BrowserInstance> {
  // Find a browser with capacity, verify it's still alive
  for (let i = pool.length - 1; i >= 0; i--) {
    const instance = pool[i];
    if (!instance.browser.isConnected()) {
      pool.splice(i, 1);
      continue;
    }
    if (instance.pageCount < RECYCLE_AFTER) {
      instance.pageCount++;
      return instance;
    }
  }

  // Launch new if under limit
  if (pool.length + launching < MAX_CONCURRENT) {
    launching++;
    try {
      const browser = await launchBrowserInstance();
      const instance: BrowserInstance = { browser, pageCount: 1 };
      pool.push(instance);
      return instance;
    } finally {
      launching--;
    }
  }

  // Wait and retry with limit
  if (retries >= MAX_ACQUIRE_RETRIES) {
    throw new Error(
      `Failed to acquire browser after ${MAX_ACQUIRE_RETRIES} retries — all instances busy`
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return acquireBrowser(retries + 1);
}

function releaseBrowser(instance: BrowserInstance): void {
  if (instance.pageCount >= RECYCLE_AFTER) {
    const idx = pool.indexOf(instance);
    if (idx !== -1) pool.splice(idx, 1);
    instance.browser.close().catch(() => {});
  }
}

export type DeviceType = "desktop" | "mobile";

/** Navigate to a URL, respecting robots.txt. Throws if disallowed. */
async function navigateWithRobotsCheck(page: Page, url: string): Promise<void> {
  const parsed = new URL(url);
  const allowed = await isPathAllowed(parsed.hostname, parsed.pathname);
  if (!allowed) {
    console.log(`[robots.txt] Skipping disallowed path: ${parsed.pathname} on ${parsed.hostname}`);
    throw new Error(`robots.txt disallows path: ${parsed.pathname}`);
  }
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
}

export async function withBrowser<T>(
  deviceType: DeviceType,
  callback: (page: Page, context: BrowserContext) => Promise<T>
): Promise<T> {
  const instance = await acquireBrowser();
  const viewport = deviceType === "mobile" ? MOBILE_VIEWPORT : DESKTOP_VIEWPORT;
  const userAgent = deviceType === "mobile"
    ? pickRandom(MOBILE_USER_AGENTS)
    : pickRandom(DESKTOP_USER_AGENTS);

  const context = await instance.browser.newContext({
    viewport,
    userAgent,
    locale: "en-US",
    timezoneId: "America/New_York",
    extraHTTPHeaders: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-CH-UA-Platform": deviceType === "mobile" ? '"iOS"' : '"macOS"',
    },
  });

  // Stealth: override navigator.webdriver and add Chrome-like properties
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    // Chrome-like window.chrome object
    if (!(window as any).chrome) {
      (window as any).chrome = {
        runtime: { connect: () => {}, sendMessage: () => {} },
      };
    }
    // Hide Playwright-specific properties
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });

  const page = await context.newPage();

  try {
    // Add human-like delay helper to page
    await randomDelay();
    const result = await callback(page, context);
    return result;
  } finally {
    await context.close().catch(() => {});
    releaseBrowser(instance);
  }
}

export async function closeAll(): Promise<void> {
  await Promise.all(pool.map((i) => i.browser.close().catch(() => {})));
  pool.length = 0;
}

export { randomDelay, navigateWithRobotsCheck };

// ── Cloudflare Browser Rendering REST API fallback ──

/**
 * Resolve hostname and check that it does NOT point to a private/loopback IP.
 * Prevents DNS rebinding SSRF when forwarding URLs to external services.
 */
async function isPublicHostname(hostname: string): Promise<boolean> {
  try {
    const { resolve4 } = await import("node:dns/promises");
    const addresses = await Promise.race([
      resolve4(hostname),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DNS timeout')), 10_000)
      ),
    ]);
    for (const addr of addresses) {
      if (
        addr.startsWith("127.") ||
        addr.startsWith("10.") ||
        addr.startsWith("0.") ||
        addr.startsWith("169.254.") ||
        addr.startsWith("192.168.") ||
        addr === "::1" ||
        // 172.16.0.0 – 172.31.255.255
        (addr.startsWith("172.") && (() => {
          const second = parseInt(addr.split(".")[1], 10);
          return second >= 16 && second <= 31;
        })())
      ) {
        return false;
      }
    }
    return true;
  } catch {
    // DNS resolution failed — treat as unsafe
    return false;
  }
}

/**
 * Fetch rendered HTML via Cloudflare Browser Rendering REST API.
 * Returns null if CF BR is not configured, robots.txt disallows, or request fails.
 */
export async function cfFetchHtml(url: string): Promise<string | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_BR_TOKEN;
  if (!accountId || !token) return null;

  try {
    const parsed = new URL(url);

    // SSRF: re-validate hostname resolves to public IP
    if (!(await isPublicHostname(parsed.hostname))) {
      console.warn("[cf-br] Blocked: hostname resolves to private IP");
      return null;
    }

    // robots.txt enforcement
    if (!(await isPathAllowed(parsed.hostname, parsed.pathname))) {
      console.warn(`[cf-br] Blocked by robots.txt: ${parsed.pathname}`);
      return null;
    }

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/content`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!res.ok) {
      console.warn(`[cf-br] HTML fetch failed: ${res.status}`);
      return null;
    }

    return await res.text();
  } catch (err) {
    console.warn(`[cf-br] HTML fetch error: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Fetch screenshot via Cloudflare Browser Rendering REST API.
 * Returns PNG buffer, or null if not configured or request fails.
 */
export async function cfFetchScreenshot(url: string): Promise<Buffer | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_BR_TOKEN;
  if (!accountId || !token) return null;

  try {
    const parsed = new URL(url);

    if (!(await isPublicHostname(parsed.hostname))) {
      console.warn("[cf-br] Blocked: hostname resolves to private IP");
      return null;
    }

    if (!(await isPathAllowed(parsed.hostname, parsed.pathname))) {
      console.warn(`[cf-br] Blocked by robots.txt: ${parsed.pathname}`);
      return null;
    }

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/screenshot`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          viewport_width: 1280,
          viewport_height: 800,
        }),
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!res.ok) {
      console.warn(`[cf-br] Screenshot failed: ${res.status}`);
      return null;
    }

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch (err) {
    console.warn(`[cf-br] Screenshot error: ${(err as Error).message}`);
    return null;
  }
}
