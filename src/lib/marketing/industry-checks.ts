import { safeFetch } from "./safe-fetch";

export type BusinessSegment = "saas" | "ecommerce" | "local_business" | "professional_services" | "media" | "other";

export interface IndustrySignal {
  signal: string;
  found: boolean;
  category: string;
  importance: "high" | "medium" | "low";
}

export interface IndustryCheckResult {
  segment: BusinessSegment;
  signals: IndustrySignal[];
  recommendations: string[];
}

/** URL existence check via HEAD request (with safeFetch for SSRF protection) */
async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await safeFetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Check multiple paths and return first that exists */
async function findFirstExistingPath(origin: string, paths: string[]): Promise<string | null> {
  const results = await Promise.all(
    paths.map(async (path) => ({ path, exists: await urlExists(`${origin}${path}`) }))
  );
  return results.find(r => r.exists)?.path ?? null;
}

// ---- SaaS-specific checks ----
async function saasChecks(origin: string, html: string): Promise<IndustrySignal[]> {
  const signals: IndustrySignal[] = [];

  // Trial/demo funnel pages
  const trialPage = await findFirstExistingPath(origin, ["/trial", "/free-trial", "/start", "/signup", "/get-started", "/demo", "/request-demo"]);
  signals.push({
    signal: trialPage ? `Trial/demo page found at ${trialPage}` : "No trial or demo page found — potential conversion barrier for SaaS",
    found: !!trialPage,
    category: "conversion",
    importance: "high",
  });

  // Comparison/alternative pages (strong SEO signal for SaaS)
  const comparisonPage = await findFirstExistingPath(origin, ["/vs", "/compare", "/alternatives", "/comparison"]);
  signals.push({
    signal: comparisonPage ? `Comparison page found at ${comparisonPage}` : "No comparison pages — missing competitive SEO opportunity for SaaS",
    found: !!comparisonPage,
    category: "seo",
    importance: "medium",
  });

  // Documentation / developer hub
  const docsPage = await findFirstExistingPath(origin, ["/docs", "/documentation", "/developers", "/api-docs", "/api"]);
  signals.push({
    signal: docsPage ? `Documentation found at ${docsPage}` : "No public documentation found",
    found: !!docsPage,
    category: "product",
    importance: "medium",
  });

  // Product-led growth signals in HTML
  const hasPricingToggle = /annual|monthly|yearly|billing.*period/i.test(html);
  signals.push({
    signal: hasPricingToggle ? "Annual/monthly pricing toggle detected — product-led growth signal" : "No billing period toggle on pricing page",
    found: hasPricingToggle,
    category: "pricing",
    importance: "low",
  });

  // Integration/marketplace pages
  const integrationsPage = await findFirstExistingPath(origin, ["/integrations", "/marketplace", "/apps", "/plugins", "/extensions"]);
  signals.push({
    signal: integrationsPage ? `Integrations page found at ${integrationsPage}` : "No integrations/marketplace page — potential partner channel gap for SaaS",
    found: !!integrationsPage,
    category: "product",
    importance: "medium",
  });

  return signals;
}

// ---- E-commerce-specific checks ----
async function ecommerceChecks(origin: string, html: string): Promise<IndustrySignal[]> {
  const signals: IndustrySignal[] = [];

  // Product schema markup
  const hasProductSchema = /\"@type\"\s*:\s*\"Product\"/i.test(html) || /itemtype.*schema\.org\/Product/i.test(html);
  signals.push({
    signal: hasProductSchema ? "Product schema markup detected — good for rich snippets" : "No Product schema markup — missing rich snippet opportunity for e-commerce",
    found: hasProductSchema,
    category: "seo",
    importance: "high",
  });

  // Review widgets
  const hasReviewWidget = /yotpo|judge\.me|stamped\.io|loox|reviewscouk|trustpilot.*widget|bazaarvoice/i.test(html);
  signals.push({
    signal: hasReviewWidget ? "Product review widget detected" : "No product review widget found — social proof gap for e-commerce",
    found: hasReviewWidget,
    category: "trust",
    importance: "high",
  });

  // Cart recovery / abandoned cart signals
  const hasCartRecovery = /klaviyo.*abandoned|cart.*recovery|cartrecover|rejoiner|jilt|recart/i.test(html);
  signals.push({
    signal: hasCartRecovery ? "Cart recovery/abandonment tool detected" : "No cart recovery tool detected — up to 70% of carts are abandoned in e-commerce",
    found: hasCartRecovery,
    category: "conversion",
    importance: "high",
  });

  // Product feed presence
  const productFeed = await findFirstExistingPath(origin, ["/products.json", "/feed/products", "/product-feed.xml"]);
  signals.push({
    signal: productFeed ? `Product feed found at ${productFeed}` : "No product feed detected — limits Google Shopping and Meta catalog ads",
    found: !!productFeed,
    category: "ads",
    importance: "medium",
  });

  // Wishlist/save functionality
  const hasWishlist = /wishlist|save.*for.*later|favorites/i.test(html);
  signals.push({
    signal: hasWishlist ? "Wishlist/save functionality detected" : "No wishlist functionality detected",
    found: hasWishlist,
    category: "conversion",
    importance: "low",
  });

  return signals;
}

