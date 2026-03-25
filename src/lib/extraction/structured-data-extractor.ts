import { load } from 'cheerio';

export function extractStructuredData(html: string): any[] {
  const $ = load(html);
  const items: any[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).contents().text().trim();
    if (!raw) {
      return;
    }

    try {
      items.push(JSON.parse(raw));
    } catch {
      items.push({ type: 'invalid-json-ld', raw: raw.slice(0, 500) });
    }
  });

  $('[itemscope]').each((_, element) => {
    const entry: Record<string, unknown> = {
      type: 'microdata',
      itemType: $(element).attr('itemtype') ?? null,
      properties: {} as Record<string, string>
    };

    $(element)
      .find('[itemprop]')
      .each((__, prop) => {
        const name = $(prop).attr('itemprop');
        const value = $(prop).attr('content') ?? $(prop).attr('href') ?? $(prop).text().replace(/\s+/g, ' ').trim();
        if (name && value) {
          (entry.properties as Record<string, string>)[name] = value;
        }
      });

    items.push(entry);
  });

  return items;
}
