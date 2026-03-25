# Alien Eyes — Full Vision Specification

> Version: 1.0 | Date: 2026-03-11
> Status: DESIGN-COMPLETE. Master synthesis of 4 expert panels (29 experts, ~12,600 lines).
> Purpose: Reference specification for the full multi-surface Alien Eyes vision. This document does NOT expand Phase 0 scope. For current build scope, read `docs/CANONICAL-BUILD-SCOPE.md` first.
> Sources:
>   - Panel A: `docs/MULTI-SURFACE-METHODOLOGY.md` — MCP, REST API, GraphQL, Webhook (7 experts)
>   - Panel B: `docs/MULTI-SURFACE-SPEC.md` — CLI, Package, GitHub, Docs (7 experts)
>   - Panel C: `research/panels/panel-round3-cross-surface-metrology.md` — Cross-surface evaluation theory (7 experts)
>   - Panel D: `docs/PLATFORM-ARCHITECTURE.md` — Enterprise, monitoring, CI/CD, personas, methodology v0.2, grammar v2.0, badges, patterns (8 experts)
> Foundational: `docs/TYPE-SPEC.md` (frozen v1.0), `docs/METHODOLOGY-v0.1.md`, `PRODUCT-SPEC.md` (v3.0), `docs/WORK-UNITS.md` (25 WUs)

---

## Part 1: Vision Summary

### Product Definition

Alien Eyes is an agent-native multi-surface auditing product that evaluates digital products — websites, APIs, MCP servers, CLI tools, packages, repositories, and documentation — from the outside, for both human users and AI agent consumers. The core experience: builder provides a target, Alien Eyes crawls/probes from perspectives the builder cannot have, findings are structured for direct paste into a coding agent, the agent fixes, the builder re-tests. Two loops took supertrained.ai from "critical SEO issue" to clean. The clipboard is the product. Every finding carries immutable evidence. Scores are probabilistic, not pass/fail. The accumulated pattern data across all audits creates a cross-product intelligence layer that no single-surface tool can replicate.

### Core Loop

```
Target Input (URL, package, repo, MCP server, API endpoint, CLI name)
  → Surface Detection & Triage (10-30s per surface)
  → Collection Engine (surface-specific: crawl, introspect, probe, install)
  → CollectionResult (discriminated union by surface)
  → Summarizer (surface-specific → SurfaceSummary, 2-5K tokens)
  → Persona & Scenario Selection (grammar-driven, deterministic or probabilistic)
  → Audit Primitives (surface-specific dimensions + universal dimensions)
  → BH FDR Correction (controls false discovery at 10%)
  → Synthesizer (de-duplicate, chain, score, cross-surface patterns)
  → Payload Renderer (Format A/B/C/JSON/SARIF/JUnit/Badge)
  → Builder pastes → Agent fixes → Re-test → Loop converges
```

### Principles Table

| # | Principle | Product Feature Expression |
|---|-----------|--------------------------|
| 1 | **Agent-native first** | Every surface audited BY agents AND FOR agent-nativeness. Atomic primitives. Structured outputs. MCP server as delivery surface. AN Score per surface feeds Rhumb. |
| 2 | **Probabilistic as possible** | Satisfaction scores 0-100 with confidence intervals. Multi-run averaging (premium). BH FDR correction mandatory. Credibility weighting for new surfaces. Coverage confidence reported alongside every score. |
| 3 | **Discovery-led** | Teresa Torres opportunity tree. Every finding is a potential opportunity. Pattern database reveals what to build next. Surface triage discovers all auditable surfaces before deep evaluation. |
| 4 | **EOS** | Weekly scorecard (audits, findings, FP rate, conversion, COGS). Quarterly Rocks mapped to build phases. L10 issues list tracks blockers. Product generates its own measurable metrics. |
| 5 | **AEO/GEO/MEO optimized** | Four-layer stack evaluated per surface. MEO (semantic coherence) is a universal dimension. Web audits check semantic HTML, structured data, topical clustering. API audits check schema semantic clarity. MCP audits check tool naming precision. |
| 6 | **MEO as base layer** | Alien Eyes itself is MEO-optimized: semantic HTML, JSON-LD, topical coherence. Every surface's MEO evaluation measures how well AI systems can understand and represent the target product. |

---

## Part 2: Surface Registry

### Surface Type Enumeration

```typescript
type SurfaceType =
  | 'web'         // Phase 0
  | 'mcp'         // Phase 2
  | 'rest-api'    // Phase 2
  | 'graphql'     // Phase 3
  | 'cli'         // Phase 3
  | 'package'     // Phase 3
  | 'repo'        // Phase 3
  | 'docs'        // Phase 3
  | 'webhook';    // Phase 3 (deferred, infrastructure-heavy)
```

### Surface Registry Table

| Surface | Collection Method | Result Type | Dimensions | Quick Check? | Grammar Size | MEO Applicability | Build Phase | Est. Hours | Reference Doc |
|---------|------------------|-------------|------------|--------------|-------------|-------------------|-------------|-----------|---------------|
| **Web** | Playwright crawl, clean browser profiles | `CrawlResult` | 6 (seo, a11y, security, perf, AN, copy-ux) | Yes (SEO+perf+a11y, deterministic) | 27,440 | Semantic HTML, structured data, topical clustering, entity disambiguation | Phase 0 | ~59h (25 WUs) | `WORK-UNITS.md` |
| **MCP** | MCP client (SSE/HTTP/stdio), initialize, tools/list, probe tools, error tests | `MCPIntrospectionResult` | 7 (schema, reliability, errors, AN, security, protocol, dx) | Yes (schema+protocol+reliability) | 1,728 | Tool naming semantic precision, description quality for LLM comprehension | Phase 2 | ~34h (8 WUs) | `MULTI-SURFACE-METHODOLOGY.md` Expert 1 |
| **REST API** | OpenAPI parse, endpoint discovery, safe probing, auth/rate/CORS/error tests | `APIProbeResult` | 9 (spec, contract, errors, auth, ratelimit, security, AN, versioning, dx) | Yes (spec+security+ratelimit+contract) | 2,268 | Schema semantic clarity, field naming consistency, docs-to-behavior alignment | Phase 2 | ~36h (8 WUs) | `MULTI-SURFACE-METHODOLOGY.md` Expert 2 |
| **GraphQL** | Introspection query, schema analysis, complexity/depth testing, batching, auth | `GraphQLIntrospectionResult` | 7 (schema, safety, errors, perf, auth, AN, dx) | Yes (schema deterministic+safety+auth) | 1,680 | Type/field naming semantic coherence, description coverage, schema self-documentation | Phase 3 | ~29h (7 WUs) | `MULTI-SURFACE-METHODOLOGY.md` Expert 3 |
| **CLI** | Docker sandbox, install, --help, --version, subcommand discovery, exercise commands | `CLIProbeResult` | 8 (install-exp, discoverability, errors, composability, AN, supply-chain, docs, maintenance) | Yes (install+composability+maintenance) | est. 1,500 | Help text semantic quality, man page coherence, error message clarity | Phase 3 | ~30h (9 WUs) | `MULTI-SURFACE-SPEC.md` Section 2 |
| **Package** | Registry API + tarball static analysis, NO execution | `PackageProbeResult` | 8 (docs, install-exp, trustworthiness, supply-chain, maintenance, AN, composability, discoverability) | Yes (install+trust+maintenance) | est. 1,200 | README meaning density, description accuracy, type definition quality | Phase 3 | ~23h (8 WUs) | `MULTI-SURFACE-SPEC.md` Section 3 |
| **Repo** | GitHub API (read-only), no code execution | `RepoProbeResult` | 8 (docs, maintenance, trust, security, contributor-exp, AN, onboarding, composability) | Yes (maintenance+trust+security) | est. 1,200 | README-to-code alignment, issue template clarity, contribution guide coherence | Phase 3 | ~23h (8 WUs) | `MULTI-SURFACE-SPEC.md` Section 4 |
| **Docs** | Layers on web crawl + doc-specific extractors | `DocsCollectionResult` | 8 (docs-quality, onboarding, discoverability, errors, AN, maintenance, composability, perf) | Yes (discoverability+maintenance+perf) | est. 1,200 | Topical hierarchy, semantic navigation, concept prerequisite chains | Phase 3 | ~21h (8 WUs) | `MULTI-SURFACE-SPEC.md` Section 5 |
| **Webhook** | Temporary HTTPS listener, register callback, receive events, test retries/signing | `WebhookProbeResult` | 6 (delivery, signing, retry, schema, dx, AN) | No (requires listener infra) | 864 | Event schema semantic clarity, documentation quality | Phase 3 (deferred) | ~22h (5 WUs) | `MULTI-SURFACE-METHODOLOGY.md` Expert 5 |

**Total grammar configurations across all surfaces: ~39,080+**

---

## Part 3: Unified Type System (TYPE-SPEC v2.0)

TYPE-SPEC v1.0 is FROZEN (`docs/TYPE-SPEC.md`). The types below are v2.0 ADDITIVE changes. v1.0 types become the `web` variant of each union. Zero breaking changes.

