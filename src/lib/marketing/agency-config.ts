/**
 * Worker-side agency config resolution.
 * Reads from organizations.settings JSONB with in-memory cache.
 * Mirrors lib/agency-config.ts but uses the worker's own Supabase client.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type AgencyConfig = {
  id: string;
  name: string;
  fullName: string;
  company: string;
  companyUrl: string;
  notificationEmail: {
    from: string;
    replyTo?: string;
  };
  appUrl: string;
  enabledPrimitives: string[];
  theme: {
    primary: string;
    primaryHover: string;
    primaryCta: string;
    primaryLight: string;
    accent: string;
    accentLight: string;
  };
  logoUrl?: string;
  logoInitials: string;
  font: { family: string; url?: string };
  ctaGradient?: string;
  description: string;
  loomStyle?: { tone: string; structure: string; cta: string };
  synthesisTemplate?: {
    reportStructure?: string;
    findingFormat?: string;
    strengthsInstruction?: string;
    actionPlanFormat?: string;
    outreachRules?: string;
    loomScriptStructure?: string;
    loomScriptTone?: string;
  };
};

const DEFAULT_CONFIG: AgencyConfig = {
  id: "supertrained",
  name: "GMPF",
  fullName: "Growth Marketing Problem Finder",
  company: "SuperTrained",
  companyUrl: "https://supertrained.ai",
  notificationEmail: { from: "GMPF <notifications@supertrained.ai>" },
  appUrl: "https://growth-marketing-problem-finder-pi.vercel.app",
  enabledPrimitives: [
    "traffic_analysis", "website_technical", "website_messaging",
    "content_presence", "tracking_analytics", "meta_ads", "google_ads",
    "email_analysis", "competitor_context", "company_enrichment",
    "brand_reputation", "social_organic", "pricing_monetization",
    "meo_analysis", "agent_native",
  ],
  theme: {
    primary: "#ff6f61", primaryHover: "#e5554a", primaryCta: "#ff6f61",
    primaryLight: "#fff0ee", accent: "#1a2f4f", accentLight: "#2a4a6f",
  },
  logoInitials: "ST",
  font: { family: "Inter" },
  description: "Comprehensive growth marketing audit.",
};

const configCache = new Map<string, { config: AgencyConfig; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function mergeWithDefaults(
  settings: Record<string, unknown>,
  orgName?: string,
  orgSlug?: string
): AgencyConfig {
  const s = (settings.agency ?? settings) as Record<string, unknown>;
  return {
    id: (s.id as string) ?? orgSlug ?? DEFAULT_CONFIG.id,
    name: (s.name as string) ?? DEFAULT_CONFIG.name,
    fullName: (s.fullName as string) ?? DEFAULT_CONFIG.fullName,
    company: (s.company as string) ?? orgName ?? DEFAULT_CONFIG.company,
    companyUrl: (s.companyUrl as string) ?? DEFAULT_CONFIG.companyUrl,
    notificationEmail: (s.notificationEmail as AgencyConfig["notificationEmail"]) ?? DEFAULT_CONFIG.notificationEmail,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? (s.appUrl as string) ?? DEFAULT_CONFIG.appUrl,
    enabledPrimitives: (s.enabledPrimitives as string[]) ?? DEFAULT_CONFIG.enabledPrimitives,
    theme: { ...DEFAULT_CONFIG.theme, ...((s.theme as Record<string, string>) ?? {}) },
    logoUrl: s.logoUrl as string | undefined,
    logoInitials: (s.logoInitials as string) ?? DEFAULT_CONFIG.logoInitials,
    font: { ...DEFAULT_CONFIG.font, ...((s.font as Record<string, string>) ?? {}) },
    ctaGradient: s.ctaGradient as string | undefined,
    description: (s.description as string) ?? DEFAULT_CONFIG.description,
    loomStyle: s.loomStyle as AgencyConfig["loomStyle"],
    synthesisTemplate: s.synthesisTemplate as AgencyConfig["synthesisTemplate"],
  };
}

export async function getConfigForOrg(orgId: string): Promise<AgencyConfig> {
  const cached = configCache.get(orgId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.config;
  }

  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("settings, name, slug")
      .eq("id", orgId)
      .single();

    const config = mergeWithDefaults(org?.settings ?? {}, org?.name, org?.slug);
    configCache.set(orgId, { config, fetchedAt: Date.now() });
    return config;
  } catch (err) {
    console.warn(`[agency-config] Failed to fetch config for org ${orgId}:`, err);
    return { ...DEFAULT_CONFIG };
  }
}
