import { describe, expect, it } from 'vitest';
import { detectTrackingTools, detectTrackingToolsFromHtml } from '@/lib/extraction/tracking-detector';
import type { NetworkEntry } from '@/types';

function makeRequest(url: string): NetworkEntry {
  return {
    url,
    method: 'GET',
    statusCode: 200,
    contentType: 'application/javascript',
    size: 1000,
    durationMs: 50,
    resourceType: 'script',
  };
}

describe('detectTrackingTools', () => {
  it('detects GA4 from gtag network request', () => {
    const requests = [makeRequest('https://www.googletagmanager.com/gtag/js?id=G-ABC123')];
    const tools = detectTrackingTools(requests);
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('Google Analytics 4');
    expect(tools[0]!.category).toBe('analytics');
  });

  it('detects Meta Pixel from fbevents.js', () => {
    const requests = [makeRequest('https://connect.facebook.net/en_US/fbevents.js')];
    const tools = detectTrackingTools(requests);
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('Meta Pixel');
    expect(tools[0]!.category).toBe('advertising');
  });

  it('detects LinkedIn Insight Tag', () => {
    const requests = [makeRequest('https://snap.licdn.com/li.lms-analytics/insight.min.js')];
    const tools = detectTrackingTools(requests);
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('LinkedIn Insight Tag');
    expect(tools[0]!.category).toBe('advertising');
  });

  it('detects Microsoft Clarity', () => {
    const requests = [makeRequest('https://www.clarity.ms/tag/abc123')];
    const tools = detectTrackingTools(requests);
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('Microsoft Clarity');
    expect(tools[0]!.category).toBe('heatmap');
  });

  it('detects HubSpot', () => {
    const requests = [makeRequest('https://js.hs-scripts.com/12345.js')];
    const tools = detectTrackingTools(requests);
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('HubSpot');
    expect(tools[0]!.category).toBe('crm');
  });

  it('detects Cookiebot consent manager', () => {
    const requests = [makeRequest('https://consent.cookiebot.com/uc.js')];
    const tools = detectTrackingTools(requests);
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('Cookiebot');
    expect(tools[0]!.category).toBe('consent');
  });

  it('detects multiple tools from a realistic request set', () => {
    const requests = [
      makeRequest('https://www.googletagmanager.com/gtm.js?id=GTM-ABC'),
      makeRequest('https://connect.facebook.net/en_US/fbevents.js'),
      makeRequest('https://snap.licdn.com/li.lms-analytics/insight.min.js'),
      makeRequest('https://www.clarity.ms/tag/xyz'),
      makeRequest('https://js.hs-scripts.com/999.js'),
      makeRequest('https://cdn.example.com/app.js'),
    ];

    const tools = detectTrackingTools(requests);
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'Google Tag Manager',
      'HubSpot',
      'LinkedIn Insight Tag',
      'Meta Pixel',
      'Microsoft Clarity',
    ]);
  });

  it('deduplicates the same tool across multiple matching requests', () => {
    const requests = [
      makeRequest('https://www.googletagmanager.com/gtag/js?id=G-AAA'),
      makeRequest('https://www.google-analytics.com/g/collect?v=2'),
    ];
    const tools = detectTrackingTools(requests);
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('Google Analytics 4');
  });

  it('returns empty array when no tracking tools found', () => {
    const requests = [
      makeRequest('https://cdn.example.com/app.js'),
      makeRequest('https://api.example.com/data'),
    ];
    expect(detectTrackingTools(requests)).toHaveLength(0);
  });
});

describe('detectTrackingToolsFromHtml', () => {
  it('detects GTM from inline HTML', () => {
    const html = '<script src="https://www.googletagmanager.com/gtm.js?id=GTM-ABC"></script>';
    const tools = detectTrackingToolsFromHtml(html);
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('Google Tag Manager');
    expect(tools[0]!.detectedVia).toBe('html');
  });

  it('detects Meta Pixel from fbq() call', () => {
    const html = '<script>fbq("init", "123456")</script>';
    const tools = detectTrackingToolsFromHtml(html);
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('Meta Pixel');
  });

  it('detects LinkedIn from partner ID variable', () => {
    const html = '<script>_linkedin_partner_id = "12345";</script>';
    const tools = detectTrackingToolsFromHtml(html);
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('LinkedIn Insight Tag');
  });
});
