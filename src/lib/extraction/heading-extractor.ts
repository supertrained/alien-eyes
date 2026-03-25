import { load } from 'cheerio';
import type { Heading } from '@/types';

export function extractHeadings(html: string): Heading[] {
  const $ = load(html);
  const headings: Heading[] = [];

  $('h1, h2, h3, h4, h5, h6').each((_, element) => {
    const tagName = element.tagName.toLowerCase();
    const level = Number(tagName.slice(1)) as Heading['level'];
    const text = $(element).text().replace(/\s+/g, ' ').trim();
    if (!text) {
      return;
    }

    headings.push({ level, text });
  });

  return headings;
}
