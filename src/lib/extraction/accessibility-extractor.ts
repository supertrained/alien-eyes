import { load } from 'cheerio';
import type { AriaLandmark, ImageInfo, Link } from '@/types';

const NATIVE_LANDMARKS = new Set(['main', 'nav', 'header', 'footer', 'aside', 'form']);

export interface AccessibilityExtraction {
  links: Link[];
  images: ImageInfo[];
  ariaLandmarks: AriaLandmark[];
}

export function extractAccessibilitySignals(html: string, pageUrl: string): AccessibilityExtraction {
  const $ = load(html);
  const current = new URL(pageUrl);

  const links: Link[] = [];
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.trim();
    if (!href) {
      return;
    }

    let isInternal = false;
    try {
      isInternal = new URL(href, current).origin === current.origin;
    } catch {
      isInternal = false;
    }

    links.push({
      href,
      text: $(element).text().replace(/\s+/g, ' ').trim(),
      isInternal,
      nofollow: ($(element).attr('rel') ?? '').split(/\s+/).includes('nofollow')
    });
  });

  const images: ImageInfo[] = [];
  $('img').each((_, element) => {
    const alt = $(element).attr('alt');
    images.push({
      src: $(element).attr('src') ?? '',
      alt: alt ?? null,
      hasAlt: alt !== undefined,
      isDecorative: alt === '',
      width: parseOptionalNumber($(element).attr('width')),
      height: parseOptionalNumber($(element).attr('height'))
    });
  });

  const ariaLandmarks: AriaLandmark[] = [];
  $('main, nav, header, footer, aside, form, [role]').each((_, element) => {
    const tagName = element.tagName.toLowerCase();
    let role = $(element).attr('role') ?? tagName;
    if ((tagName === 'nav' || tagName === 'footer') && $(element).parents('main').length > 0) {
      role = `${role}-inside-main`;
    }
    ariaLandmarks.push({
      role,
      label: $(element).attr('aria-label') ?? $(element).attr('aria-labelledby') ?? undefined,
      isNative: NATIVE_LANDMARKS.has(tagName)
    });
  });

  return { links, images, ariaLandmarks };
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
