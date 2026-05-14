/**
 * Strips non-semantic HTML elements before sending to LLM.
 * Removes scripts, styles, SVGs, noscript, iframes, inline event handlers, data-URIs.
 * Preserves semantic structure: headings, paragraphs, lists, links, forms, img alt text.
 */
export function cleanHtmlForLlm(rawHtml: string, maxChars = 15_000): string {
  let html = rawHtml;

  // Remove script tags and contents
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Remove style tags and contents
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Remove SVG tags and contents
  html = html.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  // Remove noscript tags
  html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  // Remove iframe tags
  html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  // Remove HTML comments
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  // Remove inline event handlers (onclick, onload, etc.)
  html = html.replace(/\s+on\w+="[^"]*"/gi, '');
  html = html.replace(/\s+on\w+='[^']*'/gi, '');
  // Remove data-URI attributes (base64 images/content)
  html = html.replace(/\s+(src|href)="data:[^"]*"/gi, '');
  // Remove empty attributes
  html = html.replace(/\s+\w+=""/g, '');
  // Collapse whitespace
  html = html.replace(/\s{2,}/g, ' ');
  // Remove blank lines
  html = html.replace(/\n\s*\n/g, '\n');

  return html.slice(0, maxChars);
}
