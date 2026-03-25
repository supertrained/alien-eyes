# Alien Eyes — Frozen Type Specifications

> Version: 1.0 | Date: 2026-03-10
> Status: FROZEN. These types must be implemented exactly as specified. Any change requires a new version number and human approval.
> Purpose: Coordination contract between Opus 4.6 and Codex (ChatGPT 5.4). Types ARE the coordination mechanism for multi-agent builds.
> Implements: Architecture Decision #1 (Freeze Types Before Code)

---

## How Types Are Used

```
URL input
  → URLValidator (validates URL safety)
  → CrawlEngine → CrawlResult (one per audit)
  → PageSummarizer → PageSummary[] (one per page)
  → AuditPrimitive.run() → Envelope<Finding[]> (one per primitive)
  → Synthesizer → SynthesisResult (de-duplicated, scored, chained)
  → PayloadRenderer → Format A/B/C/JSON (four views of same data)
```

Every agent reads from CrawlResult + PageSummary. Every agent outputs Envelope<Finding[]>. The Synthesizer reads all Envelopes. The Renderers read SynthesisResult. This is the ONLY data flow.

---

## 1. Finding — The Atom

Every output in the system derives from this type. A Finding is a single observation about the audited product.

```typescript
/**
 * The atomic unit of Alien Eyes output.
 * Every finding represents a single observation about the audited product.
 * All formats (A, B, C, JSON) are views of the same Finding.
 */
interface Finding {
  /** Unique identifier. Format: dimension-NNN (e.g., "seo-001", "a11y-003") */
  id: string;

  /** What is wrong — specific observable behavior, not a category label.
   *  Example: "Canonical URL on /services points to / instead of /services" */
  what: string;

  /** Where in the product — URL, endpoint, page section, or component.
   *  Example: "/services, /blog/*, /about — all 45 static pages" */
  where: string;

  /** What should happen instead — the expected behavior, stated concretely.
   *  Example: "Each page's canonical URL should be its own URL path" */
  expected: string;

  /** Why it matters — who is affected and how.
   *  Example: "Search engines treat all pages as duplicates of the homepage" */
  why: string;

  /** How to verify the fix — a concrete check the agent can run after fixing.
   *  Example: "Run next build, check any non-homepage route's canonical tag" */
  verify: string;

  /** Severity level. CRITICAL findings get their own visual plane.
   *  CRITICAL = blocks core functionality or creates security/SEO disaster
   *  HIGH = significant impact on user/agent experience
   *  MEDIUM = meaningful improvement opportunity
   *  LOW = minor polish or optimization */
  severity: 'critical' | 'high' | 'medium' | 'low';

  /** Which audit dimension produced this finding */
  dimension: AuditDimension;

  /** Causal chain: IDs of other findings this one connects to (Swiss Cheese Model).
   *  Example: ["seo-001", "a11y-003"] — fixing seo-001 first simplifies a11y-003 */
  causalChain?: string[];

  /** Confidence score 0-1. Findings < 0.7 are flagged for manual verification.
   *  CRITICAL findings require confidence >= 0.9 */
  confidence: number;

  /** Whether this finding requires human judgment (not auto-fixable).
   *  Example: brand voice evaluation, design aesthetic choices */
  requiresHumanJudgment?: boolean;

  /** If requiresHumanJudgment is true, explain why.
   *  Example: "Render-blocking custom font may be intentional brand expression" */
  humanJudgmentReason?: string;

  /** Evidence bundle — every finding must carry proof. */
  evidence: EvidenceBundle;

  /** Resolution state — tracks the lifecycle of this finding */
  lifecycle: FindingLifecycle;
}
```

---

## 2. Evidence Bundle

Every finding carries proof. CRITICAL/HIGH findings are blocked without 100% evidence completeness.

