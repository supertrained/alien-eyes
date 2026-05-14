/**
 * Cross-Dimensional Analysis Module
 *
 * Pre-computes patterns across primitive results before synthesis,
 * dramatically improving LLM synthesis quality at zero additional API cost.
 */

interface PrimitiveResults {
  trafficAnalysis: any;
  websiteCro: any;
  websiteTechnical?: any;
  websiteMessaging?: any;
  contentPresence?: any;
  trackingAnalytics: any;
  metaAds: any;
  googleAds: any;
  emailAnalysis: any;
  competitorContext: any;
  companyEnrichment: any;
  brandReputation?: any;
  socialOrganic?: any;
  pricingMonetization?: any;
  meoAnalysis?: any;
  agentNative?: any;
}

interface CrossDimensionalPattern {
  pattern: string;
  dimensions: string[];
  severity: "critical" | "high" | "medium" | "low";
  insight: string;
}

export function computeCrossDimensionalPatterns(results: PrimitiveResults): CrossDimensionalPattern[] {
  const patterns: CrossDimensionalPattern[] = [];

  const traffic = results.trafficAnalysis;
  const cro = results.websiteCro ?? results.websiteTechnical;
  const tracking = results.trackingAnalytics;
  const metaAds = results.metaAds;
  const googleAds = results.googleAds;
  const email = results.emailAnalysis;
  const competitors = results.competitorContext;
  const enrichment = results.companyEnrichment;

  // --- Traffic + CRO patterns ---
  const organicTraffic = traffic?.traffic?.organicTraffic;
  const performanceScore = cro?.pagespeed?.mobile?.performanceScore;
  const overallGrade = cro?.analysis?.overallGrade;

  if (organicTraffic > 5000 && performanceScore !== null && performanceScore < 0.5) {
    patterns.push({
      pattern: "conversion_leak",
      dimensions: ["trafficAnalysis", "websiteCro"],
      severity: "critical",
      insight: `High traffic (~${organicTraffic} monthly visits) but poor site performance (${Math.round(performanceScore * 100)}/100) — visitors are arriving but likely bouncing due to slow load times. This is a conversion leak.`
    });
  }

  if (organicTraffic !== null && organicTraffic < 500 && overallGrade && /^[AB]/i.test(overallGrade)) {
    patterns.push({
      pattern: "traffic_acquisition_opportunity",
      dimensions: ["trafficAnalysis", "websiteCro"],
      severity: "high",
      insight: `Website quality is solid (grade: ${overallGrade}) but traffic is very low (~${organicTraffic}/mo). The site can convert — it just needs more visitors. Traffic acquisition should be the priority.`
    });
  }

  // --- Ads + Tracking patterns ---
  const hasAds = (metaAds?.activeAdCount > 0) || (googleAds?.activeAdCount > 0);
  const hasConversionTracking = tracking?.detected?.some((d: any) =>
    ["meta_pixel", "google_ads", "tiktok_pixel", "linkedin_insight"].includes(d.name)
  );
  const hasAnalytics = tracking?.detected?.some((d: any) =>
    ["google_analytics_ga4", "google_tag_manager"].includes(d.name)
  );

  if (hasAds && !hasConversionTracking) {
    patterns.push({
      pattern: "burning_money",
      dimensions: ["metaAds", "googleAds", "trackingAnalytics"],
      severity: "critical",
      insight: "Running paid ads but no conversion pixels detected. Ad spend cannot be attributed to results — essentially burning money with no way to optimize."
    });
  }

  if (hasAds && !hasAnalytics) {
    patterns.push({
      pattern: "flying_blind",
      dimensions: ["metaAds", "googleAds", "trackingAnalytics"],
      severity: "critical",
      insight: "Running paid ads but no analytics detected. Cannot measure traffic, behavior, or conversions from ad campaigns."
    });
  }

  // --- Enrichment + Gaps patterns ---
  const employeeCount = enrichment?.company?.employeeCount;
  const estimatedRevenue = enrichment?.company?.estimatedRevenue;
  const fundingData = enrichment?.company?.funding;

  if (employeeCount && employeeCount < 20 && hasAds) {
    // Small team running ads without full analytics = needs help
    if (!hasConversionTracking || !hasAnalytics) {
      patterns.push({
        pattern: "small_team_needs_partner",
        dimensions: ["companyEnrichment", "trackingAnalytics"],
        severity: "high",
        insight: `Small team (${employeeCount} employees) running ads without proper analytics infrastructure. Likely no dedicated marketing ops person — needs a partner to set up measurement.`
      });
    }
  }

  if (fundingData && (fundingData.lastRoundAmount > 0 || fundingData.totalFunding > 0)) {
    const totalGaps = [
      !hasAnalytics,
      !hasConversionTracking,
      !email?.formFound,
      organicTraffic !== null && organicTraffic < 500,
    ].filter(Boolean).length;

    if (totalGaps >= 2) {
      patterns.push({
        pattern: "funded_with_gaps",
        dimensions: ["companyEnrichment", "trafficAnalysis", "trackingAnalytics"],
        severity: "high",
        insight: `Recently funded company with ${totalGaps} significant marketing gaps. Has budget to fix these issues — timing is good for outreach.`
      });
    }
  }

  // --- Competitor + Prospect contrast ---
  const competitorList = competitors?.competitors ?? [];
  if (competitorList.length > 0) {
    const avgCompTraffic = competitorList
      .filter((c: any) => c.traffic?.organic != null)
      .reduce((sum: number, c: any) => sum + c.traffic.organic, 0) /
      Math.max(competitorList.filter((c: any) => c.traffic?.organic != null).length, 1);

    if (organicTraffic !== null && avgCompTraffic > 0 && organicTraffic < avgCompTraffic * 0.2) {
      patterns.push({
        pattern: "competitor_traffic_gap",
        dimensions: ["trafficAnalysis", "competitorContext"],
        severity: "high",
        insight: `Organic traffic (~${organicTraffic}/mo) is less than 20% of competitor average (~${Math.round(avgCompTraffic)}/mo). Significant competitive gap in organic visibility.`
      });
    }

    // Check if competitors run ads but prospect doesn't
    const competitorAds = competitors?.competitorAds;
    if (competitorAds && !hasAds) {
      const competitorsWithAds = competitorAds.filter((c: any) => c.metaAdCount && c.metaAdCount > 0);
      if (competitorsWithAds.length > 0) {
        patterns.push({
          pattern: "competitors_outspending",
          dimensions: ["competitorContext", "metaAds"],
          severity: "medium",
          insight: `${competitorsWithAds.length} competitor(s) running Meta ads while you have none. Competitors are investing in paid visibility in your space.`
        });
      }
    }
  }

  // --- Email + CRO patterns ---
  if (!email?.formFound && cro?.analysis?.trustSignals?.length > 3) {
    patterns.push({
      pattern: "trust_without_capture",
      dimensions: ["emailAnalysis", "websiteCro"],
      severity: "medium",
      insight: "Good trust signals on site but no email capture. The 97% of visitors who don't convert immediately have no way to stay connected."
    });
  }

  // --- Tracking maturity + Ad spend ---
  const maturityLevel = tracking?.maturityScore?.level;
  if (maturityLevel && maturityLevel <= 2 && hasAds) {
    patterns.push({
      pattern: "immature_tracking_with_spend",
      dimensions: ["trackingAnalytics", "metaAds", "googleAds"],
      severity: "high",
      insight: `Analytics maturity is basic (Level ${maturityLevel}/5) but actively spending on ads. Cannot properly measure or optimize ad performance without mature tracking.`
    });
  }

  // --- MEO + CRO patterns ---
  const meo = results.meoAnalysis;
  if (meo?.overallMeoScore != null && meo.overallMeoScore < 30) {
    patterns.push({
      pattern: "invisible_to_ai",
      dimensions: ["meoAnalysis", "websiteCro"],
      severity: "high",
      insight: `MEO score is ${meo.overallMeoScore}/100 — content is poorly optimized for AI retrieval systems. As AI-powered search grows, this limits discoverability.`
    });
  }

  if (meo?.overallMeoScore > 70 && organicTraffic != null && organicTraffic > 2000) {
    patterns.push({
      pattern: "ai_ready_content",
      dimensions: ["meoAnalysis", "trafficAnalysis"],
      severity: "low",
      insight: `Strong MEO score (${meo.overallMeoScore}/100) paired with solid organic traffic. Well-positioned for AI-driven search.`
    });
  }

  // --- Agent-Native patterns ---
  const agentNative = results.agentNative;
  if (agentNative?.agentNativeScore != null && agentNative.agentNativeScore < 25) {
    patterns.push({
      pattern: "agent_invisible",
      dimensions: ["agentNative"],
      severity: "medium",
      insight: `Agent-Native score is ${agentNative.agentNativeScore}/100. The digital presence is largely inaccessible to AI agents, limiting automated discovery and integration.`
    });
  }

  if (agentNative?.agentNativeScore > 60 && meo?.overallMeoScore > 60) {
    patterns.push({
      pattern: "future_ready",
      dimensions: ["agentNative", "meoAnalysis"],
      severity: "low",
      insight: `Both Agent-Native (${agentNative.agentNativeScore}/100) and MEO (${meo.overallMeoScore}/100) scores are strong. Well-prepared for the AI-first future.`
    });
  }

  // --- B15: Bright Spots — positive pattern detection ---

  // strong_foundation: Has GA4 + GTM + decent CRO grade
  const hasGa4Pattern = tracking?.detected?.some((d: any) => d.name === "google_analytics_ga4");
  const hasGtmPattern = tracking?.detected?.some((d: any) => d.name === "google_tag_manager");
  if (hasAnalytics && hasGa4Pattern && hasGtmPattern) {
    const grade = overallGrade;
    if (grade && /^[ABC]/i.test(grade)) {
      patterns.push({
        pattern: "strong_foundation",
        dimensions: ["trackingAnalytics", "websiteCro"],
        severity: "low",
        insight: `Solid analytics foundation — GA4 and GTM in place with a ${grade} CRO grade`,
      });
    }
  }

  // content_momentum: Blog present + organic traffic
  const blogPresent = cro?.strategicAnalysis?.contentMarketing?.blogPresent;
  if (blogPresent && organicTraffic !== null && organicTraffic > 500) {
    patterns.push({
      pattern: "content_momentum",
      dimensions: ["websiteCro", "trafficAnalysis"],
      severity: "low",
      insight: "Content is driving organic growth",
    });
  }

  // ad_discipline: Winners > 0 in Meta or Google ads
  const metaWinners = metaAds?.adLongevity?.winners ?? 0;
  const googleWinners = googleAds?.adLongevity?.winners ?? 0;
  const totalWinners = metaWinners + googleWinners;
  if (totalWinners > 0) {
    patterns.push({
      pattern: "ad_discipline",
      dimensions: ["metaAds", "googleAds"],
      severity: "low",
      insight: `Ad program shows discipline — ${totalWinners} long-running winning creative${totalWinners > 1 ? "s" : ""}`,
    });
  }

  // email_ready: SPF + DKIM + DMARC all found
  if (email?.emailAuth?.spf?.found && email?.emailAuth?.dkim?.found && email?.emailAuth?.dmarc?.found) {
    patterns.push({
      pattern: "email_ready",
      dimensions: ["emailAnalysis"],
      severity: "low",
      insight: "Email infrastructure is production-ready (SPF + DKIM + DMARC)",
    });
  }

  // competitive_awareness: Runs ads AND competitors found
  if (hasAds && competitorList.length > 0) {
    patterns.push({
      pattern: "competitive_awareness",
      dimensions: ["metaAds", "googleAds", "competitorContext"],
      severity: "low",
      insight: "Competing actively in paid channels",
    });
  }

  // --- New cross-dimensional patterns (Wave 2) ---

  // content_without_distribution: Blog present but no traffic/social/email capture
  const contentPresence = results.contentPresence;
  const socialOrganic = results.socialOrganic;
  const blogPresent2 = contentPresence?.blogPresent ?? cro?.strategicAnalysis?.contentMarketing?.blogPresent;
  const hasSocialLinks = (socialOrganic?.activePlatforms ?? 0) > 0;
  if (blogPresent2 && organicTraffic !== null && organicTraffic < 500 && !hasSocialLinks && !email?.formFound) {
    patterns.push({
      pattern: "content_without_distribution",
      dimensions: ["contentPresence", "trafficAnalysis", "socialOrganic", "emailAnalysis"],
      severity: "high",
      insight: "Blog exists but no distribution — low organic traffic, no social links, no email capture. Content is being produced but nobody sees it.",
    });
  }

  // measurement_free_growth: 50+ employees with no analytics
  if (employeeCount && employeeCount >= 50 && !hasAnalytics && !hasConversionTracking) {
    patterns.push({
      pattern: "measurement_free_growth",
      dimensions: ["companyEnrichment", "trackingAnalytics"],
      severity: "critical",
      insight: `${employeeCount}+ employees but no analytics or conversion tracking detected. Growth decisions are being made without measurement.`,
    });
  }

  // competitor_outspending_on_content: Competitor has 10x more indexed pages
  if (competitorList.length > 0) {
    const competitorWithMoreContent = competitorList.find((c: any) =>
      c.traffic?.indexedPages != null &&
      (traffic as any)?.indexedPages != null &&
      c.traffic.indexedPages > (traffic as any).indexedPages * 10
    );
    if (competitorWithMoreContent) {
      patterns.push({
        pattern: "competitor_outspending_on_content",
        dimensions: ["competitorContext", "contentPresence"],
        severity: "high",
        insight: `A competitor has 10x more indexed pages — they're investing heavily in content while you're not.`,
      });
    }
  }

  // leaky_ad_funnel: Running ads but no email capture and no retargeting pixel
  const hasRetargetingPixel = tracking?.detected?.some((d: any) =>
    ["meta_pixel", "tiktok_pixel", "linkedin_insight", "twitter_pixel"].includes(d.name)
  );
  if (hasAds && !email?.formFound && !hasRetargetingPixel) {
    patterns.push({
      pattern: "leaky_ad_funnel",
      dimensions: ["metaAds", "googleAds", "emailAnalysis", "trackingAnalytics"],
      severity: "high",
      insight: "Running ads but no email capture and no retargeting pixel. Paid traffic visits once and is gone forever — no way to re-engage.",
    });
  }

  // authority_less_advertising: Running ads but no trust signals, low domain authority, no reviews
  const brandReputation = results.brandReputation;
  const hasReviewPresence = (brandReputation?.platformsWithPresence ?? 0) > 0;
  const trustSignalCount = cro?.analysis?.trustSignals?.length ?? 0;
  if (hasAds && trustSignalCount < 2 && !hasReviewPresence) {
    patterns.push({
      pattern: "authority_less_advertising",
      dimensions: ["metaAds", "googleAds", "websiteCro", "brandReputation"],
      severity: "high",
      insight: "Running ads but landing pages have minimal trust signals and no review platform presence. Ad spend drives clicks to pages that can't convert.",
    });
  }

  // seo_meo_misalignment: High organic traffic but low MEO score
  if (meo?.overallMeoScore != null && meo.overallMeoScore < 30 && organicTraffic != null && organicTraffic > 2000) {
    patterns.push({
      pattern: "seo_meo_misalignment",
      dimensions: ["meoAnalysis", "trafficAnalysis"],
      severity: "medium",
      insight: `Strong organic traffic (~${organicTraffic}/mo) but low MEO score (${meo.overallMeoScore}/100). Content ranks in Google but is invisible to AI search — a growing channel you're missing.`,
    });
  }

  // channel_concentration_risk: 80%+ branded traffic, no ads, no email
  const brandedPercent = (traffic as any)?.keywords?.brandedPercent;
  if (brandedPercent != null && brandedPercent > 80 && !hasAds && !email?.formFound) {
    patterns.push({
      pattern: "channel_concentration_risk",
      dimensions: ["trafficAnalysis", "metaAds", "emailAnalysis"],
      severity: "high",
      insight: `${brandedPercent}% of keyword traffic is branded — almost no non-branded organic visibility, no paid ads, and no email list. All growth depends on existing brand awareness.`,
    });
  }

  // enterprise_tools_startup_execution: Enterprise analytics but no custom events or pixels
  const hasEnterpriseAnalytics = tracking?.detected?.some((d: any) =>
    ["segment", "mixpanel", "amplitude", "heap", "fullstory"].includes(d.name)
  );
  if (hasEnterpriseAnalytics && !hasConversionTracking) {
    patterns.push({
      pattern: "enterprise_tools_startup_execution",
      dimensions: ["trackingAnalytics"],
      severity: "medium",
      insight: "Enterprise-grade analytics tools detected but no conversion tracking pixels. The measurement infrastructure is there but not being used for growth optimization.",
    });
  }

  // --- Root Cause: Traffic + Indexing patterns ---
  const contentData = results.contentPresence as any;

  // Sitemap coverage gap → explains low traffic
  if (organicTraffic !== null && organicTraffic < 500 && contentData) {
    const coverageSignal = contentData?.signals?.find((s: string) =>
      typeof s === "string" && s.includes("blog URLs but blog page links to")
    );
    if (coverageSignal) {
      patterns.push({
        pattern: "sitemap_coverage_gap",
        dimensions: ["contentPresence", "trafficAnalysis"],
        severity: "high",
        insight: `Low organic traffic (~${organicTraffic}/mo) may be caused by incomplete sitemap coverage. ${coverageSignal}. Search engines cannot index content they don't know about.`,
      });
    }
  }

  // Blog exists but traffic is near-zero
  const hasBlog = contentData?.blogPresent ?? cro?.strategicAnalysis?.contentMarketing?.blogPresent;
  if (hasBlog && organicTraffic !== null && organicTraffic < 200) {
    patterns.push({
      pattern: "content_without_discovery",
      dimensions: ["contentPresence", "trafficAnalysis"],
      severity: "medium",
      insight: `Blog content exists but estimated organic traffic is very low (~${organicTraffic}/mo). Check whether blog posts are in the sitemap, indexed by search engines, and targeting keywords with search volume.`,
    });
  }

  return patterns;
}

