const BASE_URL = "https://api.apollo.io/api/v1";

function getApiKey(): string {
  const key = process.env.APOLLO_API_KEY;
  if (!key) throw new Error("APOLLO_API_KEY not set");
  return key;
}

export interface CompanyEnrichment {
  name: string | null;
  domain: string;
  industry: string | null;
  subIndustry: string | null;
  employeeCount: number | null;
  estimatedRevenue: string | null;
  foundedYear: number | null;
  description: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  technologies: string[];
  keywords: string[];
  legalName: string | null;
  parentCompany: string | null;
  alternateNames: string[];
  city: string | null;
  state: string | null;
  country: string | null;
}

export async function enrichCompany(domain: string): Promise<CompanyEnrichment> {
  const params = new URLSearchParams({ domain });
  const response = await fetch(
    `${BASE_URL}/organizations/enrich?${params}`,
    {
      headers: { "X-Api-Key": getApiKey() },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apollo enrich failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as any;
  const org = data.organization;

  if (!org) {
    return {
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
    };
  }

  // Build alternate names from available fields (for multi-strategy ad search)
  const alternateNames: string[] = [];
  if (org.dba_name) alternateNames.push(org.dba_name);
  if (org.alternate_name) alternateNames.push(org.alternate_name);

  return {
    name: org.name ?? null,
    domain,
    industry: org.industry ?? null,
    subIndustry: org.sub_industry ?? null,
    employeeCount: org.estimated_num_employees ?? null,
    estimatedRevenue: org.annual_revenue_printed ?? null,
    foundedYear: org.founded_year ?? null,
    description: org.short_description ?? null,
    linkedinUrl: org.linkedin_url ?? null,
    facebookUrl: org.facebook_url ?? null,
    twitterUrl: org.twitter_url ?? null,
    technologies: org.current_technologies?.map((t: any) => t.name) ?? [],
    keywords: Array.isArray(org.keywords) ? org.keywords : [],
    legalName: org.legal_name ?? null,
    parentCompany: org.parent_account_name ?? null,
    alternateNames,
    city: org.city ?? null,
    state: org.state ?? null,
    country: org.country ?? null,
  };
}

export interface Contact {
  name: string;
  title: string;
  email: string | null;
  linkedinUrl: string | null;
  seniority: string | null;
}

export async function findContacts(
  domain: string,
  titles?: string[]
): Promise<Contact[]> {
  const body: any = {
    q_organization_domains: domain,
    page: 1,
    per_page: 10,
  };

  if (titles && titles.length > 0) {
    body.person_titles = titles;
  } else {
    body.person_titles = [
      "CMO",
      "VP Marketing",
      "Head of Marketing",
      "Director of Marketing",
      "Chief Marketing Officer",
      "Head of Growth",
      "VP Growth",
    ];
  }

  const response = await fetch(`${BASE_URL}/mixed_people/search`, {
    method: "POST",
    headers: {
      "X-Api-Key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apollo contacts failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as any;
  const people = data.people ?? [];

  return people.map((p: any) => ({
    name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
    title: p.title ?? "",
    email: p.email ?? null,
    linkedinUrl: p.linkedin_url ?? null,
    seniority: p.seniority ?? null,
  }));
}
