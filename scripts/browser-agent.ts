import { chromium, type Browser, type Page } from 'playwright';

const args = process.argv.slice(2);
const action = args[0];
const target = args[1];
const extra = args.slice(2).join(' ');

const CDP_URL = 'http://127.0.0.1:9222';
const USER_DATA_DIR = '/tmp/ae-browser-agent';

async function launchBrowser(): Promise<void> {
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--remote-debugging-port=9222'],
  });
  const page = context.pages()[0] ?? await context.newPage();
  console.log('Browser launched with CDP on port 9222');
  console.log(`Page URL: ${page.url()}`);
  // Keep alive — the process stays running until killed
  await new Promise(() => {});
}

async function connectAndRun(): Promise<void> {
  const browser = await chromium.connectOverCDP(CDP_URL);
  const contexts = browser.contexts();
  const context = contexts[0];
  if (!context) throw new Error('No browser context found');
  const page = context.pages()[0] ?? await context.newPage();

  try {
    await runAction(page);
  } finally {
    // Disconnect without closing — browser stays open
    await browser.close();
  }
}

async function runAction(page: Page): Promise<void> {
  switch (action) {
    case 'open':
      if (!target) throw new Error('open requires a URL');
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log(`Navigated to: ${page.url()}`);
      console.log(`Title: ${await page.title()}`);
      break;

    case 'screenshot': {
      const path = target ?? '/tmp/ae-screenshot.png';
      await page.screenshot({ path, fullPage: false });
      console.log(`Screenshot saved: ${path}`);
      break;
    }

    case 'click':
      if (!target) throw new Error('click requires a selector or text');
      try {
        await page.click(target, { timeout: 5000 });
      } catch {
        await page.getByText(target, { exact: false }).first().click({ timeout: 5000 });
      }
      console.log(`Clicked: ${target}`);
      await page.waitForTimeout(1000);
      break;

    case 'type':
      if (!target || !extra) throw new Error('type requires selector and text');
      await page.fill(target, extra);
      console.log(`Typed into ${target}: ${extra}`);
      break;

    case 'url':
      console.log(page.url());
      break;

    case 'wait': {
      const ms = parseInt(target ?? '3000', 10);
      await page.waitForTimeout(ms);
      console.log(`Waited ${ms}ms`);
      break;
    }

    case 'eval':
      if (!target) throw new Error('eval requires JS expression');
      const jsExpr = [target, extra].filter(Boolean).join(' ');
      const result = await page.evaluate(jsExpr);
      console.log(JSON.stringify(result, null, 2));
      break;

    case 'content': {
      const text = await page.textContent('body');
      console.log(text?.slice(0, 3000));
      break;
    }

    default:
      console.error(`Unknown action: ${action}`);
      process.exit(1);
  }
}

async function main() {
  if (!action) {
    console.log('Usage:');
    console.log('  browser-agent launch              # Start browser (background)');
    console.log('  browser-agent open <url>           # Navigate');
    console.log('  browser-agent screenshot [path]    # Take screenshot');
    console.log('  browser-agent click <selector>     # Click element');
    console.log('  browser-agent type <sel> <text>    # Type into element');
    console.log('  browser-agent eval <js>            # Run JS');
    console.log('  browser-agent content              # Get body text');
    console.log('  browser-agent url                  # Get current URL');
    console.log('  browser-agent wait [ms]            # Wait');
    process.exit(0);
  }

  if (action === 'launch') {
    await launchBrowser();
  } else {
    await connectAndRun();
  }
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