> **CONFLICT RESOLUTION:** Panel A defines `CollectionResult` as `{ surface: string; data: T }` wrapper objects. Panel B defines it using `extends BaseCollectionResult` with `surface` as a field on the type itself. **Resolution:** Adopt Panel B's approach (surface as direct field on the type, via `BaseCollectionResult` interface). It is more ergonomic — primitives access `collection.surface` directly without unwrapping `.data`. Panel A's types are remapped to extend `BaseCollectionResult`. This is a presentation difference, not a semantic one.

### 3.1 CollectionResult (Discriminated Union)

```typescript
/**
 * TYPE-SPEC v2.0 — Universal input for all audit primitives.
 * Replaces CrawlResult as the top-level collection type.
 * The `surface` field is the discriminant.
 */
interface BaseCollectionResult {
  surface: SurfaceType;
  target: string;
  timestamp: string;             // ISO 8601
  totalDurationMs: number;
  methodologyVersion: string;
}

type CollectionResult =
  | WebCrawlResult               // Existing CrawlResult + surface: 'web'
  | MCPIntrospectionResult       // Panel A Expert 1
  | APIProbeResult               // Panel A Expert 2
  | GraphQLIntrospectionResult   // Panel A Expert 3
  | WebhookProbeResult           // Panel A Expert 5
  | CLIProbeResult               // Panel B Section 2
  | PackageProbeResult           // Panel B Section 3
  | RepoProbeResult              // Panel B Section 4
  | DocsCollectionResult;        // Panel B Section 5
```

Full type definitions for each variant are in the respective panel documents. The types are implementation-ready as specified there.

### 3.2 SurfaceSummary (Discriminated Union)

```typescript
/**
 * Compressed representation for LLM consumption. 2-5K tokens per surface.
 * Each variant has a `surface` discriminant field.
 */
type SurfaceSummary =
  | PageSummary                  // Existing, for web (array)
  | MCPServerSummary             // Panel A Expert 1
  | APIServerSummary             // Panel A Expert 2
  | GraphQLServerSummary         // Panel A Expert 3
  | WebhookProducerSummary       // Panel A Expert 5
  | CLISummary                   // Panel B Section 2
  | PackageSummary               // Panel B Section 3
  | RepoSummary                  // Panel B Section 4
  | DocsSummary;                 // Panel B Section 5
```

**Note:** Web uses `PageSummary[]` (array, one per page). All other surfaces use a single summary object. The pipeline handles this: web primitives receive `SurfaceSummary[]`, non-web receive `SurfaceSummary`.

### 3.3 SurfaceEvidence (Discriminated Union)

```typescript
/**
 * Surface-specific proof that a finding is real.
 * Finding.evidence becomes this union type in v2.0.
 * Existing EvidenceBundle becomes the web variant.
 */
type SurfaceEvidence =
  | WebEvidence                  // Existing EvidenceBundle
  | MCPEvidence                  // Panel A Expert 1
  | APIEvidence                  // Panel A Expert 2
  | GraphQLEvidence              // Panel A Expert 3
  | WebhookEvidence              // Panel A Expert 5
  | CLIEvidence                  // Panel B Section 2
  | PackageEvidence              // Panel B Section 3
  | RepoEvidence                 // Panel B Section 4
  | DocsEvidence;                // Panel B Section 5

/**
 * Evidence with optional cross-cutting extensions (from Panel A Experts 6-7).
 * DX and Reliability evidence can augment any surface evidence.
 */
interface EvidenceWithExtensions {
  primary: SurfaceEvidence;
  dx?: DXEvidenceExtension;            // Panel A Expert 6
  reliability?: ReliabilityEvidenceExtension;  // Panel A Expert 7
}
```

### 3.4 Finding Extensions (v2.0)

```typescript
/**
 * Additive fields for Finding type. Existing fields unchanged.
 */
interface FindingV2Extensions {
  /** Surface this finding belongs to (defaults to 'web' for v1 compat) */
  surface?: SurfaceType;

  /** Fault vs quality observation — Panel C Recommendation 4 */
  category?: 'fault' | 'quality';

  /** Temporal classification for monitoring — Panel D Expert 2 */
  temporalCategory?: TemporalFindingCategory;

  /** Persona that discovered this finding — Panel D Expert 4 */
  personaId?: string;

  /** Scenario that produced this finding — Panel D Expert 6 */
  scenarioId?: string;

  /** Monitoring persistence tracking — Panel D Expert 2 */
  firstSeenAuditId?: string;
  firstSeenAt?: string;
  persistenceCount?: number;
  wasEverResolved?: boolean;
  resolvedAt?: string;
  regressedAt?: string;
}
```

### 3.5 AuditPrimitive V2

```typescript
/**
 * V2 primitive interface. Accepts surface-agnostic types.
 * V1 web primitives still work via type narrowing.
 * Source: Panel A synthesis S6.
 */
interface AuditPrimitiveV2 {
  name: string;
  dimension: AuditDimension;
  supportedSurfaces: SurfaceType[];
  requiresOwnershipVerification: boolean;
  usesLLM: boolean;

  run(
    collection: CollectionResult,
    summary: SurfaceSummary | SurfaceSummary[],
    config: AuditConfigV2
  ): Promise<Envelope<Finding[]>>;
}
```

### 3.6 AuditTarget V2

```typescript
/**
 * Replaces simple URL input. Different surfaces need different inputs.
 * Source: Panel A synthesis S7.
 */
type AuditTarget =
  | { surface: 'web'; url: string }
  | { surface: 'mcp'; target: MCPTarget }
  | { surface: 'rest-api'; baseUrl: string; specUrl?: string; authConfig?: APIAuthConfig }
  | { surface: 'graphql'; endpointUrl: string; authConfig?: APIAuthConfig }
  | { surface: 'webhook'; producerBaseUrl: string; registrationEndpoint?: string; authConfig?: APIAuthConfig }
  | { surface: 'cli'; package: string; installMethod: string; version?: string }
  | { surface: 'package'; registry: 'npm' | 'pypi'; name: string; version?: string }
  | { surface: 'repo'; fullName: string }   // "owner/repo"
  | { surface: 'docs'; url: string };

/** Builder purpose declaration — Panel C Recommendation 10 */
interface AuditConfigV2 extends AuditConfig {
  surface: SurfaceType;
  methodologyRegistry: MethodologyRegistry;
  purposeDeclaration?: string;
  orgId?: string;
  customDimensions?: CustomDimensionConfig[];
}
```

### 3.7 SynthesisResult Extensions

```typescript
/**
 * Additive fields for SynthesisResult.
 * Source: Panel C Recommendations 5 and 8.
 */
interface SynthesisResultV2Extensions {
  /** Coverage confidence — how much to trust this score. Panel C Rec 5. */
  coverageConfidence?: Score;
  coverageFactors?: {
    surfaceMaturity: 'established' | 'emerging' | 'experimental';
    collectionCompleteness: number;    // 0-1
    methodologyCalibration: number;    // 0-1
    sampleSize: number;
  };

  /** Cross-surface patterns — root causes spanning surfaces. Panel C Rec 8. */
  crossSurfacePatterns?: CrossSurfacePattern[];

  /** Three-component score — Panel C Section 5 */
  faultScore?: number;       // Deterministic, normalized per exposure unit
  qualityScore?: number;     // LLM-assessed, with confidence interval
}

interface CrossSurfacePattern {
  pattern: string;
  findingIds: string[];
  rootCause: string;
  surfaces: SurfaceType[];
  confidence: number;
}
```

### 3.8 Triage Types

```typescript
/**
 * Multi-surface triage — discover all surfaces before deep evaluation.
 * Source: Panel C Section 7, Recommendation 6.
 */
interface TriageResult {
  discoveredSurfaces: DiscoveredSurface[];
  priorityMap: Record<SurfaceType, 'P0' | 'P1' | 'P2' | 'P3'>;
  budgetAllocation: Record<SurfaceType, number>;
  triageDurationMs: number;
}

interface DiscoveredSurface {
  type: SurfaceType;
  endpoint: string;
  responsive: boolean;
  criticalSignals: string[];
  health: 'critical' | 'degraded' | 'healthy' | 'unresponsive';
}
```

### 3.9 Backwards Compatibility

| v1.0 Type | v2.0 Status | Change |
|-----------|-------------|--------|
| Finding | Extended (additive) | Optional `surface`, `category`, `temporalCategory` fields |
| EvidenceBundle | Preserved | Becomes `WebEvidence` variant of `SurfaceEvidence` |
| CrawlResult | Preserved | Becomes `WebCrawlResult` variant of `CollectionResult` |
| PageSummary | Preserved | Becomes the web variant of `SurfaceSummary` |
| AuditPrimitive | Preserved | V1 primitives still work; V2 uses `AuditPrimitiveV2` |
| AuditConfig | Extended | V2 adds `surface`, `methodologyRegistry`, `purposeDeclaration` |
| AuditDimension | Extended | V2 adds 32+ new dimension codes |
| Envelope | Unchanged | Works for all surfaces |
| SynthesisResult | Extended | V2 adds `coverageConfidence`, `crossSurfacePatterns`, `faultScore`, `qualityScore` |
| PayloadRenderer | Unchanged | Works for all surfaces |

Source: Panel A synthesis S12, Panel B Section 1.

---

## Part 4: Unified Dimension Registry

### 4.1 Universal Dimensions (Apply to ALL Surfaces)

These emerged from Panel C as the five dimensions every evaluable thing must be measured against. Panel A's `agent-nativeness` is confirmed universal. Panel C's five map onto the existing dimension structure.