```typescript
/**
 * Immutable evidence that a finding is real.
 * Required by Principle 14: Every finding must carry evidence.
 */
interface EvidenceBundle {
  /** URL where the finding was observed */
  url: string;

  /** ISO 8601 timestamp when the finding was observed */
  timestamp: string;

  /** SHA-256 hash of the DOM at the time of observation */
  domSnapshotHash: string;

  /** Storage path to screenshot (Supabase Storage or local file) */
  screenshotPath?: string;

  /** Relevant request/response data (headers, status codes — NOT bodies) */
  relevantHeaders?: Record<string, string>;

  /** Which model produced this finding (if LLM-generated) */
  model?: string;

  /** Token count used to generate this finding */
  tokensUsed?: number;

  /** The reasoning chain that led to this finding */
  reasoning?: string;

  /** Evidence completeness score 0-1.
   *  CRITICAL findings require completeness >= 1.0
   *  HIGH findings require completeness >= 0.9 */
  completeness: number;
}
```

---

## 3. Finding Lifecycle

Every finding has a resolution state. Required by Principle 15.

```typescript
/**
 * Resolution state of a finding.
 * Required by Principle 15: Findings have lifecycle states.
 */
interface FindingLifecycle {
  /** Current state */
  state: FindingLifecycleState;

  /** When the state was last updated */
  updatedAt: string;

  /** Who/what updated the state (user ID, agent ID, or "system") */
  updatedBy?: string;

  /** Reason for the current state (required for disputed/accepted-risk/false-positive) */
  reason?: string;

  /** For platform-limited findings: which platform */
  platform?: string;

  /** For third-party findings: which service */
  thirdPartyService?: string;
}

type FindingLifecycleState =
  | 'detected'           // Initial state: finding discovered
  | 'delivered'          // Included in a report/payload
  | 'accepted'           // Builder acknowledges the finding
  | 'disputed'           // Builder disputes the finding (potential false positive)
  | 'fixed'              // Verified fixed in a re-audit
  | 'false_positive'     // Confirmed false positive (feeds calibration)
  | 'fixable'            // Can be fixed in codebase
  | 'mitigable'          // Can't fully fix, compensating controls exist
  | 'platform_limited'   // Platform constraint (Shopify, Wix, etc.)
  | 'accepted_risk'      // Builder explicitly accepts the risk
  | 'third_party';       // Caused by external service builder doesn't control
```

---

## 4. Envelope — Universal Output Wrapper

Every primitive's output is wrapped in this. Ported from GMPF, extended with methodology version.

```typescript
/**
 * Universal output envelope for all primitives.
 * Every primitive returns Envelope<Finding[]>.
 * The envelope tracks: what ran, whether it succeeded, confidence, cost, and timing.
 */
interface Envelope<T = unknown> {
  /** Name of the primitive that produced this result */
  primitive: string;

  /** Did the primitive succeed, fail, or timeout? */
  status: 'success' | 'error' | 'timeout';

  /** The typed output data */
  data: T;

  /** Overall confidence in this primitive's output (0-1) */
  confidence: number;

  /** Factors that contributed to the confidence score */
  confidenceFactors: string[];

  /** Optional reasoning explaining the output */
  reasoning?: string;

  /** Execution metadata */
  metadata: EnvelopeMetadata;
}

interface EnvelopeMetadata {
  /** LLM model used (if any) */
  model?: string;

  /** Total tokens consumed */
  tokensUsed?: number;

  /** Total cost in USD */
  costUsd?: number;

  /** Execution duration in milliseconds */
  durationMs: number;

  /** Which methodology version this was scored against */
  methodologyVersion: string;
}

/**
 * Helper function to create a successful envelope.
 * Automatically tracks duration via performance.now().
 */
async function runPrimitive<T>(
  name: string,
  methodologyVersion: string,
  fn: () => Promise<{
    data: T;
    confidence: number;
    confidenceFactors: string[];
    reasoning?: string;
    model?: string;
    tokensUsed?: number;
    costUsd?: number;
  }>
): Promise<Envelope<T>>;
```

---

## 5. CrawlResult — The Shared Input

One crawl per audit. All primitives read from this. Implements Architecture Decision #2.

