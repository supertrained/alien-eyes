import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Check whether a domain has opted out of scanning. */
export async function isDomainOptedOut(domain: string): Promise<boolean> {
  const normalized = domain.replace(/^www\./, "").toLowerCase();

  const { data } = await supabase
    .from("scan_optouts")
    .select("id")
    .eq("domain", normalized)
    .limit(1)
    .single();

  return !!data;
}
