/**
 * Check for AI discoverability files (llms.txt, ai.txt, llms-full.txt, .well-known/ai-plugin.json)
 * Shared between MEO and Agent-Native primitives.
 */
export interface AiDiscoverabilityFile {
  found: boolean;
  url: string;
  contentPreview?: string;
}

export interface AiDiscoverabilityResult {
  llmsTxt: AiDiscoverabilityFile;
  aiTxt: AiDiscoverabilityFile;
  llmsFullTxt: AiDiscoverabilityFile;
  aiPluginJson: AiDiscoverabilityFile;
}

/** Max content size to consider valid (avoids treating large HTML error pages as valid files) */
const MAX_CONTENT_SIZE = 50_000;

/** Max characters to store in contentPreview */
const PREVIEW_LENGTH = 500;

/**
 * Fetch a single AI discoverability file and validate it.
 * Returns found: true only if the response is 200, non-HTML, and non-empty.
 */
async function fetchDiscoverabilityFile(
  fileUrl: string,
  expectJson = false
): Promise<AiDiscoverabilityFile> {
  try {
    const response = await fetch(fileUrl, {
      signal: AbortSignal.timeout(10_000),
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AlienEyes/1.0; +https://supertrained.ai)",
        "Accept": "text/plain, text/markdown, application/json, */*",
      },
    });

    if (!response.ok) {
      return { found: false, url: fileUrl };
    }

    // Reject HTML Content-Type responses (CDN challenge pages, soft 404s)
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html") && !expectJson) {
      return { found: false, url: fileUrl };
    }

    const text = await response.text().catch(() => "");

    // Reject empty responses
    if (text.length === 0) {
      return { found: false, url: fileUrl };
    }

    // Reject oversized responses (likely error pages)
    if (text.length > MAX_CONTENT_SIZE) {
      return { found: false, url: fileUrl };
    }

    // Reject HTML body responses (soft 404s returning HTML with non-HTML content-type)
    if (/<html/i.test(text) && !contentType.includes("text/plain") && !contentType.includes("text/markdown")) {
      return { found: false, url: fileUrl };
    }

    // For JSON files, verify it parses
    if (expectJson) {
      try {
        JSON.parse(text);
      } catch {
        return { found: false, url: fileUrl };
      }
    }

    return {
      found: true,
      url: fileUrl,
      contentPreview: text.slice(0, PREVIEW_LENGTH),
    };
  } catch {
    return { found: false, url: fileUrl };
  }
}

/**
 * Check all AI discoverability files for a given base URL.
 * Fetches llms.txt, ai.txt, llms-full.txt, and .well-known/ai-plugin.json in parallel.
 */
export async function checkAiDiscoverability(
  baseUrl: string
): Promise<AiDiscoverabilityResult> {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");

  const [llmsTxt, aiTxt, llmsFullTxt, aiPluginJson] = await Promise.all([
    fetchDiscoverabilityFile(`${cleanBaseUrl}/llms.txt`),
    fetchDiscoverabilityFile(`${cleanBaseUrl}/ai.txt`),
    fetchDiscoverabilityFile(`${cleanBaseUrl}/llms-full.txt`),
    fetchDiscoverabilityFile(`${cleanBaseUrl}/.well-known/ai-plugin.json`, true),
  ]);

  return { llmsTxt, aiTxt, llmsFullTxt, aiPluginJson };
}
