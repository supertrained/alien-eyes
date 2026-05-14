const BASE_URL = "https://api.apify.com/v2";

function getToken(): string {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN not set");
  return token;
}

const META_AD_LIBRARY_ACTOR = "apify/facebook-ads-library-scraper";
const GOOGLE_ADS_ACTOR = "apify/google-ads-transparency-scraper";

async function runActor(
  actorId: string,
  input: Record<string, unknown>,
  timeoutMs = 120_000
): Promise<unknown[]> {
  const token = getToken();
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Start the actor run
  const startResponse = await fetch(
    `${BASE_URL}/acts/${actorId}/runs`,
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(input),
    }
  );

  if (!startResponse.ok) {
    const text = await startResponse.text();
    throw new Error(`Apify start failed (${startResponse.status}): ${text}`);
  }

  const runData = (await startResponse.json()) as any;
  const runId = runData.data?.id;
  if (!runId) throw new Error("No run ID returned from Apify");

  // Poll for completion
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));

    const statusResponse = await fetch(
      `${BASE_URL}/actor-runs/${runId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const statusData = (await statusResponse.json()) as any;
    const status = statusData.data?.status;

    if (status === "SUCCEEDED") {
      // Fetch results from default dataset
      const datasetId = statusData.data?.defaultDatasetId;
      if (!datasetId) return [];

      const itemsResponse = await fetch(
        `${BASE_URL}/datasets/${datasetId}/items?limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return (await itemsResponse.json()) as unknown[];
    }

    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Apify run ${runId} ended with status: ${status}`);
    }
  }

  throw new Error(`Apify run ${runId} timed out after ${timeoutMs}ms`);
}

export interface MetaAdResult {
  adId: string;
  pageName: string;
  adText: string;
  startDate: string | null;
  isActive: boolean;
  landingPageUrl: string | null;
  mediaType: string | null;
}

/** Derive media type from Apify item fields */
export function deriveMediaType(item: Record<string, unknown>): string {
  // Prefer explicit type fields from the Apify schema
  if (typeof item.media_type === "string" && item.media_type) return item.media_type;
  if (typeof item.ad_creative_type === "string" && item.ad_creative_type) return item.ad_creative_type;
  // Heuristic: multiple images/bodies suggest carousel
  const bodies = item.ad_creative_bodies as unknown[] | undefined;
  const linkCaptions = item.ad_creative_link_captions as unknown[] | undefined;
  if (bodies && bodies.length > 1 && linkCaptions && linkCaptions.length > 1) return "carousel";
  // Check for video indicators
  if (item.ad_creative_videos && (item.ad_creative_videos as unknown[]).length > 0) return "video";
  // Link descriptions present = link ad
  if (item.ad_creative_link_descriptions && (item.ad_creative_link_descriptions as unknown[]).length > 0) return "link";
  return "unknown";
}

/** Map a raw Apify item to our MetaAdResult */
export function mapApifyItem(item: Record<string, unknown>): MetaAdResult {
  return {
    adId: (item.id as string) ?? "",
    pageName: (item.page_name as string) ?? "",
    adText: (item.ad_creative_bodies as string[] | undefined)?.join(" ") ?? "",
    startDate: (item.ad_delivery_start_time as string) ?? null,
    isActive:
      (item.ad_delivery_status as string) === "active" ||
      item.ad_delivery_stop_time == null,
    landingPageUrl:
      (item.ad_creative_link_destinations as string[] | undefined)?.[0] ??
      (item.ad_snapshot_url as string) ??
      null,
    mediaType: deriveMediaType(item),
  };
}

/**
 * Run the Meta Ad Library scraper via Apify with multiple search terms.
 * Deduplicates results by adId across all searches.
 */
export async function runMetaAdLibraryScraper(
  searchTerms: string[]
): Promise<MetaAdResult[]> {
  const seenIds = new Set<string>();
  const results: MetaAdResult[] = [];

  for (const term of searchTerms) {
    if (!term?.trim()) continue;
    try {
      const items = await runActor(META_AD_LIBRARY_ACTOR, {
        searchQuery: term.trim(),
        countryCode: "US",
        adType: "all",
        maxItems: 20,
      });

      for (const raw of items as Record<string, unknown>[]) {
        const mapped = mapApifyItem(raw);
        if (mapped.adId && seenIds.has(mapped.adId)) continue;
        if (mapped.adId) seenIds.add(mapped.adId);
        results.push(mapped);
      }

      // If we got results from this search, no need to try more
      if (results.length > 0) break;
    } catch (err) {
      console.warn(`[apify] Search for "${term}" failed:`, err);
      // Continue with next search term
    }
  }

  return results;
}

export interface GoogleAdResult {
  advertiserName: string;
  adFormat: string;
  adText: string;
  lastShown: string | null;
  landingPageUrl: string | null;
}

export async function runGoogleAdsScraper(
  domain: string
): Promise<GoogleAdResult[]> {
  const items = await runActor(GOOGLE_ADS_ACTOR, {
    advertiserDomain: domain,
    maxItems: 20,
  });

  return (items as any[]).map((item) => ({
    advertiserName: item.advertiser_name ?? "",
    adFormat: item.format ?? "unknown",
    adText: item.text ?? "",
    lastShown: item.last_shown ?? null,
    landingPageUrl: item.landing_page ?? null,
  }));
}