| Universal Dimension (Panel C) | Code | What It Measures | Maps To |
|-------------------------------|------|-----------------|---------|
| **Purpose Fulfillment** | (composite) | Does it accomplish what it exists to do? | copy-ux (web), AN (all), composability (CLI/package) |
| **Safety / Trust** | (composite) | Can you trust it not to harm you? | security (web/API), supply-chain (CLI/package), signing (webhook) |
| **Documentation Quality** | `documentation-quality` | Can a third party understand it? | dx-docs, mcp-dx, api-dx, gql-dx, wh-dx |
| **Standards Compliance** | (composite) | Does it meet relevant standards? | seo (web), mcp-protocol (MCP), POSIX (CLI) |
| **Resilience / Maintainability** | `maintenance-health` | Will it continue to work over time? | rel-* dimensions, maintenance-health (CLI/package/repo/docs) |

**Agent-Nativeness** (`agent-nativeness`) is the ONLY dimension that appears with its own weight vector entry in EVERY surface methodology. It is the product's signature dimension.

### 4.2 Dimension-to-Surface Map

| Dimension Code | Web | MCP | REST | GQL | CLI | Pkg | Repo | Docs | WH | Source |
|----------------|-----|-----|------|-----|-----|-----|------|------|----|--------|
| `agent-nativeness` | 0.15 | 0.20 | 0.15 | 0.15 | 0.15 | 0.10 | 0.10 | 0.10 | 0.10 | All panels |
| `seo` | 0.15 | - | - | - | - | - | - | - | - | Existing |
| `accessibility` | 0.20 | - | - | - | - | - | - | - | - | Existing |
| `security` | 0.15 | - | - | - | - | - | 0.15 | - | - | Existing + Panel B |
| `performance` | 0.15 | - | - | - | - | - | - | 0.05 | - | Existing + Panel B |
| `copy-ux` | 0.20 | - | - | - | - | - | - | - | - | Existing |
| `mcp-schema` | - | 0.20 | - | - | - | - | - | - | - | Panel A E1 |
| `mcp-reliability` | - | 0.20 | - | - | - | - | - | - | - | Panel A E1 |
| `mcp-errors` | - | 0.15 | - | - | - | - | - | - | - | Panel A E1 |
| `mcp-security` | - | 0.10 | - | - | - | - | - | - | - | Panel A E1 |
| `mcp-protocol` | - | 0.05 | - | - | - | - | - | - | - | Panel A E1 |
| `mcp-dx` | - | 0.10 | - | - | - | - | - | - | - | Panel A E1 |
| `api-spec` | - | - | 0.10 | - | - | - | - | - | - | Panel A E2 |
| `api-contract` | - | - | 0.15 | - | - | - | - | - | - | Panel A E2 |
| `api-errors` | - | - | 0.15 | - | - | - | - | - | - | Panel A E2 |
| `api-auth` | - | - | 0.10 | - | - | - | - | - | - | Panel A E2 |
| `api-ratelimit` | - | - | 0.05 | - | - | - | - | - | - | Panel A E2 |
| `api-security` | - | - | 0.15 | - | - | - | - | - | - | Panel A E2 |
| `api-versioning` | - | - | 0.05 | - | - | - | - | - | - | Panel A E2 |
| `api-dx` | - | - | 0.10 | - | - | - | - | - | - | Panel A E2 |
| `gql-schema` | - | - | - | 0.20 | - | - | - | - | - | Panel A E3 |
| `gql-safety` | - | - | - | 0.20 | - | - | - | - | - | Panel A E3 |
| `gql-errors` | - | - | - | 0.10 | - | - | - | - | - | Panel A E3 |
| `gql-performance` | - | - | - | 0.10 | - | - | - | - | - | Panel A E3 |
| `gql-auth` | - | - | - | 0.15 | - | - | - | - | - | Panel A E3 |
| `gql-dx` | - | - | - | 0.10 | - | - | - | - | - | Panel A E3 |
| `wh-delivery` | - | - | - | - | - | - | - | - | 0.25 | Panel A E5 |
| `wh-signing` | - | - | - | - | - | - | - | - | 0.25 | Panel A E5 |
| `wh-retry` | - | - | - | - | - | - | - | - | 0.15 | Panel A E5 |
| `wh-schema` | - | - | - | - | - | - | - | - | 0.15 | Panel A E5 |
| `wh-dx` | - | - | - | - | - | - | - | - | 0.10 | Panel A E5 |
| `install-experience` | - | - | - | - | 0.20 | 0.10 | - | - | - | Panel B |
| `discoverability` | - | - | - | - | 0.15 | 0.05 | - | 0.15 | - | Panel B |
| `error-handling` | - | - | - | - | 0.15 | - | - | 0.10 | - | Panel B |
| `composability` | - | - | - | - | 0.15 | 0.05 | 0.05 | 0.05 | - | Panel B |
| `supply-chain` | - | - | - | - | 0.10 | 0.20 | - | - | - | Panel B |
| `documentation-quality` | - | - | - | - | 0.05 | 0.15 | 0.15 | 0.25 | - | Panel B |
| `maintenance-health` | - | - | - | - | 0.05 | 0.15 | 0.25 | 0.10 | - | Panel B |
| `trustworthiness` | - | - | - | - | - | 0.20 | 0.15 | - | - | Panel B |
| `onboarding` | - | - | - | - | - | - | 0.05 | 0.20 | - | Panel B |
| `contributor-experience` | - | - | - | - | - | - | 0.10 | - | - | Panel B |

Values are weights (sum to 1.0 per surface). `-` means dimension does not apply to that surface.

### 4.3 Cross-Surface DX Dimensions (Panel A Expert 6)

These overlay dimensions apply to ALL HTTP-based surfaces and are scored as sub-components of the surface-specific DX dimension:

| DX Dimension | Code | Applies To |
|-------------|------|-----------|
| Time-to-First-Success | `dx-ttfs` | All |
| Error Message Quality | `dx-errors` | All |
| Documentation Completeness | `dx-docs` | All |
| Onboarding Friction | `dx-onboarding` | All |
| Self-Documentation | `dx-selfdoc` | All |
| Error Recoverability | `dx-recovery` | All |
| SDK/Client Quality | `dx-sdk` | REST, GraphQL |
| Changelog/Migration | `dx-changelog` | All |

### 4.4 Cross-Surface Reliability Dimensions (Panel A Expert 7)

| Reliability Dimension | Code | Applies To |
|----------------------|------|-----------|
| Health Endpoints | `rel-health` | REST, GraphQL, MCP (HTTP) |
| Timeout Behavior | `rel-timeout` | All |
| Rate Limit Transparency | `rel-ratelimit` | REST, GraphQL |
| Graceful Degradation | `rel-degradation` | All |
| Backpressure Signaling | `rel-backpressure` | All |
| Versioning Stability | `rel-versioning` | REST, GraphQL, MCP |
| Idempotency | `rel-idempotency` | REST (writes), MCP (tools) |
| Connection Lifecycle | `rel-connection` | MCP, GraphQL (subscriptions) |

### 4.5 Total Dimension Count

| Category | Count | Source |
|----------|-------|--------|
| Web-specific | 6 | `METHODOLOGY-v0.1.md` |
| MCP-specific | 6 | Panel A Expert 1 |
| REST API-specific | 8 | Panel A Expert 2 |
| GraphQL-specific | 6 | Panel A Expert 3 |
| Webhook-specific | 5 | Panel A Expert 5 |
| CLI/Package/Repo/Docs | 10 | Panel B |
| Cross-surface DX | 8 | Panel A Expert 6 |
| Cross-surface Reliability | 8 | Panel A Expert 7 |
| Universal (agent-nativeness) | 1 | All panels |
| **Total unique codes** | **~58** | |

---

## Part 5: MEO Integration Layer

This section is NEW — not covered by any panel. It defines how Alien Eyes evaluates MEO (Meaning Engine Optimization) across all surfaces. MEO measures semantic coherence for embeddings and vector space — whether AI systems can correctly understand, represent, and cite the target product.

### 5.1 MEO as Universal Audit Sub-Dimension

MEO is evaluated as a sub-component of the surface-specific documentation/DX dimension for non-web surfaces, and as its own dimension for web. The evaluation question is always: **"Can an AI system that encounters this product correctly understand what it does, who it's for, and how to use it?"**

### 5.2 Per-Surface MEO Evaluation

