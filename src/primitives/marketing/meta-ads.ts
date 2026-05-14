import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { withBrowser, randomDelay } from "@marketing/browser-pool";
import { captureScreenshot } from "@marketing/screenshots";
import { complete, getModelName } from "@marketing/models";
import { runMetaAdLibraryScraper } from "@marketing/apify";
import { computeAdLongevity, adLongevitySignals } from "@marketing/ad-longevity";

interface AdSearchRecord {
  query: string;
  source: "meta_library" | "apify";
  resultCount: number;
}

export interface MetaAdsData {
  activeAdCount: number | null;
  creativeTypes: Record<string, number>;
  adSamples: Array<{
    text: string;
    landingPage: string | null;
    startDate: string | null;
    mediaType: string | null;
  }>;
  screenshotPaths: string[];
  adDiversityScore: number;
  signals: string[];
  searchesPerformed: AdSearchRecord[];
  searchCoverage: "comprehensive" | "partial" | "limited";
  scrapingSucceeded?: boolean;
  adCopyAnalysis?: {
    hookQuality: string;
    orientation: string;
    ctaStrength: string;
    creativeDiversity: string;
    overallRating: "strong" | "adequate" | "weak";
  } | null;
  adLongevity: {
    longestRunningDays: number;
    averageAgeDays: number;
    testing: number;
    validated: number;
    winners: number;
    noCreativeRefresh: boolean;
  } | null;
  estimatedSpendTier: "none" | "testing" | "moderate" | "significant" | "heavy" | "unknown";
}

const EXTRACTION_PROMPT = `Extract structured ad data from this Meta Ad Library page HTML. Find all visible ads and return JSON:

{
  "ads": [
    {
      "text": "ad copy text",
      "landingPage": "URL or null",
      "startDate": "date or null",
      "mediaType": "image|video|carousel|text",
      "isActive": true
    }
  ],
  "totalCount": number,
  "pageName": "advertiser page name"
}

If the page shows "no results" or an error, return: { "ads": [], "totalCount": 0, "pageName": null }`;

// B9: Estimate ad spend tier based on ad count and longevity
function estimateSpendTier(
  adCount: number,
  adLongevity: MetaAdsData["adLongevity"]
): MetaAdsData["estimatedSpendTier"] {
  if (adCount === 0) return "none";

  // Base tier from ad count
  let tier: MetaAdsData["estimatedSpendTier"];
  if (adCount <= 5) tier = "testing";
  else if (adCount <= 20) tier = "moderate";
  else if (adCount <= 50) tier = "significant";
  else tier = "heavy";

  // Boost tier if longevity data shows winners (ads running 60+ days = likely profitable)
  if (adLongevity && adLongevity.winners > 0) {
    if (tier === "testing") tier = "moderate";
    else if (tier === "moderate") tier = "significant";
  }

  return tier;
}

