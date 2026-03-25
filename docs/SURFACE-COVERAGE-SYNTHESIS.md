# Alien Eyes — Surface Coverage Synthesis

> Date: 2026-03-11
> Source: 3 expert panels (23 simulated experts) + Codex endpoint audit
> Purpose: Definitive assessment of multi-surface readiness and expansion strategy
> Status: Pre-implementation analysis

---

## Executive Summary

23 experts across 3 panels independently converge on the same structural finding:

**The current architecture is excellent for web auditing and does not extend to non-web surfaces.**

The frozen types, scoring methodology, evidence model, and scenario grammar are all web-specific. Multi-surface expansion requires rebuilding the foundation — not extending it. However, several high-value additions can be made WITHIN web auditing before any surface expansion, and ONE non-web surface (MCP servers) has genuine strategic advantage with no incumbent.

### The Verdict

| Question | Answer |
|----------|--------|
| Has Alien Eyes thoroughly mapped website auditing? | **Yes.** Design-complete, adversarially reviewed. |
| Do the frozen types generalize beyond web? | **No.** 100% of CrawledPage fields are web-specific. |
| Does the methodology generalize beyond web? | **No.** 5 of 6 dimensions are web-only. |
| Does the scenario grammar generalize? | **No.** 80% of primitives are web-specific. |
| Should Alien Eyes pursue multi-surface expansion now? | **No.** Ship web first. Expand to MCP only when web reaches PMF. |
| What should change in the current plan? | Add 6 high-value web-only enhancements (see Section 4). |

---

## 1. Panel Overview

### Panel A: 10 Target Surface Specialists
REST API, GraphQL, MCP Server, CLI, GitHub, Package Registry, Webhook, DNS/Infrastructure, OAuth/Auth, Documentation. Each produced a 10-point structured analysis.

### Panel B: 7 Abstract/Adjacent Experts
Penetration tester, mystery shopping veteran, film test screening coordinator, clinical trial biostatistician, building inspector, crash test engineer, food safety auditor. Each brought cross-domain insights.

### Panel C: 6 Adversarial Reviewers
Type system critic, methodology skeptic, evidence model breaker, scenario grammar destroyer, business model assassin, competitive intelligence analyst. Each tried to break a different aspect of the plan.

---

## 2. Fatal Flaws (Panel C — Adversarial)

### CRITICAL-1: Frozen Types Are Web-Locked

**The problem:** `CrawledPage` has 10 fields (html, dom, screenshot, consoleLogs, networkRequests, responseHeaders, metaTags, viewport, deviceType, statusCode). Zero of these apply to a CLI audit. Zero apply to an MCP server audit. The `AuditPrimitive.run()` signature takes `CrawlResult` and `PageSummary[]` — types that cannot represent non-web data without semantic corruption.

**The evidence:** The `EvidenceBundle` requires `url`, `domSnapshotHash`, `screenshotPath`, and `relevantHeaders`. A CRITICAL CLI finding (e.g., "deploy command silently fails with exit code 0") cannot populate ANY of these fields. The 100% evidence completeness rule would block the finding.

**Impact:** Every future surface requires type system changes, version bumps, human approval, and migration. The types have frozen Alien Eyes into web-only.

**Required fix (when expanding):** Discriminated union: `CollectionResult = WebCrawlResult | CLIProbeResult | APIProbeResult | MCPIntrospectionResult`. Accept TYPE-SPEC v2.0. Do NOT attempt this now — fix it when expanding, not before shipping V1.

### CRITICAL-2: Methodology Is 5/6 Web-Only

**The problem:** SEO, Accessibility, Security Surface, Performance, and Copy & UX are web-specific dimensions. Only Agent-Nativeness partially transfers. The satisfaction score formula has no defined behavior when 55% of its weighted dimensions produce null values.

**Impact:** Non-web audits produce meaningless composite scores. Publishing meaningless scores on non-web surfaces destroys credibility on the web surface where scores ARE meaningful.