| Surface | MEO Checks | Method | Severity |
|---------|-----------|--------|----------|
| **Web** | Semantic HTML (proper heading hierarchy, landmark roles). Structured data (JSON-LD, schema.org). Topical clustering (pages organized by topic, not randomly). Entity disambiguation (product name unique, not confused with other products). OG/meta alignment with page content. | Deterministic (HTML parsing) + LLM (semantic assessment) | MEDIUM (missing JSON-LD), HIGH (contradictory meta vs content), LOW (suboptimal heading hierarchy) |
| **MCP** | Tool naming semantic precision (does `get_data` accurately describe what it returns?). Description quality for LLM comprehension (can an agent select the right tool from description alone?). Consistent naming convention across tools. Resource URI semantic clarity. | LLM (Sonnet, judging semantic precision) | HIGH (ambiguous tool names), MEDIUM (missing descriptions), LOW (inconsistent naming) |
| **REST API** | Schema semantic clarity (field names self-documenting). Documentation-to-behavior alignment (does the spec accurately describe what the API does?). Endpoint naming RESTful conventions. Error message semantic clarity. | Deterministic (naming pattern check) + LLM (alignment assessment) | MEDIUM (non-RESTful naming), HIGH (spec contradicts behavior), LOW (verbose field names) |
| **GraphQL** | Type/field naming semantic coherence. Description coverage (what % of types/fields have descriptions). Schema self-documentation quality. Enum value naming clarity. | Deterministic (coverage check) + LLM (quality assessment) | MEDIUM (low description coverage), HIGH (misleading type names), LOW (missing enum descriptions) |
| **CLI** | Help text semantic quality (does --help communicate what each command does?). Man page coherence. Error message clarity (can you understand what went wrong from the error alone?). Flag naming conventions (--verbose vs -v consistency). | LLM (Haiku, judging clarity) | MEDIUM (unhelpful error messages), HIGH (--help missing or cryptic), LOW (inconsistent flag naming) |
| **Package** | README meaning density (does the README convey what the package does in the first paragraph?). Description accuracy in registry (npm description vs actual functionality). Type definition quality (do exported types have JSDoc?). | LLM (Haiku) + Deterministic (field presence) | MEDIUM (misleading description), HIGH (README absent or vacuous), LOW (missing JSDoc on types) |
| **Repo** | README-to-code alignment (does the README describe what the code actually does?). Issue template clarity. PR template quality. CONTRIBUTING.md semantic completeness. | LLM (Sonnet, alignment assessment) | MEDIUM (stale README), HIGH (README describes different project), LOW (missing CONTRIBUTING.md) |
| **Docs** | Topical hierarchy (are docs organized by concept, not arbitrary structure?). Semantic navigation (can you find what you need from the sidebar alone?). Concept prerequisite chains (do advanced topics link back to prerequisites?). Getting-started-to-reference coherence. | LLM (Sonnet, structural assessment) | MEDIUM (poor topic organization), HIGH (missing getting-started), LOW (no cross-referencing) |

### 5.3 MEO Scoring Formula

MEO is assessed as a sub-score within the appropriate dimension per surface:

- **Web:** MEO checks contribute to the `seo` dimension (structured data, semantic HTML) and a future dedicated `meo` dimension
- **Non-web surfaces:** MEO checks contribute to the surface-specific DX dimension (e.g., `mcp-dx`, `api-dx`, `gql-dx`, `documentation-quality`)

The scoring follows the same severity-deduction model as all other dimensions (METHODOLOGY-v0.1 Section 2.2).

### 5.4 Alien Eyes Own MEO

Alien Eyes itself must practice what it measures:

| Our Surface | MEO Implementation |
|-------------|-------------------|
| alieneyes.dev | JSON-LD (SoftwareApplication + Organization), semantic HTML, topical page structure, OG tags aligned with content |
| CLI (`ae`) | Semantic --help text, clear error messages, consistent flag naming |
| MCP server | Precise tool descriptions, typed parameters, meaningful resource URIs |
| REST API | OpenAPI spec with descriptions, RESTful naming, self-documenting error codes |
| Documentation | Topic-based hierarchy, getting-started-first, concept prerequisites linked |
| npm/PyPI packages | Accurate description, quality README, JSDoc on all exports |

---

## Part 6: Platform Features

All specifications are implementation-ready in `docs/PLATFORM-ARCHITECTURE.md`. This section indexes the key decisions.

### 6.1 Enterprise (Panel D Expert 1: Victoria Chen)

| Feature | Team ($99-199/mo) | Enterprise (Custom) |
|---------|-------------------|---------------------|
| Team accounts | Up to 10 seats | Unlimited |
| Roles | Admin, Auditor, Viewer | + Custom roles |
| SSO | GitHub OAuth | SAML + OIDC |
| Audit trail | 1-year retention | 7-year retention |
| Custom dimensions | No | Yes |
| White-label reports | No | Yes |
| Data residency | US only | US, EU, AP |
| Worker pool | Shared | Dedicated |
| SLA | Best effort | 99.9% uptime |

**Data model:** Organizations, Memberships, AuditTrailEntry (append-only), SSOConfig, WhiteLabelConfig, CustomDimensionConfig.
**Security:** Multi-tenancy via RLS + org_id. SSO certificates encrypted at rest. Audit trail immutable (no UPDATE/DELETE). SCIM deferred.
**WUs:** 10 WUs, 33h. Phase 3-4.

### 6.2 Continuous Monitoring (Panel D Expert 2: Dr. Marcus Webb)

**Core concept:** Transform episodic auditing into continuous monitoring. Quick Check daily, Full Audit weekly. Health score = rolling composite over 4-audit window with trend detection.

**Key types:** MonitorConfig, HealthScore, Alert, SLODefinition, TemporalFindingCategory (current_defect, emerging_risk, degradation_signal, resolved, regression, flapping).

**Alerting:** SLO violation, regression, new critical, score degradation (>10 pts), flapping. Channels: email, webhook, Slack, PagerDuty.

**COGS reality:** Daily Quick Check ($0.10) + weekly Full Audit ($2.50) = ~$13/mo COGS per URL. Pricing: $9-59/mo per URL by tier.
**WUs:** 10 WUs, 33h. Phase 2-3.

### 6.3 CI/CD Integration (Panel D Expert 3: Ravi Patel)

**Core concept:** Alien Eyes as a PR check. Deterministic mode (seeded RNG), SARIF + JUnit output, threshold-based pass/fail, regression detection.

**GitHub Action:** `alien-eyes/audit-action@v1`. Supports cloud and local mode. Configurable thresholds per dimension.

**Key features:** Wait-for-URL (preview deployments), baseline comparison (auto = latest audit for URL), ignored findings with expiry, PR comment with summary.

**Default:** Quick Check ($0.10) in CI. Full Audit requires explicit opt-in to prevent cost explosion.
**WUs:** 12 WUs, 28h. Phase 2-3.

### 6.4 Badge & Certification System (Panel D Expert 7: James Moreau)

**Core concept:** "Tested by Alien Eyes" badge. SVG badge + JS widget + verification page + JSON-LD. Badges EXPIRE (30-90 days by tier). Continuous monitoring extends validity.

**Tiers:** Tested (>50 score), Verified (>70), Excellent (>85), Agent-Ready (>70 AN score).

**Anti-fraud:** Verification API checks badge authenticity. Fraud detection for misuse (badge displayed without valid certificate). Revocation on score drop below tier threshold.

**Rhumb integration:** Badges feed Rhumb's trust signals. "Agent-Ready" tier is the quality gate for Rhumb directory listing.
**WUs:** 10 WUs, 22h. Phase 2-3.

### 6.5 Cross-Product Pattern Database (Panel D Expert 8: Dr. Sophia Torres)

**The moat.** Every audit extracts anonymized finding patterns. Patterns enable:
1. **Benchmarking** — "67% of Next.js sites have this issue"
2. **FP prediction** — ML model trained on resolved findings
3. **Rhumb export** — AN Scores, token benchmarks, schema fingerprints
4. **Content marketing** — findings-as-content, "most common mistakes" posts

**Pipeline:** Finding → Anonymization (strip URL, user, specific content) → Validation → Embedding (pgvector) → Similarity matching → Stack clustering → Benchmark materialization.

**Privacy:** Default private. Pattern-to-audit links deleted after 90 days. Anonymous patterns retained indefinitely. Failed anonymization = pattern blocked.
**WUs:** 12 WUs, 37h. Phase 1-3.

---

## Part 7: Methodology v0.2 Path

Source: Panel D Expert 5 (Professor David Chang) + Panel C calibration architecture.

### 7.1 Multi-Run Consensus

Premium audits run the same audit N times (default N=3) with different persona/scenario selections. Findings present in 2-of-3 runs are confirmed. Findings in only 1-of-3 are flagged as low-confidence. Scores are averaged across runs.

**Cost implication:** Triples LLM cost. Reserved for Professional/Enterprise tier. Quick Check remains single-run.

### 7.2 Benjamini-Hochberg FDR Correction

When an audit produces many findings across many dimensions, some will be false discoveries by chance. BH correction controls false discovery rate at 10% (configurable).

**Algorithm:** Sort p-values ascending. For each finding i with p-value p_i: reject if p_i <= (i/m) * alpha, where m = total findings, alpha = 0.10. Applied in the Synthesizer after all primitives complete.

> **CONFLICT:** Panel A mentions BH in the pipeline diagram. Panel D Expert 5 specifies it as ADR-021. The existing METHODOLOGY-v0.1 does not include it. **Resolution:** BH correction is a METHODOLOGY-v0.2 feature. It ships with the first multi-surface expansion (Phase 2), not in Phase 0 web-only launch. ADR-021 records this decision. The Synthesizer must be architectured to support it from the start (pluggable correction step), but the correction is disabled for v0.1.

### 7.3 Gauge R&R Validation

Before any methodology version goes live, run Gauge Repeatability & Reproducibility:
- **Repeatability:** Same audit, same configuration, 10 runs. Score variance must be <15%.
- **Reproducibility:** Same product, different persona/scenario configs, 10 runs. Score variance must be <30%.

