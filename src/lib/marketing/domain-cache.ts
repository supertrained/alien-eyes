import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** TTL in milliseconds per primitive type */
const CACHE_TTL_MS: Record<string, number> = {
  traffic_analysis: 7 * 24 * 60 * 60 * 1000,       // 7 days
  company_enrichment: 30 * 24 * 60 * 60 * 1000,     // 30 days
  brand_reputation: 7 * 24 * 60 * 60 * 1000,        // 7 days
  social_organic: 3 * 24 * 60 * 60 * 1000,          // 3 days
  meo_analysis: 7 * 24 * 60 * 60 * 1000,            // 7 days
  agent_native: 7 * 24 * 60 * 60 * 1000,            // 7 days
  content_presence: 3 * 24 * 60 * 60 * 1000,        // 3 days
  competitor_context: 3 * 24 * 60 * 60 * 1000,      // 3 days
  // Short TTL for volatile data
  meta_ads: 12 * 60 * 60 * 1000,                    // 12 hours
  google_ads: 12 * 60 * 60 * 1000,                  // 12 hours
  tracking_analytics: 24 * 60 * 60 * 1000,          // 24 hours
  email_analysis: 24 * 60 * 60 * 1000,              // 24 hours
  // Website analysis changes frequently
  website_cro: 24 * 60 * 60 * 1000,                 // 24 hours
  website_technical: 24 * 60 * 60 * 1000,           // 24 hours
  website_messaging: 3 * 24 * 60 * 60 * 1000,       // 3 days
  pricing_monetization: 7 * 24 * 60 * 60 * 1000,    // 7 days
};

/** Default TTL if primitive not in map */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedEnvelope {
  data: unknown;
  confidence: number;
  confidenceFactors: string[];
  model_used: string | null;
  tokens_used: number;
  cost_usd: number;
  duration_ms: number | null;
  cached_at: string;
}

/**
 * Look up cached result for a domain+primitive.
 * Returns null if not found or expired.
 */
export async function getCachedResult(
  domain: string,
  primitive: string
): Promise<CachedEnvelope | null> {
  const { data, error } = await supabase
    .from("domain_cache")
    .select("data, confidence, confidence_factors, model_used, tokens_used, cost_usd, duration_ms, cached_at")
    .eq("domain", domain)
    .eq("primitive", primitive)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;

  return {
    data: data.data,
    confidence: data.confidence,
    confidenceFactors: data.confidence_factors ?? [],
    model_used: data.model_used,
    tokens_used: data.tokens_used ?? 0,
    cost_usd: data.cost_usd ?? 0,
    duration_ms: data.duration_ms,
    cached_at: data.cached_at,
  };
}

/**
 * Store a result in the domain cache.
 * Uses upsert so re-scans update the cache.
 * Cache is global (no org filter on reads) but tracks contributing_org_id for GDPR erasure.
 */
export async function setCachedResult(
  domain: string,
  primitive: string,
  envelope: {
    data: unknown;
    confidence: number;
    confidenceFactors: string[];
    metadata: {
      model?: string;
      tokensUsed?: number;
      costUsd?: number;
      durationMs?: number;
    };
  },
  contributingOrgId?: string
): Promise<void> {
  const ttlMs = CACHE_TTL_MS[primitive] ?? DEFAULT_TTL_MS;
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  const row: Record<string, unknown> = {
    domain,
    primitive,
    data: envelope.data,
    confidence: envelope.confidence,
    confidence_factors: envelope.confidenceFactors,
    model_used: envelope.metadata.model ?? null,
    tokens_used: envelope.metadata.tokensUsed ?? 0,
    cost_usd: envelope.metadata.costUsd ?? 0,
    duration_ms: envelope.metadata.durationMs ?? null,
    cached_at: new Date().toISOString(),
    expires_at: expiresAt,
  };

  if (contributingOrgId) {
    row.contributing_org_id = contributingOrgId;
  }

  const { error } = await supabase
    .from("domain_cache")
    .upsert(row, { onConflict: "domain,primitive" });

  if (error) {
    console.warn(`[domain-cache] Failed to cache ${primitive} for ${domain}: ${error.message}`);
  }
}

/**
 * Invalidate cache for a domain (all primitives or specific one).
 */
export async function invalidateCache(
  domain: string,
  primitive?: string
): Promise<void> {
  let query = supabase.from("domain_cache").delete().eq("domain", domain);
  if (primitive) {
    query = query.eq("primitive", primitive);
  }
  await query;
}
