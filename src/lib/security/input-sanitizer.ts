import { load } from 'cheerio';

const HIDDEN_STYLE_PATTERNS = [/display\s*:\s*none/i, /visibility\s*:\s*hidden/i];

export class InputSanitizer {
  sanitizeHtml(html: string): string {
    const $ = load(html);

    $('script, noscript').remove();
    $('*').contents().each((_, node) => {
      if (node.type === 'comment') {
        $(node).remove();
      }
    });

    $('[aria-hidden="true"]').remove();
    $('[hidden]').remove();

    $('[style]').each((_, element) => {
      const style = $(element).attr('style') ?? '';
      if (HIDDEN_STYLE_PATTERNS.some((pattern) => pattern.test(style))) {
        $(element).remove();
      }
    });

    return $.html();
  }

  extractVisibleText(html: string): string {
    const $ = load(this.sanitizeHtml(html));
    const textNodes = $.root()
      .find('*')
      .contents()
      .toArray()
      .filter((node) => node.type === 'text')
      .map((node) => node.data?.trim() ?? '')
      .filter(Boolean);

    return textNodes.join(' ').replace(/\s+/g, ' ').trim();
  }

  createPromptPayload(instructions: string, data: string): string {
    return [
      '<SYSTEM_INSTRUCTIONS>',
      instructions.trim(),
      '</SYSTEM_INSTRUCTIONS>',
      '<DATA>',
      data.trim(),
      '</DATA>'
    ].join('\n');
  }
}
