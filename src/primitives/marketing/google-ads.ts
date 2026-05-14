import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { withBrowser, randomDelay } from "@marketing/browser-pool";
import { captureScreenshot } from "@marketing/screenshots";
import { complete, getModelName } from "@marketing/models";
import { runGoogleAdsScraper } from "@marketing/apify";
import { computeAdLongevity, adLongevitySignals } from "@marketing/ad-longevity";
import { absenceSignal } from "@marketing/signal-builder";

interface AdSearchRecord {
  query: string;
  source: "google_transparency" | "apify";
  searchType: "domain" | "advertiser_name" | "alternate_name";
  resultCount: number;
}

export interface GoogleAdsData {
  activeAdCount: number | null;
  adFormats: Record<string, number>;
  adSamples: Array<{
    text: string;
    format: string;
    landingPage: string | null;
    lastShown: string | null;
  }>;
  screenshotPaths: string[];
  formatDiversityScore: number;
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
}

const EXTRACTION_PROMPT = `Extract structured ad data from this Google Ads Transparency Center page HTML. Return JSON:

{
  "ads": [
    {
      "text": "ad headline and description",
      "format": "search|display|youtube|shopping",
      "landingPage": "URL or null",
      "lastShown": "date or null"
    }
  ],
  "totalCount": number,
  "advertiserName": "name or null"
}

If the page shows no results or an error, return: { "ads": [], "totalCount": 0, "advertiserName": null }`;

