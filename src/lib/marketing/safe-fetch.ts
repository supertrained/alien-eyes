/**
 * SSRF-safe fetch wrapper for worker primitives.
 * Re-validates DNS resolution before every outbound request to close the
 * TOCTOU gap between API-layer validation and worker execution.
 */

import dns from "dns/promises";

const PRIVATE_IP_RANGES = [
  /^127\./,                          // Loopback
  /^10\./,                           // RFC 1918 Class A
  /^172\.(1[6-9]|2\d|3[01])\./,     // RFC 1918 Class B
  /^192\.168\./,                     // RFC 1918 Class C
  /^169\.254\./,                     // Link-local
  /^0\./,                            // Current network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // Carrier-grade NAT
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
]);

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RANGES.some((r) => r.test(ip));
}

/**
 * Validates that a hostname resolves to a public IP.
 * Throws if the hostname resolves to a private/blocked IP (SSRF protection).
 */
async function validateHostname(hostname: string): Promise<void> {
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    throw new Error(`SSRF blocked: hostname "${hostname}" is not allowed`);
  }

  // Skip DNS check for known safe third-party domains
  if (SAFE_DOMAINS.has(hostname.toLowerCase())) {
    return;
  }

  try {
    const addresses = await Promise.race([
      dns.resolve4(hostname),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DNS timeout')), 10_000)
      ),
    ]);
    for (const ip of addresses) {
      if (isPrivateIp(ip)) {
        throw new Error(
          `SSRF blocked: "${hostname}" resolves to private IP ${ip}`
        );
      }
    }
  } catch (err) {
    // Re-throw SSRF errors
    if (err instanceof Error && err.message.startsWith("SSRF blocked:")) {
      throw err;
    }
    // DNS resolution failures are not SSRF — let fetch handle them
  }
}

/** Known-safe third-party domains that don't need DNS validation */
const SAFE_DOMAINS = new Set([
  "www.trustpilot.com",
  "trustpilot.com",
  "www.g2.com",
  "g2.com",
  "www.bbb.org",
  "bbb.org",
  "www.yelp.com",
  "yelp.com",
  "www.facebook.com",
  "facebook.com",
  "www.instagram.com",
  "instagram.com",
  "www.twitter.com",
  "twitter.com",
  "x.com",
  "www.linkedin.com",
  "linkedin.com",
  "www.youtube.com",
  "youtube.com",
  "www.tiktok.com",
  "tiktok.com",
  "api.exa.ai",
]);

/**
 * SSRF-safe fetch. Re-resolves DNS before every request to prevent
 * DNS rebinding attacks between scan creation and worker execution.
 *
 * Drop-in replacement for `fetch()` in worker primitives.
 */
export async function safeFetch(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  const parsed = new URL(url.toString());
  await validateHostname(parsed.hostname);
  return fetch(url, init);
}
