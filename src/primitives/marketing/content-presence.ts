import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { safeFetch } from "@marketing/safe-fetch";
import { absenceSignal } from "@marketing/signal-builder";

// ── Data Interface ──

export interface ContentPresenceData {
  blogPresent: boolean;
  blogUrl: string | null;
  sitemapFound: boolean;
  sitemapPageCount: number | null;
  rssFound: boolean;
  contentPages: number | null;
  lastPublishDate: string | null;
  newsletterSignup: boolean;
  leadMagnets: string[];
  contentFunnel: string[];
  retentionSignals: {
    helpCenter: boolean;
    changelog: boolean;
    statusPage: boolean;
    community: boolean;
    referralProgram: boolean;
    onboarding: boolean;
  };
  signals: string[];
  methodology: string[];
}

// ── Helpers ──

const BLOG_PATHS = ["/blog", "/news", "/articles", "/resources", "/insights", "/journal", "/posts"];
const CONTENT_PATHS = ["/blog", "/news", "/articles", "/resources", "/insights", "/journal", "/posts", "/guides", "/tutorials", "/learn", "/knowledge-base", "/help"];

/**
 * Perform a lightweight HTTP HEAD/GET to check if a URL exists (2xx/3xx).
 * Returns the response or null on failure. Does NOT use Playwright.
 */
async function probeUrl(url: string, method: "HEAD" | "GET" = "HEAD"): Promise<Response | null> {
  try {
    const response = await safeFetch(url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GMPFBot/1.0; +https://supertrained.ai)",
        "Accept": method === "GET" ? "text/html, application/xml, application/rss+xml, text/xml, */*" : "*/*",
      },
    });
    if (response.ok || (response.status >= 300 && response.status < 400)) {
      return response;
    }
    return null;
  } catch {
    return null;
  }
}

interface SitemapAnalysis {
  pageCount: number | null;
  urls: string[];          // actual <loc> URLs extracted (capped at 500)
  isIndex: boolean;        // was this a sitemap index?
}

/** Parse a sitemap.xml — count entries AND extract actual URLs for coverage analysis */
async function parseSitemap(sitemapUrl: string): Promise<SitemapAnalysis> {
  try {
    const response = await safeFetch(sitemapUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GMPFBot/1.0; +https://supertrained.ai)",
        "Accept": "application/xml, text/xml, */*",
      },
    });
    if (!response.ok) return { pageCount: null, urls: [], isIndex: false };

    const text = await response.text();

    // Check for sitemap index (contains <sitemap> references)
    const sitemapIndexMatches = text.match(/<sitemap>/gi);
    if (sitemapIndexMatches && sitemapIndexMatches.length > 0) {
      return {
        pageCount: sitemapIndexMatches.length * 500,
        urls: [], // Can't extract individual URLs from an index without recursive fetch
        isIndex: true,
      };
    }

    // Extract <loc> URLs from regular sitemap (cap at 500)
    const locMatches = text.match(/<loc>([^<]+)<\/loc>/gi) ?? [];
    const urls = locMatches
      .map((m) => m.replace(/<\/?loc>/gi, "").trim())
      .filter((u) => u.length > 0)
      .slice(0, 500);

    return {
      pageCount: urls.length || (text.match(/<url>/gi)?.length ?? null),
      urls,
      isIndex: false,
    };
  } catch {
    return { pageCount: null, urls: [], isIndex: false };
  }
}

/** Backward-compat wrapper */
async function parseSitemapPageCount(sitemapUrl: string): Promise<number | null> {
  const result = await parseSitemap(sitemapUrl);
  return result.pageCount;
}

/**
 * Analyze sitemap coverage for blog content.
 * Compares blog URLs in sitemap vs blog post links on the blog index page.
 * HTTP-only — no Playwright needed.
 */
