// workers/primitives/social-organic.ts
// Organic social presence analysis — lightweight, no scraping.
// Checks: link verification, cross-promotion, OG tags, Exa brand mentions.

import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { extractSocialLinks, type SocialLinks } from "@marketing/social-links";
import { safeFetch } from "@marketing/safe-fetch";
import { absenceSignal } from "@marketing/signal-builder";

export interface SocialPlatformStatus {
  platform: string;
  url: string;
  status: "active" | "missing" | "broken";
  statusCode: number | null;
}

export interface OpenGraphData {
  title: string | null;
  description: string | null;
  image: string | null;
  type: string | null;
  twitterCard: string | null;
}

export interface SocialOrganicData {
  socialLinks: SocialLinks;
  platformStatus: SocialPlatformStatus[];
  activePlatforms: number;
  /** @deprecated — removed "missing from standard platforms" assumption. Always empty for new scans. */
  missingPlatforms: string[];
  openGraph: OpenGraphData;
  crossPromotion: {
    websiteLinksToSocials: boolean;
    socialWidgetsDetected: string[];
  };
  signals: string[];
}

/** Check if a social URL resolves (200 OK) */
async function verifySocialLink(
  platform: string,
  url: string
): Promise<SocialPlatformStatus> {
  try {
    const response = await safeFetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GrowthAudit/1.0)",
      },
    });

    return {
      platform,
      url,
      status: response.ok ? "active" : "broken",
      statusCode: response.status,
    };
  } catch {
    return { platform, url, status: "broken", statusCode: null };
  }
}

/** Extract Open Graph meta tags from HTML */
function extractOpenGraph(html: string): OpenGraphData {
  const getMetaContent = (property: string): string | null => {
    const regex = new RegExp(
      `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
      "i"
    );
    const altRegex = new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
      "i"
    );
    return regex.exec(html)?.[1] ?? altRegex.exec(html)?.[1] ?? null;
  };

  return {
    title: getMetaContent("og:title"),
    description: getMetaContent("og:description"),
    image: getMetaContent("og:image"),
    type: getMetaContent("og:type"),
    twitterCard: getMetaContent("twitter:card"),
  };
}

/** Detect social proof widgets embedded on the page */
function detectSocialWidgets(html: string): string[] {
  const widgets: string[] = [];
  const lowerHtml = html.toLowerCase();

  if (lowerHtml.includes("twitter-timeline") || lowerHtml.includes("data-tweet-id")) {
    widgets.push("Twitter/X embed");
  }
  if (lowerHtml.includes("instagram-media") || lowerHtml.includes("instgrm.")) {
    widgets.push("Instagram embed");
  }
  if (lowerHtml.includes("fb-page") || lowerHtml.includes("facebook.com/plugins")) {
    widgets.push("Facebook widget");
  }
  if (lowerHtml.includes("linkedin.com/embed") || lowerHtml.includes("linkedin-badge")) {
    widgets.push("LinkedIn badge");
  }
  if (lowerHtml.includes("youtube.com/embed") || lowerHtml.includes("youtube-video")) {
    widgets.push("YouTube embed");
  }

  return widgets;
}

/** Standard platforms every business should consider, keyed by industry */
const EXPECTED_PLATFORMS = ["facebook", "instagram", "linkedin", "twitter"] as const;

export async function runSocialOrganic(
  url: string,
  domain: string,
  htmlContent?: string
): Promise<Envelope<SocialOrganicData | null>> {
  const startTime = Date.now();
  const primitive = "social_organic";

  try {
    // Get homepage HTML if not provided
    let html = htmlContent ?? "";
    if (!html) {
      try {
        const response = await safeFetch(url, {
          signal: AbortSignal.timeout(10_000),
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; GrowthAudit/1.0)",
          },
        });
        if (response.ok) {
          html = await response.text();
        }
      } catch {
        // Will proceed with empty HTML — limited analysis
      }
    }

    // Extract social links from HTML
    const socialLinks = extractSocialLinks(html);
    const signals: string[] = [];

    // Verify each social link resolves
    const platformEntries = Object.entries(socialLinks) as Array<[string, string]>;
    const verifications = await Promise.all(
      platformEntries.map(([platform, linkUrl]) =>
        verifySocialLink(platform, linkUrl)
      )
    );

    const activePlatforms = verifications.filter((v) => v.status === "active");
    const brokenLinks = verifications.filter((v) => v.status === "broken");

    // Deprecated: removed "missing from standard platforms" assumption
    // Different industries use different platforms — assuming all need all 6 damages credibility
    const missingPlatforms: string[] = [];

    if (platformEntries.length === 0) {
      signals.push(absenceSignal("social media links", { checked: ["homepage HTML"], method: "HTML pattern match", coverage: "homepage_only" }));
    } else {
      signals.push(
        `${platformEntries.length} social platform${platformEntries.length > 1 ? "s" : ""} linked from website: ${platformEntries.map(([p]) => p).join(", ")}`
      );
    }

    if (brokenLinks.length > 0) {
      signals.push(
        `${brokenLinks.length} broken social link${brokenLinks.length > 1 ? "s" : ""}: ${brokenLinks.map((b) => `${b.platform} (${b.statusCode ?? "unreachable"})`).join(", ")}`
      );
    }

    // Open Graph analysis
    const openGraph = extractOpenGraph(html);
    const ogComplete =
      openGraph.title && openGraph.description && openGraph.image;
    if (!ogComplete) {
      const missing: string[] = [];
      if (!openGraph.title) missing.push("og:title");
      if (!openGraph.description) missing.push("og:description");
      if (!openGraph.image) missing.push("og:image");
      signals.push(
        `Incomplete Open Graph tags — missing: ${missing.join(", ")}. Social shares will look generic.`
      );
    } else {
      signals.push("Open Graph tags complete — social shares will display correctly");
    }

    if (!openGraph.twitterCard) {
      signals.push("No Twitter/X card meta tag — links shared on X will lack rich previews");
    }

    // Social widgets
    const socialWidgets = detectSocialWidgets(html);
    if (socialWidgets.length > 0) {
      signals.push(
        `Social proof widgets detected: ${socialWidgets.join(", ")}`
      );
    }

    const confidence =
      html.length > 0
        ? 0.6 + Math.min(platformEntries.length * 0.05, 0.25)
        : 0.3;

    return createEnvelope<SocialOrganicData>(primitive, startTime, {
      socialLinks,
      platformStatus: verifications,
      activePlatforms: activePlatforms.length,
      missingPlatforms,
      openGraph,
      crossPromotion: {
        websiteLinksToSocials: platformEntries.length > 0,
        socialWidgetsDetected: socialWidgets,
      },
      signals,
    }, {
      confidence,
      confidenceFactors: [
        html.length > 0 ? "Homepage HTML analyzed" : "Could not fetch homepage",
        `${platformEntries.length} social links found`,
        `${activePlatforms.length} verified active`,
        ogComplete ? "OG tags complete" : "OG tags incomplete",
      ],
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
