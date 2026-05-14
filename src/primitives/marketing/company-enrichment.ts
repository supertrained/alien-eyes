import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import {
  enrichCompany,
  findContacts,
  type CompanyEnrichment,
  type Contact,
} from "@marketing/apollo";
import {
  searchPeople,
  type PeopleSearchResult,
} from "@marketing/pdl";
import { absenceSignal } from "@marketing/signal-builder";

/** Simple normalized name similarity (0-1) for cross-validation. */
function nameSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(inc|llc|ltd|corp|co)$/g, "");
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  // Check if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  // Simple character overlap
  const chars = new Set(na.split(""));
  let overlap = 0;
  for (const c of nb.split("")) if (chars.has(c)) overlap++;
  return overlap / Math.max(na.length, nb.length);
}

export interface CompanyEnrichmentData {
  company: CompanyEnrichment;
  contactSummary: {
    contactCount: number;
    seniorityDistribution: Record<string, number>;
    departmentDistribution: Record<string, number>;
    hasMarketingLeader: boolean;
  };
  pdlContactCount: number;
  signals: string[];
  match_confidence: "high" | "medium" | "low" | "none";
}

export async function runCompanyEnrichment(
  domain: string,
  observationOnly = false
): Promise<Envelope<CompanyEnrichmentData | null>> {
  const startTime = Date.now();
  const primitive = "company_enrichment";

  try {
    // Early return when Apollo key not configured — prevents 3 wasted exception round-trips
    if (!process.env.APOLLO_API_KEY) {
      return createEnvelope<CompanyEnrichmentData | null>(primitive, startTime, null, {
        confidence: 0.1,
        confidenceFactors: ["Apollo API key not configured — company enrichment skipped"],
      });
    }

    // Run Apollo company enrichment always; contacts only with deep analysis
    const [company, contacts, pdlContacts] = await Promise.all([
      enrichCompany(domain).catch(
        (): CompanyEnrichment => ({
          name: null,
          domain,
          industry: null,
          subIndustry: null,
          employeeCount: null,
          estimatedRevenue: null,
          foundedYear: null,
          description: null,
          linkedinUrl: null,
          facebookUrl: null,
          twitterUrl: null,
          technologies: [],
          keywords: [],
          legalName: null,
          parentCompany: null,
          alternateNames: [],
          city: null,
          state: null,
          country: null,
        })
      ),
      observationOnly
        ? Promise.resolve([] as Contact[])
        : findContacts(domain).catch((): Contact[] => []),
      observationOnly
        ? Promise.resolve([] as PeopleSearchResult[])
        : searchPeople({ companyDomain: domain, limit: 5 }).catch(
            (): PeopleSearchResult[] => []
          ),
    ]);

    const signals: string[] = [];
    const confidenceFactors: string[] = [];
    let matchConfidence: "high" | "medium" | "low" | "none" = "none";

    // Cross-validate returned domain against input domain
    if (company.domain && company.domain.replace(/^www\./, "") !== domain.replace(/^www\./, "")) {
      confidenceFactors.push(
        `Domain mismatch: queried "${domain}" but Apollo returned "${company.domain}"`
      );
      signals.push(
        `Company data may not match — Apollo returned data for "${company.domain}" instead of "${domain}". Verify manually.`
      );
      matchConfidence = "low";
    }

    // Cross-validate company name between Apollo and PDL
    if (company.name && pdlContacts.length > 0) {
      const pdlCompanyName = (pdlContacts[0] as unknown as Record<string, unknown>)?.company_name as string | undefined;
      if (pdlCompanyName && company.name) {
        const similarity = nameSimilarity(company.name, pdlCompanyName);
        if (similarity < 0.5) {
          confidenceFactors.push(
            `Low match: Apollo="${company.name}" vs PDL="${pdlCompanyName}" (${(similarity * 100).toFixed(0)}%)`
          );
          signals.push(
            `Company match uncertain: Apollo says "${company.name}", PDL says "${pdlCompanyName}" — verify manually`
          );
          if (matchConfidence !== "low") matchConfidence = "medium";
        } else {
          confidenceFactors.push("Apollo and PDL company names match");
          if (matchConfidence === "none") matchConfidence = "high";
        }
      }
    }

    if (company.name) {
      confidenceFactors.push("Apollo company data found");
      if (matchConfidence === "none") matchConfidence = "medium";
    } else {
      confidenceFactors.push("No Apollo company data");
      signals.push("Company not found in Apollo — may be very small or new");
      matchConfidence = "low";
    }

    if (company.employeeCount !== null) {
      if (company.employeeCount < 10) {
        signals.push(`Very small team (~${company.employeeCount} employees) — likely no dedicated marketing`);
      } else if (company.employeeCount < 50) {
        signals.push(`Small team (~${company.employeeCount} employees) — marketing may be one person or outsourced`);
      }
    }

    if (contacts.length > 0) {
      confidenceFactors.push(`${contacts.length} marketing contacts found`);
      const hasMarketing = contacts.some(
        (c) => /market|growth|demand|brand/i.test(c.title)
      );
      if (!hasMarketing) {
        signals.push(absenceSignal("a dedicated marketing leader", { checked: ["Apollo contacts database"], method: "API query", coverage: "external_api" }, "growth may lack strategic direction"));
      }
    } else if (pdlContacts.length > 0) {
      confidenceFactors.push(`${pdlContacts.length} contacts found via PDL`);
    } else {
      confidenceFactors.push("No contacts found");
      signals.push("Could not find marketing decision-makers");
    }

    if (company.technologies.length > 0) {
      signals.push(`Tech stack: ${company.technologies.slice(0, 5).join(", ")}`);
    }

    const confidence =
      company.name !== null
        ? contacts.length > 0 ? 0.85 : 0.65
        : 0.3;

    // Strip PII: replace individual contact details with aggregated summary
    const contactSummary: CompanyEnrichmentData["contactSummary"] = {
      contactCount: contacts.length,
      seniorityDistribution: {} as Record<string, number>,
      departmentDistribution: {} as Record<string, number>,
      hasMarketingLeader: contacts.some(c => /market|growth|demand|brand/i.test(c.title)),
    };

    for (const c of contacts) {
      const title = (c.title ?? '').toLowerCase();
      if (title.includes('vp') || title.includes('director') || title.includes('head')) {
        contactSummary.seniorityDistribution['senior'] = (contactSummary.seniorityDistribution['senior'] ?? 0) + 1;
      } else if (title.includes('manager')) {
        contactSummary.seniorityDistribution['mid'] = (contactSummary.seniorityDistribution['mid'] ?? 0) + 1;
      } else {
        contactSummary.seniorityDistribution['other'] = (contactSummary.seniorityDistribution['other'] ?? 0) + 1;
      }

      if (/market|growth|demand|brand/i.test(title)) {
        contactSummary.departmentDistribution['marketing'] = (contactSummary.departmentDistribution['marketing'] ?? 0) + 1;
      } else if (/sales|business dev/i.test(title)) {
        contactSummary.departmentDistribution['sales'] = (contactSummary.departmentDistribution['sales'] ?? 0) + 1;
      } else {
        contactSummary.departmentDistribution['other'] = (contactSummary.departmentDistribution['other'] ?? 0) + 1;
      }
    }

    return createEnvelope<CompanyEnrichmentData>(primitive, startTime, {
      company,
      contactSummary,
      pdlContactCount: pdlContacts.length,
      signals,
      match_confidence: matchConfidence,
    }, {
      confidence,
      confidenceFactors,
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
