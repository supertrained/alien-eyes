import { describe, expect, it } from 'vitest';
import { InputSanitizer } from '@/lib/security/input-sanitizer';

describe('InputSanitizer', () => {
  const sanitizer = new InputSanitizer();

  it('removes hidden elements, scripts, comments, and noscript blocks', () => {
    const html = `
      <html>
        <head><title>Visible Title</title></head>
        <body>
          <!-- comment -->
          <main>
            <h1>Visible Heading</h1>
            <p style="display:none">Hidden text</p>
            <p style="visibility:hidden">Also hidden</p>
            <div aria-hidden="true">Aria hidden</div>
            <noscript>Noscript text</noscript>
            <script>alert('x')</script>
            <a href="/docs" aria-label="Docs">Docs</a>
          </main>
        </body>
      </html>
    `;

    const sanitized = sanitizer.sanitizeHtml(html);
    expect(sanitized).not.toContain('Hidden text');
    expect(sanitized).not.toContain('Also hidden');
    expect(sanitized).not.toContain('Aria hidden');
    expect(sanitized).not.toContain('Noscript text');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).not.toContain('comment');
    expect(sanitized).toContain('Visible Heading');
    expect(sanitized).toContain('aria-label="Docs"');
  });

  it('preserves semantic text when extracting visible content', () => {
    const html = '<main><h1>Title</h1><p>Body text</p><span hidden>Secret</span></main>';
    expect(sanitizer.extractVisibleText(html)).toBe('Title Body text');
  });

  it('separates instructions from data for prompt payloads', () => {
    const payload = sanitizer.createPromptPayload('Follow the schema.', '{"url":"https://example.com"}');
    expect(payload).toContain('<SYSTEM_INSTRUCTIONS>');
    expect(payload).toContain('<DATA>');
  });
});
