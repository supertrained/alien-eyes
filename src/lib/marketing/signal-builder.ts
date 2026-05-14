/**
 * Signal builder helpers for epistemically honest reporting.
 *
 * Two-tier approach:
 * - Measurement signals: state facts with source attribution (PageSpeed, traffic)
 * - Detection signals: use qualified language with methodology scope
 *
 * Design principle: lead with what you DID find, not what you didn't.
 */

export interface DetectionScope {
  /** What was actually checked (e.g., ["/blog", "/news", "/articles"]) */
  checked: string[];
  /** Detection method used */
  method: "HTTP HEAD" | "HTML pattern match" | "network interception" | "API query" | "DNS lookup" | "Playwright";
  /** How much of the site was analyzed */
  coverage: "homepage_only" | "common_paths" | "full_site" | "external_api";
}

/**
 * For things we measured via external APIs or tools.
 * These ARE facts — state them confidently with source attribution.
 *
 * @example measurementSignal("PageSpeed mobile score", "42/100", "Google Lighthouse")
 * // → "PageSpeed mobile score: 42/100 (via Google Lighthouse)"
 */
export function measurementSignal(what: string, value: string, source: string): string {
  return `${what}: ${value} (via ${source})`;
}

/**
 * For things we checked but did not find.
 * Qualify with methodology scope — never assert absence as fact.
 *
 * @example absenceSignal("a blog", { checked: BLOG_PATHS, method: "HTTP HEAD", coverage: "common_paths" }, "this limits organic traffic growth")
 * // → "Could not detect a blog at common paths (/blog, /news, +5 more) — this limits organic traffic growth"
 */
export function absenceSignal(
  what: string,
  scope: DetectionScope,
  consequence?: string
): string {
  let methodNote: string;
  switch (scope.coverage) {
    case "homepage_only":
      methodNote = "on the homepage";
      break;
    case "common_paths": {
      const shown = scope.checked.slice(0, 3).join(", ");
      const extra = scope.checked.length > 3 ? `, +${scope.checked.length - 3} more` : "";
      methodNote = `at common paths (${shown}${extra})`;
      break;
    }
    case "external_api":
      methodNote = `via ${scope.method}`;
      break;
    case "full_site":
      methodNote = "across the site";
      break;
    default:
      methodNote = "in our scan";
  }

  const base = `Could not detect ${what} ${methodNote}`;
  return consequence ? `${base} — ${consequence}` : base;
}

/**
 * For things we did find — state positively with location.
 *
 * @example presenceSignal("Blog", "/blog", "28 posts found")
 * // → "Blog found at /blog: 28 posts found"
 */
export function presenceSignal(what: string, where: string, detail?: string): string {
  const base = `${what} found at ${where}`;
  return detail ? `${base}: ${detail}` : base;
}
