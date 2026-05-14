import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { withBrowser, randomDelay } from "@marketing/browser-pool";
import { technologyDetection } from "@marketing/dataforseo";
import { absenceSignal } from "@marketing/signal-builder";

// --- Detection patterns ported from marketing-primitive-brain ---

const ANALYTICS_PATTERNS: Record<
  string,
  { patterns: RegExp[]; extractId: RegExp }
> = {
  google_analytics_ga4: {
    patterns: [/gtag\(/i, /googletagmanager\.com\/gtag/i, /G-[A-Z0-9]{4,}/i],
    extractId: /(G-[A-Z0-9]{4,})/,
  },
  google_tag_manager: {
    patterns: [/googletagmanager\.com\/gtm\.js/i, /GTM-[A-Z0-9]+/i],
    extractId: /(GTM-[A-Z0-9]+)/,
  },
  meta_pixel: {
    patterns: [/connect\.facebook\.net\/.*\/fbevents\.js/i, /fbq\s*\(/i],
    extractId: /fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/,
  },
  hotjar: {
    patterns: [/static\.hotjar\.com/i, /hj\s*\(\s*['"]identify['"]/i],
    extractId: /hjid:(\d+)/,
  },
  microsoft_clarity: {
    patterns: [/clarity\.ms\/tag/i],
    extractId: /clarity\.ms\/tag\/([a-z0-9]+)/i,
  },
  tiktok_pixel: {
    patterns: [/analytics\.tiktok\.com/i, /ttq\.load/i],
    extractId: /ttq\.load\s*\(\s*['"]([A-Z0-9]+)['"]/,
  },
  linkedin_insight: {
    patterns: [/snap\.licdn\.com\/li\.lms-analytics/i, /dc\.ads\.linkedin\.com/i],
    extractId: /_linkedin_partner_id\s*=\s*['"](\d+)['"]/,
  },
  google_ads: {
    patterns: [/googleads\.g\.doubleclick\.net/i, /gtag.*config.*AW-/i],
    extractId: /(AW-\d+)/,
  },
};

const CMS_PATTERNS: Record<string, { patterns: RegExp[] }> = {
  wordpress: { patterns: [/wp-content/i, /wp-includes/i, /wp-json/i] },
  shopify: { patterns: [/cdn\.shopify\.com/i, /Shopify\.theme/i] },
  webflow: { patterns: [/webflow\.com/i, /data-wf-site/i] },
  squarespace: { patterns: [/squarespace\.com/i, /static\.squarespace/i] },
  wix: { patterns: [/wix\.com/i, /parastorage\.com/i] },
  ghost: { patterns: [/ghost\.org/i, /ghost-api/i] },
  hubspot_cms: { patterns: [/hs-scripts\.com/i, /js\.hs-analytics/i] },
};

const MARKETING_TOOL_PATTERNS: Record<string, { patterns: RegExp[] }> = {
  klaviyo: { patterns: [/static\.klaviyo\.com/i, /a\.klaviyo\.com/i] },
  mailchimp: { patterns: [/chimpstatic\.com/i, /list-manage\.com/i] },
  hubspot: { patterns: [/js\.hs-scripts\.com/i, /forms\.hubspot\.com/i] },
  intercom: { patterns: [/widget\.intercom\.io/i, /intercomcdn\.com/i] },
  drift: { patterns: [/js\.driftt\.com/i, /drift\.com/i] },
  convertkit: { patterns: [/convertkit\.com/i, /ck\.page/i] },
  activecampaign: { patterns: [/trackcmp\.net/i, /activecampaign\.com/i] },
  segment: { patterns: [/cdn\.segment\.com/i, /analytics\.js/i] },
  mixpanel: { patterns: [/cdn\.mxpnl\.com/i, /mixpanel\.com/i] },
  amplitude: { patterns: [/cdn\.amplitude\.com/i, /amplitude\.com/i] },
  fullstory: { patterns: [/fullstory\.com\/s\/fs\.js/i] },
  heap: { patterns: [/heap-.*\.js/i, /heapanalytics\.com/i] },
  // B6: CRM Detection
  salesforce_crm: { patterns: [/force\.com/i, /salesforce\.com/i, /lightning/i] },
  hubspot_crm: { patterns: [/app\.hubspot\.com/i, /hs-scripts\.com.*crm/i] },
  pipedrive: { patterns: [/pipedrive\.com/i] },
  close_crm: { patterns: [/close\.com\/js/i, /app\.close\.com/i] },
  zoho_crm: { patterns: [/zoho\.com\/crm/i, /zohopublic\.com/i] },
  // B7: Attribution Platform Detection
  triple_whale: { patterns: [/triplewhale\.com/i, /tw-pixel/i] },
  rockerbox: { patterns: [/rockerbox\.com/i] },
  northbeam: { patterns: [/northbeam\.io/i] },
  ruler_analytics: { patterns: [/ruleranalytics\.com/i] },
  // B8: Zapier/Make Detection
  zapier: { patterns: [/hooks\.zapier\.com/i] },
  make_integromat: { patterns: [/hook\..*\.make\.com/i, /integromat\.com/i] },
};

// Popup / lead capture tool patterns
const POPUP_TOOL_PATTERNS: Record<string, { patterns: RegExp[] }> = {
  optinmonster: { patterns: [/optinmonster/i] },
  optimonk: { patterns: [/optimonk/i] },
  convertkit_modal: { patterns: [/convertkit.*modal|ck-modal/i] },
  elementor_popup: { patterns: [/elementor.*popup|e-popup/i] },
  sumo: { patterns: [/sumo\.com/i, /sumome/i] },
  hellobar: { patterns: [/hellobar/i] },
  privy: { patterns: [/privy\.com/i] },
  typeform: { patterns: [/typeform\.com/i] },
  calendly: { patterns: [/calendly\.com/i, /assets\.calendly/i] },
  sleeknote: { patterns: [/sleeknote\.com/i] },
  wisepops: { patterns: [/wisepops\.com/i] },
};

interface DetectedTool {
  name: string;
  category: "analytics" | "cms" | "marketing_tool" | "technology";
  id: string | null;
  verified: boolean;
}

interface TrackingIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
}

export interface TrackingAnalyticsData {
  detected: DetectedTool[];
  issues: TrackingIssue[];
  networkRequests: { url: string; blocked: boolean }[];
  consoleErrors: string[];
  cookieConsent: {
    detected: boolean;
    platform: string | null;
  };
  utmHandling: {
    tested: boolean;
    persisted: boolean;
  };
  dataLayer: {
    events: string[];
    eventCount: number;
    hasEcommerce: boolean;
    hasCustomEvents: boolean;
    raw: unknown[] | null;
  } | null;
  cookies: {
    total: number;
    firstParty: number;
    thirdParty: number;
    session: number;
    persistent: number;
    categories: Record<string, number>;
    names: string[];
  } | null;
  ga4Events: {
    eventNames: string[];
    hasCustomEvents: boolean;
    hasEnhancedMeasurement: boolean;
    totalEvents: number;
  } | null;
  consentModeV2: {
    detected: boolean;
    hasDefault: boolean;
    hasUpdate: boolean;
    consentTypes: string[];
    missingTypes: string[];
    properlyConfigured: boolean;
  } | null;
  iabApi: {
    hasTcfApi: boolean;
    hasUspApi: boolean;
    hasGppApi: boolean;
  } | null;
  consentDarkPatterns: {
    noRejectButton: boolean;
    preCheckedCategories: boolean;
    consentWall: boolean;
    count: number;
  } | null;
  consentComplianceScore: {
    score: number;
    maxScore: number;
    rating: "strong" | "adequate" | "weak" | "none";
    factors: string[];
  } | null;
  maturityScore: {
    level: number;
    label: string;
    factors: string[];
  };
}

function matchPatterns(
  content: string,
  patterns: Record<string, { patterns: RegExp[]; extractId?: RegExp }>,
  category: DetectedTool["category"]
): DetectedTool[] {
  const found: DetectedTool[] = [];
  for (const [name, config] of Object.entries(patterns)) {
    const matched = config.patterns.some((p) => p.test(content));
    if (matched) {
      let id: string | null = null;
      if ("extractId" in config && config.extractId) {
        const match = content.match(config.extractId);
        id = match?.[1] ?? null;
      }
      found.push({ name, category, id, verified: false });
    }
  }
  return found;
}

// Cookie consent platform patterns (Phase 1: expanded from 7 to 22 CMPs)
const CONSENT_PATTERNS: Record<string, RegExp> = {
  // Original 7
  cookiebot: /cookiebot\.com|CybotCookiebotDialog/i,
  onetrust: /onetrust\.com|optanon|onetrust-banner/i,
  termly: /termly\.io/i,
  iubenda: /iubenda\.com/i,
  cookieyes: /cookieyes\.com/i,
  complianz: /complianz/i,
  osano: /osano\.com/i,
  // Phase 1 additions (15 new CMPs)
  trustarc: /truste\.com|trustarc\.com/i,
  didomi: /didomi\.io|didomi-popup/i,
  quantcast: /quantcast\.com\/choice|__cmpLocator/i,
  sourcepoint: /sourcepoint/i,
  usercentrics: /usercentrics\.eu|uc-banner/i,
  securiti: /securiti\.ai/i,
  ketch: /ketch\.com/i,
  admiral: /admiral\.com|getadmiral/i,
  consentmanager: /consentmanager\.net/i,
  civic: /civiccomputing\.com|civic.*cookie/i,
  cookiefirst: /cookiefirst\.com/i,
  cookiescript: /cookie-script\.com/i,
  klaro: /klaro\.js|klaro-config/i,
  borlabs: /borlabs-cookie/i,
  piwikpro: /piwik\.pro.*consent|ppms\.com.*consent/i,
};

export async function runTrackingAnalytics(
  url: string,
  domain: string
): Promise<Envelope<TrackingAnalyticsData | null>> {
  const startTime = Date.now();
  const primitive = "tracking_analytics";

  try {
    // Browser analysis: intercept requests, capture console, analyze HTML
    const browserData = await withBrowser("desktop", async (page, context) => {
      const networkRequests: { url: string; blocked: boolean }[] = [];
      const consoleErrors: string[] = [];
      const ga4CollectParams: string[] = []; // Feature 0D: collect GA4 event params

      // Intercept network requests to see what fires
      page.on("request", (req) => {
        const reqUrl = req.url();
        // Track analytics/ad-related requests
        const isTracking =
          /google-analytics|googletagmanager|facebook\.net|fbevents|clarity\.ms|hotjar|tiktok|linkedin|doubleclick/i.test(
            reqUrl
          );
        if (isTracking) {
          networkRequests.push({ url: reqUrl, blocked: false });
        }

        // Feature 0D: Capture GA4 collect requests for event parsing
        if (/google-analytics\.com\/g\/collect|analytics\.google\.com\/g\/collect/i.test(reqUrl)) {
          ga4CollectParams.push(reqUrl);
        }
      });

      page.on("requestfailed", (req) => {
        const reqUrl = req.url();
        const isTracking =
          /google-analytics|googletagmanager|facebook\.net|fbevents|clarity\.ms|hotjar|tiktok|linkedin|doubleclick/i.test(
            reqUrl
          );
        if (isTracking) {
          networkRequests.push({ url: reqUrl, blocked: true });
        }
      });

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      await randomDelay(1000, 2000); // Wait for delayed scripts

      const html = await page.content();

      // Passive UTM detection: check if the page has UTM-handling JavaScript
      // (no injecting test UTMs which would show up in the prospect's analytics)
      const utmHandling = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll("script"));
        const inlineCode = scripts.map((s) => s.textContent ?? "").join(" ");
        const hasUtmParsing = /utm_source|utm_medium|utm_campaign|getParam.*utm/i.test(inlineCode);
        const hasUtmInLinks = Array.from(document.querySelectorAll("a"))
          .some((a) => a.href.includes("utm_"));
        return { hasUtmParsing, hasUtmInLinks };
      });
      const utmPersisted = utmHandling.hasUtmParsing || utmHandling.hasUtmInLinks;

      // --- Feature 0A: dataLayer Extraction ---
      let dataLayerResult: TrackingAnalyticsData["dataLayer"] = null;
      try {
        const dlRaw = await Promise.race([
          page.evaluate(() => (window as any).dataLayer as unknown[] | undefined),
          new Promise<undefined>((_, reject) =>
            setTimeout(() => reject(new Error("dataLayer timeout")), 5000)
          ),
        ]);
        if (Array.isArray(dlRaw)) {
          const GTM_BUILTIN_EVENTS = new Set([
            "gtm", "gtm.dom", "gtm.load", "gtm.click", "gtm.linkClick",
            "gtm.formSubmit", "gtm.historyChange", "gtm.scrollDepth",
            "gtm.timer", "gtm.video",
          ]);
          const ECOMMERCE_EVENTS = new Set([
            "purchase", "add_to_cart", "remove_from_cart", "begin_checkout",
            "view_item", "view_item_list", "add_payment_info", "add_shipping_info",
            "view_cart", "select_item", "select_promotion", "view_promotion",
            "transaction", "ecommerce",
          ]);
          const eventNames = new Set<string>();
          let hasEcommerce = false;
          for (const entry of dlRaw) {
            if (entry && typeof entry === "object") {
              const obj = entry as Record<string, unknown>;
              if (typeof obj.event === "string") {
                eventNames.add(obj.event);
              }
              if (obj.ecommerce !== undefined) {
                hasEcommerce = true;
              }
            }
          }
          for (const ev of eventNames) {
            if (ECOMMERCE_EVENTS.has(ev)) hasEcommerce = true;
          }
          const customEvents = Array.from(eventNames).filter(
            (ev) => !GTM_BUILTIN_EVENTS.has(ev)
          );
          dataLayerResult = {
            events: Array.from(eventNames),
            eventCount: dlRaw.length,
            hasEcommerce,
            hasCustomEvents: customEvents.length > 0,
            raw: dlRaw.slice(0, 50), // cap to prevent huge payloads
          };
        }
      } catch (e) {
        console.warn(`[tracking] dataLayer extraction failed: ${(e as Error).message}`);
      }

      // --- Feature 0B: Cookie Inventory ---
      let cookiesResult: TrackingAnalyticsData["cookies"] = null;
      try {
        const allCookies = await Promise.race([
          context.cookies(url),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("cookies timeout")), 5000)
          ),
        ]);
        const pageDomain = new URL(url).hostname.replace(/^www\./, "");
        // Cookie name patterns for categorization
        const ANALYTICS_COOKIE_PATTERNS = /^(_ga|_gid|_gat|__utm|_hjid|_hj|_clck|_clsk|mp_|amplitude|ajs_)/i;
        const ADVERTISING_COOKIE_PATTERNS = /^(_fbp|_fbc|_gcl|_uet|_tt_|fr$|IDE$|NID$|test_cookie|__gads|_rdt_)/i;
        const FUNCTIONAL_COOKIE_PATTERNS = /^(lang|locale|currency|timezone|consent|cookieconsent|cc_|euconsent|OptanonConsent)/i;

        let firstParty = 0;
        let thirdParty = 0;
        let session = 0;
        let persistent = 0;
        const categories: Record<string, number> = {
          analytics: 0,
          advertising: 0,
          functional: 0,
          other: 0,
        };
        const cookieNames: string[] = [];

        for (const cookie of allCookies) {
          cookieNames.push(cookie.name);
          // First-party vs third-party
          const cookieDomain = (cookie.domain || "").replace(/^\./, "").replace(/^www\./, "");
          if (pageDomain.endsWith(cookieDomain) || cookieDomain.endsWith(pageDomain)) {
            firstParty++;
          } else {
            thirdParty++;
          }
          // Session vs persistent
          if (cookie.expires === -1 || cookie.expires === 0) {
            session++;
          } else {
            persistent++;
          }
          // Category
          if (ANALYTICS_COOKIE_PATTERNS.test(cookie.name)) {
            categories.analytics++;
          } else if (ADVERTISING_COOKIE_PATTERNS.test(cookie.name)) {
            categories.advertising++;
          } else if (FUNCTIONAL_COOKIE_PATTERNS.test(cookie.name)) {
            categories.functional++;
          } else {
            categories.other++;
          }
        }

        cookiesResult = {
          total: allCookies.length,
          firstParty,
          thirdParty,
          session,
          persistent,
          categories,
          names: cookieNames.slice(0, 100), // cap names list
        };
      } catch (e) {
        console.warn(`[tracking] Cookie inventory failed: ${(e as Error).message}`);
      }

      // --- Feature 0D: GA4 Payload Parsing ---
      let ga4EventsResult: TrackingAnalyticsData["ga4Events"] = null;
      try {
        const ENHANCED_MEASUREMENT_EVENTS = new Set([
          "scroll", "click", "file_download", "video_start",
          "video_progress", "video_complete", "view_search_results",
        ]);
        const GA4_BUILTIN_EVENTS = new Set([
          "page_view", "session_start", "first_visit", "user_engagement",
          ...ENHANCED_MEASUREMENT_EVENTS,
        ]);
        const parsedEventNames = new Set<string>();
        for (const collectUrl of ga4CollectParams) {
          try {
            const parsed = new URL(collectUrl);
            const en = parsed.searchParams.get("en");
            if (en) {
              parsedEventNames.add(en);
            }
          } catch {
            // malformed URL — skip
          }
        }
        if (parsedEventNames.size > 0 || ga4CollectParams.length > 0) {
          const eventNamesArr = Array.from(parsedEventNames);
          const hasEnhancedMeasurement = eventNamesArr.some((ev) =>
            ENHANCED_MEASUREMENT_EVENTS.has(ev)
          );
          const hasCustomEvents = eventNamesArr.some(
            (ev) => !GA4_BUILTIN_EVENTS.has(ev)
          );
          ga4EventsResult = {
            eventNames: eventNamesArr,
            hasCustomEvents,
            hasEnhancedMeasurement,
            totalEvents: ga4CollectParams.length,
          };
        }
      } catch (e) {
        console.warn(`[tracking] GA4 event parsing failed: ${(e as Error).message}`);
      }

      // --- Phase 2: IAB TCF/USP/GPP API Detection ---
      let iabApiResult: TrackingAnalyticsData["iabApi"] = null;
      try {
        iabApiResult = await page.evaluate(() => ({
          hasTcfApi: typeof (window as any).__tcfapi === "function",
          hasUspApi: typeof (window as any).__uspapi === "function",
          hasGppApi: typeof (window as any).__gpp === "function",
        }));
      } catch {
        // IAB API detection is optional
      }

      // --- Phase 4: Consent Dark Pattern Detection ---
      let consentDarkPatterns: TrackingAnalyticsData["consentDarkPatterns"] = null;
      try {
        consentDarkPatterns = await page.evaluate(() => {
          // Look for consent banner elements
          const bannerSelectors = [
            '[class*="cookie"]', '[class*="consent"]', '[class*="gdpr"]', '[class*="privacy"]',
            '[id*="cookie"]', '[id*="consent"]', '[id*="gdpr"]',
            '#CybotCookiebotDialog', '#onetrust-banner-sdk', '.didomi-popup',
            '.uc-banner', '.termly-consent-banner',
          ];
          const banners = bannerSelectors.flatMap((s) => Array.from(document.querySelectorAll(s)));
          if (banners.length === 0) return null;

          // Check for reject/decline button
          const buttonTexts = banners.flatMap((b) =>
            Array.from(b.querySelectorAll('button, a[role="button"], [class*="btn"]'))
              .map((el) => (el as HTMLElement).textContent?.toLowerCase().trim() ?? "")
          );
          const hasReject = buttonTexts.some((t) =>
            /reject|decline|deny|refuse|disagree|necessary only|essential only/i.test(t)
          );

          // Check for pre-checked non-essential categories
          const checkboxes = banners.flatMap((b) =>
            Array.from(b.querySelectorAll('input[type="checkbox"]'))
          ) as HTMLInputElement[];
          const preChecked = checkboxes.some((cb) => {
            const label = cb.closest("label")?.textContent?.toLowerCase() ?? "";
            const isNonEssential = /marketing|advertising|analytics|statistics|performance|targeting|social/i.test(label);
            return cb.checked && isNonEssential;
          });

          // Check for consent wall (full-screen overlay blocking content)
          const isWall = banners.some((b) => {
            const style = window.getComputedStyle(b as Element);
            return style.position === "fixed" && parseInt(style.height) > window.innerHeight * 0.8;
          });

          let count = 0;
          if (!hasReject) count++;
          if (preChecked) count++;
          if (isWall) count++;

          return {
            noRejectButton: !hasReject,
            preCheckedCategories: preChecked,
            consentWall: isWall,
            count,
          };
        });
      } catch {
        // Dark pattern detection is optional
      }

      return {
        html,
        networkRequests,
        consoleErrors,
        utmPersisted,
        dataLayerResult,
        cookiesResult,
        ga4EventsResult,
        ga4CollectParams,
        iabApiResult,
        consentDarkPatterns,
      };
    });

    // Pattern matching on HTML content
    const detected: DetectedTool[] = [
      ...matchPatterns(browserData.html, ANALYTICS_PATTERNS, "analytics"),
      ...matchPatterns(browserData.html, CMS_PATTERNS, "cms"),
      ...matchPatterns(browserData.html, MARKETING_TOOL_PATTERNS, "marketing_tool"),
      ...matchPatterns(browserData.html, POPUP_TOOL_PATTERNS, "marketing_tool"),
    ];

    // Verify detected tools against network requests
    for (const tool of detected) {
      if (tool.category === "analytics") {
        const patterns = ANALYTICS_PATTERNS[tool.name]?.patterns ?? [];
        const fired = browserData.networkRequests.some((req) =>
          patterns.some((p) => p.test(req.url))
        );
        tool.verified = fired;
      }
    }

    // Cookie consent detection
    let consentDetected = false;
    let consentPlatform: string | null = null;
    for (const [platform, pattern] of Object.entries(CONSENT_PATTERNS)) {
      if (pattern.test(browserData.html)) {
        consentDetected = true;
        consentPlatform = platform;
        break;
      }
    }

    // DataForSEO technology detection (enrichment)
    try {
      const techData = await technologyDetection(domain);
      for (const tech of techData.technologies) {
        const alreadyDetected = detected.some(
          (d) => d.name.toLowerCase() === tech.name.toLowerCase()
        );
        if (!alreadyDetected) {
          detected.push({
            name: tech.name,
            category: "technology",
            id: tech.version,
            verified: true,
          });
        }
      }
    } catch {
      // DataForSEO enrichment is optional
    }

    // Identify issues
    const issues: TrackingIssue[] = [];

    // No analytics at all
    const hasAnalytics = detected.some(
      (d) =>
        d.category === "analytics" &&
        ["google_analytics_ga4", "google_tag_manager"].includes(d.name)
    );
    if (!hasAnalytics) {
      issues.push({
        severity: "critical",
        category: "analytics",
        message: `${absenceSignal("Google Analytics or GTM", { checked: ["page HTML", "network requests"], method: "HTML pattern match", coverage: "homepage_only" })} — likely no visibility into traffic or conversions`,
      });
    }

    // GTM without GA4
    const hasGtm = detected.some((d) => d.name === "google_tag_manager");
    const hasGa4 = detected.some((d) => d.name === "google_analytics_ga4");
    if (hasGtm && !hasGa4) {
      issues.push({
        severity: "warning",
        category: "analytics",
        message: "GTM container detected but no GA4 property found in page HTML — GA4 may fire through GTM (not detectable from source) or GTM may be misconfigured",
      });
    }

    // No cookie consent
    if (!consentDetected && detected.some((d) => d.category === "analytics")) {
      issues.push({
        severity: "warning",
        category: "compliance",
        message: "Tracking scripts detected but no cookie consent platform found — potential GDPR/CCPA risk",
      });
    }

    // Blocked tracking requests
    const blockedRequests = browserData.networkRequests.filter((r) => r.blocked);
    if (blockedRequests.length > 0) {
      issues.push({
        severity: "warning",
        category: "tracking",
        message: `${blockedRequests.length} tracking request(s) were blocked — ad blockers or CSP may interfere`,
      });
    }

    // Console errors related to tracking
    const trackingErrors = browserData.consoleErrors.filter((e) =>
      /gtag|fbq|analytics|pixel|tracking/i.test(e)
    );
    if (trackingErrors.length > 0) {
      issues.push({
        severity: "warning",
        category: "tracking",
        message: `${trackingErrors.length} tracking-related console error(s) found`,
      });
    }

    // No conversion tracking pixels
    const hasAdPixels = detected.some((d) =>
      ["meta_pixel", "google_ads", "tiktok_pixel", "linkedin_insight"].includes(d.name)
    );
    if (!hasAdPixels) {
      issues.push({
        severity: "info",
        category: "ads",
        message: absenceSignal("ad conversion pixels", { checked: ["page HTML", "network requests"], method: "network interception", coverage: "homepage_only" }),
      });
    }

    // No marketing automation
    const popupToolNames = Object.keys(POPUP_TOOL_PATTERNS);
    const marketingOnlyTools = detected.filter(
      (d) => d.category === "marketing_tool" && !popupToolNames.includes(d.name)
    );
    const popupTools = detected.filter(
      (d) => d.category === "marketing_tool" && popupToolNames.includes(d.name)
    );
    if (marketingOnlyTools.length === 0) {
      issues.push({
        severity: "info",
        category: "marketing",
        message: "No marketing automation or email platform scripts detected on site (checked: Klaviyo, Mailchimp, HubSpot, ActiveCampaign, and 8 others)",
      });
    }
    if (popupTools.length > 0) {
      issues.push({
        severity: "info",
        category: "marketing",
        message: `Popup/lead capture tool(s) detected: ${popupTools.map((t) => t.name.replace(/_/g, " ")).join(", ")}`,
      });
    }

    // GA4 data retention warning (default is 2 months — most companies never change it)
    if (hasGa4) {
      issues.push({
        severity: "info",
        category: "analytics",
        message: "GA4 detected — note: GA4 default data retention is 2 months. If not changed in Admin > Data Settings, historical data beyond 2 months is lost permanently",
      });
    }

    // No heatmap/session recording tool
    const hasHeatmap = detected.some((d) =>
      ["hotjar", "microsoft_clarity", "fullstory", "heap"].includes(d.name)
    );
    if (!hasHeatmap) {
      issues.push({
        severity: "info",
        category: "analytics",
        message: "No heatmap or session recording tool detected (checked: Hotjar, Clarity, FullStory, Heap) — qualitative user behavior data is likely missing",
      });
    }

    // No product analytics
    const hasProductAnalytics = detected.some((d) =>
      ["mixpanel", "amplitude", "heap", "segment"].includes(d.name)
    );
    if (!hasProductAnalytics && hasAnalytics) {
      issues.push({
        severity: "info",
        category: "analytics",
        message: "No product analytics platform detected (checked: Mixpanel, Amplitude, Heap, Segment) — event-level user behavior tracking may be limited to GA4",
      });
    }

    // --- Feature 0B (continued): Cookie compliance cross-check ---
    if (
      browserData.cookiesResult &&
      consentDetected &&
      (browserData.cookiesResult.categories.advertising > 0 ||
        browserData.cookiesResult.categories.analytics > 0)
    ) {
      // Consent platform detected, but tracking/ad cookies are already set
      // This could indicate consent is not blocking cookies before acceptance
      const trackingCookieCount =
        browserData.cookiesResult.categories.advertising +
        browserData.cookiesResult.categories.analytics;
      issues.push({
        severity: "warning",
        category: "compliance",
        message: `Consent platform (${consentPlatform}) detected but ${trackingCookieCount} analytics/advertising cookie(s) are set on initial load — cookies may be firing before user consent`,
      });
    }

    // --- Feature 0E: Consent Mode v2 Validation ---
    let consentModeV2Result: TrackingAnalyticsData["consentModeV2"] = null;
    try {
      const htmlSource = browserData.html;
      const hasDefault = /gtag\s*\(\s*['"]consent['"]\s*,\s*['"]default['"]/i.test(htmlSource);
      const hasUpdate = /gtag\s*\(\s*['"]consent['"]\s*,\s*['"]update['"]/i.test(htmlSource);
      const detected_v2 = hasDefault || hasUpdate;

      const REQUIRED_CONSENT_TYPES = [
        "ad_storage",
        "analytics_storage",
        "ad_user_data",
        "ad_personalization",
      ];
      const foundTypes: string[] = [];
      for (const ct of REQUIRED_CONSENT_TYPES) {
        if (new RegExp(ct, "i").test(htmlSource)) {
          foundTypes.push(ct);
        }
      }
      const missingTypes = REQUIRED_CONSENT_TYPES.filter(
        (ct) => !foundTypes.includes(ct)
      );
      const properlyConfigured =
        hasDefault && hasUpdate && missingTypes.length === 0;

      consentModeV2Result = {
        detected: detected_v2,
        hasDefault,
        hasUpdate,
        consentTypes: foundTypes,
        missingTypes,
        properlyConfigured,
      };

      // If consent platform exists but no Consent Mode v2, flag it
      if (consentDetected && !detected_v2) {
        issues.push({
          severity: "warning",
          category: "compliance",
          message: `Consent platform (${consentPlatform}) detected but no Google Consent Mode v2 implementation found — Google Ads conversions may lose attribution after March 2024 enforcement`,
        });
      }
      // If Consent Mode v2 detected but incomplete
      if (detected_v2 && missingTypes.length > 0) {
        issues.push({
          severity: "warning",
          category: "compliance",
          message: `Consent Mode v2 detected but missing required consent types: ${missingTypes.join(", ")} — incomplete implementation may affect ad measurement`,
        });
      }
    } catch (e) {
      console.warn(`[tracking] Consent Mode v2 check failed: ${(e as Error).message}`);
    }

    // --- Phase 2: IAB API signals ---
    if (browserData.iabApiResult) {
      if (browserData.iabApiResult.hasTcfApi) {
        issues.push({ severity: "info", category: "compliance", message: "IAB TCF v2 API (__tcfapi) detected — standards-compliant consent framework" });
      }
      if (browserData.iabApiResult.hasUspApi) {
        issues.push({ severity: "info", category: "compliance", message: "IAB US Privacy API (__uspapi) detected — CCPA compliance signal" });
      }
    }

    // --- Phase 4: Dark pattern signals ---
    if (browserData.consentDarkPatterns && browserData.consentDarkPatterns.count > 0) {
      if (browserData.consentDarkPatterns.noRejectButton) {
        issues.push({ severity: "warning", category: "compliance", message: "Consent banner has no visible reject/decline option — users must navigate to preferences to opt out (potential dark pattern)" });
      }
      if (browserData.consentDarkPatterns.preCheckedCategories) {
        issues.push({ severity: "warning", category: "compliance", message: "Non-essential consent categories (marketing/analytics) are pre-checked — violates GDPR requirement for opt-in consent" });
      }
      if (browserData.consentDarkPatterns.consentWall) {
        issues.push({ severity: "warning", category: "compliance", message: "Consent banner appears as a full-screen wall blocking content — may be considered a coercive consent pattern" });
      }
    }

    // --- Phase 5: Consent Compliance Score (deterministic, no LLM) ---
    let consentComplianceScore: TrackingAnalyticsData["consentComplianceScore"] = null;
    {
      let score = 100;
      const factors: string[] = [];

      // Consent mechanism (40 pts)
      if (!consentDetected && detected.some((d) => d.category === "analytics")) {
        score -= 20; factors.push("-20: No consent platform despite tracking scripts");
      }
      const preConsentTracking = browserData.cookiesResult &&
        (browserData.cookiesResult.categories.advertising > 0 || browserData.cookiesResult.categories.analytics > 0);
      if (preConsentTracking && consentDetected) {
        score -= 15; factors.push("-15: Tracking cookies set before user consent");
      }
      if (browserData.consentDarkPatterns?.noRejectButton) {
        score -= 10; factors.push("-10: No reject option on consent banner");
      }
      if (browserData.consentDarkPatterns?.preCheckedCategories) {
        score -= 10; factors.push("-10: Non-essential categories pre-checked");
      }
      if (browserData.consentDarkPatterns?.consentWall) {
        score -= 7; factors.push("-7: Consent wall blocks content");
      }

      // Technical compliance (25 pts)
      if (consentDetected && !consentModeV2Result?.detected) {
        score -= 8; factors.push("-8: No Consent Mode v2 despite consent platform");
      }
      if (consentModeV2Result?.detected && !consentModeV2Result.properlyConfigured) {
        score -= 5; factors.push("-5: Consent Mode v2 incomplete");
      }
      if (browserData.iabApiResult && !browserData.iabApiResult.hasTcfApi && consentDetected) {
        score -= 5; factors.push("-5: Consent platform without IAB TCF API");
      }

      // Bonuses
      if (browserData.iabApiResult?.hasTcfApi) {
        score += 5; factors.push("+5: IAB TCF API present");
      }
      if (browserData.iabApiResult?.hasUspApi) {
        score += 3; factors.push("+3: US Privacy API present");
      }
      if (consentModeV2Result?.properlyConfigured) {
        score += 5; factors.push("+5: Consent Mode v2 fully configured");
      }

      score = Math.max(0, Math.min(score, 100));
      const rating: "strong" | "adequate" | "weak" | "none" =
        score >= 80 ? "strong" : score >= 50 ? "adequate" : score >= 20 ? "weak" : "none";

      consentComplianceScore = { score, maxScore: 100, rating, factors };

      if (score < 50) {
        issues.push({
          severity: "warning",
          category: "compliance",
          message: `Consent compliance score: ${score}/100 (${rating}) — significant privacy compliance gaps detected`,
        });
      }
    }

    // --- Feature 2E: Analytics Maturity Score ---
    const maturityFactors: string[] = [];
    let maturityLevel = 1;

    // Gather signals for maturity computation
    const hasSegmentOrWarehouse = detected.some((d) =>
      ["segment"].includes(d.name)
    );
    const hasServerSideTagging =
      /sgtm\.|ss\./i.test(browserData.html) ||
      browserData.networkRequests.some((r) => /sgtm\.|ss\./i.test(r.url));
    const hasMultipleAnalytics =
      detected.filter((d) =>
        ["google_analytics_ga4", "mixpanel", "amplitude", "heap", "fullstory"].includes(d.name)
      ).length >= 2;
    const hasCustomEventsSignal =
      (browserData.dataLayerResult?.hasCustomEvents ?? false) ||
      (browserData.ga4EventsResult?.hasCustomEvents ?? false);

    if (!hasAnalytics) {
      // Level 1: No analytics at all
      maturityLevel = 1;
      maturityFactors.push("No analytics detected");
    } else if (hasGa4 && !hasGtm && !hasCustomEventsSignal) {
      // Level 2: Basic pageview only
      maturityLevel = 2;
      maturityFactors.push("GA4 present but no custom events or GTM");
    } else if (
      (hasGa4 && hasGtm) ||
      (hasGa4 && hasCustomEventsSignal)
    ) {
      // At least Level 3
      maturityLevel = 3;
      if (hasGa4 && hasGtm) maturityFactors.push("GA4 + GTM detected");
      if (hasCustomEventsSignal) maturityFactors.push("Custom events detected");

      // Check for Level 4
      const level4Checks = {
        productAnalytics: hasProductAnalytics,
        consent: consentDetected,
        heatmap: hasHeatmap,
        adPixelsWithEvents: hasAdPixels,
      };
      const level4Count = Object.values(level4Checks).filter(Boolean).length;

      if (level4Count >= 3) {
        maturityLevel = 4;
        if (level4Checks.productAnalytics) maturityFactors.push("Product analytics platform present");
        if (level4Checks.consent) maturityFactors.push("Consent platform present");
        if (level4Checks.heatmap) maturityFactors.push("Heatmap/session recording present");
        if (level4Checks.adPixelsWithEvents) maturityFactors.push("Ad pixels detected");

        // Check for Level 5
        if (hasServerSideTagging || hasSegmentOrWarehouse || hasMultipleAnalytics) {
          maturityLevel = 5;
          if (hasServerSideTagging) maturityFactors.push("Server-side tagging indicators found");
          if (hasSegmentOrWarehouse) maturityFactors.push("Data warehouse/CDP tool detected (Segment)");
          if (hasMultipleAnalytics) maturityFactors.push("Multiple analytics platforms in use");
        }
      }
    }

    const MATURITY_LABELS: Record<number, string> = {
      1: "No Analytics",
      2: "Basic Pageview",
      3: "Event Tracking",
      4: "Full Stack",
      5: "Enterprise",
    };

    // B19: Maturity level descriptions for richer signal output
    // Note: Size-adjusted maturity could be enhanced later when company employee count
    // is available from enrichment data (enrichment runs after tracking in the pipeline).
    // For now, provide descriptive labels for each maturity level.
    const MATURITY_DESCRIPTIONS: Record<number, string> = {
      1: "No analytics detected",
      2: "Basic analytics only",
      3: "Multiple analytics tools in use",
      4: "Advanced measurement stack",
      5: "Enterprise-grade analytics",
    };

    const maturityScore: TrackingAnalyticsData["maturityScore"] = {
      level: maturityLevel,
      label: MATURITY_LABELS[maturityLevel],
      factors: maturityFactors,
    };

    // B19: Add maturity level description signal
    issues.push({
      severity: "info",
      category: "analytics",
      message: `Analytics maturity: Level ${maturityLevel}/5 (${MATURITY_LABELS[maturityLevel]}) — ${MATURITY_DESCRIPTIONS[maturityLevel]}`,
    });

    // --- Confidence calculation (updated with new signals) ---
    let confidence = detected.length > 0 ? 0.8 : 0.5;
    // Boost confidence if we got rich data from new extractions
    if (browserData.dataLayerResult) confidence = Math.min(confidence + 0.05, 1.0);
    if (browserData.cookiesResult) confidence = Math.min(confidence + 0.05, 1.0);
    if (browserData.ga4EventsResult) confidence = Math.min(confidence + 0.05, 1.0);
    if (consentModeV2Result?.detected) confidence = Math.min(confidence + 0.03, 1.0);

    const confidenceFactors: string[] = [
      `${detected.length} tools detected`,
      `${browserData.networkRequests.length} tracking network requests observed`,
      consentDetected ? "Cookie consent platform found" : "No cookie consent detected",
      browserData.dataLayerResult
        ? `dataLayer extracted (${browserData.dataLayerResult.eventCount} entries, ${browserData.dataLayerResult.events.length} unique events)`
        : "No dataLayer found",
      browserData.cookiesResult
        ? `${browserData.cookiesResult.total} cookies inventoried (${browserData.cookiesResult.firstParty} first-party, ${browserData.cookiesResult.thirdParty} third-party)`
        : "Cookie inventory unavailable",
      browserData.ga4EventsResult
        ? `${browserData.ga4EventsResult.totalEvents} GA4 collect requests parsed (${browserData.ga4EventsResult.eventNames.length} unique events)`
        : "No GA4 collect requests intercepted",
      consentModeV2Result?.detected
        ? `Consent Mode v2 ${consentModeV2Result.properlyConfigured ? "properly configured" : "partially configured"}`
        : "No Consent Mode v2 detected",
      `Analytics maturity: Level ${maturityLevel} (${MATURITY_LABELS[maturityLevel]})`,
    ];

    return createEnvelope<TrackingAnalyticsData>(primitive, startTime, {
      detected,
      issues,
      networkRequests: browserData.networkRequests,
      consoleErrors: browserData.consoleErrors.slice(0, 20),
      cookieConsent: {
        detected: consentDetected,
        platform: consentPlatform,
      },
      utmHandling: {
        tested: true,
        persisted: browserData.utmPersisted,
      },
      dataLayer: browserData.dataLayerResult,
      cookies: browserData.cookiesResult,
      ga4Events: browserData.ga4EventsResult,
      consentModeV2: consentModeV2Result,
      iabApi: browserData.iabApiResult,
      consentDarkPatterns: browserData.consentDarkPatterns,
      consentComplianceScore,
      maturityScore,
    }, {
      confidence,
      confidenceFactors,
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