// ---- Local business-specific checks ----
async function localBusinessChecks(origin: string, html: string): Promise<IndustrySignal[]> {
  const signals: IndustrySignal[] = [];

  // Service area pages
  const serviceAreaPage = await findFirstExistingPath(origin, ["/service-area", "/service-areas", "/locations", "/areas-we-serve"]);
  signals.push({
    signal: serviceAreaPage ? `Service area page found at ${serviceAreaPage}` : "No service area pages — missing local SEO opportunity",
    found: !!serviceAreaPage,
    category: "seo",
    importance: "high",
  });

  // Local business schema
  const hasLocalSchema = /\"@type\"\s*:\s*\"(LocalBusiness|Restaurant|Store|AutoRepair|MedicalBusiness|LegalService|FinancialService|RealEstateAgent)/i.test(html);
  signals.push({
    signal: hasLocalSchema ? "Local Business schema markup detected" : "No Local Business schema — missing Google Business Profile rich results",
    found: hasLocalSchema,
    category: "seo",
    importance: "high",
  });

  // Appointment/booking widgets
  const hasBooking = /calendly|acuityscheduling|simplybook|booksy|setmore|square.*appointments|housecall/i.test(html);
  signals.push({
    signal: hasBooking ? "Online booking/appointment widget detected" : "No online booking widget — friction for service-based local businesses",
    found: hasBooking,
    category: "conversion",
    importance: "high",
  });

  // Google Maps embed
  const hasMap = /google.*maps.*embed|maps\.googleapis|maps\.google/i.test(html);
  signals.push({
    signal: hasMap ? "Google Maps embed detected" : "No Google Maps embed — local businesses benefit from map visibility",
    found: hasMap,
    category: "trust",
    importance: "medium",
  });

  // NAP consistency (Name, Address, Phone in footer/header)
  const hasPhone = /tel:|phone|call.*us/i.test(html);
  const hasAddress = /\d+\s+\w+\s+(street|st|avenue|ave|road|rd|blvd|drive|dr|lane|ln|way|court|ct)\b/i.test(html);
  signals.push({
    signal: hasPhone && hasAddress ? "Phone and address visible on page — good NAP consistency" : `Missing ${!hasPhone ? "phone number" : ""}${!hasPhone && !hasAddress ? " and " : ""}${!hasAddress ? "physical address" : ""} on page`,
    found: hasPhone && hasAddress,
    category: "trust",
    importance: "medium",
  });

  return signals;
}

// ---- Professional services-specific checks ----
async function professionalServicesChecks(origin: string, html: string): Promise<IndustrySignal[]> {
  const signals: IndustrySignal[] = [];

  // Case studies
  const caseStudyPage = await findFirstExistingPath(origin, ["/case-studies", "/case-study", "/success-stories", "/results", "/portfolio", "/work"]);
  signals.push({
    signal: caseStudyPage ? `Case study page found at ${caseStudyPage}` : "No case study page — missing trust signal for professional services",
    found: !!caseStudyPage,
    category: "trust",
    importance: "high",
  });

  // Team/about page
  const teamPage = await findFirstExistingPath(origin, ["/team", "/about", "/about-us", "/our-team"]);
  signals.push({
    signal: teamPage ? `Team page found at ${teamPage}` : "No team page found",
    found: !!teamPage,
    category: "trust",
    importance: "medium",
  });

  // Credentialing/certification signals
  const hasCertifications = /certified|accredited|certification|credential|licensed|registered|member of|affiliated with/i.test(html);
  signals.push({
    signal: hasCertifications ? "Professional credentials/certifications mentioned" : "No visible professional credentials — trust gap for professional services",
    found: hasCertifications,
    category: "trust",
    importance: "medium",
  });

  // Thought leadership signals
  const hasThoughtLeadership = /webinar|podcast|whitepaper|white paper|research report|industry report|speaking/i.test(html);
  signals.push({
    signal: hasThoughtLeadership ? "Thought leadership content detected (webinars, whitepapers, etc.)" : "No thought leadership content visible",
    found: hasThoughtLeadership,
    category: "authority",
    importance: "medium",
  });

  // Consultation/discovery call
  const hasConsultation = /free.*consult|discovery.*call|book.*call|schedule.*meeting|strategy.*session/i.test(html);
  signals.push({
    signal: hasConsultation ? "Free consultation/discovery call CTA found" : "No consultation CTA — professional services benefit from low-friction entry",
    found: hasConsultation,
    category: "conversion",
    importance: "high",
  });

  return signals;
}

/**
 * Run industry-specific checks based on detected business segment.
 * Returns segment-specific signals and recommendations.
 */
export async function getIndustryChecks(
  segment: BusinessSegment,
  domain: string,
  html: string
): Promise<IndustryCheckResult> {
  const origin = `https://${domain}`;
  let signals: IndustrySignal[] = [];

  switch (segment) {
    case "saas":
      signals = await saasChecks(origin, html);
      break;
    case "ecommerce":
      signals = await ecommerceChecks(origin, html);
      break;
    case "local_business":
      signals = await localBusinessChecks(origin, html);
      break;
    case "professional_services":
      signals = await professionalServicesChecks(origin, html);
      break;
    case "media":
      // Media-specific: RSS, syndication, ad network presence
      signals = []; // Minimal for now — media shares signals with content_presence
      break;
    default:
      signals = [];
  }

  // Generate recommendations from unfound signals
  const recommendations = signals
    .filter(s => !s.found && s.importance !== "low")
    .map(s => s.signal);

  return { segment, signals, recommendations };
}
