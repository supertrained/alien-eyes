/**
 * Extract social media profile URLs from HTML content.
 * Pure functions — no side effects, no external dependencies.
 */

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

/** Patterns that indicate share/intent links rather than profile links */
const SHARE_PATTERNS = [
  /facebook\.com\/sharer/i,
  /facebook\.com\/share/i,
  /facebook\.com\/dialog/i,
  /twitter\.com\/intent/i,
  /twitter\.com\/share/i,
  /x\.com\/intent/i,
  /x\.com\/share/i,
  /linkedin\.com\/share/i,
  /linkedin\.com\/cws\/share/i,
  /youtube\.com\/embed/i,
];

/** Platform detection: domain pattern → platform key */
const PLATFORM_MATCHERS: Array<{
  pattern: RegExp;
  key: keyof SocialLinks;
}> = [
  { pattern: /^(?:www\.)?facebook\.com$/i, key: "facebook" },
  { pattern: /^(?:www\.)?instagram\.com$/i, key: "instagram" },
  { pattern: /^(?:www\.)?twitter\.com$/i, key: "twitter" },
  { pattern: /^(?:www\.)?x\.com$/i, key: "twitter" },
  { pattern: /^(?:www\.)?linkedin\.com$/i, key: "linkedin" },
  { pattern: /^(?:www\.)?youtube\.com$/i, key: "youtube" },
  { pattern: /^(?:www\.)?tiktok\.com$/i, key: "tiktok" },
];

/**
 * Extract social media profile URLs from HTML content.
 * Scans for <a> tags linking to known social platforms.
 * Ignores share buttons, empty hrefs, and fragment-only links.
 */
export function extractSocialLinks(html: string): SocialLinks {
  const links: SocialLinks = {};

  // Cap HTML size to prevent ReDoS on adversarially crafted content
  const safeHtml = html.length > 500_000 ? html.slice(0, 500_000) : html;

  // Match all href attributes in anchor tags
  const hrefRegex = /<a\s[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(safeHtml)) !== null) {
    const href = match[1].trim();

    // Skip empty, fragment-only, or javascript: hrefs
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
      continue;
    }

    // Skip non-http(s) links
    if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("//")) {
      continue;
    }

    // Skip share/intent links
    if (SHARE_PATTERNS.some((p) => p.test(href))) {
      continue;
    }

    // Parse URL and test hostname only (not full URL) to prevent
    // attackers from crafting links like facebook.com.evil.com
    let hostname: string;
    try {
      const normalized = href.startsWith("//") ? `https:${href}` : href;
      hostname = new URL(normalized).hostname.toLowerCase();
    } catch {
      continue; // Malformed URL
    }

    // Check each platform against parsed hostname
    for (const { pattern, key } of PLATFORM_MATCHERS) {
      if (pattern.test(hostname)) {
        // Only keep the first match per platform (typically the header/footer profile link)
        if (!links[key]) {
          const normalized = href.startsWith("//") ? `https:${href}` : href;
          links[key] = normalized;
        }
        break;
      }
    }
  }

  return links;
}

/**
 * Extract the page/profile name from a social URL.
 * e.g., "https://facebook.com/PetMeds" -> "PetMeds"
 *       "https://www.instagram.com/petmeds_official/" -> "petmeds_official"
 *       "https://linkedin.com/company/acme-corp" -> "acme-corp"
 *       "https://youtube.com/@handle" -> "@handle"
 *       "https://youtube.com/channel/UC1234" -> "UC1234"
 *       "https://tiktok.com/@brand" -> "@brand"
 *       "https://x.com/handle" -> "handle"
 *
 * Returns null if the URL has no meaningful path segment.
 */
export function extractSocialPageName(url: string): string | null {
  try {
    // Handle protocol-relative URLs
    const normalized = url.startsWith("//") ? `https:${url}` : url;
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();

    // Get path segments, stripping leading/trailing slashes and empty entries
    const segments = parsed.pathname
      .split("/")
      .filter((s) => s.length > 0);

    if (segments.length === 0) return null;

    // LinkedIn: extract company slug from /company/slug
    if (hostname.includes("linkedin.com")) {
      if (segments[0] === "company" && segments.length >= 2) {
        return segments[1];
      }
      if (segments[0] === "in" && segments.length >= 2) {
        return segments[1];
      }
      // Other linkedin paths (e.g., /school/slug)
      if (segments.length >= 2) {
        return segments[1];
      }
      return segments[0];
    }

    // YouTube: handle /@handle and /channel/ID patterns
    if (hostname.includes("youtube.com")) {
      if (segments[0].startsWith("@")) {
        return segments[0];
      }
      if (segments[0] === "channel" && segments.length >= 2) {
        return segments[1];
      }
      if (segments[0] === "c" && segments.length >= 2) {
        return segments[1];
      }
      if (segments[0] === "user" && segments.length >= 2) {
        return segments[1];
      }
      return segments[0];
    }

    // TikTok: handle /@handle
    if (hostname.includes("tiktok.com")) {
      if (segments[0].startsWith("@")) {
        return segments[0];
      }
      return segments[0];
    }

    // Facebook, Instagram, Twitter/X: first path segment is the username/page
    return segments[0];
  } catch {
    return null;
  }
}