export interface MarketingMaturity {
  level: number; // 1-5
  label: string;
  factors: string[];
  breakdown: {
    tracking: number;      // 0-5
    team: number;          // 0-5
    content: number;       // 0-5
    ads: number;           // 0-5
    email: number;         // 0-5
    meo: number;           // 0-5
    agentNative: number;   // 0-5
    reputation: number;    // 0-5
    social: number;        // 0-5
    pricing: number;       // 0-5
  };
}

export function computeMarketingMaturity(results: PrimitiveResults): MarketingMaturity {
  const tracking = results.trackingAnalytics;
  const enrichment = results.companyEnrichment;
  const cro = results.websiteCro ?? results.websiteTechnical;
  const metaAds = results.metaAds;
  const googleAds = results.googleAds;
  const email = results.emailAnalysis;

  const factors: string[] = [];

  // Tracking sophistication (0-5)
  let trackingScore = 0;
  const maturityLevel = tracking?.maturityScore?.level;
  if (maturityLevel) {
    trackingScore = maturityLevel;
  } else {
    const detected = tracking?.detected ?? [];
    if (detected.some((d: any) => d.name === "google_analytics_ga4")) trackingScore += 2;
    if (detected.some((d: any) => d.name === "google_tag_manager")) trackingScore += 1;
    if (detected.some((d: any) => ["hotjar", "microsoft_clarity", "fullstory", "heap"].includes(d.name))) trackingScore += 1;
    if (detected.some((d: any) => ["segment", "mixpanel", "amplitude"].includes(d.name))) trackingScore += 1;
  }
  factors.push(`Tracking: ${trackingScore}/5`);

  // Team size proxy (0-5)
  let teamScore = 0;
  const employeeCount = enrichment?.company?.employeeCount;
  if (employeeCount) {
    if (employeeCount >= 200) teamScore = 5;
    else if (employeeCount >= 50) teamScore = 4;
    else if (employeeCount >= 20) teamScore = 3;
    else if (employeeCount >= 5) teamScore = 2;
    else teamScore = 1;
  }
  factors.push(`Team: ${teamScore}/5`);

  // Content investment (0-5)
  let contentScore = 0;
  const strategic = cro?.strategicAnalysis;
  if (strategic?.contentMarketing?.blogPresent) contentScore += 2;
  if (strategic?.contentMarketing?.newsletterSignup) contentScore += 1;
  if (strategic?.contentMarketing?.leadMagnets?.length > 0) contentScore += 1;
  if (strategic?.contentMarketing?.lastPostDate) contentScore += 1;
  factors.push(`Content: ${contentScore}/5`);

  // Ad activity (0-5)
  let adsScore = 0;
  if (metaAds?.activeAdCount > 0) adsScore += 2;
  if (googleAds?.activeAdCount > 0) adsScore += 2;
  if ((metaAds?.adLongevity?.winners ?? 0) > 0 || (googleAds?.adLongevity?.winners ?? 0) > 0) adsScore += 1;
  adsScore = Math.min(adsScore, 5);
  factors.push(`Ads: ${adsScore}/5`);

  // Email sophistication (0-5)
  let emailScore = 0;
  if (email?.formFound) emailScore += 1;
  if (email?.platformDetected) emailScore += 1;
  if (email?.emailAuth?.spf?.found) emailScore += 1;
  if (email?.emailAuth?.dmarc?.found) emailScore += 1;
  if (email?.emailAuth?.dmarc?.policy === "reject" || email?.emailAuth?.dmarc?.policy === "quarantine") emailScore += 1;
  factors.push(`Email: ${emailScore}/5`);

  // MEO sophistication (0-5)
  let meoScore = 0;
  const meo = results.meoAnalysis;
  if (meo?.overallMeoScore != null) {
    if (meo.overallMeoScore >= 80) meoScore = 5;
    else if (meo.overallMeoScore >= 60) meoScore = 4;
    else if (meo.overallMeoScore >= 40) meoScore = 3;
    else if (meo.overallMeoScore >= 20) meoScore = 2;
    else meoScore = 1;
  }
  factors.push(`MEO: ${meoScore}/5`);

  // Agent-Native readiness (0-5)
  let agentNativeScore = 0;
  const an = results.agentNative;
  if (an?.agentNativeScore != null) {
    if (an.agentNativeScore >= 80) agentNativeScore = 5;
    else if (an.agentNativeScore >= 60) agentNativeScore = 4;
    else if (an.agentNativeScore >= 40) agentNativeScore = 3;
    else if (an.agentNativeScore >= 20) agentNativeScore = 2;
    else agentNativeScore = 1;
  }
  factors.push(`Agent-Native: ${agentNativeScore}/5`);

  // Reputation (0-5)
  let reputationScore = 0;
  const reputation = results.brandReputation;
  if (reputation?.platformsWithPresence != null) {
    reputationScore = Math.min(reputation.platformsWithPresence + 1, 5);
  }
  factors.push(`Reputation: ${reputationScore}/5`);

  // Social presence (0-5)
  let socialScore = 0;
  const social = results.socialOrganic;
  if (social?.activePlatforms != null) {
    if (social.activePlatforms >= 4) socialScore = 5;
    else if (social.activePlatforms >= 3) socialScore = 4;
    else if (social.activePlatforms >= 2) socialScore = 3;
    else if (social.activePlatforms >= 1) socialScore = 2;
    if (social.openGraph?.image) socialScore = Math.min(socialScore + 1, 5);
  }
  factors.push(`Social: ${socialScore}/5`);

  // Pricing (0-5)
  let pricingScore = 0;
  const pricing = results.pricingMonetization;
  if (pricing?.pricingPageFound) {
    pricingScore += 2;
    if (pricing.riskReversal?.freeTrial) pricingScore += 1;
    if (pricing.featureComparison) pricingScore += 1;
    if (pricing.analysis?.overallRating === "strong") pricingScore += 1;
    pricingScore = Math.min(pricingScore, 5);
  }
  factors.push(`Pricing: ${pricingScore}/5`);

  // Overall: average only dimensions that actually have data (prevents deflation
  // when optional primitives like reputation/social/pricing didn't run)
  const scores = [trackingScore, teamScore, contentScore, adsScore, emailScore];
  if (meo?.overallMeoScore != null) scores.push(meoScore);
  if (an?.agentNativeScore != null) scores.push(agentNativeScore);
  if (reputation?.platformsWithPresence != null) scores.push(reputationScore);
  if (social?.activePlatforms != null) scores.push(socialScore);
  if (pricing?.pricingPageFound) scores.push(pricingScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  let level: number;
  let label: string;
  if (avg >= 4) { level = 5; label = "Enterprise"; }
  else if (avg >= 3) { level = 4; label = "Advanced"; }
  else if (avg >= 2) { level = 3; label = "Intermediate"; }
  else if (avg >= 1) { level = 2; label = "Foundational"; }
  else { level = 1; label = "Nascent"; }

  return {
    level,
    label,
    factors,
    breakdown: {
      tracking: trackingScore,
      team: teamScore,
      content: contentScore,
      ads: adsScore,
      email: emailScore,
      meo: meoScore,
      agentNative: agentNativeScore,
      reputation: reputationScore,
      social: socialScore,
      pricing: pricingScore,
    },
  };
}

export function buildIndustryContext(enrichmentData: any): string | null {
  if (!enrichmentData?.company) return null;

  const company = enrichmentData.company;
  const parts: string[] = [];

  if (company.industry) parts.push(`Industry: ${company.industry}`);
  if (company.employeeCount) parts.push(`Team size: ~${company.employeeCount} employees`);
  if (company.estimatedRevenue) parts.push(`Estimated revenue: ${company.estimatedRevenue}`);
  if (company.foundedYear) parts.push(`Founded: ${company.foundedYear}`);
  if (company.funding?.totalFunding) parts.push(`Total funding: $${(company.funding.totalFunding / 1_000_000).toFixed(1)}M`);

  if (parts.length === 0) return null;

  return `COMPANY CONTEXT: ${parts.join(" | ")}

Use this context to calibrate your findings. A 50-person SaaS company with $5M ARR should have different expectations than a 5-person agency. Set benchmarks relative to their industry, size, and stage.`;
}