```typescript
/**
 * Result of crawling a site. One per audit.
 * Every primitive reads from this shared result.
 * Raw HTML is stored but NEVER fed directly to LLMs — use PageSummary instead.
 */
interface CrawlResult {
  /** The URL that was submitted for audit */
  url: string;

  /** All pages discovered and crawled */
  pages: CrawledPage[];

  /** ISO 8601 timestamp when the crawl started */
  timestamp: string;

  /** Always 'clean' — every audit uses a fresh browser profile */
  browserProfile: 'clean';

  /** Total crawl duration in milliseconds */
  totalDurationMs: number;

  /** Number of pages discovered but not crawled (exceeded page limit) */
  pagesSkipped: number;

  /** Detected technology stack (from Wappalyzer or similar) */
  detectedStack?: string[];

  /** Whether robots.txt was found and respected */
  robotsTxtStatus: 'found' | 'not_found' | 'blocked_some_pages';
}

interface CrawledPage {
  /** Full URL of the page */
  url: string;

  /** Raw HTML content. Stored but NEVER fed to LLMs directly. */
  html: string;

  /** Simplified DOM representation for analysis */
  dom: string;

  /** Storage path to full-page screenshot */
  screenshot: string;

  /** Console log entries captured during page load */
  consoleLogs: ConsoleEntry[];

  /** Network requests made during page load */
  networkRequests: NetworkEntry[];

  /** HTTP response headers */
  responseHeaders: Record<string, string>;

  /** Meta tags extracted from <head> */
  metaTags: Record<string, string>;

  /** HTTP status code */
  statusCode: number;

  /** Page load time in milliseconds */
  loadTimeMs: number;

  /** Viewport used for this capture */
  viewport: { width: number; height: number };

  /** Device type used */
  deviceType: 'desktop' | 'mobile';
}

interface ConsoleEntry {
  level: 'error' | 'warning' | 'info' | 'log' | 'debug';
  message: string;
  /** Truncated to 500 chars to prevent PII leakage */
  timestamp: string;
}

interface NetworkEntry {
  url: string;
  method: string;
  statusCode: number;
  contentType: string;
  /** Size in bytes */
  size: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Only type/category, NOT request/response bodies (privacy) */
  resourceType: 'document' | 'script' | 'stylesheet' | 'image' | 'font' | 'xhr' | 'fetch' | 'other';
}
```

---

## 6. PageSummary — Compressed Representation for LLMs

Created by WU-01.5. This is what primitives actually receive — NOT raw HTML.

```typescript
/**
 * Compressed representation of a page for LLM consumption.
 * 2-5K tokens per page (vs 50-100K raw HTML).
 * Created deterministically — no LLM required.
 */
interface PageSummary {
  /** Page URL */
  url: string;

  /** Page title from <title> tag */
  title: string;

  /** All meta tags (name → content) */
  metaTags: Record<string, string>;

  /** Heading hierarchy */
  headings: Heading[];

  /** Internal and external links */
  links: Link[];

  /** Images with alt text status */
  images: ImageInfo[];

  /** ARIA landmarks and roles */
  ariaLandmarks: AriaLandmark[];

  /** Structured data (JSON-LD, microdata) */
  structuredData: any[];

  /** Security-relevant headers */
  securityHeaders: SecurityHeaders;

  /** Console log summary (counts by level, NOT raw messages) */
  consoleSummary: ConsoleSummary;

  /** Network request summary (counts by type, NOT bodies) */
  networkSummary: NetworkSummary;

  /** Performance metrics */
  performanceMetrics: PerformanceMetrics;

  /** Visible text content, sanitized (no hidden elements, scripts, comments) */
  sanitizedTextContent: string;

  /** Estimated token count of this summary */
  tokenEstimate: number;

  /** HTTP status code */
  statusCode: number;
}

interface Heading {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

interface Link {
  href: string;
  text: string;
  isInternal: boolean;
  /** Whether rel contains nofollow */
  nofollow: boolean;
}

interface ImageInfo {
  src: string;
  alt: string | null;
  /** Whether alt="" (decorative) vs missing entirely */
  hasAlt: boolean;
  isDecorative: boolean;
  width?: number;
  height?: number;
}

interface AriaLandmark {
  role: string;
  label?: string;
  /** Whether it's a native HTML5 landmark (<nav>, <main>, <header>) */
  isNative: boolean;
}

interface SecurityHeaders {
  csp: string | null;
  hsts: string | null;
  xFrameOptions: string | null;
  xContentTypeOptions: string | null;
  referrerPolicy: string | null;
  permissionsPolicy: string | null;
  /** Cookie attributes for each cookie */
  cookies: CookieInfo[];
}

interface CookieInfo {
  name: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none' | null;
  /** Whether this appears to be a tracking cookie */
  isTracking: boolean;
}

interface ConsoleSummary {
  errorCount: number;
  warningCount: number;
  /** Sample error messages (first 3, truncated) */
  sampleErrors: string[];
}

interface NetworkSummary {
  totalRequests: number;
  totalSizeBytes: number;
  byType: Record<string, { count: number; sizeBytes: number }>;
  /** Third-party domains contacted */
  thirdPartyDomains: string[];
  /** Whether any requests fired before cookie consent */
  preConsentRequests: boolean;
}

interface PerformanceMetrics {
  loadTimeMs: number;
  ttfbMs: number;
  domContentLoadedMs: number;
  /** Total page weight in bytes */
  totalWeightBytes: number;
  /** Number of render-blocking resources */
  renderBlockingCount: number;
  /** Largest Contentful Paint (if measurable) */
  lcpMs?: number;
  /** Cumulative Layout Shift (if measurable) */
  cls?: number;
}
```

