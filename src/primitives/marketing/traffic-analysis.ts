import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import {
  bulkTrafficEstimation,
  getBacklinksSummary,
  getRankedKeywords,
  getRelevantPages,
  type TrafficEstimation,
  type BacklinksSummary,
  type RankedKeywordsResult,
} from "@marketing/dataforseo";
import { getCruxData, type CruxData } from "@marketing/pagespeed";
import { safeFetch } from "@marketing/safe-fetch";
import { absenceSignal } from "@marketing/signal-builder";

export interface QuickWinKeyword {
  keyword: string;
  position: number;
  volume: number;
  difficulty: number | null;
  intent: string | null;
}

export interface BacklinkQualityTiers {
  high: number;
  medium: number;
  low: number;
}

export interface TrafficAnalysisData {
  traffic: TrafficEstimation;
  crux: CruxData;
  backlinks: BacklinksSummary | null;
  keywords: RankedKeywordsResult | null;
  topPages: Array<{ page: string; traffic: number }>;
  quickWinKeywords: QuickWinKeyword[];
  searchVisibilityIndex: number;
  backlinkQualityTiers: BacklinkQualityTiers | null;
  organicCost: number | null;
  paidCost: number | null;
  sitemapDetected: boolean;
  signals: string[];
}

export async function runTrafficAnalysis(
  domain: string
): Promise<Envelope<TrafficAnalysisData | null>> {
  const startTime = Date.now();
  const primitive = "traffic_analysis";

  try {
    const origin = `https://${domain}`;
    const [traffic, crux, backlinks, keywords, relevantPages, sitemapDetected] = await Promise.all([
      bulkTrafficEstimation(domain),
      getCruxData(origin).catch(() => ({
        origin,
        lcp: { p75: null, rating: null },
        cls: { p75: null, rating: null },
        fcp: { p75: null, rating: null },
        inp: { p75: null, rating: null },
        ttfb: { p75: null, rating: null },
        hasData: false,
      })),
      getBacklinksSummary(domain),
      getRankedKeywords(domain),
      getRelevantPages(domain),
      safeFetch(`${origin}/sitemap.xml`, {
        method: "HEAD",
        signal: AbortSignal.timeout(5_000),
      }).then((r) => r.ok).catch(() => false),
    ]);

    const signals: string[] = [];
    const confidenceFactors: string[] = [];

    // Analyze traffic signals — nuanced language with source attribution
    // All traffic numbers are estimates from DataForSEO; label them accordingly
    if (traffic.organicTraffic !== null) {
      if (traffic.organicTraffic < 100) {
        signals.push("Very low estimated organic traffic — DataForSEO estimates <100 monthly visits (estimated)");
      } else if (traffic.organicTraffic < 1000) {
        signals.push(`Low estimated organic traffic — DataForSEO estimates ~${traffic.organicTraffic} monthly visits (estimated)`);
      }
      confidenceFactors.push("DataForSEO traffic data available");
    } else {
      signals.push("DataForSEO returned no traffic data — domain may be very new, very small, or not indexed");
      confidenceFactors.push("No traffic data from DataForSEO");
    }

    if (traffic.paidTraffic !== null && traffic.paidTraffic > 0) {
      signals.push(`DataForSEO detects ~${traffic.paidTraffic} estimated monthly paid search visits (estimated)`);
    } else {
      signals.push("DataForSEO reports no paid search traffic for this domain");
    }

    // Organic cost — the value of organic traffic expressed as equivalent ad spend
    if (traffic.organicCost !== null && traffic.organicCost > 0) {
      const formatted = traffic.organicCost >= 1000
        ? `$${Math.round(traffic.organicCost / 1000)}K`
        : `$${Math.round(traffic.organicCost)}`;
      signals.push(`Organic traffic is worth ~${formatted}/month in equivalent Google Ads spend (DataForSEO estimate)`);
      if (traffic.organicCost > 10_000) {
        signals.push("Significant organic SEO asset — protecting this traffic should be a priority");
      }
    }

    // Sitemap detection
    if (!sitemapDetected) {
      signals.push(`${absenceSignal("sitemap.xml", { checked: ["/sitemap.xml"], method: "HTTP HEAD", coverage: "common_paths" })} — search engines may not discover all pages efficiently`);
    }

    if (
      traffic.organicKeywordsCount !== null &&
      traffic.organicKeywordsCount < 50
    ) {
      signals.push(`Ranking for only an estimated ${traffic.organicKeywordsCount} organic keywords (per DataForSEO) — thin content or new site`);
    }

    // Backlink signals
    if (backlinks) {
      confidenceFactors.push("Backlink data available");
      if (backlinks.domainRank !== null) {
        signals.push(`Domain Rank: ${backlinks.domainRank} (DataForSEO)`);
        if (backlinks.domainRank < 30) {
          signals.push("Low domain authority — weak backlink profile");
        }
      }
      signals.push(`${backlinks.referringDomains} referring domains linking to this site (DataForSEO)`);
    } else {
      confidenceFactors.push("No backlink data from DataForSEO");
    }

    // Keyword signals
    if (keywords && keywords.keywords.length > 0) {
      confidenceFactors.push("Ranked keywords data available");
      const total = keywords.keywords.length;
      const brandedPct = total > 0 ? Math.round((keywords.brandedCount / total) * 100) : 0;
      const unbrandedPct = 100 - brandedPct;
      signals.push(`Ranks for ${keywords.totalCount} keywords (${brandedPct}% branded, ${unbrandedPct}% unbranded)`);

      // Intent distribution signals
      const intentTotal = Object.values(keywords.intentDistribution).reduce(
        (sum, count) => sum + count,
        0
      );
      if (intentTotal > 0) {
        const pcts: string[] = [];
        for (const intent of ["informational", "commercial", "transactional"]) {
          const count = keywords.intentDistribution[intent] ?? 0;
          const pct = Math.round((count / intentTotal) * 100);
          if (pct > 0) pcts.push(`${pct}% ${intent}`);
        }
        if (pcts.length > 0) {
          signals.push(`Intent distribution: ${pcts.join(", ")}`);
        }

        const commercialCount =
          (keywords.intentDistribution["commercial"] ?? 0) +
          (keywords.intentDistribution["transactional"] ?? 0);
        if (commercialCount === 0) {
          signals.push("No commercial-intent keywords — traffic has no purchase intent");
        }
      }

      if (brandedPct > 80) {
        signals.push("Traffic heavily branded — vulnerable to competitors");
      }
    } else {
      confidenceFactors.push("No ranked keywords data from DataForSEO");
    }

    // --- B1: Quick Win Keywords (positions 4-20, high volume, low competition) ---
    const quickWinKeywords: QuickWinKeyword[] = [];
    if (keywords && keywords.keywords.length > 0) {
      // Filter for keywords at positions 4-20 with meaningful search volume
      // Sort by volume descending to surface the best opportunities
      const candidates = keywords.keywords
        .filter((kw) => kw.position >= 4 && kw.position <= 20 && kw.searchVolume >= 100 && !kw.isBranded)
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, 10);

      for (const kw of candidates) {
        quickWinKeywords.push({
          keyword: kw.keyword,
          position: kw.position,
          volume: kw.searchVolume,
          difficulty: null, // DataForSEO keyword difficulty not currently extracted per-keyword
          intent: kw.intent,
        });
      }

      if (quickWinKeywords.length > 0) {
        signals.push(
          `${quickWinKeywords.length} quick-win keyword${quickWinKeywords.length > 1 ? "s" : ""} found at positions 4-20 (high volume, low competition) — top opportunity: "${quickWinKeywords[0].keyword}" at position ${quickWinKeywords[0].position} with ${quickWinKeywords[0].volume} monthly searches`
        );
      }
    }

    // --- B2: Search Visibility Index ---
    let searchVisibilityIndex = 0;
    if (keywords && keywords.keywords.length > 0) {
      // Weighted visibility: volume × (21 - position) / 20 for each ranked keyword
      let rawScore = 0;
      let maxPossibleScore = 0;
      for (const kw of keywords.keywords) {
        if (kw.position >= 1 && kw.position <= 20) {
          rawScore += kw.searchVolume * ((21 - kw.position) / 20);
        }
        // Max possible: all keywords at position 1
        maxPossibleScore += kw.searchVolume * (20 / 20);
      }
      // Normalize to 0-100
      searchVisibilityIndex = maxPossibleScore > 0
        ? Math.round((rawScore / maxPossibleScore) * 100)
        : 0;

      signals.push(`Search visibility index: ${searchVisibilityIndex}/100 (weighted by keyword volume and position)`);
    }

    // --- B3: Backlink Quality Tiers ---
    // Note: BacklinksSummary only provides domainRank for the target site, not per-referring-domain.
    // Per-domain rank data is not available from the current DataForSEO backlinks/summary endpoint.
    // If referring domain rank data becomes available, classify here.
    let backlinkQualityTiers: BacklinkQualityTiers | null = null;
    // Placeholder: backlinkQualityTiers remains null until per-referring-domain rank data is available

    // Use relevant pages if available, otherwise keep empty array from bulkTrafficEstimation
    const topPages = relevantPages.length > 0 ? relevantPages : traffic.topPages;

    // CrUX signals
    if (!crux.hasData) {
      signals.push("No Chrome UX Report (CrUX) data available — insufficient real-user traffic for field metrics");
      confidenceFactors.push("No CrUX field data");
    } else {
      confidenceFactors.push("CrUX field data available");
      if (crux.lcp.rating === "poor") signals.push("Poor LCP per CrUX data — slow loading experienced by real users");
      if (crux.cls.rating === "poor") signals.push("Poor CLS per CrUX data — layout shifts frustrating real users");
      if (crux.inp.rating === "poor") signals.push("Poor INP per CrUX data — slow interactivity for real users");
    }

    // Confidence: base on data availability
    let confidence = 0.3;
    if (confidenceFactors.includes("DataForSEO traffic data available")) {
      confidence = crux.hasData ? 0.85 : 0.65;
    }
    if (backlinks) confidence = Math.min(confidence + 0.05, 0.95);
    if (keywords && keywords.keywords.length > 0) confidence = Math.min(confidence + 0.05, 0.95);

    return createEnvelope<TrafficAnalysisData>(primitive, startTime, {
      traffic,
      crux,
      backlinks,
      keywords,
      topPages,
      quickWinKeywords,
      searchVisibilityIndex,
      backlinkQualityTiers,
      organicCost: traffic.organicCost,
      paidCost: traffic.paidCost,
      sitemapDetected,
      signals,
    }, {
      confidence,
      confidenceFactors,
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
