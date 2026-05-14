const BASE_URL = "https://api.dataforseo.com/v3";

function getAuth(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) throw new Error("DATAFORSEO credentials not set");
  return Buffer.from(`${login}:${password}`).toString("base64");
}

async function post<T>(path: string, body: unknown[]): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getAuth()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DataForSEO ${path} failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

export interface TrafficEstimation {
  domain: string;
  organicTraffic: number | null;
  paidTraffic: number | null;
  organicCost: number | null;
  paidCost: number | null;
  organicKeywordsCount: number | null;
  topPages: Array<{
    page: string;
    traffic: number;
  }>;
}

export async function bulkTrafficEstimation(
  domain: string
): Promise<TrafficEstimation> {
  const result = await post<any>(
    "/dataforseo_labs/google/bulk_traffic_estimation/live",
    [{ targets: [domain] }]
  );

  const item = result?.tasks?.[0]?.result?.[0]?.items?.[0];
  if (!item) {
    return {
      domain,
      organicTraffic: null,
      paidTraffic: null,
      organicCost: null,
      paidCost: null,
      organicKeywordsCount: null,
      topPages: [],
    };
  }

  return {
    domain,
    organicTraffic: item.metrics?.organic?.etv ?? null,
    paidTraffic: item.metrics?.paid?.etv ?? null,
    organicCost: item.metrics?.organic?.estimated_paid_traffic_cost ?? null,
    paidCost: item.metrics?.paid?.estimated_paid_traffic_cost ?? null,
    organicKeywordsCount: item.metrics?.organic?.count ?? null,
    topPages: [],
  };
}

// --- Backlinks Summary (1A) ---

export interface BacklinksSummary {
  totalBacklinks: number;
  referringDomains: number;
  referringMainDomains: number;
  domainRank: number | null;
  topAnchors: Array<{ anchor: string; backlinks: number }>;
}

export async function getBacklinksSummary(
  domain: string
): Promise<BacklinksSummary | null> {
  try {
    const result = await post<any>("/backlinks/summary/live", [
      { target: domain, internal_list_limit: 0, backlinks_status_type: "live" },
    ]);

    const item = result?.tasks?.[0]?.result?.[0];
    if (!item) return null;

    const topAnchors: Array<{ anchor: string; backlinks: number }> = [];
    if (Array.isArray(item.top_anchors)) {
      for (const a of item.top_anchors.slice(0, 10)) {
        topAnchors.push({
          anchor: a.anchor ?? "",
          backlinks: a.backlinks ?? 0,
        });
      }
    }

    return {
      totalBacklinks: item.total_backlinks ?? 0,
      referringDomains: item.referring_domains ?? 0,
      referringMainDomains: item.referring_main_domains ?? 0,
      domainRank: item.rank ?? null,
      topAnchors,
    };
  } catch {
    return null;
  }
}

// --- Ranked Keywords (1B) ---

export interface RankedKeyword {
  keyword: string;
  position: number;
  searchVolume: number;
  intent: string | null;
  isBranded: boolean;
}

export interface RankedKeywordsResult {
  keywords: RankedKeyword[];
  totalCount: number;
  brandedCount: number;
  unbrandedCount: number;
  intentDistribution: Record<string, number>;
}

export async function getRankedKeywords(
  domain: string
): Promise<RankedKeywordsResult | null> {
  try {
    const result = await post<any>(
      "/dataforseo_labs/google/ranked_keywords/live",
      [
        {
          target: domain,
          limit: 100,
          order_by: ["keyword_data.keyword_info.search_volume,desc"],
        },
      ]
    );

    const items: any[] = result?.tasks?.[0]?.result?.[0]?.items ?? [];
    const totalCount: number =
      result?.tasks?.[0]?.result?.[0]?.total_count ?? items.length;

    // Extract domain name without TLD for brand matching
    const domainParts = domain.replace(/^www\./, "").split(".");
    const brandName = domainParts[0].toLowerCase();

    const keywords: RankedKeyword[] = items.map((item: any) => {
      const kw: string = item.keyword_data?.keyword ?? "";
      const kwLower = kw.toLowerCase();
      return {
        keyword: kw,
        position: item.ranked_serp_element?.serp_item?.rank_absolute ?? 0,
        searchVolume: item.keyword_data?.keyword_info?.search_volume ?? 0,
        intent:
          item.keyword_data?.keyword_info?.search_intent_info?.main_intent ??
          item.keyword_data?.search_intent_info?.main_intent ??
          null,
        isBranded:
          kwLower.includes(brandName) ||
          kwLower.includes(brandName.replace(/-/g, " ")) ||
          kwLower.includes(brandName.replace(/-/g, "")),
      };
    });

    const brandedCount = keywords.filter((k) => k.isBranded).length;
    const unbrandedCount = keywords.length - brandedCount;

    const intentDistribution: Record<string, number> = {};
    for (const kw of keywords) {
      const intent = kw.intent ?? "unknown";
      intentDistribution[intent] = (intentDistribution[intent] ?? 0) + 1;
    }

    return {
      keywords,
      totalCount,
      brandedCount,
      unbrandedCount,
      intentDistribution,
    };
  } catch {
    return null;
  }
}