---

## 7. AuditPrimitive — The Interface Every Primitive Implements

```typescript
/**
 * Every audit primitive implements this interface.
 * Primitives are the workers — each one evaluates one dimension.
 */
interface AuditPrimitive {
  /** Unique name of this primitive (e.g., "seo", "accessibility") */
  name: string;

  /** Which dimension this primitive evaluates */
  dimension: AuditDimension;

  /** Whether this primitive requires ownership verification to run */
  requiresOwnershipVerification: boolean;

  /** Whether this primitive uses LLM (false = deterministic, no cost) */
  usesLLM: boolean;

  /**
   * Run the primitive against crawl data.
   * @param crawl - The full crawl result
   * @param summaries - Page summaries (compressed, LLM-ready)
   * @param config - Audit configuration (paid/free, ownership status)
   * @returns Envelope wrapping an array of Findings
   */
  run(
    crawl: CrawlResult,
    summaries: PageSummary[],
    config: AuditConfig
  ): Promise<Envelope<Finding[]>>;
}

/**
 * Audit configuration passed to every primitive.
 */
interface AuditConfig {
  /** Audit tier: 'quick_check' = free/deterministic, 'full_audit' = paid/LLM */
  tier: 'quick_check' | 'full_audit';

  /** Whether the URL owner has been verified (DNS TXT, meta tag, file upload) */
  ownershipVerified: boolean;

  /** Maximum pages to audit */
  pageLimit: number;

  /** Maximum LLM cost for this audit */
  costBudget: number;

  /** Methodology version to use */
  methodologyVersion: string;

  /** Whether this is a re-audit (for delta comparison) */
  isReAudit: boolean;

  /** Previous audit ID (if re-audit) */
  previousAuditId?: string;

  /** Targeted dimensions (for targeted re-audit — empty = all) */
  targetedDimensions?: AuditDimension[];
}

/**
 * All audit dimensions.
 * V1 implements: seo, accessibility, security, performance, agent-nativeness, copy-ux
 * Future: aeo, geo, meo, analytics, legal, email, api-quality
 */
type AuditDimension =
  | 'seo'
  | 'aeo'
  | 'geo'
  | 'meo'
  | 'accessibility'
  | 'security'
  | 'performance'
  | 'ux'
  | 'copy'
  | 'analytics'
  | 'legal'
  | 'agent-nativeness'
  | 'email'
  | 'api-quality';
```

---

## 8. Synthesis Result

Output of the synthesis engine. Input to all renderers.