**Required fix (when expanding):** Rename to "Web Scoring Methodology v0.1." Create a methodology registry mapping surfaces to applicable dimensions with surface-specific rubrics and weight vectors.

### CRITICAL-3: Evidence Model Blocks Non-Web Findings

**The problem:** Evidence = URL + DOM hash + screenshot + HTTP headers. A CLI audit has none of these. An MCP audit has none of these. The completeness formula that gates CRITICAL findings would block legitimate non-web CRITICAL findings by design.

**Required fix (when expanding):** Discriminated evidence union: `WebEvidence | CLIEvidence | APIEvidence | MCPEvidence`. Surface-specific completeness formulas.

### CRITICAL-4: Scenario Grammar Generates 6 API Scenarios

**The problem:** 80%+ of grammar primitives are web-specific. For an API audit using only cross-surface primitives: ~2 personas × 1 entry point × 3 intents × 1 focus × 1 condition = 6 configurations. The anti-gaming property (27,440+ web configs) does not extend.

**Required fix (when expanding):** Per-surface primitive registry. Shared composition logic, surface-specific primitives. Budget 30-50 primitives per new surface across 5 axes.

### HIGH-1: Multi-Surface Dilutes Focus Before PMF

**The problem:** Each surface requires multiplicative investment: new infrastructure, types, evidence model, primitives, calibration data, methodology, personas, threat models, and false positive tracking. No non-web surface reaches positive unit economics within 18 months. Engineering hours spent on API auditing are hours not spent making web auditing excellent.

**Required fix:** ADR-017: "Single Surface Until PMF." No non-web engineering until web hits: (a) 1,000 paid audits, (b) <5% FP rate, (c) positive unit economics, (d) NRR >100%.

### HIGH-2: Every Non-Web Surface Has Incumbents (Except MCP)

**The problem:**
- REST API: Postman ($5.6B), Dredd, Schemathesis, SmartBear
- CLI: ShellCheck (free), bats-core (free), clitest (free)
- Package: Snyk ($8.5B), Socket, npm audit (free), Bundlephobia (free)
- GitHub: OSSF Scorecard (Google-backed), CodeClimate, Socket
- Webhooks: Svix, Hookdeck, webhook.site

MCP server auditing has NO incumbent. The ecosystem is 6 months old. Alien Eyes' agent-nativeness rubric is most relevant here. The Rhumb integration is native. This is the only surface where Alien Eyes has structural competitive advantage.

**Required fix:** Restrict expansion to MCP only (no incumbent, highest structural advantage). Skip APIs, CLIs, packages.

---

## 3. Surface Feasibility Matrix (Panel A)

| Surface | V1 Feasibility | New WUs | Infrastructure | Incumbent Strength | Strategic Value |
|---------|---------------|---------|----------------|-------------------|-----------------|
| DNS/Infrastructure | Very High | 1 | None — deterministic, no LLM, no browser | Medium (SSL Labs, MXToolbox) | Low (commodity) |
| REST API | High | 2-3 | HTTP client only | Very High (Postman) | Low (crowded) |
| GitHub Repository | High | 2-3 | GitHub API only | High (OSSF Scorecard) | Medium |
| Package Registry (npm) | High | 2 | Registry API + tarball inspection | Very High (Snyk) | Low (crowded) |
| Documentation/DX | High (content) | 1-2 | Layers on web crawl | Low | Medium |
| GraphQL API | Medium-High | 3-4 | Schema introspection | Medium (Escape.tech) | Medium |
| MCP Server (SSE/HTTP) | Medium | 3-4 | MCP client library | **None** | **Very High** |
| OAuth/Auth Flow | Medium-Low | 2-3 | OAuth client, legal risk | High (OWASP ZAP, Burp) | Low |
| CLI Tool | Medium | 3-4 | Docker sandboxing | Medium (free tools) | Low |
| Webhook Producer | Low | 4-5 | Public HTTPS listener | Medium (Svix) | Low |
| MCP Server (stdio) | Low | 3-4 + Docker | Sandboxed execution | **None** | **Very High** |