If variance exceeds thresholds: lower LLM temperature, tighten prompts, constrain evaluation. Worst case: mark dimension as "indicative" (disclosed in report).

### 7.4 Cross-Surface Score Normalization

Scores are NOT directly comparable across surfaces (a web score of 72 and an MCP score of 72 measure different things). Panel C's three-component score (fault score + quality score + coverage confidence) enables qualified comparison:

- **Fault score** (deterministic, normalized per exposure unit) — directly comparable
- **Quality score** (probabilistic, surface-specific rubrics) — not directly comparable
- **Coverage confidence** (meta-score) — qualifies trustworthiness of both

Exposure units per surface (Panel C Recommendation 3):

| Surface | Exposure Unit | Example |
|---------|--------------|---------|
| Web | Pages crawled | 50 pages |
| MCP | Tools + resources + prompts | 12 tools |
| REST API | Endpoints enumerated | 24 endpoints |
| GraphQL | Query + mutation fields | 30 fields |
| CLI | Commands available | 8 commands |
| Package | Exported modules | 5 modules |
| Repo | Source files analyzed | 120 files |
| Docs | Documentation pages | 25 pages |

### 7.5 Methodology Versioning

```typescript
interface MethodologyVersion {
  version: string;          // "v0.1", "v0.2"
  surfaces: SurfaceType[];  // which surfaces this version covers
  frozenAt: string;         // ISO 8601 — immutable after this date
  dimensions: Record<SurfaceType, SurfaceDimensionConfig[]>;
  correctionMethod: 'none' | 'bh-fdr';
  multiRunDefault: number;  // 1 for v0.1, 3 for v0.2+
  calibrationStatus: 'pre-calibration' | 'calibrating' | 'calibrated';
}
```

Every audit records which methodology version produced it. Score comparisons are valid ONLY within the same methodology version and surface. Methodology changes trigger re-baselining.

### 7.6 Credibility Weighting for New Surfaces (Panel C Recommendation 9)

For the first N audits on a new surface type:

```
z = min(1.0, sqrt(n / 50))
reported_score = z * raw_score + (1 - z) * portfolio_average
```

Where n = completed audits for that surface. At n=50, the surface's own scores dominate. Below n=50, scores blend toward the mean. MUST be disclosed in output.

---

## Part 8: Scenario Grammar v2.0

Source: Panel D Expert 6 (Miyuki Suzuki) + Panel A/B per-surface registries.

### 8.1 Architecture: Shared Engine, Surface-Specific Registries

```typescript
interface ScenarioGrammarRegistry {
  surfaces: Record<SurfaceType, SurfaceGrammar>;
}

interface SurfaceGrammar {
  personas: string[];
  entryPoints: string[];
  intents: string[];
  dimensionFocuses: string[];
  conditions: string[];
  exclusionRules: ExclusionRule[];
  priorityRules: PriorityRule[];
  totalConfigurations: number;
}
```

The composition engine is shared. Each surface plugs in its own primitives per axis.

### 8.2 Combined Configuration Count

| Surface | Personas | Entry | Intents | Focus | Conditions | Total | Source |
|---------|----------|-------|---------|-------|-----------|-------|--------|
| Web | 10 | 7 | 7 | 7 | 8 | 27,440 | `SCENARIO-GRAMMAR.md` |
| MCP | 6 | 6 | 6 | 7 | 8 | 1,728 | Panel A Expert 1 |
| REST API | 6 | 6 | 7 | 9 | 9 | 2,268 | Panel A Expert 2 |
| GraphQL | 6 | 5 | 7 | 7 | 8 | 1,680 | Panel A Expert 3 |
| Webhook | 6 | 4 | 6 | 6 | 6 | 864 | Panel A Expert 5 |
| CLI | 6* | 5* | 6* | 8* | 6* | ~1,440* | Panel B (estimated) |
| Package | 5* | 4* | 5* | 8* | 5* | ~800* | Panel B (estimated) |
| Repo | 5* | 4* | 5* | 8* | 5* | ~800* | Panel B (estimated) |
| Docs | 5* | 4* | 5* | 8* | 5* | ~800* | Panel B (estimated) |
| **Total** | | | | | | **~37,820** | |

*Panel B does not enumerate grammar primitives with the same detail as Panel A. Estimates based on dimension count and surface complexity.

### 8.3 Exclusion Rules

Certain combinations are invalid and must be excluded:

1. Security-auditor persona + normal condition = invalid (security auditors always use adversarial conditions)
2. Agent-consumer persona + human-only entry point (e.g., web browser) = invalid
3. Full Audit intent + Quick Check tier = invalid (Quick Check is deterministic only)
4. Destructive intent + read-only surface (package, repo) = invalid

### 8.4 Priority Rules (Panel D Expert 6)

When audit budget is limited, grammar selects scenarios by priority:

1. **Security-critical combinations first** — any combination involving security dimensions
2. **Previously-failing combinations** — re-test combinations that produced findings in previous audits
3. **Coverage gaps** — combinations never tested for this URL (per-site memory)
4. **High-variance combinations** — combinations that produced different results across runs

### 8.5 Anti-Gaming Properties

1. **Scenarios stored outside codebase** — builders cannot optimize for specific test cases
2. **Probabilistic selection** — which scenarios run varies per audit (except CI/CD deterministic mode)
3. **Per-site memory** — the grammar tracks which combinations have been tested and avoids repetition
4. **Adaptive enrichment** — when a finding is detected, related scenarios are automatically tested

### 8.6 Per-Site Memory (Panel D Expert 6)

```typescript
interface ScenarioFrequency {
  url: string;
  surface: SurfaceType;
  scenarioHash: string;        // SHA-256 of the 5-axis combination
  timesRun: number;
  lastRunAt: string;
  lastProducedFinding: boolean;
  findingIds: string[];
}
```

Stored in `scenario_frequencies` table. Queried during scenario selection to maximize coverage and avoid redundancy.

---

## Part 9: Persona System

Source: Panel D Expert 4 (Dr. Anna Kowalski) + `docs/PERSONA-METHODOLOGY.md`.

### 9.1 Architecture

```
Target URL
  → Context Extractor (deterministic: tech stack, audience signals, industry)
  → Audience Inferrer (LLM: who uses this product?)
  → Candidate Generator (LLM: generate 5-8 candidate personas)
  → Panel Selector (pick 3-5 personas that maximize dimension coverage)
  → Scenario Generator (grammar-based: assign scenarios to personas)
  → Hypothesis Generator (each persona generates testable hypotheses)
  → Audit Primitives (evaluate hypotheses)
  → Calibration Feedback (track which personas produce useful findings)
```

### 9.2 Per-Surface Persona Families

| Surface | Human Personas | Agent Personas |
|---------|---------------|----------------|
| **Web** | First-time visitor, returning user, mobile user, accessibility-dependent user, competitor evaluator | Search engine crawler, AI chat citation engine, agent browsing for integration, voice assistant |
| **MCP** | Developer evaluating integration, DevOps setting up server, security auditor | Orchestrator agent routing across MCP servers, coding agent discovering tools, agent composing multi-tool workflow |
| **REST API** | Frontend developer, mobile developer, integration partner, security researcher | Agent consuming API, CI pipeline, rate-limited batch processor |
| **GraphQL** | Frontend developer, schema explorer, mobile client, federation consumer | Agent querying schema, agent composing complex queries |
| **CLI** | First-time user, power user, scripter piping to other tools, CI/CD pipeline | Agent executing CLI commands, agent parsing output for integration |
| **Package** | Developer evaluating dependency, security auditor, TypeScript consumer | Dependabot-style agent, agent building dependency tree |
| **Repo** | Potential contributor, user evaluating quality, security auditor | Agent assessing repo health for integration decision |
| **Docs** | New user following getting-started, experienced user looking up API reference, agent reading docs for context | Agent extracting how-to instructions, RAG pipeline indexing docs |

### 9.3 Quick Check Mode

Quick Check uses FIXED personas (no LLM generation):
- Web: "Generic first-time visitor" + "Search engine crawler"
- MCP: "Agent discovering tools" + "Developer reading README"
- Other surfaces: one human + one agent persona, deterministically assigned

### 9.4 Calibration Loop

Track which personas produce findings that are NOT marked `false_positive`. Over time, down-weight personas that consistently produce disputed findings and up-weight personas that find real issues.

```sql
-- persona_calibration table
persona_template TEXT,
surface TEXT,
total_findings INT,
confirmed_findings INT,
disputed_findings INT,
false_positive_findings INT,
precision NUMERIC(3,2),  -- confirmed / total
```

---

## Part 10: Master Work Unit Registry

### 10.1 Existing Plan (Phase 0: Web V1)

