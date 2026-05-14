const PSI_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const CRUX_URL = "https://chromeuxreport.googleapis.com/v1/records:queryRecord";

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY not set");
  return key;
}

export interface PageSpeedResult {
  strategy: "mobile" | "desktop";
  performanceScore: number | null;
  accessibilityScore: number | null;
  lcp: number | null;
  cls: number | null;
  fcp: number | null;
  tbt: number | null;
  speedIndex: number | null;
  diagnostics: string[];
}

export async function runPageSpeedInsight(
  url: string,
  strategy: "mobile" | "desktop"
): Promise<PageSpeedResult> {
  const params = new URLSearchParams({
    url,
    strategy,
    key: getApiKey(),
  });
  params.append("category", "performance");
  params.append("category", "accessibility");

  const response = await fetch(`${PSI_URL}?${params}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PageSpeed API failed (${response.status}): ${text}`);
  }

  const data = await response.json() as any;
  const lighthouse = data.lighthouseResult;

  if (!lighthouse) {
    return {
      strategy,
      performanceScore: null,
      accessibilityScore: null,
      lcp: null,
      cls: null,
      fcp: null,
      tbt: null,
      speedIndex: null,
      diagnostics: ["No Lighthouse data returned"],
    };
  }

  const audits = lighthouse.audits ?? {};
  const diagnostics: string[] = [];

  // Collect notable diagnostics
  for (const [key, audit] of Object.entries(audits) as [string, any][]) {
    if (audit.score !== null && audit.score < 0.5 && audit.title) {
      diagnostics.push(`${audit.title}: ${audit.displayValue ?? "needs improvement"}`);
    }
  }

  return {
    strategy,
    performanceScore: lighthouse.categories?.performance?.score ?? null,
    accessibilityScore: lighthouse.categories?.accessibility?.score ?? null,
    lcp: audits["largest-contentful-paint"]?.numericValue ?? null,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
    fcp: audits["first-contentful-paint"]?.numericValue ?? null,
    tbt: audits["total-blocking-time"]?.numericValue ?? null,
    speedIndex: audits["speed-index"]?.numericValue ?? null,
    diagnostics: diagnostics.slice(0, 10),
  };
}

export interface CruxData {
  origin: string;
  lcp: { p75: number | null; rating: string | null };
  cls: { p75: number | null; rating: string | null };
  fcp: { p75: number | null; rating: string | null };
  inp: { p75: number | null; rating: string | null };
  ttfb: { p75: number | null; rating: string | null };
  hasData: boolean;
}

function extractMetric(
  record: any,
  metricKey: string
): { p75: number | null; rating: string | null } {
  const metric = record?.metrics?.[metricKey];
  if (!metric) return { p75: null, rating: null };

  const p75 = metric.percentiles?.p75 ?? null;

  // Determine rating from histogram
  const histogram = metric.histogram ?? [];
  let rating: string | null = null;
  if (histogram.length >= 3) {
    const good = histogram[0]?.density ?? 0;
    const needsImprovement = histogram[1]?.density ?? 0;
    if (good >= 0.75) rating = "good";
    else if (good + needsImprovement >= 0.75) rating = "needs-improvement";
    else rating = "poor";
  }

  return { p75, rating };
}

export async function getCruxData(origin: string): Promise<CruxData> {
  const response = await fetch(`${CRUX_URL}?key=${getApiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin }),
  });

  if (!response.ok) {
    // CrUX returns 404 when no data exists for the origin
    if (response.status === 404) {
      return {
        origin,
        lcp: { p75: null, rating: null },
        cls: { p75: null, rating: null },
        fcp: { p75: null, rating: null },
        inp: { p75: null, rating: null },
        ttfb: { p75: null, rating: null },
        hasData: false,
      };
    }
    const text = await response.text();
    throw new Error(`CrUX API failed (${response.status}): ${text}`);
  }

  const data = await response.json() as any;
  const record = data.record;

  return {
    origin,
    lcp: extractMetric(record, "largest_contentful_paint"),
    cls: extractMetric(record, "cumulative_layout_shift"),
    fcp: extractMetric(record, "first_contentful_paint"),
    inp: extractMetric(record, "interaction_to_next_paint"),
    ttfb: extractMetric(record, "experimental_time_to_first_byte"),
    hasData: true,
  };
}