async function analyzeSitemapCoverage(
  sitemapUrls: string[],
  blogUrl: string | null,
  domain: string
): Promise<{
  blogUrlsInSitemap: number;
  estimatedBlogPages: number | null;
  coverageRatio: number | null;
  signal: string | null;
}> {
  if (!blogUrl || sitemapUrls.length === 0) {
    return { blogUrlsInSitemap: 0, estimatedBlogPages: null, coverageRatio: null, signal: null };
  }

  // Count sitemap URLs that match the blog path
  const blogPath = new URL(blogUrl).pathname;
  const blogUrlsInSitemap = sitemapUrls.filter((u) => {
    try { return new URL(u).pathname.startsWith(blogPath + "/"); } catch { return false; }
  }).length;

  // Fetch blog index page and count blog post links
  let estimatedBlogPages: number | null = null;
  try {
    const blogResponse = await safeFetch(blogUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GMPFBot/1.0; +https://supertrained.ai)",
        "Accept": "text/html",
      },
    });
    if (blogResponse.ok) {
      const html = await blogResponse.text();
      // Count unique internal links that look like blog posts (contain the blog path prefix)
      const linkRegex = new RegExp(`href=["']((?:https?://[^"']*${domain.replace(/\./g, "\\.")})?${blogPath.replace(/\//g, "\\/")}[^"']+)["']`, "gi");
      const links = new Set<string>();
      let match;
      while ((match = linkRegex.exec(html)) !== null) {
        const path = match[1].replace(/^https?:\/\/[^/]+/, "");
        // Skip the blog index itself, pagination, categories, tags
        if (path !== blogPath && path !== blogPath + "/" &&
            !path.includes("/page/") && !path.includes("?page=") &&
            !path.includes("/category/") && !path.includes("/tag/")) {
          links.add(path);
        }
      }
      estimatedBlogPages = links.size > 0 ? links.size : null;
    }
  } catch {
    // Blog page fetch failed — can't estimate
  }

  if (estimatedBlogPages === null || estimatedBlogPages === 0) {
    return { blogUrlsInSitemap, estimatedBlogPages: null, coverageRatio: null, signal: null };
  }

  const coverageRatio = Math.min(blogUrlsInSitemap / estimatedBlogPages, 1);

  let signal: string | null = null;
  if (coverageRatio < 0.5 && estimatedBlogPages >= 5) {
    signal = `Sitemap contains ${blogUrlsInSitemap} blog URLs but blog page links to ~${estimatedBlogPages} posts — ${estimatedBlogPages - blogUrlsInSitemap} posts may not be indexed by search engines (first page only — actual count may differ)`;
  }

  return { blogUrlsInSitemap, estimatedBlogPages, coverageRatio, signal };
}