| WU | Title | Agent | Hours | Phase |
|----|-------|-------|-------|-------|
| WU-00 | Architecture & Types | Opus | 2 | 0 |
| WU-00a | Worker Runtime Architecture | Opus | 1 | 0 |
| WU-00b | Security Architecture | Opus | 2 | 0 |
| WU-01 | Crawl Worker | Opus | 4 | 0 |
| WU-01.5 | Content Extraction | Codex | 2 | 0 |
| WU-02 | Audit Primitives (6 Core) | Opus+Codex | 6 | 0 |
| WU-03 | Synthesis Engine | Opus | 3 | 0 |
| WU-04 | Payload Renderers | Codex | 3 | 0 |
| WU-05 | Model Router | Opus | 2 | 0 |
| WU-06 | Pipeline Orchestrator | Opus | 3 | 0 |
| WU-07a | CLI Local Mode | Opus | 3 | 0 |
| WU-07b | CLI Cloud Mode | Codex | 2 | 0 |
| WU-08 | Dogfood Regression Test | Opus | 2 | 0 |
| WU-09 | Design System | Codex | 3 | 0 |
| WU-10 | Landing Page | Codex | 3 | 0 |
| WU-11 | Audit Progress Page | Codex | 2 | 0 |
| WU-12 | Results Page | Codex | 3 | 0 |
| WU-13 | Account & Dashboard | Codex | 3 | 0 |
| WU-14 | MCP Server (delivery) | Opus | 3 | 0 |
| WU-15 | REST API (delivery) | Codex | 2 | 0 |
| WU-16 | Re-Audit System | Opus | 2 | 0 |
| WU-17 | Error Handling & Edge Cases | Opus | 2 | 0 |
| WU-18 | SEO/MEO & Accessibility (Our Site) | Codex | 2 | 0 |
| WU-19 | Testing | Codex | 3 | 0 |
| WU-20 | Deploy | Opus | 1 | 0 |
| **Subtotal** | | | **59h** | |

Source: `docs/WORK-UNITS.md`

### 10.2 Platform Foundation (Phase 1)

| WU | Title | Agent | Hours | Source |
|----|-------|-------|-------|--------|
| WU-PER-01 | Context Extractor (persona, deterministic) | Codex | 2 | Panel D E4 |
| WU-PER-09 | Quick Check fixed personas | Codex | 2 | Panel D E4 |
| WU-PAT-01 | Pattern extraction + anonymization | Opus | 3 | Panel D E8 |
| WU-PAT-02 | Anonymization validation | Codex | 3 | Panel D E8 |
| WU-GRAM-01 | Scenario grammar engine (shared) | Opus | 3 | Panel D E6 |
| WU-GRAM-02 | Web surface registry (expanded) | Codex | 2 | Panel D E6 |
| WU-GRAM-03 | Exclusion rules | Codex | 2 | Panel D E6 |
| WU-GRAM-04 | Priority rules | Opus | 2 | Panel D E6 |
| WU-METH-05 | Gauge R&R validation harness | Opus | 4 | Panel D E5 |
| **Subtotal** | | | **23h** | |

### 10.3 Multi-Surface Shared Infrastructure (Phase 2)

| WU | Title | Agent | Hours | Source |
|----|-------|-------|-------|--------|
| WU-S01 / WU-MULTI-00 | TYPE-SPEC v2.0: discriminated unions | Opus | 4 | Panel A S1 / Panel B 1.1 |
| WU-S02 / WU-MULTI-01 | Methodology registry | Opus | 4 | Panel A S4 / Panel B 1.5 |
| WU-S03 / WU-MULTI-02 | Multi-surface pipeline router | Opus | 4 | Panel A S8 / Panel B |
| WU-MULTI-03 | Schema migration (surface columns, collection tables) | Codex | 3 | Panel B 12.1 |
| WU-MULTI-04 | Synthesis engine generalization | Opus | 4 | Panel B 10.2 |
| WU-MULTI-05 | Renderer generalization (Format B for non-web) | Codex | 2 | Panel B 10.2 |
| **Subtotal** | | | **21h** | |

> **CONFLICT:** Panel A specifies 3 shared WUs (12h). Panel B specifies 6 shared WUs (16h). **Resolution:** Panel B's shared WUs are a superset — they include schema migration and synthesis/renderer generalization that Panel A omits. Use Panel B's 6 WUs but increase hours on WU-S01 and WU-S02 to match Panel A's estimates (they are more complex than Panel B estimated). Total: 21h.

### 10.4 MCP Surface (Phase 2)

| WU | Title | Agent | Hours | Source |
|----|-------|-------|-------|--------|
| WU-M01 | MCP Client & Connection Manager | Opus | 4 | Panel A |
| WU-M02 | MCP Introspection Engine | Opus | 6 | Panel A |
| WU-M03 | MCP Summarizer | Codex | 3 | Panel A |
| WU-M04 | MCP Audit Primitives (Deterministic) | Codex | 5 | Panel A |
| WU-M05 | MCP Audit Primitives (LLM) | Opus | 5 | Panel A |
| WU-M06 | MCP Security Primitive | Opus | 4 | Panel A |
| WU-M07 | MCP Scenario Grammar | Opus | 3 | Panel A |
| WU-M08 | MCP Integration & Pipeline | Opus | 4 | Panel A |
| **Subtotal** | | | **34h** | |

### 10.5 REST API Surface (Phase 2, if market demands)

| WU | Title | Agent | Hours | Source |
|----|-------|-------|-------|--------|
| WU-A01 | API Discovery & Spec Parser | Codex | 5 | Panel A |
| WU-A02 | API Probe Engine | Opus | 6 | Panel A |
| WU-A03 | API Summarizer | Codex | 3 | Panel A |
| WU-A04 | API Audit Primitives (Deterministic) | Codex | 6 | Panel A |
| WU-A05 | API Audit Primitives (LLM) | Opus | 4 | Panel A |
| WU-A06 | OWASP API Security Primitive | Opus | 5 | Panel A |
| WU-A07 | API Scenario Grammar | Opus | 3 | Panel A |
| WU-A08 | API Integration & Pipeline | Opus | 4 | Panel A |
| **Subtotal** | | | **36h** | |

### 10.6 Platform Layer (Phase 2)

| Domain | WUs | Hours | Source |
|--------|-----|-------|--------|
| Monitoring | WU-MON-01 through WU-MON-07 | 20h | Panel D E2 |
| CI/CD | WU-CI-01 through WU-CI-10, WU-CI-12 | 25h | Panel D E3 |
| Personas | WU-PER-02 through WU-PER-08 | 22h | Panel D E4 |
| Badges | WU-BADGE-01 through WU-BADGE-07, WU-BADGE-10 | 17h | Panel D E7 |
| Methodology | WU-METH-01 through WU-METH-04 | 15h | Panel D E5 |
| Patterns | WU-PAT-03 through WU-PAT-06, WU-PAT-10 | 17h | Panel D E8 |
| Grammar | WU-GRAM-05 through WU-GRAM-07 | 8h | Panel D E6 |
| **Subtotal** | **~50 WUs** | **124h** | |

### 10.7 GraphQL + Panel B Surfaces (Phase 3)

| Surface | WUs | Hours | Source |
|---------|-----|-------|--------|
| GraphQL | WU-G01 through WU-G07 | 29h | Panel A |
| CLI | WU-CLI-00 through WU-CLI-08 | 30h | Panel B |
| Package | WU-PKG-00 through WU-PKG-07 | 23h | Panel B |
| Repo | WU-REPO-00 through WU-REPO-07 | 23h | Panel B |
| Docs | WU-DOCS-00 through WU-DOCS-07 | 21h | Panel B |
| Webhook | WU-WH-01 through WU-WH-05 | 22h | Panel A |
| **Subtotal** | **~52 WUs** | **148h** | |

### 10.8 Enterprise + Scale (Phase 3-4)

| Domain | WUs | Hours | Source |
|--------|-----|-------|--------|
| Enterprise | WU-ENT-01 through WU-ENT-10 | 33h | Panel D E1 |
| Monitoring (advanced) | WU-MON-06, WU-MON-08 through WU-MON-10 | 13h | Panel D E2 |
| CI/CD (advanced) | WU-CI-11 | 3h | Panel D E3 |
| Badges (advanced) | WU-BADGE-08, WU-BADGE-09 | 5h | Panel D E7 |
| Methodology (advanced) | WU-METH-06 through WU-METH-08 | 9h | Panel D E5 |
| Patterns (advanced) | WU-PAT-07 through WU-PAT-09, WU-PAT-11, WU-PAT-12 | 14h | Panel D E8 |
| Grammar (advanced) | WU-GRAM-08 through WU-GRAM-10 | 9h | Panel D E6 |
| **Subtotal** | **~30 WUs** | **86h** | |

### 10.9 Grand Total

| Phase | WUs | Hours | Description |
|-------|-----|-------|-------------|
| Phase 0 | 25 | 59h | Web V1 (core pipeline, CLI, web UI, deploy) |
| Phase 1 | 9 | 23h | Platform foundation (personas, patterns, grammar, GR&R) |
| Phase 2 | ~66 | 179h | Multi-surface shared + MCP + REST API + platform layer |
| Phase 3 | ~82 | 234h | Full surface expansion + enterprise + scale |
| Phase 4 | ~5 | 12h | Advanced enterprise |
| **Total** | **~187** | **~507h** | |

**Agent split (estimated):**
- Opus 4.6: ~280h (complex architecture, LLM integration, security, synthesis)
- Codex 5.4: ~190h (deterministic modules, UI, CRUD, API routes, schema)
- Human review: ~15h (10 gates x 30min + methodology reviews + type approvals)

---

## Part 11: Build Phases

### Phase 0: Web V1 (Core Pipeline)