async function searchMetaAdLibrary(
  page: any,
  query: string,
  scanId: string,
  captureShot: boolean
): Promise<{ ads: any[]; totalCount: number; screenshotPaths: string[] }> {
  const searchQuery = encodeURIComponent(query);
  const adLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${searchQuery}&media_type=all`;

  await page.goto(adLibraryUrl, { waitUntil: "networkidle", timeout: 30_000 });
  await randomDelay(2000, 4000);

  const screenshotPaths: string[] = [];
  if (captureShot) {
    try {
      const path = await captureScreenshot(page, "meta-ad-library", "desktop", scanId);
      screenshotPaths.push(path);
    } catch {
      // Screenshot is optional
    }
  }

  const html = await page.content();
  const truncatedHtml = html.slice(0, 20_000);

  const result = await complete("haiku", [
    { role: "user", content: `Extract ads from this Meta Ad Library page:\n\n${truncatedHtml}` },
  ], {
    system: EXTRACTION_PROMPT,
    temperature: 0.1,
  });

  let parsed: any;
  try {
    parsed = JSON.parse(result.content);
  } catch {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { ads: [], totalCount: 0 };
  }

  return {
    ads: parsed.ads ?? [],
    totalCount: parsed.totalCount ?? 0,
    screenshotPaths,
  };
}

export async function runMetaAds(
  companyName: string,
  domain: string,
  scanId: string,
  alternateNames?: string[],
  facebookPageName?: string
): Promise<Envelope<MetaAdsData | null>> {
  const startTime = Date.now();
  const primitive = "meta_ads";

  try {
    let adsData: MetaAdsData | null = null;
    const searchesPerformed: AdSearchRecord[] = [];
    let allScreenshotPaths: string[] = [];

    // Build search terms list (ordered by expected accuracy)
    const searchTerms: string[] = [];
    if (facebookPageName) searchTerms.push(facebookPageName);
    searchTerms.push(companyName);
    const domainWithoutTld = domain.replace(/\.[a-z]{2,}$/i, "");
    if (domainWithoutTld !== companyName) searchTerms.push(domainWithoutTld);
    if (alternateNames) searchTerms.push(...alternateNames.slice(0, 2));

    // ═══════════════════════════════════════════════════════
    // PRIMARY: Apify structured data (reliable, no Cloudflare)
    // ═══════════════════════════════════════════════════════
    const hasApifyToken = !!process.env.APIFY_API_TOKEN;

    if (hasApifyToken) {
      try {
        const apifyResults = await runMetaAdLibraryScraper(searchTerms);
        const usedTerm = searchTerms[0]; // first term that worked (Apify stops on first success)
        searchesPerformed.push({
          query: usedTerm,
          source: "apify",
          resultCount: apifyResults.length,
        });

        const activeAds = apifyResults.filter((a) => a.isActive);
        const creativeTypes: Record<string, number> = {};
        for (const ad of activeAds) {
          const type = ad.mediaType ?? "unknown";
          creativeTypes[type] = (creativeTypes[type] ?? 0) + 1;
        }

        const typeCount = Object.keys(creativeTypes).length;
        const adLongevity = computeAdLongevity(activeAds.map((a) => a.startDate));

        const signals: string[] = [];
        if (activeAds.length === 0) {
          const queriesList = searchTerms.map((s) => `"${s}"`).join(", ");
          signals.push(`No active Meta ads found via Meta Ad Library API (searched: ${queriesList})`);
        } else {
          signals.push(
            `${activeAds.length} active Meta ad${activeAds.length > 1 ? "s" : ""} detected in Meta Ad Library`
          );
          if (typeCount === 1) {
            signals.push("Only one ad creative type detected — low creative diversity suggests limited testing");
          }
          if (activeAds.length < 3) {
            signals.push("Few active ads — may indicate limited ad investment or early-stage testing");
          }
        }

        signals.push(...adLongevitySignals(adLongevity, activeAds.length));
        const estimatedSpendTier = estimateSpendTier(activeAds.length, adLongevity);
        if (activeAds.length > 0) {
          const longRunningCount = adLongevity?.winners ?? 0;
          signals.push(
            `Estimated ad spend tier: ${estimatedSpendTier} (${activeAds.length} active ad${activeAds.length > 1 ? "s" : ""}${longRunningCount > 0 ? `, ${longRunningCount} long-running` : ""})`
          );
        }

        const searchCoverage: "comprehensive" | "partial" | "limited" =
          searchTerms.length >= 3 ? "comprehensive" : searchTerms.length >= 2 ? "partial" : "limited";

        adsData = {
          activeAdCount: activeAds.length,
          creativeTypes,
          adSamples: activeAds.slice(0, 5).map((a) => ({
            text: a.adText,
            landingPage: a.landingPageUrl,
            startDate: a.startDate,
            mediaType: a.mediaType,
          })),
          screenshotPaths: [],
          adDiversityScore: activeAds.length > 0 ? Math.min(typeCount / 4, 1) : 0,
          signals,
          searchesPerformed,
          searchCoverage,
          scrapingSucceeded: true,
          adLongevity,
          estimatedSpendTier,
        };
      } catch (apifyError) {
        console.warn("Meta ads Apify primary failed, falling back to Playwright:", apifyError);
      }
    }

    // ═══════════════════════════════════════════════════════
    // SECONDARY: Playwright screenshot enrichment (if Apify found ads)
    // OR full Playwright fallback (if Apify failed/unavailable)
    // ═══════════════════════════════════════════════════════
    const apifyFoundAds = adsData && adsData.activeAdCount != null && adsData.activeAdCount > 0;

    if (apifyFoundAds) {
      // Apify found ads — optionally capture a screenshot for visual evidence (non-blocking)
      try {
        await withBrowser("desktop", async (page) => {
          const bestQuery = facebookPageName ?? companyName;
          const result = await searchMetaAdLibrary(page, bestQuery, scanId, true);
          allScreenshotPaths.push(...result.screenshotPaths);
        });
        if (allScreenshotPaths.length > 0) {
          adsData!.screenshotPaths = allScreenshotPaths;
        }
      } catch {
        // Screenshot enrichment is optional — Apify data is sufficient
      }
    } else if (!adsData) {
      // Full Playwright fallback — Apify unavailable or failed
      try {
        const allAds: any[] = [];
        await withBrowser("desktop", async (page) => {
          if (facebookPageName) {
            const result0 = await searchMetaAdLibrary(page, facebookPageName, scanId, true);
            searchesPerformed.push({ query: facebookPageName, source: "meta_library", resultCount: result0.totalCount });
            allAds.push(...result0.ads);
            allScreenshotPaths.push(...result0.screenshotPaths);
          }

          if (allAds.length === 0) {
            const result1 = await searchMetaAdLibrary(page, companyName, scanId, !facebookPageName);
            searchesPerformed.push({ query: companyName, source: "meta_library", resultCount: result1.totalCount });
            allAds.push(...result1.ads);
            if (!facebookPageName) allScreenshotPaths.push(...result1.screenshotPaths);
          }

          if (allAds.length === 0 && domain !== companyName) {
            const result2 = await searchMetaAdLibrary(page, domainWithoutTld, scanId, false);
            searchesPerformed.push({ query: domainWithoutTld, source: "meta_library", resultCount: result2.totalCount });
            allAds.push(...result2.ads);

            if (result2.totalCount === 0) {
              const brandName = domain.split(".")[0];
              if (brandName !== domainWithoutTld) {
                const result2b = await searchMetaAdLibrary(page, brandName, scanId, false);
                searchesPerformed.push({ query: brandName, source: "meta_library", resultCount: result2b.totalCount });
                allAds.push(...result2b.ads);
              }
            }
          }

          if (allAds.length === 0 && alternateNames && alternateNames.length > 0) {
            for (const altName of alternateNames.slice(0, 2)) {
              const result3 = await searchMetaAdLibrary(page, altName, scanId, false);
              searchesPerformed.push({ query: altName, source: "meta_library", resultCount: result3.totalCount });
              allAds.push(...result3.ads);
              if (allAds.length > 0) break;
            }
          }
        });

        // Deduplicate ads by text
        const seenTexts = new Set<string>();
        const uniqueAds = allAds.filter((ad) => {
          const key = (ad.text ?? "").slice(0, 100);
          if (seenTexts.has(key)) return false;
          seenTexts.add(key);
          return true;
        });

        const creativeTypes: Record<string, number> = {};
        for (const ad of uniqueAds) {
          const type = ad.mediaType ?? "unknown";
          creativeTypes[type] = (creativeTypes[type] ?? 0) + 1;
        }

        const typeCount = Object.keys(creativeTypes).length;
        const totalCount = uniqueAds.length;
        const adLongevity = computeAdLongevity(uniqueAds.map((ad) => ad.startDate));

        const searchCoverage: "comprehensive" | "partial" | "limited" =
          searchesPerformed.length >= 3 ? "comprehensive"
            : searchesPerformed.length >= 2 ? "partial" : "limited";

        const signals: string[] = [];
        if (totalCount === 0) {
          const queriesList = searchesPerformed.map((s) => `"${s.query}"`).join(", ");
          signals.push(`No active Meta ads found in Meta Ad Library (searched: ${queriesList})`);
          if (searchCoverage === "limited") {
            signals.push("Limited search coverage — additional company name variants may yield results");
          }
        } else {
          signals.push(`${totalCount} active Meta ad${totalCount > 1 ? "s" : ""} detected in Meta Ad Library`);
          if (typeCount === 1) {
            signals.push("Only one ad creative type detected — low creative diversity suggests limited testing");
          }
          if (totalCount < 3) {
            signals.push("Few active ads — may indicate limited ad investment or early-stage testing");
          }
        }

        signals.push(...adLongevitySignals(adLongevity, uniqueAds.length));
        const estimatedSpendTier = estimateSpendTier(totalCount, adLongevity);
        if (totalCount > 0) {
          const longRunningCount = adLongevity?.winners ?? 0;
          signals.push(
            `Estimated ad spend tier: ${estimatedSpendTier} (${totalCount} active ad${totalCount > 1 ? "s" : ""}${longRunningCount > 0 ? `, ${longRunningCount} long-running` : ""})`
          );
        }

        adsData = {
          activeAdCount: totalCount,
          creativeTypes,
          adSamples: uniqueAds.slice(0, 5).map((a: any) => ({
            text: a.text ?? "",
            landingPage: a.landingPage ?? null,
            startDate: a.startDate ?? null,
            mediaType: a.mediaType ?? null,
          })),
          screenshotPaths: allScreenshotPaths,
          adDiversityScore: uniqueAds.length > 0 ? Math.min(typeCount / 4, 1) : 0,
          signals,
          searchesPerformed,
          searchCoverage,
          scrapingSucceeded: true,
          adLongevity,
          estimatedSpendTier,
        };
      } catch (playwrightError) {
        console.warn("Meta ads Playwright fallback also failed:", playwrightError);
        adsData = {
          activeAdCount: null,
          creativeTypes: {},
          adSamples: [],
          screenshotPaths: [],
          adDiversityScore: 0,
          signals: ["Could not assess Meta ad activity — both Apify and Playwright methods failed"],
          searchesPerformed,
          searchCoverage: "limited",
          scrapingSucceeded: false,
          adLongevity: null,
          estimatedSpendTier: "unknown",
        };
      }
    }

    // adsData is guaranteed non-null at this point
    const data = adsData!;

    // Ad copy quality analysis when ads are found
    if (data.activeAdCount != null && data.activeAdCount > 0 && data.adSamples.length > 0) {
      try {
        const adTexts = data.adSamples.map((a) => a.text).filter(Boolean).join("\n---\n");
        const copyResult = await complete("haiku", [
          { role: "user", content: `Analyze these Meta ad copies for quality:\n\n${adTexts}` },
        ], {
          system: `Evaluate ad copy quality. Return JSON:
{
  "hookQuality": "strong|adequate|weak — does the first line grab attention?",
  "orientation": "benefit-driven|feature-driven|mixed — what does the copy emphasize?",
  "ctaStrength": "strong|adequate|weak — is there a clear call to action?",
  "creativeDiversity": "high|moderate|low — are they testing different angles?",
  "overallRating": "strong|adequate|weak"
}`,
          temperature: 0.1,
        });

        try {
          data.adCopyAnalysis = JSON.parse(copyResult.content);
        } catch {
          const match = copyResult.content.match(/\{[\s\S]*\}/);
          if (match) data.adCopyAnalysis = JSON.parse(match[0]);
        }
      } catch {
        // Ad copy analysis is optional
      }
    }

    // Dynamic confidence scoring
    const confidence = calculateAdConfidence({
      adsFound: data.activeAdCount != null && data.activeAdCount > 0,
      searchMethods: searchesPerformed.length,
      hasEnrichmentData: (alternateNames?.length ?? 0) > 0,
      playwrightSuccess: searchesPerformed.some((s) => s.source === "meta_library"),
    });

    return createEnvelope<MetaAdsData>(primitive, startTime, data, {
      confidence,
      confidenceFactors: [
        data.activeAdCount == null
          ? "Could not verify ad activity"
          : data.activeAdCount > 0
            ? `${data.activeAdCount} ads found`
            : "No ads found",
        `${searchesPerformed.length} search strategies used`,
        `Coverage: ${data.searchCoverage}`,
        data.screenshotPaths.length > 0
          ? "Screenshots captured"
          : "No screenshots",
      ],
      model: getModelName("haiku"),
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}

function calculateAdConfidence(factors: {
  adsFound: boolean;
  searchMethods: number;
  hasEnrichmentData: boolean;
  playwrightSuccess: boolean;
}): number {
  let confidence = 0.4; // Base
  if (factors.adsFound) confidence += 0.2;
  if (factors.searchMethods >= 3) confidence += 0.15;
  else if (factors.searchMethods >= 2) confidence += 0.1;
  if (factors.hasEnrichmentData) confidence += 0.1;
  if (factors.playwrightSuccess) confidence += 0.1;
  return Math.min(confidence, 0.95);
}