async function searchGoogleTransparency(
  page: any,
  query: string,
  queryType: "domain" | "advertiser_name",
  scanId: string,
  captureShot: boolean
): Promise<{ ads: any[]; totalCount: number; advertiserName: string | null; screenshotPaths: string[] }> {
  const transparencyUrl = queryType === "domain"
    ? `https://adstransparency.google.com/?domain=${query}`
    : `https://adstransparency.google.com/?search=${encodeURIComponent(query)}`;

  await page.goto(transparencyUrl, { waitUntil: "networkidle", timeout: 30_000 });
  await randomDelay(3000, 5000);

  const screenshotPaths: string[] = [];
  if (captureShot) {
    try {
      const path = await captureScreenshot(page, "google-ads-transparency", "desktop", scanId);
      screenshotPaths.push(path);
    } catch {
      // Optional
    }
  }

  const html = await page.content();
  const truncatedHtml = html.slice(0, 20_000);

  const result = await complete("haiku", [
    { role: "user", content: `Extract ads from this Google Ads Transparency page:\n\n${truncatedHtml}` },
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
    advertiserName: parsed.advertiserName ?? null,
    screenshotPaths,
  };
}

export async function runGoogleAds(
  domain: string,
  scanId: string,
  companyName?: string,
  alternateNames?: string[]
): Promise<Envelope<GoogleAdsData | null>> {
  const startTime = Date.now();
  const primitive = "google_ads";

  try {
    let adsData: GoogleAdsData | null = null;
    const searchesPerformed: AdSearchRecord[] = [];
    const allAds: any[] = [];
    let allScreenshotPaths: string[] = [];

    // Primary: Playwright multi-strategy search
    try {
      await withBrowser("desktop", async (page) => {
        // Strategy 1: Search by domain (primary)
        const result1 = await searchGoogleTransparency(page, domain, "domain", scanId, true);
        searchesPerformed.push({
          query: domain,
          source: "google_transparency",
          searchType: "domain",
          resultCount: result1.totalCount,
        });
        allAds.push(...result1.ads);
        allScreenshotPaths.push(...result1.screenshotPaths);

        // Strategy 2: Search by company name if domain yielded no results
        if (result1.totalCount === 0 && companyName && companyName !== domain) {
          const result2 = await searchGoogleTransparency(page, companyName, "advertiser_name", scanId, false);
          searchesPerformed.push({
            query: companyName,
            source: "google_transparency",
            searchType: "advertiser_name",
            resultCount: result2.totalCount,
          });
          allAds.push(...result2.ads);

          // Strategy 2b: Try domain without TLD
          if (result2.totalCount === 0) {
            const domainWithoutTld = domain.replace(/\.[a-z]{2,}$/i, "");
            if (domainWithoutTld !== domain && domainWithoutTld !== companyName) {
              const result2b = await searchGoogleTransparency(page, domainWithoutTld, "advertiser_name", scanId, false);
              searchesPerformed.push({
                query: domainWithoutTld,
                source: "google_transparency",
                searchType: "advertiser_name",
                resultCount: result2b.totalCount,
              });
              allAds.push(...result2b.ads);

              // Strategy 2c: Try brand name (first segment before any dot)
              if (result2b.totalCount === 0) {
                const brandName = domain.split(".")[0];
                if (brandName !== domainWithoutTld) {
                  const result2c = await searchGoogleTransparency(page, brandName, "advertiser_name", scanId, false);
                  searchesPerformed.push({
                    query: brandName,
                    source: "google_transparency",
                    searchType: "advertiser_name",
                    resultCount: result2c.totalCount,
                  });
                  allAds.push(...result2c.ads);
                }
              }
            }
          }
        }

        // Strategy 3: Search by alternate names (DBA, parent company)
        if (allAds.length === 0 && alternateNames && alternateNames.length > 0) {
          for (const altName of alternateNames.slice(0, 2)) {
            const result3 = await searchGoogleTransparency(page, altName, "advertiser_name", scanId, false);
            searchesPerformed.push({
              query: altName,
              source: "google_transparency",
              searchType: "alternate_name",
              resultCount: result3.totalCount,
            });
            allAds.push(...result3.ads);
            if (allAds.length > 0) break;
          }
        }
      });

      // Deduplicate
      const seenTexts = new Set<string>();
      const uniqueAds = allAds.filter((ad) => {
        const key = (ad.text ?? "").slice(0, 100);
        if (seenTexts.has(key)) return false;
        seenTexts.add(key);
        return true;
      });

      const adFormats: Record<string, number> = {};
      for (const ad of uniqueAds) {
        const format = ad.format ?? "unknown";
        adFormats[format] = (adFormats[format] ?? 0) + 1;
      }

      const formatCount = Object.keys(adFormats).length;
      const formatDiversityScore = uniqueAds.length > 0 ? Math.min(formatCount / 4, 1) : 0;
      const totalCount = uniqueAds.length;

      // Ad longevity analysis (uses lastShown field)
      const adLongevity = computeAdLongevity(uniqueAds.map((ad) => ad.lastShown));

      const searchCoverage: "comprehensive" | "partial" | "limited" =
        searchesPerformed.length >= 3 ? "comprehensive"
          : searchesPerformed.length >= 2 ? "partial"
            : "limited";

      // Nuanced signals
      const signals: string[] = [];
      if (totalCount === 0) {
        const queriesList = searchesPerformed.map((s) => `"${s.query}" (${s.searchType})`).join(", ");
        signals.push(
          `No Google Ads campaigns detected in Ads Transparency Center (searched: ${queriesList})`
        );
      } else {
        signals.push(`${totalCount} Google Ad${totalCount > 1 ? "s" : ""} detected in Ads Transparency Center`);
        if (!adFormats.search) signals.push(absenceSignal("search ads", { checked: ["Google Ads Transparency Center"], method: "API query", coverage: "external_api" }, "missing high-intent traffic channel"));
        if (!adFormats.display) signals.push(absenceSignal("display ads", { checked: ["Google Ads Transparency Center"], method: "API query", coverage: "external_api" }, "no brand awareness campaigns visible"));
        if (!adFormats.youtube) signals.push(absenceSignal("YouTube ads", { checked: ["Google Ads Transparency Center"], method: "API query", coverage: "external_api" }));
        if (totalCount < 3) {
          signals.push("Few active ads — may indicate limited budget or early testing phase");
        }
      }

      // Ad longevity signals
      signals.push(...adLongevitySignals(adLongevity, uniqueAds.length));

      adsData = {
        activeAdCount: totalCount,
        adFormats,
        adSamples: uniqueAds.slice(0, 5).map((a: any) => ({
          text: a.text ?? "",
          format: a.format ?? "unknown",
          landingPage: a.landingPage ?? null,
          lastShown: a.lastShown ?? null,
        })),
        screenshotPaths: allScreenshotPaths,
        formatDiversityScore,
        signals,
        searchesPerformed,
        searchCoverage,
        scrapingSucceeded: true,
        adLongevity,
      };
    } catch (playwrightError) {
      console.warn("Google Ads Playwright failed, falling back to Apify:", playwrightError);
    }

    // Fallback: Apify
    if (!adsData) {
      try {
        const apifyResults = await runGoogleAdsScraper(domain);
        searchesPerformed.push({
          query: domain,
          source: "apify",
          searchType: "domain",
          resultCount: apifyResults.length,
        });

        const adFormats: Record<string, number> = {};
        for (const ad of apifyResults) {
          const format = ad.adFormat ?? "unknown";
          adFormats[format] = (adFormats[format] ?? 0) + 1;
        }

        const formatCount = Object.keys(adFormats).length;
        const signals: string[] = [];
        if (apifyResults.length === 0) {
          signals.push(`No Google Ads detected for ${domain} via Apify scraper`);
        } else {
          signals.push(`${apifyResults.length} Google Ad${apifyResults.length > 1 ? "s" : ""} detected via Apify`);
        }

        // Ad longevity for Apify results
        const apifyAdLongevity = computeAdLongevity(apifyResults.map((a) => a.lastShown));

        adsData = {
          activeAdCount: apifyResults.length,
          adFormats,
          adSamples: apifyResults.slice(0, 5).map((a) => ({
            text: a.adText,
            format: a.adFormat,
            landingPage: a.landingPageUrl,
            lastShown: a.lastShown,
          })),
          screenshotPaths: [],
          formatDiversityScore: apifyResults.length > 0 ? Math.min(formatCount / 4, 1) : 0,
          signals,
          searchesPerformed,
          searchCoverage: "limited",
          scrapingSucceeded: true,
          adLongevity: apifyAdLongevity,
        };
      } catch {
        adsData = {
          activeAdCount: null,
          adFormats: {},
          adSamples: [],
          screenshotPaths: [],
          formatDiversityScore: 0,
          signals: ["Could not assess Google Ads activity — both Playwright and Apify methods failed"],
          searchesPerformed,
          searchCoverage: "limited",
          scrapingSucceeded: false,
          adLongevity: null,
        };
      }
    }

    // Ad copy quality analysis when ads are found
    if (adsData.activeAdCount != null && adsData.activeAdCount > 0 && adsData.adSamples.length > 0) {
      try {
        const adTexts = adsData.adSamples.map((a) => a.text).filter(Boolean).join("\n---\n");
        const copyResult = await complete("haiku", [
          { role: "user", content: `Analyze these Google ad copies for quality:\n\n${adTexts}` },
        ], {
          system: `Evaluate ad copy quality. Return JSON:
{
  "hookQuality": "strong|adequate|weak — does the headline grab attention?",
  "orientation": "benefit-driven|feature-driven|mixed",
  "ctaStrength": "strong|adequate|weak — is there a clear call to action?",
  "creativeDiversity": "high|moderate|low — are they testing different messages?",
  "overallRating": "strong|adequate|weak"
}`,
          temperature: 0.1,
        });

        try {
          adsData.adCopyAnalysis = JSON.parse(copyResult.content);
        } catch {
          const match = copyResult.content.match(/\{[\s\S]*\}/);
          if (match) adsData.adCopyAnalysis = JSON.parse(match[0]);
        }
      } catch {
        // Optional
      }
    }

    // Dynamic confidence
    const confidence = calculateGoogleAdConfidence({
      adsFound: adsData.activeAdCount != null && adsData.activeAdCount > 0,
      searchMethods: searchesPerformed.length,
      hasEnrichmentData: (alternateNames?.length ?? 0) > 0,
      playwrightSuccess: searchesPerformed.some((s) => s.source === "google_transparency"),
    });

    return createEnvelope<GoogleAdsData>(primitive, startTime, adsData, {
      confidence,
      confidenceFactors: [
        adsData.activeAdCount == null
          ? "Could not verify ad activity"
          : adsData.activeAdCount > 0
            ? `${adsData.activeAdCount} ads found`
            : "No ads found",
        `${searchesPerformed.length} search strategies used`,
        `Coverage: ${adsData.searchCoverage}`,
      ],
      model: getModelName("haiku"),
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}

function calculateGoogleAdConfidence(factors: {
  adsFound: boolean;
  searchMethods: number;
  hasEnrichmentData: boolean;
  playwrightSuccess: boolean;
}): number {
  let confidence = 0.4;
  if (factors.adsFound) confidence += 0.2;
  if (factors.searchMethods >= 3) confidence += 0.15;
  else if (factors.searchMethods >= 2) confidence += 0.1;
  if (factors.hasEnrichmentData) confidence += 0.1;
  if (factors.playwrightSuccess) confidence += 0.1;
  return Math.min(confidence, 0.95);
}