**Goal:** Ship the core web audit pipeline. Paste URL, get findings, paste into agent, fix, re-test.
**Scope:** 25 WUs, ~59h. Web surface only. Quick Check (free) + Full Audit (paid).
**Gate:** Dogfood regression test passes. 10 manual audits with <10% FP rate.
**Detailed spec:** `docs/WORK-UNITS.md`

### Phase 1: Platform Foundation

**Goal:** Lay groundwork for multi-surface and platform features.
**Scope:** 9 WUs, ~23h. Pattern extraction, persona context, grammar engine, GR&R harness.
**Key insight (Panel D):** Pattern extraction MUST be in Phase 1. Every audit without it is lost data.
**Gate:** Grammar engine produces valid scenarios. Pattern anonymization passes validation. GR&R harness operational.

### Phase 2: MCP + API + Platform Layer

**Goal:** First non-web surface (MCP), REST API if market demands, platform features (monitoring, CI/CD, badges, methodology v0.2).
**Scope:** ~66 WUs, ~179h.
**Build order within phase:**
1. TYPE-SPEC v2.0 discriminated unions (WU-S01)
2. Methodology registry + pipeline router (WU-S02, WU-S03) parallel with MCP client (WU-M01)
3. MCP introspection + primitives (WU-M02 through WU-M08)
4. Platform features (monitoring, CI/CD, badges) can start as soon as Phase 0 is complete — parallel with MCP work
5. REST API (WU-A01 through WU-A08) only if specific market demand

**Gate criteria:**
- Web PMF (1,000 paid audits, <5% FP rate, positive unit economics) before MCP begins
- TYPE-SPEC v2.0 approved by human before implementation
- Methodology v0.2 pre-registered before non-web audits run
- 20+ reference MCP servers manually audited as calibration corpus

### Phase 3: Full Surface Expansion + Enterprise

**Goal:** All remaining surfaces (GraphQL, CLI, Package, Repo, Docs, Webhook). Enterprise features.
**Scope:** ~82 WUs, ~234h.
**Build order (from Panel B):**
1. Docs (lowest marginal cost, layers on web crawl)
2. Repo (API-only, no execution)
3. Package (API-only, supply chain differentiation)
4. GraphQL (shares REST infrastructure)
5. CLI (highest infra cost, Docker sandbox)
6. Webhook (deferred unless customer demand — requires listener infrastructure)

**Gate criteria per surface (Panel B Appendix A):**
- 50 manual audits by panel team (ground truth)
- 200 automated audits with manual FP review
- 20 cross-reviewer agreement audits (3 reviewers each)
- >= 80% recall on reference corpus, <= 15% FP rate
- Human approval of surface-specific methodology

### Phase 4: Advanced Enterprise

**Goal:** Dedicated worker pools, data residency, custom dimensions.
**Scope:** ~5 WUs, ~12h.
**Gate:** 3+ enterprise customers committed.

---

## Part 12: EOS Scorecard

### Weekly Metrics

| Metric | Target (Phase 0) | Target (Phase 2) | Target (Phase 3) |
|--------|------------------|------------------|------------------|
| Audits completed (total) | 50/wk | 500/wk | 2,000/wk |
| Quick Check audits | 40/wk | 350/wk | 1,400/wk |
| Full Audit audits | 10/wk | 150/wk | 600/wk |
| Findings generated | 200/wk | 2,000/wk | 8,000/wk |
| False positive rate | <10% | <5% | <3% |
| FP rate (CRITICAL findings) | <1% | <0.5% | <0.5% |
| Conversion (Quick Check to Full) | 5% | 8% | 10% |
| COGS per Full Audit (p50) | $2.50 | $2.00 | $1.50 |
| COGS per Quick Check | $0.10 | $0.08 | $0.06 |
| Patterns extracted | 100/wk | 1,000/wk | 5,000/wk |
| Re-test rate | 20% | 30% | 35% |

### Quarterly Rocks

| Quarter | Rock | Maps To |
|---------|------|---------|
| Q1 2026 | Ship Web V1 + Quick Check + Full Audit | Phase 0 |
| Q2 2026 | 1,000 paid audits, web PMF demonstrated | Phase 0 completion |
| Q3 2026 | MCP surface live, CI/CD integration shipped | Phase 2 |
| Q4 2026 | Monitoring product live, 50 monitors active | Phase 2 |
| Q1 2027 | First enterprise customer. Badge system live. | Phase 3 start |
| Q2 2027 | 3+ surfaces live. Pattern database has 50K+ patterns. | Phase 3 |

### Issues List

| # | Issue | Owner | Status |
|---|-------|-------|--------|
| 1 | LLM cost validation not done (10 real audits needed) | Product | Open |
| 2 | AEO/GEO/MEO rubric requires SEO professional validation | Product | Deferred |
| 3 | MCP stdio sandboxing (Docker for arbitrary servers) design needed | Engineering | Open |
| 4 | Webhook listener infrastructure unique and expensive | Engineering | Deferred |
| 5 | REST API auth credential handling security model | Engineering | Open |
| 6 | GR&R may fail for LLM dimensions (>30% variance) | Methodology | Open |
| 7 | Daily monitoring COGS negative margin at current pricing | Business | Mitigated (Quick Check daily) |

---

## Part 13: Open Questions

### Must-Answer-Before-Build

| # | Question | Context | Source |
|---|----------|---------|--------|
| 1 | **LLM cost validation:** What are actual token costs for 10 real Full Audits? | COGS estimate is $1.90-4.40 based on token count projections, not measurement. If real costs are >$5, pricing model breaks. | PRODUCT-SPEC adversarial review |
| 2 | **GR&R for LLM dimensions:** Does the Sonnet/Haiku evaluation produce acceptable variance (<30%)? | If LLM dimensions have >30% variance, they must be marked "indicative" or replaced with deterministic proxies. | Panel D Expert 5 |
| 3 | **Finding matching across re-audits:** Is SHA-256(what + where + dimension) sufficient for finding identity? | Monitoring and regression detection depend on this. ~5% false mismatch rate acceptable? | Panel D Expert 2 |
| 4 | **MCP stdio sandboxing:** SSE/HTTP-only for V1, or must stdio be supported? | Stdio requires Docker containers per audit. SSE/HTTP is simpler. Most production MCP servers use HTTP. | Panel A Expert 1 |
| 5 | **Cross-surface score comparability:** Are stakeholders OK with "scores not comparable across surfaces"? | Panel recommendation: keep separate. But customers may expect a unified score. | Panel A S15, Panel C Section 5 |

### Can-Learn-As-We-Go

| # | Question | Context | Source |
|---|----------|---------|--------|
| 6 | **GraphQL introspection disabled in production:** How to audit schema? | Options: (a) require SDL input, (b) infer from responses, (c) "limited audit" label. | Panel A S15 |
| 7 | **OWASP API Top 10 vs general security:** Split into "external" (no auth) and "authenticated"? | Some OWASP checks (BOLA) require auth context. | Panel A S15 |
| 8 | **Schema fingerprinting cadence for Rhumb:** Every audit? Daily? | Affects monitoring pillar cost. | Panel A S15 |
| 9 | **REST API auth credential handling:** CLI-only (no web form) to reduce exposure? | Credentials must NEVER be stored. CLI provides better security posture. | Panel A S15 |
| 10 | **Webhook listener as separate service?** | Different infrastructure from Playwright workers. May need independent scaling. | Panel A S15 |
| 11 | **"Full Product Audit" bundle pricing:** Web + docs + repo + package for $49-99? | Natural upsell but requires 4 surfaces operational. | Panel B Appendix B |
| 12 | **Credibility weighting disclosure language:** How to explain to builders that their score is blended? | Must be transparent without undermining trust. | Panel C Rec 9 |
| 13 | **Pattern database anonymization edge cases:** URLs that contain PII in path segments? | Need regex patterns for common PII-in-URL patterns. | Panel D Expert 8 |
| 14 | **Enterprise SLA definition:** What does 99.9% uptime mean for an auditing service? | Audits are not real-time. "Uptime" = API responsiveness + audit completion within SLA. | Panel D Expert 1 |

---

## Part 14: ADR Updates

New ADRs to add to `docs/ADR.md` based on panel findings.

### From Panel A

| ADR | Title | Decision | Source |
|-----|-------|----------|--------|
| ADR-018 | Discriminated unions for multi-surface types | CollectionResult, SurfaceSummary, SurfaceEvidence as discriminated unions with `surface` field. Existing web types become web variant. No breaking changes. | Panel A S14, Panel B Appendix C |
| ADR-019 | Surface-specific methodology with registry | MethodologyRegistry maps each surface to dimensions + weights. Scores comparable within surface, NOT across surfaces. | Panel A S14 |
| ADR-020 | Build order: Web -> MCP -> REST -> GraphQL -> others | MCP has no incumbent, highest strategic value. REST only if market demands. GraphQL shares REST infra. CLI/Package/Repo/Docs by Panel B priority. Webhooks last. | Panel A S14 |

### From Panel C