### Recommendation

**Phase 1 expansion (after web PMF): MCP Server (SSE/HTTP only)**
- No incumbent
- Rhumb integration is native (MCP audit findings ARE the AN Score input)
- Agent-nativeness rubric maps 1:1 to MCP server quality
- Highest strategic value

**Phase 2 expansion: MCP Server (stdio) + DNS/Infrastructure**
- DNS bolts onto Quick Check (free, deterministic, 1 WU)
- MCP stdio requires sandboxed containers

**Do not build:** REST API auditing (Postman wins), CLI auditing (free tools win), package auditing (Snyk wins), webhook auditing (infrastructure-heavy, low demand).

---

## 4. High-Value Web-Only Enhancements (Panel B)

These additions improve web auditing WITHOUT any surface expansion. They should be prioritized before non-web work.

### Tier 1: Add Before V1 (3+ experts endorsed)

#### 4.1 Discovery Phase

**Source:** Pentester (Kai), Building Inspector (Robert), Food Safety (Adaku)

Add a phase before crawling: URL → **Discover** → Crawl → Primitives → Synthesis.

The Discovery phase enumerates:
- Subdomains via DNS queries and certificate transparency logs (crt.sh)
- Referenced API endpoints in JavaScript source
- Exposed configuration files (.env, .git/HEAD, wp-config.php.bak)
- Source map exposure (.js.map files publicly accessible)
- robots.txt intelligence (admin paths, internal routes)
- Third-party services referenced in page source

Cost: Almost zero (DNS queries + a few HTTP HEAD requests, <10 seconds). Value: In penetration testing, 40-60% of critical findings come from reconnaissance, not from testing the known surface.

**Implementation:** New primitive `discovery` that runs between URL validation and crawl. Deterministic, no LLM. Findings like "staging.example.com is publicly accessible" and "source maps expose full unminified source at /assets/main.js.map."

#### 4.2 Journey/Flow-Level Testing

**Source:** Film Test Screener (Ines), Mystery Shopper (Margot), Crash Test Engineer (Sana)

Add a `Journey` data type alongside `PageSummary`:

```typescript
interface Journey {
  pages: PageSummary[];
  transitions: Transition[];
  intent: string;
  persona: string;
  totalSteps: number;
  estimatedTimeSeconds: number;
  emotionalArc?: string[];  // LLM-generated
}
```

Critical flows to test as journeys:
- Homepage → Pricing → Signup (onboarding flow)
- Homepage → Docs → First API call (developer flow)
- Landing page → CTA → Conversion (marketing flow)

Finding example: "The path from pricing to signup has 3 unnecessary steps and requires scrolling past 2 screens of content the user has already read."

#### 4.3 Temporal Finding Categories

**Source:** Building Inspector (Robert), Crash Test Engineer (Sana), Food Safety (Adaku)

Add `temporalCategory` to the Finding type:

```typescript
temporalCategory: 'current_defect' | 'emerging_risk' | 'degradation_signal';
```

- **current_defect:** Wrong now. "Missing alt text on hero image."
- **emerging_risk:** Will fail soon. "SSL certificate expires in 14 days."
- **degradation_signal:** Trending toward failure. "jQuery 2.x loaded — last security patch was 2019."

This data model distinction enables the Phase 3 monitoring product. Build the data model now.

#### 4.4 Promise Fulfillment Audit

**Source:** Mystery Shopper (Margot), Film Test Screener (Ines), Building Inspector (Robert)

New pre-scoring primitive: crawl marketing pages, extract explicit and implicit promises, verify each one.