```typescript
/**
 * The synthesized output of a full audit.
 * Produced by the synthesis engine from all primitive outputs.
 * This is what renderers consume.
 */
interface SynthesisResult {
  /** Unique audit identifier */
  auditId: string;

  /** URL that was audited */
  url: string;

  /** All findings, de-duplicated and sorted by fix order */
  findings: Finding[];

  /** What's working well — positive observations (celebration-first) */
  celebration: CelebrationSection;

  /** Overall satisfaction score (0-100) with confidence interval */
  satisfactionScore: Score;

  /** Human-native composite score */
  humanNativeScore: Score;

  /** Agent-nativeness composite score */
  agentNativenessScore: Score;

  /** Per-dimension scores */
  dimensionScores: Record<AuditDimension, Score | null>;

  /** Causal chains linking related findings */
  causalChains: CausalChain[];

  /** Verbatim narrative from simulated user perspective */
  verbatimNarrative: string;

  /** Metadata about the audit */
  meta: AuditMeta;

  /** Delta comparison (if re-audit) */
  delta?: DeltaComparison;
}

interface Score {
  value: number;           // 0-100
  confidenceLow: number;   // Lower bound of confidence interval
  confidenceHigh: number;  // Upper bound of confidence interval
}

interface CelebrationSection {
  /** Total pages crawled */
  pageCount: number;

  /** Number of working user flows identified */
  workingFlows: number;

  /** Dimensions where no issues were found */
  cleanDimensions: AuditDimension[];

  /** Specific positive observations */
  positiveObservations: string[];
}

interface CausalChain {
  /** IDs of findings in this chain */
  findingIds: string[];

  /** Description of how these findings interact */
  description: string;

  /** Which finding to fix first (the root cause) */
  rootCauseId: string;
}

interface AuditMeta {
  /** ISO 8601 timestamp */
  timestamp: string;

  /** Total audit duration in milliseconds */
  durationMs: number;

  /** Total LLM cost in USD */
  totalCostUsd: number;

  /** Cost breakdown by primitive */
  costByPrimitive: Record<string, number>;

  /** Methodology version used */
  methodologyVersion: string;

  /** Pages crawled vs pages discovered */
  pagesCrawled: number;
  pagesDiscovered: number;

  /** Detected technology stack */
  detectedStack?: string[];

  /** Whether ownership was verified */
  ownershipVerified: boolean;

  /** Audit tier */
  tier: 'quick_check' | 'full_audit';
}

interface DeltaComparison {
  /** Previous audit ID */
  previousAuditId: string;

  /** Previous audit timestamp */
  previousTimestamp: string;

  /** Findings that were fixed since last audit */
  fixed: Finding[];

  /** Findings that are new (not in previous audit) */
  new: Finding[];

  /** Findings that regressed (were fixed, now broken again) */
  regressed: Finding[];

  /** Findings unchanged from previous audit */
  unchanged: Finding[];

  /** Score change */
  scoreChange: {
    satisfaction: number;      // positive = improvement
    humanNative: number;
    agentNativeness: number;
  };
}
```

---

## 9. PayloadRenderer — The View Layer

```typescript
/**
 * A renderer transforms SynthesisResult into a specific format.
 * All four renderers must produce output containing the same findings.
 * If a renderer drops a finding, that is a bug.
 */
type PayloadRenderer = (result: SynthesisResult) => string;

/**
 * Renderer registry — maps format names to renderer functions.
 */
interface RendererRegistry {
  'format-a': PayloadRenderer;   // Dashboard HTML
  'format-b': PayloadRenderer;   // Clipboard plain text
  'format-c': PayloadRenderer;   // File-aware (Format B + paths)
  'format-json': PayloadRenderer; // Structured JSON
}
```

---

## 10. Model Router Types

```typescript
type ModelTier = 'opus' | 'sonnet' | 'haiku' | 'openai-mini';

interface ModelConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  maxTokens: number;
  costPer1MInput: number;
  costPer1MOutput: number;
}

interface CompletionResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}
```

---

## 11. Security Types

```typescript
interface URLValidationResult {
  valid: boolean;
  url: string;
  resolvedIPs: string[];
  blocked: boolean;
  blockReason?: string;
}

interface CostBudget {
  maxPerAudit?: number;      // Optional cap in USD. NOT enforced in Phase 0 (measurement mode).
  currentSpend: number;      // Running total — always tracked
  isExceeded: boolean;       // Informational in Phase 0 (does not trigger kill). Enforcement deferred until after 50+ real audits establish cost baselines.
  primitiveSpend: Record<string, number>;  // Per-primitive cost tracking — always recorded
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-10 | Initial frozen types. All types defined. |

---

## Rules for Type Changes

1. **No breaking changes** to frozen types without a new version number
2. **Additive changes** (new optional fields) require human approval but not a version bump
3. **Breaking changes** (removed fields, changed types, renamed fields) require:
   - New version number (e.g., 1.0 → 2.0)
   - Human approval at review gate
   - Migration plan for existing data
4. All agents must use the SAME version of types
5. If you need a type that doesn't exist, propose it in a HANDOFF.md and wait for approval
