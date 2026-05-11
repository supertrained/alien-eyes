import type { NetworkEntry } from '@/types';

export interface TrackingTool {
  name: string;
  category: 'analytics' | 'advertising' | 'heatmap' | 'crm' | 'consent' | 'social' | 'other';
  detectedVia: 'network' | 'script' | 'html';
  matchedUrl?: string;
}

interface DetectionRule {
  name: string;
  category: TrackingTool['category'];
  patterns: RegExp[];
}

const DETECTION_RULES: DetectionRule[] = [
  // Analytics
  {
    name: 'Google Analytics 4',
    category: 'analytics',
    patterns: [
      /google-analytics\.com\/g\/collect/,
      /googletagmanager\.com\/gtag/,
      /gtag\/js\?id=G-/,
    ],
  },
  {
    name: 'Google Tag Manager',
    category: 'analytics',
    patterns: [
      /googletagmanager\.com\/gtm\.js/,
      /googletagmanager\.com\/ns\.html/,
    ],
  },
  {
    name: 'Google Universal Analytics',
    category: 'analytics',
    patterns: [
      /google-analytics\.com\/analytics\.js/,
      /google-analytics\.com\/collect\?/,
      /gtag\/js\?id=UA-/,
    ],
  },
  {
    name: 'Plausible',
    category: 'analytics',
    patterns: [/plausible\.io\/js\//],
  },
  {
    name: 'Fathom',
    category: 'analytics',
    patterns: [/cdn\.usefathom\.com\//],
  },
  {
    name: 'PostHog',
    category: 'analytics',
    patterns: [/posthog\.com\/static\//, /us\.posthog\.com/],
  },
  {
    name: 'Mixpanel',
    category: 'analytics',
    patterns: [/cdn\.mxpnl\.com\//, /api\.mixpanel\.com\//],
  },
  {
    name: 'Segment',
    category: 'analytics',
    patterns: [/cdn\.segment\.com\//, /api\.segment\.io\//],
  },
  {
    name: 'Amplitude',
    category: 'analytics',
    patterns: [/cdn\.amplitude\.com\//, /api\.amplitude\.com\//],
  },
  {
    name: 'Heap',
    category: 'analytics',
    patterns: [/cdn\.heapanalytics\.com\//, /heapanalytics\.com\/js/],
  },

  // Advertising
  {
    name: 'Meta Pixel',
    category: 'advertising',
    patterns: [
      /connect\.facebook\.net\/.*\/fbevents\.js/,
      /facebook\.com\/tr\?/,
      /facebook\.com\/tr\//,
    ],
  },
  {
    name: 'LinkedIn Insight Tag',
    category: 'advertising',
    patterns: [
      /snap\.licdn\.com\/li\.lms-analytics/,
      /linkedin\.com\/px/,
      /dc\.ads\.linkedin\.com/,
    ],
  },
  {
    name: 'Google Ads',
    category: 'advertising',
    patterns: [
      /googleads\.g\.doubleclick\.net/,
      /gtag\/js\?id=AW-/,
      /pagead\/landing/,
    ],
  },
  {
    name: 'Twitter/X Pixel',
    category: 'advertising',
    patterns: [
      /static\.ads-twitter\.com/,
      /analytics\.twitter\.com/,
      /t\.co\/i\/adsct/,
    ],
  },
  {
    name: 'TikTok Pixel',
    category: 'advertising',
    patterns: [/analytics\.tiktok\.com\//, /tiktok\.com\/i18n\/pixel/],
  },
  {
    name: 'Pinterest Tag',
    category: 'advertising',
    patterns: [/s\.pinimg\.com\/ct\/core\.js/, /ct\.pinterest\.com/],
  },
  {
    name: 'Reddit Pixel',
    category: 'advertising',
    patterns: [/alb\.reddit\.com\/snoo/, /redditmedia\.com\/pixel/],
  },

  // Heatmap / Session Recording
  {
    name: 'Microsoft Clarity',
    category: 'heatmap',
    patterns: [/clarity\.ms\/tag\//, /clarity\.ms\/s\//],
  },
  {
    name: 'Hotjar',
    category: 'heatmap',
    patterns: [/static\.hotjar\.com\//, /vars\.hotjar\.com/],
  },
  {
    name: 'FullStory',
    category: 'heatmap',
    patterns: [/fullstory\.com\/s\/fs\.js/, /rs\.fullstory\.com/],
  },
  {
    name: 'Lucky Orange',
    category: 'heatmap',
    patterns: [/luckyorange\.com\//, /d10lpsik1i8c69\.cloudfront\.net/],
  },

  // CRM / Marketing Automation
  {
    name: 'HubSpot',
    category: 'crm',
    patterns: [
      /js\.hs-scripts\.com\//,
      /js\.hsforms\.net\//,
      /js\.hs-analytics\.net\//,
      /track\.hubspot\.com/,
    ],
  },
  {
    name: 'Intercom',
    category: 'crm',
    patterns: [/widget\.intercom\.io\//, /api-iam\.intercom\.io/],
  },
  {
    name: 'Drift',
    category: 'crm',
    patterns: [/js\.driftt\.com\//, /drift\.com\/include/],
  },
  {
    name: 'Salesforce / Pardot',
    category: 'crm',
    patterns: [/pi\.pardot\.com\//, /go\.pardot\.com/],
  },
  {
    name: 'ActiveCampaign',
    category: 'crm',
    patterns: [/trackcmp\.net\//, /activehosted\.com/],
  },
  {
    name: 'Mailchimp',
    category: 'crm',
    patterns: [/chimpstatic\.com\//, /list-manage\.com/],
  },

  // Consent Management
  {
    name: 'Cookiebot',
    category: 'consent',
    patterns: [/consent\.cookiebot\.com\//, /consentcdn\.cookiebot\.com/],
  },
  {
    name: 'OneTrust',
    category: 'consent',
    patterns: [/cdn\.cookielaw\.org\//, /optanon\.blob/],
  },
  {
    name: 'Termly',
    category: 'consent',
    patterns: [/app\.termly\.io\//, /termly\.io\/embed/],
  },
  {
    name: 'CookieYes',
    category: 'consent',
    patterns: [/cdn-cookieyes\.com\//],
  },

  // Social
  {
    name: 'Facebook SDK',
    category: 'social',
    patterns: [/connect\.facebook\.net\/.*\/sdk\.js/],
  },
  {
    name: 'Twitter Widgets',
    category: 'social',
    patterns: [/platform\.twitter\.com\/widgets/],
  },
];

export function detectTrackingTools(networkRequests: NetworkEntry[]): TrackingTool[] {
  const detected = new Map<string, TrackingTool>();

  for (const request of networkRequests) {
    for (const rule of DETECTION_RULES) {
      if (detected.has(rule.name)) continue;

      for (const pattern of rule.patterns) {
        if (pattern.test(request.url)) {
          detected.set(rule.name, {
            name: rule.name,
            category: rule.category,
            detectedVia: 'network',
            matchedUrl: request.url,
          });
          break;
        }
      }
    }
  }

  return [...detected.values()];
}

export function detectTrackingToolsFromHtml(html: string): TrackingTool[] {
  const detected = new Map<string, TrackingTool>();

  const htmlRules: Array<{ name: string; category: TrackingTool['category']; pattern: RegExp }> = [
    { name: 'Google Tag Manager', category: 'analytics', pattern: /googletagmanager\.com\/gtm\.js/ },
    { name: 'Google Analytics 4', category: 'analytics', pattern: /gtag\/js\?id=G-/ },
    { name: 'Meta Pixel', category: 'advertising', pattern: /fbevents\.js|fbq\s*\(/ },
    { name: 'LinkedIn Insight Tag', category: 'advertising', pattern: /snap\.licdn\.com|_linkedin_partner_id/ },
    { name: 'Microsoft Clarity', category: 'heatmap', pattern: /clarity\.ms\/tag\// },
    { name: 'HubSpot', category: 'crm', pattern: /hs-scripts\.com|_hsq/ },
    { name: 'Hotjar', category: 'heatmap', pattern: /hotjar\.com|hj\s*\(\s*['"]init['"]/ },
  ];

  for (const rule of htmlRules) {
    if (rule.pattern.test(html)) {
      detected.set(rule.name, {
        name: rule.name,
        category: rule.category,
        detectedVia: 'html',
      });
    }
  }

  return [...detected.values()];
}