/** Check for RSS feed by looking at common RSS paths and HTML link tags */
async function findRssFeed(baseUrl: string, htmlContent: string | null): Promise<{ found: boolean; url: string | null }> {
  // 1. Check HTML for RSS link tags
  if (htmlContent) {
    const rssLinkMatch = htmlContent.match(/<link[^>]+type=["']application\/rss\+xml["'][^>]*href=["']([^"']+)["']/i);
    const atomLinkMatch = htmlContent.match(/<link[^>]+type=["']application\/atom\+xml["'][^>]*href=["']([^"']+)["']/i);
    const feedLink = rssLinkMatch?.[1] || atomLinkMatch?.[1];
    if (feedLink) {
      try {
        const feedUrl = new URL(feedLink, baseUrl).href;
        return { found: true, url: feedUrl };
      } catch {
        // Invalid URL in link tag
      }
    }
  }

  // 2. Check common RSS paths in parallel — resolve with first success
  const rssPaths = ["/feed", "/rss", "/rss.xml", "/feed.xml", "/atom.xml", "/blog/feed", "/blog/rss"];
  const rssProbes = rssPaths.map(async (path) => {
    const feedUrl = new URL(path, baseUrl).href;
    const response = await probeUrl(feedUrl);
    if (!response) throw new Error("not found");
    return { found: true as const, url: feedUrl };
  });

  try {
    return await Promise.any(rssProbes);
  } catch {
    return { found: false, url: null };
  }
}

/** Detect newsletter signup patterns in HTML */
function detectNewsletterSignup(html: string): boolean {
  const patterns = [
    /newsletter/i,
    /subscribe\s+(to\s+)?(our\s+)?(email|newsletter|updates)/i,
    /sign\s+up\s+(for\s+)?(our\s+)?(email|newsletter|updates)/i,
    /join\s+(our\s+)?(email|mailing)\s+(list|newsletter)/i,
    /get\s+(our\s+)?(weekly|monthly|daily)\s+(newsletter|digest|update)/i,
    /email\s+updates/i,
    /stay\s+(up\s+to\s+date|updated|informed|in\s+the\s+loop)/i,
  ];
  return patterns.some((p) => p.test(html));
}

/** Detect lead magnet patterns in HTML */
function detectLeadMagnets(html: string): string[] {
  const magnets: string[] = [];
  const patterns: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /free\s+(ebook|e-book)/i, label: "Free ebook" },
    { pattern: /free\s+(guide|ultimate\s+guide)/i, label: "Free guide" },
    { pattern: /free\s+checklist/i, label: "Free checklist" },
    { pattern: /free\s+template/i, label: "Free template" },
    { pattern: /free\s+(whitepaper|white\s+paper)/i, label: "Free whitepaper" },
    { pattern: /free\s+playbook/i, label: "Free playbook" },
    { pattern: /free\s+toolkit/i, label: "Free toolkit" },
    { pattern: /free\s+worksheet/i, label: "Free worksheet" },
    { pattern: /free\s+(cheat\s+sheet|cheatsheet)/i, label: "Free cheat sheet" },
    { pattern: /free\s+(webinar|masterclass|workshop)/i, label: "Free webinar/event" },
    { pattern: /free\s+(course|mini.?course)/i, label: "Free course" },
    { pattern: /free\s+(trial|demo)/i, label: "Free trial/demo" },
    { pattern: /free\s+(report|analysis|audit|assessment)/i, label: "Free report/assessment" },
    { pattern: /download\s+(your|the|our|a)\s+(free\s+)?/i, label: "Downloadable resource" },
    { pattern: /get\s+instant\s+access/i, label: "Gated resource" },
  ];

  const seen = new Set<string>();
  for (const { pattern, label } of patterns) {
    if (pattern.test(html) && !seen.has(label)) {
      magnets.push(label);
      seen.add(label);
    }
  }
  return magnets;
}

/** Detect content funnel stages present on the site.
 * Cross-references with blog presence and sitemap size for reliability.
 * Homepage-only keyword matching is unreliable — caveat results accordingly. */
function detectContentFunnel(
  html: string,
  blogFound: boolean,
  leadMagnets: string[],
  sitemapPageCount: number | null
): string[] {
  // Skip funnel analysis for very small sites without blogs — too unreliable
  if (!blogFound && (sitemapPageCount === null || sitemapPageCount < 20)) {
    return [];
  }

  const stages: string[] = [];

  // TOFU (Top of Funnel) — educational content (require blog for keyword match credibility)
  if (blogFound) {
    stages.push("TOFU (blog/educational content present)");
  }

  // MOFU (Middle of Funnel) — comparison/consideration content
  if (/comparison|vs\s+|alternative|case\s+study|success\s+story/i.test(html)) {
    stages.push("MOFU (comparison/consideration content indicated)");
  }

  // BOFU (Bottom of Funnel) — decision/conversion content
  if (/pricing|demo|free\s+trial|get\s+started|buy\s+now|request\s+a\s+quote/i.test(html)) {
    stages.push("BOFU (decision/conversion content present)");
  }

  // Lead magnets indicate MOFU
  if (leadMagnets.length > 0 && !stages.some((s) => s.startsWith("MOFU"))) {
    stages.push("MOFU (lead magnets present)");
  }

  return stages;
}

/** Try to extract last publish date from RSS feed content */
async function extractLastPublishDate(rssUrl: string): Promise<string | null> {
  try {
    const response = await safeFetch(rssUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GMPFBot/1.0; +https://supertrained.ai)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!response.ok) return null;

    const text = await response.text();

    // Try <pubDate> (RSS 2.0)
    const pubDateMatch = text.match(/<pubDate>([^<]+)<\/pubDate>/);
    if (pubDateMatch) {
      const date = new Date(pubDateMatch[1]);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }

    // Try <updated> (Atom)
    const updatedMatch = text.match(/<updated>([^<]+)<\/updated>/);
    if (updatedMatch) {
      const date = new Date(updatedMatch[1]);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }

    // Try <dc:date>
    const dcDateMatch = text.match(/<dc:date>([^<]+)<\/dc:date>/);
    if (dcDateMatch) {
      const date = new Date(dcDateMatch[1]);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ── Main Runner ──

export async function runContentPresence(
  url: string,
  domain: string
): Promise<Envelope<ContentPresenceData | null>> {
  const startTime = Date.now();
  const primitive = "content_presence";
  const methodology: string[] = [];

  try {
    const baseUrl = url.replace(/\/$/, "");

    // 1. Check for blog/content section — probe common paths in parallel
    const blogProbes = BLOG_PATHS.map(async (path) => {
      const probeTarget = `${baseUrl}${path}`;
      const response = await probeUrl(probeTarget);
      return response ? { path, url: probeTarget } : null;
    });

    const blogResults = await Promise.all(blogProbes);
    const foundBlogs = blogResults.filter((r): r is { path: string; url: string } => r !== null);
    const blogPresent = foundBlogs.length > 0;
    const blogUrl = foundBlogs.length > 0 ? foundBlogs[0].url : null;

    if (blogPresent) {
      methodology.push(`Blog found at: ${foundBlogs.map((b) => b.path).join(", ")}`);
    } else {
      methodology.push("No blog found (checked: " + BLOG_PATHS.join(", ") + ")");
    }

    // 2. Check sitemap.xml
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    const sitemapResponse = await probeUrl(sitemapUrl);
    const sitemapFound = sitemapResponse !== null;
    let sitemapPageCount: number | null = null;

    let sitemapUrls: string[] = [];
    if (sitemapFound) {
      const sitemapAnalysis = await parseSitemap(sitemapUrl);
      sitemapPageCount = sitemapAnalysis.pageCount;
      sitemapUrls = sitemapAnalysis.urls;
      methodology.push(`Sitemap found: ${sitemapPageCount !== null ? `~${sitemapPageCount} pages` : "page count unavailable"}${sitemapAnalysis.isIndex ? " (sitemap index)" : ""}`);
    } else {
      methodology.push("No sitemap.xml found");
    }

    // 3. Fetch homepage HTML for newsletter/lead magnet detection (lightweight GET)
    let homepageHtml: string | null = null;
    try {
      const homeResponse = await safeFetch(baseUrl, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; GMPFBot/1.0; +https://supertrained.ai)",
          "Accept": "text/html, */*",
        },
      });
      if (homeResponse.ok) {
        homepageHtml = await homeResponse.text();
        methodology.push("Homepage HTML fetched for content pattern detection");
      }
    } catch {
      methodology.push("Homepage HTML fetch failed — content pattern detection limited");
    }

    // 4. Check for RSS feed
    const rssFeed = await findRssFeed(baseUrl, homepageHtml);
    if (rssFeed.found) {
      methodology.push(`RSS feed found: ${rssFeed.url}`);
    } else {
      methodology.push("No RSS feed found");
    }

    // 5. Detect newsletter signup
    const newsletterSignup = homepageHtml ? detectNewsletterSignup(homepageHtml) : false;
    if (newsletterSignup) {
      methodology.push("Newsletter signup detected on homepage");
    } else {
      methodology.push("No newsletter signup detected on homepage");
    }

    // 6. Detect lead magnets
    const leadMagnets = homepageHtml ? detectLeadMagnets(homepageHtml) : [];
    if (leadMagnets.length > 0) {
      methodology.push(`Lead magnets detected: ${leadMagnets.join(", ")}`);
    } else {
      methodology.push("No lead magnets detected on homepage");
    }

    // 7. Detect content funnel stages (cross-referenced with blog + sitemap for reliability)
    const contentFunnel = homepageHtml
      ? detectContentFunnel(homepageHtml, blogPresent, leadMagnets, sitemapPageCount)
      : [];
    if (contentFunnel.length > 0) {
      methodology.push(`Content funnel assessment based on homepage analysis — full content audit recommended`);
    } else if (!blogPresent && (sitemapPageCount === null || sitemapPageCount < 20)) {
      methodology.push("Content funnel assessment skipped — site too small for reliable analysis");
    } else {
      methodology.push("No content funnel stages detected");
    }

    // 8. Try to get last publish date from RSS
    let lastPublishDate: string | null = null;
    if (rssFeed.found && rssFeed.url) {
      lastPublishDate = await extractLastPublishDate(rssFeed.url);
      if (lastPublishDate) {
        methodology.push(`Last publish date from RSS: ${lastPublishDate}`);
      }
    }

    // 9. Estimate content pages from sitemap
    const contentPages = sitemapPageCount;

    // Build signals
    const signals: string[] = [];

    if (!blogPresent) {
      signals.push(absenceSignal("a blog or content section", { checked: BLOG_PATHS, method: "HTTP HEAD", coverage: "common_paths" }, "this is the foundation of organic traffic"));
    }

    if (!sitemapFound) {
      signals.push(absenceSignal("sitemap.xml", { checked: ["/sitemap.xml"], method: "HTTP HEAD", coverage: "common_paths" }));
    } else if (sitemapPageCount !== null && sitemapPageCount < 10) {
      signals.push(`Sitemap has only ~${sitemapPageCount} pages — thin content footprint`);
    }

    // Sitemap coverage analysis — compare blog URLs in sitemap vs blog post links
    if (sitemapUrls.length > 0 && blogPresent && blogUrl) {
      const coverage = await analyzeSitemapCoverage(sitemapUrls, blogUrl, domain);
      if (coverage.signal) {
        signals.push(coverage.signal);
        methodology.push(`Sitemap coverage: ${coverage.blogUrlsInSitemap} blog URLs in sitemap, ~${coverage.estimatedBlogPages} blog posts detected on blog index page`);
      } else if (coverage.coverageRatio !== null) {
        methodology.push(`Sitemap coverage: ${Math.round(coverage.coverageRatio * 100)}% of detected blog posts in sitemap`);
      }
    }

    // RSS absence moved to methodology (not user-facing) — SME review found it damages credibility
    if (!rssFeed.found) {
      methodology.push("No RSS feed detected");
    }

    if (!newsletterSignup) {
      signals.push(absenceSignal("an email signup form", { checked: ["homepage HTML"], method: "HTML pattern match", coverage: "homepage_only" }));
    }

    if (leadMagnets.length === 0) {
      signals.push(absenceSignal("lead magnets (ebooks, guides, checklists)", { checked: ["homepage HTML"], method: "HTML pattern match", coverage: "homepage_only" }));
    }

    if (contentFunnel.length === 0) {
      signals.push(absenceSignal("content funnel stages (TOFU/MOFU/BOFU)", { checked: ["homepage HTML"], method: "HTML pattern match", coverage: "homepage_only" }));
    } else if (contentFunnel.length === 1) {
      signals.push(`Content funnel only covers 1 stage: ${contentFunnel[0]} — gaps in buyer journey`);
    }

    if (lastPublishDate) {
      const daysSincePublish = Math.floor((Date.now() - new Date(lastPublishDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSincePublish > 90) {
        signals.push(`Last content published ${daysSincePublish} days ago — content may be stale`);
      } else if (daysSincePublish > 30) {
        signals.push(`Last content published ${daysSincePublish} days ago — publishing frequency could improve`);
      }
    }

    // Calculate confidence
    // C1: Retention/loyalty signal detection (parallel HEAD checks)
    const RETENTION_PATHS: Record<string, string[]> = {
      helpCenter: ["/help", "/support", "/knowledge-base", "/kb", "/faq", "/docs"],
      changelog: ["/changelog", "/updates", "/whats-new", "/release-notes"],
      statusPage: ["/status"],
      community: ["/community", "/forum", "/discuss"],
      referralProgram: ["/referral", "/refer", "/rewards", "/loyalty", "/ambassador"],
      onboarding: ["/getting-started", "/onboarding", "/quickstart", "/welcome"],
    };

    const retentionSignals: ContentPresenceData["retentionSignals"] = {
      helpCenter: false, changelog: false, statusPage: false,
      community: false, referralProgram: false, onboarding: false,
    };

    const retentionChecks = Object.entries(RETENTION_PATHS).map(async ([key, paths]) => {
      const probes = paths.map(async (path) => {
        const checkUrl = `${baseUrl}${path}`;
        const r = await safeFetch(checkUrl, { method: "HEAD", signal: AbortSignal.timeout(5_000), redirect: "follow" });
        if (!r.ok) throw new Error("not found");
        return true;
      });
      try {
        await Promise.any(probes);
        retentionSignals[key as keyof typeof retentionSignals] = true;
      } catch {
        // None of the paths resolved
      }
    });
    await Promise.all(retentionChecks);

    // Also check for community links in homepage HTML
    if (homepageHtml && /discord\.gg|slack\.com\/join|circle\.so|community\./i.test(homepageHtml)) {
      retentionSignals.community = true;
    }
    // Check for status page subdomain
    try {
      const statusRes = await safeFetch(`https://status.${domain}`, { method: "HEAD", signal: AbortSignal.timeout(5_000) });
      if (statusRes.ok) retentionSignals.statusPage = true;
    } catch { /* optional */ }

    const retentionCount = Object.values(retentionSignals).filter(Boolean).length;
    if (retentionCount === 0) {
      signals.push(absenceSignal("retention infrastructure (help center, changelog, community, referral)", { checked: ["6 categories of paths"], method: "HTTP HEAD", coverage: "common_paths" }));
    } else {
      const present = Object.entries(retentionSignals).filter(([, v]) => v).map(([k]) => k.replace(/([A-Z])/g, " $1").toLowerCase().trim());
      signals.push(`Retention infrastructure: ${present.join(", ")} (${retentionCount}/6 signals)`);
    }
    methodology.push(`Retention signals checked: ${Object.keys(RETENTION_PATHS).join(", ")} + community links + status subdomain`);

    let confidence = 0.4;
    if (homepageHtml) confidence += 0.15;
    if (sitemapFound) confidence += 0.1;
    if (rssFeed.found) confidence += 0.1;
    if (blogPresent) confidence += 0.1;
    // Higher confidence if we have more data points
    const dataPoints = [blogPresent, sitemapFound, rssFeed.found, newsletterSignup, leadMagnets.length > 0].filter(Boolean).length;
    confidence += dataPoints * 0.02;
    confidence = Math.min(confidence, 0.9);

    return createEnvelope<ContentPresenceData>(primitive, startTime, {
      blogPresent,
      blogUrl,
      sitemapFound,
      sitemapPageCount,
      rssFound: rssFeed.found,
      contentPages,
      lastPublishDate,
      newsletterSignup,
      leadMagnets,
      contentFunnel,
      retentionSignals,
      signals,
      methodology,
    }, {
      confidence,
      confidenceFactors: [
        blogPresent ? `Blog found at ${blogUrl}` : "No blog found",
        sitemapFound ? `Sitemap: ~${sitemapPageCount ?? "unknown"} pages` : "No sitemap",
        rssFeed.found ? "RSS feed found" : "No RSS feed",
        newsletterSignup ? "Newsletter signup present" : "No newsletter signup",
        leadMagnets.length > 0 ? `${leadMagnets.length} lead magnet type(s)` : "No lead magnets",
        `${contentFunnel.length}/3 funnel stages covered`,
        lastPublishDate ? `Last published: ${lastPublishDate}` : "Publish date unknown",
        homepageHtml ? "Homepage HTML analyzed" : "Homepage HTML unavailable",
      ],
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
