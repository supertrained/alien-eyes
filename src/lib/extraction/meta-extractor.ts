import { load } from 'cheerio';

export function extractMetaTags(html: string): Record<string, string> {
  const $ = load(html);
  const tags: Record<string, string> = {};

  $('meta').each((_, element) => {
    const key = $(element).attr('name') ?? $(element).attr('property') ?? $(element).attr('http-equiv');
    const value = $(element).attr('content');
    if (key && value) {
      tags[key] = value;
    }
  });

  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical) {
    tags.canonical = canonical;
  }

  const robots = $('meta[name="robots"]').attr('content');
  if (robots) {
    tags.robots = robots;
  }

  return tags;
}