| ADR | Title | Decision | Source |
|-----|-------|----------|--------|
| ADR-021 | MEO as universal audit dimension | MEO (semantic coherence for AI comprehension) evaluated on every surface as sub-component of DX or dedicated dimension. | Panel C + Part 5 of this document |
| ADR-022 | Sandwich architecture | Universal pipeline -> surface-specific primitives -> universal scoring. Pipeline never changes. Primitives always change. Scoring never changes. | Panel C Section 1 |
| ADR-023 | Fault vs quality finding category | Findings carry `category: 'fault' | 'quality'`. Faults are objective deviations; quality observations are judgment-based. Different confidence thresholds and presentation. | Panel C Rec 4 |
| ADR-024 | Coverage confidence score | Every SynthesisResult carries `coverageConfidence` (0-100) + `coverageFactors`. Qualifies how much to trust the score. | Panel C Rec 5 |
| ADR-025 | Exposure basis per surface | Normalize scores to findings-per-exposure-unit. Exposure unit varies by surface (pages, tools, endpoints, etc.). | Panel C Rec 3 |
| ADR-026 | Reference corpus required before surface launch | 20-50 manual audits per surface type with human-validated scores before automated audits go live. >= 80% recall gate. | Panel C Rec 7 |
| ADR-027 | Multi-surface triage as pipeline Stage 0 | Before deep evaluation, discover all surfaces (10-30s per surface) and assign priority (P0-P3) with budget allocation. | Panel C Rec 6 |

### From Panel D

| ADR | Title | Decision | Source |
|-----|-------|----------|--------|
| ADR-028 | Multi-tenancy via RLS + org_id | All org-scoped data uses org_id FK + RLS. No schema-per-tenant. | Panel D Expert 1 |
| ADR-029 | Monitoring as Quick Check + Full Audit combo | Daily = Quick Check ($0.10). Weekly = Full Audit ($2.50). Prevents negative-margin monitoring. | Panel D Expert 2 |
| ADR-030 | Badge expiration, not perpetual | Badges expire (30-90 days by tier). Continuous monitoring extends validity. Snapshot badges are misleading. | Panel D Expert 7 |
| ADR-031 | Pattern embeddings via pgvector | Supabase pgvector for similarity search. Avoids external vector DB. | Panel D Expert 8 |
| ADR-032 | BH FDR correction in Synthesizer | Benjamini-Hochberg at 10% FDR. Implemented as pluggable step, disabled for v0.1, enabled for v0.2+. | Panel D Expert 5 |
| ADR-033 | Deterministic mode via seeded RNG | CI/CD and multi-run use seeded random for reproducibility. Seed = commit SHA in CI, run index in multi-run. | Panel D Expert 3 |
| ADR-034 | Persona pipeline cost budget | Persona generation capped at 30% of audit LLM budget (~$0.30). Quick Check uses fixed personas. | Panel D Expert 4 |
| ADR-035 | Scenario grammar per-surface registries | Each surface has its own primitive registry. Composition engine shared. Surfaces added independently. | Panel D Expert 6 |
| ADR-036 | Pattern-to-audit link retention (90 days) | Occurrence links deleted after 90 days. Anonymous patterns retained indefinitely. | Panel D Expert 8 |

> **CONFLICT:** Panel D assigns ADR numbers 017-025 that overlap with Panel A's 018-020 and Panel B's 018-021. **Resolution:** Renumber all panel ADRs sequentially from ADR-018 onward in this document. The specific numbers above are the canonical assignments. Panels' internal numbering is superseded.

---

## Appendix A: Pipeline Architecture (Updated)

```
                    TARGET INPUT
                        │
                   ┌────┴────┐
                   │ Triage  │  (Panel C Rec 6)
                   │ Stage 0 │  Discover all surfaces, assign P0-P3
                   └────┬────┘
                        │
                   ┌────┴────┐
                   │ Surface │  (Panel A S8)
                   │ Router  │  Branch by surface type
                   └────┬────┘
          ┌─────┬──┴──┬─────┬─────┬─────┬──────┬─────┬──────┐
          │     │     │     │     │     │      │     │      │
         Web   MCP   REST  GQL   CLI   Pkg   Repo  Docs   WH
          │     │     │     │     │     │      │     │      │
     Collection Engines (surface-specific)
          │     │     │     │     │     │      │     │      │
     CollectionResult (discriminated union)
          │     │     │     │     │     │      │     │      │
     Summarizers (surface-specific → SurfaceSummary)
          └─────┴──┬──┴─────┴─────┴─────┴──────┴─────┴──────┘
                   │
         Persona Selection (grammar + calibration)
                   │
         Scenario Selection (grammar + per-site memory)
                   │
         Primitive Selector (picks primitives by surface)
                   │
         AuditPrimitiveV2.run() → Envelope<Finding[]>
                   │
         BH FDR Correction (v0.2+)
                   │
         Cross-Surface Synthesis (if multi-surface)
                   │
         Synthesizer → SynthesisResult (+ coverage confidence)
                   │
    ┌──────────────┼──────────────────┐
    │              │                  │
 Renderers    Pattern Extractor   Badge Evaluator
    │              │                  │
 Format A/B/C  Anonymous patterns  Certificate update
 JSON/SARIF    → pgvector           → Rhumb export
 JUnit/Badge   → benchmarks
```

**The key architectural insight (Panel A S8, Panel C Section 1):** The pipeline BRANCHES at collection and CONVERGES at synthesis. Surface-specific work is isolated to collection, summarization, and primitive evaluation. From synthesis onward, Finding, Envelope, SynthesisResult, and all renderers are surface-agnostic. This is the sandwich architecture: universal process, surface-specific criteria, universal conclusion.

---

## Appendix B: Database Schema Summary

### New Tables (Total: 22 from Panel D + surface-specific from Panels A/B)

| Table | Phase | Purpose |
|-------|-------|---------|
| collection_results | 2 | Surface-agnostic collection storage (Panel A S9) |
| cli_probe_results | 3 | CLI probe data (Panel B) |
| package_probe_results | 3 | Package probe data (Panel B) |
| repo_probe_results | 3 | Repo probe data (Panel B) |
| docs_collection_results | 3 | Docs collection data (Panel B) |
| organizations | 3 | Enterprise team accounts (Panel D E1) |
| memberships | 3 | User-to-org roles (Panel D E1) |
| audit_trail | 3 | Immutable compliance log (Panel D E1) |
| sso_secrets | 3 | Encrypted SSO certs (Panel D E1) |
| monitors | 2 | Continuous monitoring config (Panel D E2) |
| health_snapshots | 2 | Rolling health scores (Panel D E2) |
| alerts | 2 | Alert records (Panel D E2) |
| ci_ignored_findings | 2 | CI/CD finding suppression (Panel D E3) |
| persona_calibration | 2 | Cross-audit persona tracking (Panel D E4) |
| audit_personas | 2 | Per-audit persona records (Panel D E4) |
| methodology_versions | 2 | Version registry (Panel D E5) |
| gauge_rr_runs | 1 | Validation results (Panel D E5) |
| methodology_ab_tests | 3 | A/B test results (Panel D E5) |
| surface_benchmarks | 3 | Per-surface score benchmarks (Panel D E5) |
| scenario_frequencies | 2 | Per-URL scenario coverage (Panel D E6) |
| surface_registries | 1 | Per-surface grammar primitives (Panel D E6) |
| certificates | 2 | Badge/certification registry (Panel D E7) |
| badge_verifications | 2 | Fraud detection log (Panel D E7) |
| pattern_occurrences | 2 | Temporary pattern-to-audit links (Panel D E8) |
| stack_benchmarks | 2 | Stack-level quality benchmarks (Panel D E8) |
| fp_models | 3 | FP prediction model registry (Panel D E8) |
| rhumb_exports | 3 | Rhumb data pipeline queue (Panel D E8) |

### Modified Existing Tables

| Table | New Columns | Source |
|-------|-------------|--------|
| audits | +surface, +org_id, +monitor_id, +ci_metadata, +ci_passed, +deterministic_seed, +run_number, +multi_run_group_id, +consensus_applied, +bh_correction_applied | All panels |
| findings | +surface, +category, +persona_id, +scenario_id, +temporal_category, +first_seen_audit_id, +persistence_count, +was_ever_resolved | Panels C, D |
| patterns | +surface, +category, +embedding, +fp_rate, +rhumb_dimensions | Panel D E8 |

**Grand total:** ~27 new tables + 3 modified = ~40 tables (up from 10 in base schema).

---

## Appendix C: Cost Model

| Surface | Quick Check COGS | Full Audit COGS | Infrastructure | Source |
|---------|-----------------|-----------------|----------------|--------|
| Web | ~$0.10 | $1.90-4.40 | Playwright on Railway | PRODUCT-SPEC |
| MCP | ~$0.05 | $0.80-2.50 | MCP client (HTTP) | Panel A (estimated) |
| REST API | ~$0.05 | $1.00-3.00 | HTTP client | Panel A (estimated) |
| GraphQL | ~$0.05 | $0.80-2.50 | HTTP client | Panel A (estimated) |
| CLI | $0.02-0.05 | $0.52-2.05 | Docker on Railway | Panel B |
| Package | ~$0.01 | $0.31-1.51 | HTTP client only | Panel B |
| Repo | ~$0.01 | $0.31-1.01 | HTTP client only | Panel B |
| Docs | ~$0.01 | $0.50-2.00 | Reuses web Playwright | Panel B |
| Webhook | N/A | $0.50-2.00 | HTTPS listener | Panel A (estimated) |

**Key constraint:** Per-audit LLM hard cap of $5 (PRODUCT-SPEC adversarial review).

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-11 | Initial master synthesis. 4 panels, 29 experts, 14 parts. |
