const BASE_URL = "https://api.peopledatalabs.com/v5";

function getApiKey(): string {
  const key = process.env.PDL_API_KEY;
  if (!key) throw new Error("PDL_API_KEY not set");
  return key;
}

export interface PersonEnrichment {
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  company: string | null;
  industry: string | null;
  linkedinUrl: string | null;
  location: string | null;
  skills: string[];
}

export async function enrichPerson(params: {
  linkedinUrl?: string;
  email?: string;
  name?: string;
  company?: string;
}): Promise<PersonEnrichment> {
  const queryParams: Record<string, string> = {};
  if (params.linkedinUrl) queryParams.profile = params.linkedinUrl;
  if (params.email) queryParams.email = params.email;
  if (params.name) queryParams.name = params.name;
  if (params.company) queryParams.company = params.company;

  const qs = new URLSearchParams(queryParams);
  const response = await fetch(`${BASE_URL}/person/enrich?${qs}`, {
    headers: { "X-Api-Key": getApiKey() },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        fullName: null,
        firstName: null,
        lastName: null,
        title: null,
        company: null,
        industry: null,
        linkedinUrl: null,
        location: null,
        skills: [],
      };
    }
    const text = await response.text();
    throw new Error(`PDL enrich failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as any;

  return {
    fullName: data.full_name ?? null,
    firstName: data.first_name ?? null,
    lastName: data.last_name ?? null,
    title: data.job_title ?? null,
    company: data.job_company_name ?? null,
    industry: data.industry ?? null,
    linkedinUrl: data.linkedin_url ?? null,
    location: data.location_name ?? null,
    skills: data.skills ?? [],
  };
}

export interface PeopleSearchResult {
  fullName: string;
  title: string | null;
  company: string | null;
  linkedinUrl: string | null;
}

export async function searchPeople(query: {
  companyDomain?: string;
  titles?: string[];
  limit?: number;
}): Promise<PeopleSearchResult[]> {
  const esQuery: any = { bool: { must: [] } };

  if (query.companyDomain) {
    esQuery.bool.must.push({
      term: { "job_company_website": query.companyDomain },
    });
  }

  if (query.titles && query.titles.length > 0) {
    esQuery.bool.must.push({
      bool: {
        should: query.titles.map((t) => ({
          match: { job_title: t },
        })),
      },
    });
  }

  const response = await fetch(`${BASE_URL}/person/search`, {
    method: "POST",
    headers: {
      "X-Api-Key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: esQuery,
      size: query.limit ?? 5,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PDL search failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as any;
  return (data.data ?? []).map((p: any) => ({
    fullName: p.full_name ?? "",
    title: p.job_title ?? null,
    company: p.job_company_name ?? null,
    linkedinUrl: p.linkedin_url ?? null,
  }));
}
