// workers/primitives/brand-reputation.ts
// Online reputation & reviews analysis — highest-priority new primitive.
// Data sources: HTTP HEAD checks on review platforms, Exa search for sentiment.

import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { safeFetch } from "@marketing/safe-fetch";
import { absenceSignal } from "@marketing/signal-builder";

export interface ReviewPlatformPresence {
  platform: string;
  url: string;
  exists: boolean;
  statusCode: number | null;
}

export interface BrandReputationData {
  reviewPlatforms: ReviewPlatformPresence[];
  platformsWithPresence: number;
  platformsChecked: number;
  exaMentions: {
    query: string;
    resultCount: number;
    snippets: string[];
  } | null;
  signals: string[];
}

/** Slugify a company name for G2 product URLs (lowercase, hyphens, no special chars) */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const REVIEW_PLATFORMS = [
  { platform: "Trustpilot", urlTemplate: "https://www.trustpilot.com/review/{domain}" },
  { platform: "G2", urlTemplate: "https://www.g2.com/products/{slug}/reviews" },
  { platform: "BBB", urlTemplate: "https://www.bbb.org/search?find_text={name}" },
  { platform: "Yelp", urlTemplate: "https://www.yelp.com/search?find_desc={name}" },
];

async function checkPlatformPresence(
  url: string,
  platform: string
): Promise<ReviewPlatformPresence> {
  try {
    const response = await safeFetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GrowthAudit/1.0)",
      },
    });

    // For Trustpilot, 200 means profile exists; 404 means it doesn't
    // For search-based platforms, 200 just means the search page loaded
    const exists = response.ok && !url.includes("/search");

    return { platform, url, exists, statusCode: response.status };
  } catch {
    return { platform, url, exists: false, statusCode: null };
  }
}

export async function runBrandReputation(
  domain: string,
  companyName: string
): Promise<Envelope<BrandReputationData | null>> {
  const startTime = Date.now();
  const primitive = "brand_reputation";

  try {
    const name = companyName || domain.replace(/\.[a-z]+$/i, "");
    const nameEncoded = encodeURIComponent(name);

    // Check all review platforms in parallel
    const nameSlug = slugify(name);
    const platformChecks = REVIEW_PLATFORMS.map((p) => {
      const url = p.urlTemplate
        .replace("{domain}", domain)
        .replace("{name}", nameEncoded)
        .replace("{slug}", nameSlug);
      return checkPlatformPresence(url, p.platform);
    });

    const platformResults = await Promise.all(platformChecks);

    const withPresence = platformResults.filter((p) => p.exists);
    const signals: string[] = [];

    if (withPresence.length === 0) {
      signals.push(
        absenceSignal(`review profiles for '${name}'`, { checked: ["Trustpilot", "G2", "BBB", "Yelp"], method: "HTTP HEAD", coverage: "external_api" })
      );
    } else {
      signals.push(
        `Found profiles on ${withPresence.length} review platform${withPresence.length > 1 ? "s" : ""}: ${withPresence.map((p) => p.platform).join(", ")}`
      );
    }

    // Check for Trustpilot specifically — it's the most common review platform
    const trustpilot = platformResults.find((p) => p.platform === "Trustpilot");
    if (trustpilot?.exists) {
      signals.push("Trustpilot profile exists — check review count and rating");
    }

    // Check for G2 (B2B/SaaS indicator)
    const g2 = platformResults.find((p) => p.platform === "G2");
    if (g2?.exists) {
      signals.push("G2 profile found — important for B2B buyer research");
    }

    // Exa brand mention search (if EXA_API_KEY available)
    let exaMentions: BrandReputationData["exaMentions"] = null;
    if (process.env.EXA_API_KEY) {
      try {
        const exaQuery = `"${name}" review OR complaint OR recommendation`;
        const exaResponse = await safeFetch("https://api.exa.ai/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EXA_API_KEY}`,
          },
          body: JSON.stringify({
            query: exaQuery,
            numResults: 5,
            type: "auto",
            useAutoprompt: false,
          }),
          signal: AbortSignal.timeout(10_000),
        });

        if (exaResponse.ok) {
          const exaData = (await exaResponse.json()) as any;
          const results = exaData.results ?? [];
          exaMentions = {
            query: exaQuery,
            resultCount: results.length,
            snippets: results
              .slice(0, 3)
              .map((r: any) => r.text?.slice(0, 200) || r.title || "")
              .filter(Boolean),
          };

          if (results.length === 0) {
            signals.push(
              absenceSignal("brand mentions", { checked: ["Exa web search"], method: "API query", coverage: "external_api" })
            );
          } else {
            signals.push(
              `${results.length} brand mention${results.length > 1 ? "s" : ""} found via web search`
            );
          }
        }
      } catch {
        // Exa search is optional — don't fail the primitive
      }
    }

    const confidence =
      withPresence.length > 0
        ? 0.7 + Math.min(withPresence.length * 0.05, 0.2)
        : 0.5;

    return createEnvelope<BrandReputationData>(primitive, startTime, {
      reviewPlatforms: platformResults,
      platformsWithPresence: withPresence.length,
      platformsChecked: platformResults.length,
      exaMentions,
      signals,
    }, {
      confidence,
      confidenceFactors: [
        `${platformResults.length} platforms checked`,
        `${withPresence.length} profiles found`,
        exaMentions ? `${exaMentions.resultCount} web mentions` : "Exa search skipped",
      ],
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
