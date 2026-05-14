/**
 * Shared email authentication checks (SPF, DKIM, DMARC, BIMI, MX).
 * Used by email-analysis primitive and competitor-context for comparison.
 */

import dns from "node:dns/promises";

export interface EmailAuthResult {
  spf: { found: boolean; record: string | null; policy: string | null };
  dkim: { found: boolean; selectors: string[] };
  dmarc: { found: boolean; record: string | null; policy: string | null };
  bimi: { found: boolean };
  mx: { found: boolean; provider: string | null; records: string[] };
}

export async function checkEmailAuthentication(domain: string): Promise<EmailAuthResult> {
  // SPF check
  let spf: EmailAuthResult["spf"] = { found: false, record: null, policy: null };
  try {
    const txtRecords = await dns.resolveTxt(domain);
    for (const record of txtRecords) {
      const joined = record.join("");
      if (joined.startsWith("v=spf1")) {
        spf = { found: true, record: joined, policy: joined };
        break;
      }
    }
  } catch {
    // No TXT records or DNS failure
  }

  // DKIM check — try common selectors
  const dkimSelectors = [
    ...new Set([
      "google", "selector1", "selector2", "default", "k1",
      "mandrill", "mailchimp", "sendgrid", "amazonses", "ses",
      "postmark", "sparkpost", "mailgun", "klaviyo", "cm",
      "dkim", "mail", "email", "mxvault",
    ]),
  ];
  const foundSelectors: string[] = [];
  for (const selector of dkimSelectors) {
    try {
      await dns.resolveTxt(`${selector}._domainkey.${domain}`);
      foundSelectors.push(selector);
    } catch {
      // Selector not found
    }
  }
  const dkim: EmailAuthResult["dkim"] = {
    found: foundSelectors.length > 0,
    selectors: foundSelectors,
  };

  // DMARC check
  let dmarc: EmailAuthResult["dmarc"] = { found: false, record: null, policy: null };
  try {
    const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
    for (const record of dmarcRecords) {
      const joined = record.join("");
      if (joined.includes("v=DMARC1")) {
        const policyMatch = joined.match(/;\s*p\s*=\s*(none|quarantine|reject)/i);
        dmarc = {
          found: true,
          record: joined,
          policy: policyMatch ? policyMatch[1].toLowerCase() : null,
        };
        break;
      }
    }
  } catch {
    // No DMARC record
  }

  // BIMI check
  let bimi: EmailAuthResult["bimi"] = { found: false };
  try {
    const bimiRecords = await dns.resolveTxt(`default._bimi.${domain}`);
    for (const record of bimiRecords) {
      const joined = record.join("");
      if (joined.includes("v=BIMI1")) {
        bimi = { found: true };
        break;
      }
    }
  } catch {
    // No BIMI record
  }

  // MX check
  let mx: EmailAuthResult["mx"] = { found: false, provider: null, records: [] };
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords.length > 0) {
      const exchanges = mxRecords.map((r) => r.exchange.toLowerCase());
      let provider: string | null = null;
      if (exchanges.some((e) => e.includes("google") || e.includes("aspmx.l.google.com") || e.includes("googlemail.com"))) {
        provider = "Google Workspace";
      } else if (exchanges.some((e) => e.includes("outlook.com") || e.includes("microsoft.com"))) {
        provider = "Microsoft 365";
      }
      mx = { found: true, provider, records: exchanges };
    }
  } catch {
    // No MX records
  }

  return { spf, dkim, dmarc, bimi, mx };
}