Extract: "99.9% uptime" → verify uptime monitoring signals. "Response in 24 hours" → verify contact form exists and works. "GDPR compliant" → verify privacy page has substantive content. "SOC 2 certified" → verify badge links to real attestation.

This is the highest-signal dimension for non-technical evaluators. No automated tool currently does it.

#### 4.5 Error State Auditing

**Source:** Crash Test Engineer (Sana), Pentester (Kai), Building Inspector (Robert)

Navigate to deliberately wrong URLs and evaluate responses:
- /asdfghjkl → Does the 404 maintain navigation? Does it leak stack traces?
- /admin, /api/v1, /wp-admin → Does it reveal technology stack?
- /api/* → Does it return HTML error pages instead of JSON?

Submit forms with boundary-case inputs:
- Empty required fields → Helpful error messages?
- Maximum-length strings → Truncation or breakage?
- Special characters → XSS or display issues?

Quality of error handling is the most revealing signal about overall engineering quality.

#### 4.6 Third-Party Dependency Health

**Source:** Pentester (Kai), Building Inspector (Robert), Food Safety (Adaku)

Enumerate third-party services loaded on page and check health:
- JavaScript library versions against known vulnerability databases (RetireJS/Snyk DB)
- Third-party services for deprecation notices, outages, EOL status
- CDN configuration for security headers
- Analytics/tracking script legitimacy

Digital supply chain risk: the builder's product fails because of their dependencies, not their code.

### Tier 2: Add Before Phase 1

| Enhancement | Source | Description |
|-------------|--------|-------------|
| Component audit mode | Crash Test (Sana), Food Safety (Adaku) | `ae audit https://example.com/signup --scope form` — scoped audits of single endpoints/forms/flows. Cheaper, faster, CI/CD-friendly. |
| DNS/certificate health | Pentester (Kai), Inspector (Robert) | DMARC, SPF, DNSSEC, cert chain, CAA. Deterministic, no LLM. Bolt onto Quick Check. |
| Multiplicity correction | Biostatistician (Hamid), Crash Test (Sana) | Benjamini-Hochberg FDR control on finding set. 40-70 checks at 10% FP rate guarantees false positives — correct before output. |
| Probable origin on findings | Food Safety (Adaku) | Cross-product pattern DB powers: "This canonical URL issue is commonly caused by default Next.js metadata config." Transforms "what's wrong" → "what's wrong + where it came from." |
| Screening vs diagnosis stats | Biostatistician (Hamid) | Quick Check: maximize sensitivity (catch everything). Full Audit: maximize specificity (everything reported is real). Different confidence thresholds per tier. |
| Consumer-readable ratings | Crash Test (Sana), Film (Ines) | Dimension-level visual system (pass/fail/warning) alongside numerical scores. Numbers don't drive behavior; visual systems do. |

---

## 5. Finding Type Extensions

Based on cross-panel consensus, the Finding type should gain these fields:

```typescript
// Extensions to Finding (additive, not breaking)
interface FindingExtensions {
  temporalCategory: 'current_defect' | 'emerging_risk' | 'degradation_signal';
  probableOrigin?: string;       // From cross-product pattern DB
  journeyContext?: string;       // Which flow this finding affects
  promiseBroken?: string;        // Which marketing claim this contradicts
  blastRadius?: 'local' | 'flow' | 'product' | 'external';  // Impact scope
}
```

These are additive — they don't break the frozen types, they extend them.

---

## 6. Pipeline Architecture Change

### Current Pipeline
```
URL → URLValidator → CrawlEngine → CrawlResult → PageSummarizer → PageSummary[]
    → AuditPrimitive.run() → Envelope<Finding[]> → Synthesis → Render
```

### Recommended Pipeline (web V1)
```
URL → URLValidator → DiscoveryPhase → DiscoveryResult
    → CrawlEngine → CrawlResult → PageSummarizer → PageSummary[]
    → JourneyExtractor → Journey[]
    → AuditPrimitive.run(crawl, summaries, journeys, discovery) → Envelope<Finding[]>
    → MultiplicityCorrection → Finding[]
    → Synthesis → Render
```

New stages:
1. **DiscoveryPhase** — subdomains, exposed files, source maps, CT logs (deterministic, <10s)
2. **JourneyExtractor** — identifies multi-page flows from navigation structure
3. **MultiplicityCorrection** — Benjamini-Hochberg FDR before synthesis

---

## 7. Cross-Reference with Codex's Endpoint Coverage Audit

Codex's `ENDPOINT-COVERAGE-AUDIT.md` correctly identified:
- Two endpoint universes (Alien Eyes own interfaces vs target surfaces) — **confirmed by all panels**
- Only website auditing is design-complete — **confirmed, now with structural evidence for WHY**
- 9 target surface families — Panel A validated and ranked all 9 by feasibility
- Missing Alien Eyes product endpoints (cancel_audit, list_audits, etc.) — **still valid, unchanged**
- 4-layer test matrix (contract, workflow, adversarial, evidence) — **endorsed by crash test engineer**

Codex's recommended next-docs:
1. `INTERFACE-INVENTORY.md` — **still needed** (Alien Eyes' own interfaces)
2. `API-SPEC.md` — **defer** until V1 web ships
3. `MCP-SPEC.md` — **priority** after web PMF (our only no-incumbent surface)
4. `GITHUB-SPEC.md` — **defer** (OSSF Scorecard is strong incumbent)
5. `TARGET-SURFACES.md` — **superseded** by this document
6. `TEST-MATRIX.md` — **defer** until methodology v0.2

---

## 8. Strategic Recommendation

### Phase 0: Ship Web (Now → PMF)

Build the web audit product as planned. Add these enhancements from Panel B:

| Enhancement | WU Impact | Cost | When |
|-------------|-----------|------|------|
| Discovery phase | +1 WU | Low (deterministic) | During WU-02 (primitives) |
| Temporal finding categories | Type extension only | Zero | During WU-00 (types) |
| Error state auditing | +0.5 WU (add to existing primitives) | Low | During WU-02 |
| Third-party dependency health | +0.5 WU | Low (deterministic) | During WU-02 |
| Multiplicity correction | +0.5 WU (add to synthesis) | Low | During WU-03 |
| Probable origin field | Type extension only | Zero | During WU-00 |

Total impact: ~2.5 additional WUs. High value, low cost, no architectural risk.

**Defer to after V1 launch:** Journey/flow testing, promise fulfillment, component audit mode. These are valuable but add complexity to an already ambitious V1.

### Phase 1: MCP Server Auditing (After Web PMF)

The ONLY non-web surface to pursue. Reasons:
1. No incumbent (MCP is 6 months old)
2. Rhumb integration is native (audit findings = AN Score)
3. Agent-nativeness rubric maps 1:1
4. Strategic positioning as THE quality standard for MCP servers

Requirements:
- TYPE-SPEC v2.0 with discriminated unions
- Methodology v0.2 with MCP-specific dimensions
- MCP-specific evidence model
- MCP-specific scenario grammar primitives
- SSE/HTTP transport only in Phase 1 (stdio requires Docker)

### ADR-017: Single Surface Until PMF

**Decision:** Alien Eyes will not begin engineering work on any non-web surface until web auditing reaches:
- 1,000 paid audits completed
- <5% false positive rate (measured, not estimated)
- Positive unit economics (LTV > CAC + COGS)
- Net Revenue Retention > 100%

**Exception:** MCP server auditing may begin after 500 paid web audits if Rhumb integration timeline requires it.

**Rationale:** Each surface requires multiplicative investment. Premature expansion produces mediocre results on 4 surfaces instead of excellent results on 1. Every non-web surface except MCP has funded incumbents with years of domain expertise.

### Phase 2: MCP Stdio + DNS

After MCP SSE/HTTP proves viable:
- Add MCP stdio transport (requires Docker sandboxing)
- Bolt DNS/infrastructure checks onto Quick Check (1 WU, deterministic, free tier value)

### Never Build

- REST API auditing (Postman wins — $5.6B company, 500x engineering budget)
- CLI auditing (ShellCheck, bats-core are free and deeply expert)
- Package auditing (Snyk wins — $8.5B company)
- Webhook auditing (infrastructure-heavy, requires public listener, low demand)

---

## 9. Architecture Principles for Future Expansion

When (not if) MCP expansion happens, these principles from the panels must govern the work:

1. **New types, not stretched types.** `MCPIntrospectionResult` is a new type, not fields crammed into `CrawlResult`. Accept TYPE-SPEC v2.0 with discriminated unions.

2. **Surface-specific methodology.** Each surface gets its own dimension map, rubrics, and weight vector. Do not attempt to make SEO or WCAG Accessibility apply to MCP servers.

3. **Surface-specific evidence.** `MCPEvidence { toolDefinition, requestPayload, responsePayload, schemaVersion }` — not DOM hashes and screenshots.

4. **Surface-specific grammar.** Budget 30-50 scenario primitives per new surface across 5 axes. The composition engine is shared. The primitives are not.

5. **Calibration before launch.** 200+ audits per surface with manual FP review before claiming production readiness on that surface.

---

## 10. Panels Source Index

| Panel | Expert Count | Output Location |
|-------|-------------|-----------------|
| Panel A: Target Surface Specialists | 10 | Agent output (inline) |
| Panel B: Abstract/Adjacent Experts | 7 | `research/panels/panel-round2-surface-coverage.md` |
| Panel C: Adversarial Reviewers | 6 | Agent output (inline) |
| Codex: Endpoint Coverage Audit | N/A | `docs/ENDPOINT-COVERAGE-AUDIT.md` |
| Codex: Persona Methodology | N/A | `docs/PERSONA-METHODOLOGY.md` |

---

## 11. Key Insight Summary

| # | Insight | Source | Priority |
|---|---------|--------|----------|
| 1 | Types, methodology, evidence, and grammar are all web-locked | Panel C (all 6) | CRITICAL |
| 2 | MCP is the only no-incumbent surface worth pursuing | Panel A + Panel C | HIGH |
| 3 | Discovery phase catches 40-60% of critical findings | Panel B (Kai, Robert, Adaku) | HIGH |
| 4 | Journey/flow testing catches systemic issues page-level misses | Panel B (Ines, Margot, Sana) | HIGH |
| 5 | Temporal finding categories enable the monitoring product | Panel B (Robert, Sana, Adaku) | HIGH |
| 6 | Promise fulfillment is the highest-signal dimension for non-technical users | Panel B (Margot, Ines) | MEDIUM |
| 7 | Multiplicity correction is statistically mandatory | Panel B (Hamid) | MEDIUM |
| 8 | Ship web, reach PMF, THEN expand — not before | Panel C (Victoria, Mikhail) | HIGH |
| 9 | Each surface requires multiplicative, not incremental, investment | Panel C (Victoria) | HIGH |
| 10 | Probable origin transforms findings from "what's wrong" to "how to prevent recurrence" | Panel B (Adaku) | MEDIUM |

---

## Hard Conclusion

The multi-surface vision is real and important. But it is a 3-year vision, not a V1 feature. The current architecture is web-specific by design — not by accident, not by oversight, but because the types, methodology, evidence, and grammar were all designed for web. This is correct for V1.

Ship web. Make it excellent. Reach PMF. Then expand to MCP — the one surface where Alien Eyes has structural advantage and no incumbent. Everything else is a distraction that dilutes focus and burns cash.

The 6 web-only enhancements from Panel B (discovery, temporal categories, error states, dependency health, multiplicity correction, probable origin) are higher-value, lower-cost, and lower-risk than any surface expansion. Do those first.
