import type { CookieInfo, NetworkSummary, SecurityHeaders } from '@/types';
import type { CrawledPage } from '@/types';

export function extractSecurityHeaders(page: CrawledPage): SecurityHeaders {
  const headers = page.responseHeaders;
  return {
    csp: getHeader(headers, 'content-security-policy'),
    hsts: getHeader(headers, 'strict-transport-security'),
    xFrameOptions: getHeader(headers, 'x-frame-options'),
    xContentTypeOptions: getHeader(headers, 'x-content-type-options'),
    referrerPolicy: getHeader(headers, 'referrer-policy'),
    permissionsPolicy: getHeader(headers, 'permissions-policy'),
    accessControlAllowOrigin: getHeader(headers, 'access-control-allow-origin'),
    accessControlAllowCredentials: getHeader(headers, 'access-control-allow-credentials'),
    cookies: parseCookies(headers['set-cookie'] ?? headers['Set-Cookie'])
  };
}

export function summarizeNetwork(page: CrawledPage): NetworkSummary {
  const byType: NetworkSummary['byType'] = {};
  const thirdPartyDomains = new Set<string>();
  const pageOrigin = new URL(page.url).origin;
  let totalSizeBytes = 0;
  let preConsentRequests = false;
  const mixedContentRequests: string[] = [];

  for (const request of page.networkRequests) {
    totalSizeBytes += request.size;
    const bucket = byType[request.resourceType] ?? { count: 0, sizeBytes: 0 };
    bucket.count += 1;
    bucket.sizeBytes += request.size;
    byType[request.resourceType] = bucket;

    try {
      const requestOrigin = new URL(request.url).origin;
      if (requestOrigin !== pageOrigin) {
        const hostname = new URL(request.url).hostname;
        thirdPartyDomains.add(hostname);
        if (isTrackingDomain(hostname)) {
          preConsentRequests = true;
        }
      }
      if (page.url.startsWith('https://') && request.url.startsWith('http://')) {
        mixedContentRequests.push(request.url);
      }
    } catch {
      continue;
    }
  }

  return {
    totalRequests: page.networkRequests.length,
    totalSizeBytes,
    byType,
    thirdPartyDomains: [...thirdPartyDomains].sort(),
    preConsentRequests,
    mixedContentRequests
  };
}

const TRACKING_DOMAINS = new Set([
  'google-analytics.com', 'www.google-analytics.com',
  'googlesyndication.com',
  'googletagmanager.com', 'www.googletagmanager.com',
  'analytics.google.com',
  'googleadservices.com',
  'doubleclick.net', 'ad.doubleclick.net',
  'connect.facebook.net', 'www.facebook.com',
  'pixel.facebook.com',
  'bat.bing.com',
  'snap.licdn.com', 'px.ads.linkedin.com',
  'analytics.tiktok.com',
  'static.hotjar.com', 'script.hotjar.com',
  'cdn.segment.com', 'api.segment.io',
  'cdn.mxpnl.com', 'api-js.mixpanel.com',
  'cdn.amplitude.com', 'api2.amplitude.com',
  'plausible.io',
  'cdn.heapanalytics.com',
  'js.hs-analytics.net', 'track.hubspot.com',
  'static.hsappstatic.net',
  'app.pendo.io', 'cdn.pendo.io',
  'js.intercomcdn.com', 'widget.intercom.io',
  'rum.browser-intake-datadoghq.com',
  'js.sentry-cdn.com',
  'widget.trustpilot.com',
  'sc-static.net',
  'clarity.ms',
  'ct.pinterest.com',
  'cdn.mouseflow.com',
  'fullstory.com', 'rs.fullstory.com',
  'cdn.logrocket.io',
  'stats.wp.com',
  'mc.yandex.ru',
  'counter.yadro.ru'
]);

function isTrackingDomain(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (TRACKING_DOMAINS.has(lower)) return true;
  // Check if it's a subdomain of a known tracking domain
  for (const domain of TRACKING_DOMAINS) {
    if (lower.endsWith('.' + domain)) return true;
  }
  return false;
}

function getHeader(headers: Record<string, string>, key: string): string | null {
  return headers[key] ?? headers[key.toLowerCase()] ?? headers[key.toUpperCase()] ?? null;
}

function parseCookies(rawHeader?: string): CookieInfo[] {
  if (!rawHeader) {
    return [];
  }

  return rawHeader
    .split(/,(?=[^;]+=)/)
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const [nameValue, ...attributes] = cookie.split(';').map((part) => part.trim());
      const [name = ''] = nameValue.split('=');
      const sameSite = attributes
        .find((attribute) => attribute.toLowerCase().startsWith('samesite='))
        ?.split('=')[1]
        ?.toLowerCase();
      const lowerName = name.toLowerCase();

      return {
        name,
        httpOnly: attributes.some((attribute) => attribute.toLowerCase() === 'httponly'),
        secure: attributes.some((attribute) => attribute.toLowerCase() === 'secure'),
        sameSite: sameSite === 'strict' || sameSite === 'lax' || sameSite === 'none' ? sameSite : null,
        isTracking: /(_ga|_gid|fbp|analytics|track)/.test(lowerName)
      };
    });
}
