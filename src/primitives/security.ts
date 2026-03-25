import type { AuditConfig, Finding, PageSummary } from '@/types';
import type { CrawlResult } from '@/types';
import { BasePrimitive, createFindingId, withPrimitiveEnvelope } from '@/primitives/base';

const SENSITIVE_PATHS = [
  '/.git/HEAD',
  '/.env',
  '/.env.local',
  '/.env.production',
  '/security.txt',
  '/.well-known/security.txt',
  '/config.json',
  '/server-status',
  '/debug',
  '/actuator/health'
];

export class SecurityPrimitive extends BasePrimitive {
  readonly name = 'security';
  readonly dimension = 'security' as const;
  readonly requiresOwnershipVerification = false;
  readonly usesLLM = false;
  private readonly fetchFn: typeof fetch;

  constructor(options: ConstructorParameters<typeof BasePrimitive>[0] & { fetchFn?: typeof fetch } = {}) {
    super(options);
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async run(_crawl: CrawlResult, summaries: PageSummary[], config: AuditConfig) {
    return withPrimitiveEnvelope(this, config.methodologyVersion, async () => {
      const findings: Finding[] = [];
      let index = 1;
      for (const summary of summaries) {
        if (!summary.securityHeaders.csp) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Content-Security-Policy header is missing.',
            expected: 'Pages should send a restrictive Content-Security-Policy header.',
            why: 'Missing CSP increases exposure to XSS and script injection paths.',
            verify: 'Inspect response headers and confirm CSP is set for the audited page.',
            severity: 'medium',
            confidence: 0.98
          }));
        } else {
          const cspWarnings = analyzeCsp(summary.securityHeaders.csp);
          for (const warning of cspWarnings) {
            findings.push(this.createFinding({
              page: summary,
              id: createFindingId(this.name, index++),
              what: warning,
              expected: 'Content-Security-Policy should avoid bypass directives such as unsafe-inline and unsafe-eval.',
              why: 'Weak CSP directives reduce the real protection a policy provides against script injection.',
              verify: 'Review the CSP header and remove permissive directives that bypass script execution protections.',
              severity: 'medium',
              confidence: 0.92
            }));
          }
        }
        if (!summary.securityHeaders.hsts) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Strict-Transport-Security header is missing.',
            expected: 'HTTPS sites should send HSTS.',
            why: 'Without HSTS, downgrade and first-request attacks stay possible.',
            verify: 'Confirm the response includes a Strict-Transport-Security header over HTTPS.',
            severity: 'medium',
            confidence: 0.95
          }));
        }
        if (!summary.securityHeaders.xFrameOptions) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'X-Frame-Options header is missing.',
            expected: 'HTML pages should send X-Frame-Options or an equivalent frame-ancestors CSP rule.',
            why: 'Missing clickjacking protection allows pages to be embedded in hostile frames.',
            verify: 'Confirm the response sends X-Frame-Options or an equivalent frame-ancestors CSP policy.',
            severity: 'medium',
            confidence: 0.94
          }));
        }
        if (!summary.securityHeaders.xContentTypeOptions) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'X-Content-Type-Options header is missing.',
            expected: 'Responses should send X-Content-Type-Options: nosniff.',
            why: 'Without nosniff, browsers may MIME-sniff responses more permissively than intended.',
            verify: 'Confirm the response includes X-Content-Type-Options: nosniff.',
            severity: 'low',
            confidence: 0.92
          }));
        }
        if (!summary.securityHeaders.referrerPolicy) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Referrer-Policy header is missing.',
            expected: 'Responses should declare a restrictive Referrer-Policy.',
            why: 'Missing referrer controls can leak sensitive URL data to downstream destinations.',
            verify: 'Inspect the response headers and confirm a Referrer-Policy is set.',
            severity: 'low',
            confidence: 0.88
          }));
        }
        if (!summary.securityHeaders.permissionsPolicy) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Permissions-Policy header is missing.',
            expected: 'Responses should declare which browser features are permitted.',
            why: 'A missing Permissions-Policy leaves device APIs more broadly exposed than necessary.',
            verify: 'Inspect the response headers and confirm a Permissions-Policy is set for browser features.',
            severity: 'low',
            confidence: 0.84
          }));
        }
        if (
          summary.securityHeaders.accessControlAllowOrigin === '*' &&
          summary.securityHeaders.accessControlAllowCredentials?.toLowerCase() === 'true'
        ) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Access-Control-Allow-Origin is wildcarded while credentials are enabled.',
            expected: 'Credentialed CORS should restrict origins explicitly rather than using a wildcard.',
            why: 'Permissive CORS with credentials broadens cross-origin data exposure risk.',
            verify: 'Review CORS headers and confirm credentialed responses restrict Access-Control-Allow-Origin to explicit origins.',
            severity: 'high',
            confidence: 0.95
          }));
        }
        const mixedContentRequests = summary.networkSummary.mixedContentRequests ?? [];
        if (mixedContentRequests.length > 0) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `${mixedContentRequests.length} mixed-content request${mixedContentRequests.length > 1 ? 's were' : ' was'} made from an HTTPS page.`,
            expected: 'HTTPS pages should not request insecure HTTP subresources.',
            why: 'Mixed content weakens transport security and can cause browsers to block key resources.',
            verify: 'Inspect network requests and confirm all subresources load over HTTPS.',
            severity: 'high',
            confidence: 0.95
          }));
        }
        if (summary.networkSummary.preConsentRequests) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Third-party analytics or ads requests fire on initial load before consent.',
            expected: 'Tracking requests should wait until the user explicitly grants consent.',
            why: 'Pre-consent tracking requests create privacy and compliance risk for visitors who decline tracking.',
            verify: 'Load the page with network monitoring and confirm no analytics or ads requests fire before consent is granted.',
            severity: 'medium',
            confidence: 0.96
          }));
        }
        const weakCookies = summary.securityHeaders.cookies.filter((cookie) => !cookie.secure || !cookie.httpOnly || cookie.sameSite === null);
        if (config.ownershipVerified && weakCookies.length > 0) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `${weakCookies.length} cookie${weakCookies.length > 1 ? 's are' : ' is'} missing one or more secure attributes.`,
            expected: 'Sensitive cookies should be Secure, HttpOnly, and SameSite-protected.',
            why: 'Weak cookie attributes make session theft and CSRF easier.',
            verify: 'Review Set-Cookie headers and confirm each sensitive cookie carries Secure, HttpOnly, and SameSite.',
            severity: 'high',
            confidence: 0.93
          }));
        }
      }

      if (config.ownershipVerified && summaries[0]) {
        const exposedPaths = await probeSensitiveFiles(summaries[0].url, this.fetchFn);
        for (const path of exposedPaths) {
          findings.push(this.createFinding({
            page: summaries[0],
            id: createFindingId(this.name, index++),
            what: `Sensitive file probe returned content at ${path}.`,
            expected: 'Operational files such as environment files, repository metadata, and debug endpoints should not be publicly readable.',
            why: 'Exposed operational files can leak credentials, repository state, or internal diagnostics.',
            verify: `Request ${path} directly and confirm it now returns a non-sensitive 404/403 response.`,
            severity: path.includes('.git') || path.includes('.env') ? 'critical' : 'high',
            confidence: 0.97
          }));
        }
      }
      return findings;
    });
  }
}

function analyzeCsp(csp: string | null): string[] {
  if (!csp) {
    return [];
  }

  const warnings: string[] = [];
  if (/'unsafe-inline'/.test(csp)) {
    warnings.push('Content-Security-Policy allows unsafe-inline script execution.');
  }
  if (/'unsafe-eval'/.test(csp)) {
    warnings.push('Content-Security-Policy allows unsafe-eval script execution.');
  }
  return warnings;
}

async function probeSensitiveFiles(pageUrl: string, fetchFn: typeof fetch): Promise<string[]> {
  const origin = new URL(pageUrl).origin;
  const hits: string[] = [];

  await Promise.all(
    SENSITIVE_PATHS.map(async (path) => {
      try {
        const response = await fetchFn(new URL(path, origin), {
          method: 'GET',
          headers: { 'user-agent': 'AlienEyesBot/0.1 (+https://alieneyes.dev)' }
        });
        if (!response.ok) {
          return;
        }
        const body = (await response.text()).slice(0, 200).toLowerCase();
        if (path.includes('.git') || path.includes('.env') || /ref: refs|secret|token|password|health|security contact/.test(body)) {
          hits.push(path);
        }
      } catch {
        return;
      }
    })
  );

  return hits;
}