// --- Keyword Intersection / Competitive Gap (1C) ---

export interface KeywordGap {
  keyword: string;
  competitorDomain: string;
  competitorPosition: number;
  searchVolume: number;
}

export interface KeywordIntersectionResult {
  gapKeywords: KeywordGap[];
  totalGapCount: number;
}

export async function getKeywordIntersection(
  domain: string,
  competitors: string[]
): Promise<KeywordIntersectionResult | null> {
  try {
    if (competitors.length === 0) return null;

    const targets = competitors.slice(0, 2);
    const allGaps: KeywordGap[] = [];
    let totalGapCount = 0;

    const results = await Promise.all(
      targets.map(async (competitor) => {
        const result = await post<any>(
          "/dataforseo_labs/google/domain_intersection/live",
          [
            {
              target1: domain,
              target2: competitor,
              intersection_mode: "second_target_not_first",
              limit: 50,
              order_by: [
                "first_domain_serp_element.keyword_data.keyword_info.search_volume,desc",
              ],
            },
          ]
        );
        return { competitor, result };
      })
    );

    for (const { competitor, result } of results) {
      const items: any[] = result?.tasks?.[0]?.result?.[0]?.items ?? [];
      const count: number =
        result?.tasks?.[0]?.result?.[0]?.total_count ?? items.length;
      totalGapCount += count;

      for (const item of items) {
        const kwData =
          item.second_domain_serp_element?.keyword_data ??
          item.keyword_data ??
          {};
        allGaps.push({
          keyword: kwData.keyword ?? "",
          competitorDomain: competitor,
          competitorPosition:
            item.second_domain_serp_element?.serp_item?.rank_absolute ?? 0,
          searchVolume: kwData.keyword_info?.search_volume ?? 0,
        });
      }
    }

    // Sort by search volume descending and deduplicate by keyword
    allGaps.sort((a, b) => b.searchVolume - a.searchVolume);
    const seen = new Set<string>();
    const deduped = allGaps.filter((g) => {
      if (seen.has(g.keyword)) return false;
      seen.add(g.keyword);
      return true;
    });

    return {
      gapKeywords: deduped,
      totalGapCount,
    };
  } catch {
    return null;
  }
}

// --- Relevant Pages (1D) ---

export async function getRelevantPages(
  domain: string
): Promise<Array<{ page: string; traffic: number }>> {
  try {
    const result = await post<any>(
      "/dataforseo_labs/google/relevant_pages/live",
      [
        {
          target: domain,
          limit: 10,
          order_by: ["metrics.organic.etv,desc"],
        },
      ]
    );

    const items: any[] = result?.tasks?.[0]?.result?.[0]?.items ?? [];
    return items.map((item: any) => ({
      page: item.page_address ?? item.page ?? "",
      traffic: item.metrics?.organic?.etv ?? 0,
    }));
  } catch {
    return [];
  }
}

// --- Technology Detection ---

export interface TechnologyDetection {
  technologies: Array<{
    name: string;
    category: string;
    version: string | null;
  }>;
}

export async function technologyDetection(
  domain: string
): Promise<TechnologyDetection> {
  const result = await post<any>(
    "/domain_analytics/technologies/domain_technologies/live",
    [{ target: domain, limit: 100 }]
  );

  const items = result?.tasks?.[0]?.result?.[0]?.items ?? [];
  const technologies = items.map(
    (item: { technology: string; category: string; version: string | null }) => ({
      name: item.technology,
      category: item.category,
      version: item.version ?? null,
    })
  );

  return { technologies };
}
