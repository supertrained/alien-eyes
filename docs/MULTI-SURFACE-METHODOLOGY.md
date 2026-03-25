# Alien Eyes — Multi-Surface Audit Methodology

> Version: 1.0 | Date: 2026-03-11
> Status: DESIGN-COMPLETE. Implementation-ready specification for MCP Server, REST API, and GraphQL API auditing.
> Source: 7-expert panel (Panel D) — protocol architect, API security researcher, GraphQL expert, agent framework developer, webhook specialist, DX researcher, reliability engineer
> Prerequisite: SURFACE-COVERAGE-SYNTHESIS.md (establishes that current architecture is web-locked; this document provides the unlock)
> Relationship to ADR-017: This document designs the future. ADR-017 governs WHEN it ships. Both are correct simultaneously.

---

## Panel Composition

| # | Expert | Domain | Primary Responsibility |
|---|--------|--------|----------------------|
| 1 | Dr. Chen Wei | MCP Protocol Architecture | MCP server audit methodology, collection/evidence types |
| 2 | Priya Ramirez | REST API Security (OWASP API Top 10) | REST API audit methodology, security-focused dimensions |
| 3 | Marco Di Stefano | GraphQL Schema Quality | GraphQL audit methodology, schema introspection strategy |
| 4 | Ayumi Takahashi | Agent Framework Development | Consumer perspective across all surfaces — what breaks agents |
| 5 | Dr. Ibrahim Osei | Webhook & Event Architecture | Webhook producer auditing, event delivery evidence |
| 6 | Sarah Lindström | Developer Experience Research | Cross-surface DX dimensions, onboarding friction |
| 7 | Dr. James Okoye | Distributed Systems Reliability | Reliability dimensions, health endpoints, degradation patterns |

---

## How This Document Is Organized

Each expert produces Sections A-G for their domain. Then the cross-panel synthesis unifies types, dimensions, grammar, and work estimates.

1. [Expert 1: Dr. Chen Wei — MCP Server Auditing](#expert-1-mcp-server-auditing)
2. [Expert 2: Priya Ramirez — REST API Auditing](#expert-2-rest-api-auditing)
3. [Expert 3: Marco Di Stefano — GraphQL API Auditing](#expert-3-graphql-api-auditing)
4. [Expert 4: Ayumi Takahashi — Agent Consumer Perspective](#expert-4-agent-consumer-perspective)
5. [Expert 5: Dr. Ibrahim Osei — Webhook Producer Auditing](#expert-5-webhook-producer-auditing)
6. [Expert 6: Sarah Lindström — Developer Experience Dimensions](#expert-6-developer-experience-dimensions)
7. [Expert 7: Dr. James Okoye — Reliability Dimensions](#expert-7-reliability-dimensions)
8. [Cross-Panel Synthesis](#cross-panel-synthesis)

---

# Expert 1: MCP Server Auditing

**Dr. Chen Wei — MCP Protocol Architect**

## 1A. Collection Type: MCPIntrospectionResult

```typescript
/**
 * Result of introspecting an MCP server. One per audit.
 * Analogous to CrawlResult for web — the shared input all MCP primitives read from.
 *
 * Collection process:
 * 1. Connect via transport (SSE/HTTP or stdio)
 * 2. Send initialize request, capture capabilities
 * 3. List all tools, resources, prompts
 * 4. For each tool: read schema, invoke with minimal safe input, capture response
 * 5. For each resource: read URI template, attempt access
 * 6. Test error handling: malformed input, missing required params, type mismatches
 * 7. Disconnect cleanly
 */
interface MCPIntrospectionResult {
  /** The MCP server connection target */
  target: MCPTarget;

  /** MCP protocol version negotiated */
  protocolVersion: string;

  /** Server-declared capabilities from initialize response */
  serverCapabilities: MCPServerCapabilities;

  /** Server metadata from initialize response */
  serverInfo: {
    name: string;
    version: string;
    description?: string;
  };

  /** All tools discovered via tools/list */
  tools: MCPToolDefinition[];

  /** All resources discovered via resources/list */
  resources: MCPResourceDefinition[];

  /** All prompts discovered via prompts/list */
  prompts: MCPPromptDefinition[];

  /** Results of invoking each tool with probe inputs */
  toolProbeResults: MCPToolProbeResult[];

  /** Results of accessing each resource */
  resourceProbeResults: MCPResourceProbeResult[];

  /** Error handling test results */
  errorHandlingResults: MCPErrorProbeResult[];

  /** Transport-level observations */
  transportMetrics: MCPTransportMetrics;

  /** Schema stability check (if previous audit exists) */
  schemaFingerprint: string;

  /** ISO 8601 timestamp when introspection started */
  timestamp: string;

  /** Total introspection duration in milliseconds */
  totalDurationMs: number;

  /** Whether the server was reachable at all */
  connectionSuccessful: boolean;

  /** Connection error message (if connectionSuccessful is false) */
  connectionError?: string;
}

interface MCPTarget {
  /** Transport type */
  transport: 'sse' | 'streamable-http' | 'stdio';

  /** For SSE/HTTP: the server URL */
  url?: string;

  /** For stdio: the command to launch the server */
  command?: string;

  /** For stdio: command arguments */
  args?: string[];

  /** For stdio: environment variables (names only, NOT values — security) */
  envVarNames?: string[];
}

interface MCPServerCapabilities {
  /** Does the server support tool listing? */
  tools?: { listChanged?: boolean };

  /** Does the server support resource listing? */
  resources?: { subscribe?: boolean; listChanged?: boolean };

  /** Does the server support prompt listing? */
  prompts?: { listChanged?: boolean };

  /** Does the server support logging? */
  logging?: Record<string, unknown>;

  /** Raw capabilities object for future-proofing */
  raw: Record<string, unknown>;
}

interface MCPToolDefinition {
  /** Tool name */
  name: string;

  /** Tool description (may be empty — that is a finding) */
  description?: string;

  /** JSON Schema for input parameters */
  inputSchema: Record<string, unknown>;

  /** Whether the schema declares required fields */
  hasRequiredFields: boolean;

  /** Number of input parameters */
  parameterCount: number;

  /** Parameter names and types (extracted from schema) */
  parameters: MCPParameterInfo[];

  /** Annotations (if any) */
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

interface MCPParameterInfo {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  hasEnum?: boolean;
  hasDefault?: boolean;
}

interface MCPResourceDefinition {
  /** Resource URI or URI template */
  uri: string;

  /** Resource name */
  name: string;

  /** Resource description */
  description?: string;

  /** MIME type */
  mimeType?: string;

  /** Whether the URI contains template variables */
  isTemplate: boolean;

  /** Template variable names (if template) */
  templateVariables?: string[];
}

interface MCPPromptDefinition {
  /** Prompt name */
  name: string;

  /** Prompt description */
  description?: string;

  /** Arguments the prompt accepts */
  arguments?: MCPPromptArgument[];
}

interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

interface MCPToolProbeResult {
  /** Which tool was probed */
  toolName: string;

  /** The input sent (safe/minimal probe — no destructive actions) */
  probeInput: Record<string, unknown>;

  /** HTTP status or MCP result status */
  success: boolean;

  /** Response content type */
  responseContentType?: 'text' | 'image' | 'resource';

  /** Response size in bytes (approximate) */
  responseSizeBytes: number;

  /** Response time in milliseconds */
  responseTimeMs: number;

  /** Whether the response is structured (JSON-parseable text) */
  responseIsStructured: boolean;

  /** Whether the response contains an isError flag */
  responseIsError: boolean;

  /** Error message (if error response) */
  errorMessage?: string;

  /** Whether the tool declared destructiveHint but was still probed safely */
  skippedDestructive: boolean;

  /** Truncated response preview (first 500 chars) for evidence */
  responsePreview: string;
}

interface MCPResourceProbeResult {
  /** Resource URI */
  uri: string;

  /** Whether the resource was accessible */
  accessible: boolean;

  /** Content type returned */
  contentType?: string;

  /** Response time in milliseconds */
  responseTimeMs: number;

  /** Error message if inaccessible */
  errorMessage?: string;
}

interface MCPErrorProbeResult {
  /** What error condition was tested */
  testCase: MCPErrorTestCase;

  /** The input that was sent */
  input: Record<string, unknown>;

  /** What the server returned */
  response: {
    isError: boolean;
    hasErrorCode: boolean;
    errorCode?: number;
    hasErrorMessage: boolean;
    errorMessage?: string;
    responseTimeMs: number;
  };

  /** Whether the error response is useful to an agent */
  agentUseful: boolean;

  /** Reasoning for agentUseful assessment */
  agentUsefulReason: string;
}

type MCPErrorTestCase =
  | 'missing_required_param'
  | 'wrong_param_type'
  | 'extra_unknown_param'
  | 'empty_input'
  | 'nonexistent_tool'
  | 'nonexistent_resource'
  | 'oversized_input'
  | 'special_characters_in_string'
  | 'null_for_required'
  | 'negative_number_for_positive';

interface MCPTransportMetrics {
  /** Time to establish connection (ms) */
  connectionTimeMs: number;

  /** Time for initialize handshake (ms) */
  initializeTimeMs: number;

  /** Number of reconnection attempts needed */
  reconnectionAttempts: number;

  /** Whether the server sent proper JSON-RPC responses */
  validJsonRpc: boolean;

  /** Whether the server handles concurrent requests */
  concurrentRequestsSupported: boolean;

  /** Whether the server properly closes connections */
  cleanDisconnect: boolean;

  /** Total bytes transferred */
  totalBytesTransferred: number;
}
```

## 1B. Summary Type: MCPServerSummary

```typescript
/**
 * Compressed representation of an MCP server for LLM consumption.
 * Target: 2-4K tokens. Analogous to PageSummary for web.
 * Created deterministically — no LLM required.
 */
interface MCPServerSummary {
  /** Server name and version */
  serverIdentity: string;

  /** Protocol version */
  protocolVersion: string;

  /** Capability summary (which features the server supports) */
  capabilities: string[];

  /** Tool inventory: name, parameter count, has description, has annotations */
  toolInventory: MCPToolInventoryItem[];

  /** Resource inventory: URI, name, is template */
  resourceInventory: MCPResourceInventoryItem[];

  /** Prompt inventory: name, argument count */
  promptInventory: MCPPromptInventoryItem[];

  /** Tool probe summary: success rate, average response time, structured response rate */
  toolProbeStats: {
    totalProbed: number;
    successRate: number;
    averageResponseTimeMs: number;
    structuredResponseRate: number;
    errorResponseRate: number;
  };

  /** Error handling summary: how well does the server handle bad input? */
  errorHandlingStats: {
    totalTests: number;
    usefulErrorRate: number;
    hasErrorCodes: boolean;
    hasErrorMessages: boolean;
    averageErrorResponseTimeMs: number;
  };

  /** Schema completeness: what percentage of tools have descriptions, typed params, etc. */
  schemaCompleteness: {
    toolsWithDescriptions: number;
    toolsWithTypedParams: number;
    toolsWithRequiredFields: number;
    toolsWithAnnotations: number;
    resourcesWithDescriptions: number;
    promptsWithDescriptions: number;
  };

  /** Transport health summary */
  transportHealth: {
    connectionTimeMs: number;
    validJsonRpc: boolean;
    cleanDisconnect: boolean;
  };

  /** Detected patterns and anti-patterns */
  detectedPatterns: string[];

  /** Token estimate for this summary */
  tokenEstimate: number;
}

interface MCPToolInventoryItem {
  name: string;
  parameterCount: number;
  hasDescription: boolean;
  hasAnnotations: boolean;
  probeSuccess: boolean;
  responseTimeMs: number;
  responseIsStructured: boolean;
}

interface MCPResourceInventoryItem {
  uri: string;
  name: string;
  isTemplate: boolean;
  accessible: boolean;
}

interface MCPPromptInventoryItem {
  name: string;
  argumentCount: number;
  hasDescription: boolean;
}
```

## 1C. Evidence Type: MCPEvidence

```typescript
/**
 * MCP-specific evidence that a finding is real.
 * Replaces domSnapshotHash + screenshotPath with MCP-native proof.
 */
interface MCPEvidence {
  /** MCP server target (URL or command) */
  target: string;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** SHA-256 hash of the full tools/list response (schema fingerprint) */
  schemaHash: string;

  /** The specific tool/resource/prompt this finding relates to */
  subject: {
    type: 'tool' | 'resource' | 'prompt' | 'transport' | 'server';
    name: string;
  };

  /** The request that produced this finding */
  requestPayload?: Record<string, unknown>;

  /** The response that demonstrates the finding (truncated to 2KB) */
  responsePayload?: string;

  /** The error response (if finding is about error handling) */
  errorResponse?: string;

  /** The tool's JSON Schema definition (for schema-related findings) */
  toolSchema?: Record<string, unknown>;

  /** Which model produced this finding (if LLM-generated) */
  model?: string;

  /** Tokens used */
  tokensUsed?: number;

  /** Reasoning chain */
  reasoning?: string;

  /** Evidence completeness 0-1 */
  completeness: number;
}
```

## 1D. Audit Dimensions (MCP-Specific)

| Dimension | Code | What It Measures | LLM Required? | Severity Criteria |
|-----------|------|-----------------|---------------|-------------------|
| Schema Quality | `mcp-schema` | Tool descriptions, parameter types, required fields, annotations | No (deterministic) | CRITICAL: tools with no input schema; HIGH: >50% tools missing descriptions |
| Tool Reliability | `mcp-reliability` | Probe success rate, response time, structured responses | No (deterministic) | CRITICAL: >25% probes fail; HIGH: avg response >5s |
| Error Handling | `mcp-errors` | Useful error messages, error codes, graceful failures | Partially (judging "usefulness") | HIGH: errors return no message; MEDIUM: errors lack codes |
| Agent-Nativeness | `agent-nativeness` | Parity, granularity, composability, CRUD completeness | Yes (judgment) | Uses shared AN rubric from METHODOLOGY-v0.1 |
| Security Surface | `mcp-security` | Input validation, auth model, secret exposure, SSRF vectors | No (mostly deterministic) | CRITICAL: server executes arbitrary commands; HIGH: no input validation |
| Protocol Conformance | `mcp-protocol` | JSON-RPC correctness, capability negotiation, transport compliance | No (deterministic) | HIGH: invalid JSON-RPC; MEDIUM: missing capabilities |
| Documentation & DX | `mcp-dx` | README quality, example usage, setup instructions, changelog | Yes (judging quality) | MEDIUM: no README; LOW: no examples |

**Quick Check (free):** Schema Quality + Protocol Conformance + Tool Reliability. Deterministic only.
**Full Audit (paid):** All 7 dimensions. LLM for judgment calls.

## 1E. Scoring Rubric

| Check | Type | Severity if Failing |
|-------|------|-------------------|
| Server responds to initialize | Deterministic | CRITICAL (if no response) |
| tools/list returns valid response | Deterministic | CRITICAL (if error) |
| Every tool has a description | Deterministic | HIGH (if >50% missing), MEDIUM (if >0% missing) |
| Every tool has typed input schema | Deterministic | HIGH (if >50% missing), MEDIUM (if >0% missing) |
| Every parameter has a description | Deterministic | MEDIUM |
| Required fields are declared | Deterministic | MEDIUM |
| Tool annotations present (destructiveHint, etc.) | Deterministic | LOW |
| Tool probe success rate >95% | Deterministic | CRITICAL (<75%), HIGH (<95%) |
| Tool response time <2s (p95) | Deterministic | MEDIUM (2-5s), HIGH (>5s) |
| Tool responses are structured (JSON-parseable) | Deterministic | HIGH |
| Missing required param returns clear error | Deterministic | HIGH |
| Wrong type returns clear error | Deterministic | MEDIUM |
| Unknown params handled gracefully | Deterministic | LOW |
| Error responses include error codes | Deterministic | MEDIUM |
| Error messages are actionable | LLM (Haiku) | MEDIUM |
| No secret exposure in error messages | Pattern match | CRITICAL |
| No command injection vectors | Pattern match + Haiku | CRITICAL |
| Valid JSON-RPC 2.0 responses | Deterministic | HIGH |
| Proper capability negotiation | Deterministic | MEDIUM |
| Clean connection lifecycle | Deterministic | LOW |
| README exists and is substantive | LLM (Haiku) | MEDIUM |
| Example usage provided | Deterministic | LOW |
| Composability assessment | LLM (Sonnet) | MEDIUM (findings only) |
| Parity with documented capabilities | LLM (Sonnet) | HIGH |
| CRUD completeness per entity | LLM (Sonnet) | MEDIUM |

## 1F. Scenario Grammar Extensions (MCP)

### Persona Primitives (MCP)

| Primitive | Description | Affects |
|-----------|-------------|---------|
| `mcp-agent-first-use` | Agent discovering MCP server for first time | Schema quality, documentation |
| `mcp-agent-integration` | Agent integrating server into workflow | Composability, error handling |
| `mcp-agent-recovery` | Agent encountering errors mid-workflow | Error handling, resilience |
| `mcp-human-developer` | Human developer evaluating the server | Documentation, setup, examples |
| `mcp-orchestrator` | Agent orchestrator routing across multiple MCP servers | Capability discovery, tool naming |
| `mcp-security-auditor` | Security researcher probing for vulnerabilities | Input validation, auth, injection |

### Entry Point Primitives (MCP)

| Primitive | Description | Affects |
|-----------|-------------|---------|
| `mcp-initialize` | Fresh connection + capability discovery | Handshake, capabilities |
| `mcp-tool-discovery` | Browsing available tools | Tool listing, descriptions |
| `mcp-resource-browse` | Accessing resources | Resource availability |
| `mcp-prompt-discover` | Listing available prompts | Prompt quality |
| `mcp-readme-first` | Reading documentation before connecting | DX quality |
| `mcp-npm-install` | Installing via npm/pip and running | Install experience |

### Intent Primitives (MCP)

| Primitive | Description | Affects |
|-----------|-------------|---------|
| `mcp-discover-capabilities` | Understanding what the server can do | Schema completeness |
| `mcp-execute-tool` | Running a specific tool | Tool reliability, response quality |
| `mcp-compose-workflow` | Chaining multiple tools | Composability, data flow |
| `mcp-handle-error` | Recovering from a failed tool call | Error handling |
| `mcp-access-data` | Reading data via resources | Resource accessibility |
| `mcp-evaluate-trust` | Deciding whether to integrate this server | Annotations, documentation |

### Adversarial Condition Primitives (MCP)

| Primitive | Description | Tests |
|-----------|-------------|-------|
| `mcp-normal` | Everything works | Baseline |
| `mcp-slow-server` | Server takes 10s+ to respond | Timeout handling |
| `mcp-partial-schema` | Some tools have no input schema | Schema resilience |
| `mcp-malformed-input` | Intentionally wrong parameter types | Input validation |
| `mcp-oversized-input` | Very large strings/arrays | Resource limits |
| `mcp-concurrent-calls` | Multiple tool calls simultaneously | Concurrency handling |
| `mcp-reconnection` | Connection drops mid-operation | Transport resilience |
| `mcp-schema-drift` | Server schema changed since last audit | Schema stability |

**Total MCP scenarios:** 6 x 6 x 6 x 8 = **1,728 unique configurations**

## 1G. Work Unit Estimates (MCP)

| WU | Title | Agent | Est. Hours | Dependencies | Description |
|----|-------|-------|------------|-------------|-------------|
| WU-M01 | MCP Client & Connection Manager | Opus | 4h | WU-00 (types) | MCP client for SSE/HTTP + stdio, connection lifecycle, capability negotiation |
| WU-M02 | MCP Introspection Engine | Opus | 6h | WU-M01 | Discover tools/resources/prompts, build MCPIntrospectionResult, probe tools safely |
| WU-M03 | MCP Summarizer | Codex | 3h | WU-M02 | Transform MCPIntrospectionResult → MCPServerSummary (deterministic) |
| WU-M04 | MCP Audit Primitives (Deterministic) | Codex | 5h | WU-M03 | Schema quality, protocol conformance, tool reliability primitives |
| WU-M05 | MCP Audit Primitives (LLM) | Opus | 5h | WU-M03, WU-05 (model router) | Error usefulness, composability, parity, CRUD primitives |
| WU-M06 | MCP Security Primitive | Opus | 4h | WU-M02, WU-00b (security) | Input validation, injection detection, secret exposure |
| WU-M07 | MCP Scenario Grammar | Opus | 3h | WU-M04, WU-M05 | Implement MCP grammar primitives, selection logic |
| WU-M08 | MCP Integration & Pipeline | Opus | 4h | WU-M01-M07, WU-06 (pipeline) | Wire MCP into the monolithic pipeline alongside web |

**Total: 8 WUs, ~34 hours.** Critical path: WU-M01 → WU-M02 → WU-M03 → WU-M04/M05 (parallel) → WU-M08.

---

# Expert 2: REST API Auditing

**Priya Ramirez — REST API Security Researcher (OWASP API Top 10)**

## 2A. Collection Type: APIProbeResult

```typescript
/**
 * Result of probing a REST API. One per audit.
 * Collection process:
 * 1. Parse OpenAPI/Swagger spec (if provided)
 * 2. Discover endpoints from spec + common path probing
 * 3. For each endpoint: send safe GET/HEAD, capture response
 * 4. Test authentication flows
 * 5. Test error handling with invalid inputs
 * 6. Test rate limiting behavior
 * 7. Test CORS configuration
 * 8. Catalog response schemas
 */
interface APIProbeResult {
  /** Base URL of the API */
  baseUrl: string;

  /** API specification (if discovered or provided) */
  spec?: APISpecInfo;

  /** All discovered endpoints */
  endpoints: APIEndpointInfo[];

  /** Authentication probe results */
  authProbe: APIAuthProbeResult;

  /** Rate limiting probe results */
  rateLimitProbe: APIRateLimitProbeResult;

  /** CORS probe results */
  corsProbe: APICORSProbeResult;

  /** Error handling probe results */
  errorProbes: APIErrorProbeResult[];

  /** Security header analysis */
  securityHeaders: APISecurityHeaders;

  /** Response schema catalog (fingerprints of all response shapes) */
  responseSchemas: APIResponseSchemaEntry[];

  /** Versioning strategy detected */
  versioningStrategy: APIVersioningInfo;

  /** Health/readiness endpoint probe */
  healthProbe: APIHealthProbeResult;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** Total duration in milliseconds */
  totalDurationMs: number;

  /** Whether the API was reachable */
  connectionSuccessful: boolean;

  /** Connection error (if unreachable) */
  connectionError?: string;

  /** Detected API framework/platform */
  detectedStack?: string[];
}

interface APISpecInfo {
  /** Spec format */
  format: 'openapi-3.0' | 'openapi-3.1' | 'swagger-2.0' | 'none';

  /** Where the spec was found */
  source: 'provided' | 'well-known-path' | 'link-header' | 'not-found';

  /** Spec URL (if discovered) */
  specUrl?: string;

  /** Number of endpoints in spec */
  endpointCount: number;

  /** Number of schemas defined */
  schemaCount: number;

  /** Whether spec has descriptions */
  hasDescriptions: boolean;

  /** Whether spec has examples */
  hasExamples: boolean;

  /** Whether spec defines error responses */
  hasErrorSchemas: boolean;

  /** Whether spec defines authentication */
  hasSecuritySchemes: boolean;

  /** Spec validation errors (if any) */
  validationErrors: string[];

  /** SHA-256 hash of spec for fingerprinting */
  specHash: string;
}

interface APIEndpointInfo {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

  /** Path (e.g., /api/v1/users/{id}) */
  path: string;

  /** How this endpoint was discovered */
  discoverySource: 'spec' | 'probe' | 'link-header' | 'common-path';

  /** Probe result (if we sent a request) */
  probe?: APIEndpointProbe;

  /** Whether this endpoint requires authentication (from spec or probe) */
  requiresAuth: boolean;

  /** Spec-declared description (if any) */
  description?: string;

  /** Spec-declared request schema (if any) */
  requestSchema?: Record<string, unknown>;

  /** Spec-declared response schema (if any) */
  responseSchema?: Record<string, unknown>;

  /** Content types accepted */
  acceptedContentTypes?: string[];

  /** Content types returned */
  returnedContentTypes?: string[];

  /** Whether this endpoint is deprecated (from spec or header) */
  deprecated: boolean;
}

interface APIEndpointProbe {
  /** HTTP status code returned */
  statusCode: number;

  /** Response content type */
  contentType: string;

  /** Response size in bytes */
  responseSizeBytes: number;

  /** Response time in milliseconds */
  responseTimeMs: number;

  /** Whether the response is valid JSON */
  isJson: boolean;

  /** Response headers (security-relevant subset) */
  headers: Record<string, string>;

  /** Truncated response body preview (first 1KB) */
  bodyPreview: string;

  /** Whether the response matches the spec schema (if spec exists) */
  matchesSpec?: boolean;

  /** Schema drift details (if doesn't match spec) */
  schemaDriftDetails?: string[];
}

interface APIAuthProbeResult {
  /** Authentication schemes detected */
  schemesDetected: ('bearer' | 'api-key' | 'basic' | 'oauth2' | 'none' | 'unknown')[];

  /** Whether unauthenticated requests get 401/403 (not 500) */
  properAuthErrors: boolean;

  /** Whether auth error responses are structured JSON */
  structuredAuthErrors: boolean;

  /** Whether the API leaks information in auth errors (e.g., "user not found" vs "invalid credentials") */
  authInfoLeak: boolean;

  /** Whether JWT tokens are validated (if bearer auth) */
  jwtValidation?: boolean;

  /** Whether API key location is documented (header vs query vs body) */
  apiKeyLocationDocumented?: boolean;

  /** OAuth endpoints probed */
  oauthEndpoints?: string[];
}

interface APIRateLimitProbeResult {
  /** Whether rate limiting is present */
  hasRateLimit: boolean;

  /** Whether rate limit headers are returned (X-RateLimit-*, RateLimit-*) */
  hasRateLimitHeaders: boolean;

  /** Standard used (if any) */
  headerStandard?: 'rfc-6585' | 'x-ratelimit' | 'retry-after' | 'custom';

  /** Response code when rate limited */
  rateLimitStatusCode?: number;

  /** Whether rate limit response is structured JSON */
  structuredRateLimitResponse: boolean;

  /** Whether the response includes retry-after */
  hasRetryAfter: boolean;
}

interface APICORSProbeResult {
  /** Whether CORS headers are present */
  hasCors: boolean;

  /** Allowed origins */
  allowedOrigins: string[];

  /** Whether wildcard (*) origin is allowed */
  wildcardOrigin: boolean;

  /** Whether credentials are allowed with wildcard origin (security issue) */
  credentialsWithWildcard: boolean;

  /** Allowed methods */
  allowedMethods: string[];

  /** Whether preflight (OPTIONS) works correctly */
  preflightWorks: boolean;
}

interface APIErrorProbeResult {
  /** What error condition was tested */
  testCase: APIErrorTestCase;

  /** The request that was sent */
  request: {
    method: string;
    path: string;
    body?: string;
    headers?: Record<string, string>;
  };

  /** The response received */
  response: {
    statusCode: number;
    contentType: string;
    isJson: boolean;
    hasErrorCode: boolean;
    hasErrorMessage: boolean;
    hasDocLink: boolean;
    bodyPreview: string;
    responseTimeMs: number;
  };

  /** Whether the error response is agent-usable */
  agentUsable: boolean;
}

type APIErrorTestCase =
  | 'missing_required_field'
  | 'wrong_field_type'
  | 'malformed_json'
  | 'empty_body'
  | 'nonexistent_endpoint'
  | 'wrong_content_type'
  | 'oversized_body'
  | 'invalid_query_param'
  | 'unauthenticated'
  | 'forbidden'
  | 'method_not_allowed'
  | 'accept_negotiation';

interface APISecurityHeaders {
  /** Security headers present on API responses */
  csp: string | null;
  hsts: string | null;
  xContentTypeOptions: string | null;
  xFrameOptions: string | null;
  referrerPolicy: string | null;

  /** Whether API responses set cookies (unusual for APIs) */
  setsCookies: boolean;

  /** Whether HTTPS is enforced */
  httpsEnforced: boolean;

  /** Whether the API exposes server version in headers */
  exposesServerVersion: boolean;

  /** Whether stack traces leak in error responses */
  leaksStackTraces: boolean;
}

interface APIResponseSchemaEntry {
  /** Endpoint this schema was observed on */
  endpoint: string;

  /** Schema fingerprint (SHA-256 of sorted keys + types) */
  schemaFingerprint: string;

  /** Schema shape (keys and types, no values) */
  shape: Record<string, string>;
}

interface APIVersioningInfo {
  /** Detected versioning strategy */
  strategy: 'url-path' | 'header' | 'query-param' | 'none-detected';

  /** Versions detected */
  versionsDetected: string[];

  /** Whether deprecated versions are still accessible */
  deprecatedVersionsAccessible: boolean;

  /** Whether version sunset headers are present */
  hasSunsetHeaders: boolean;
}

interface APIHealthProbeResult {
  /** Whether a health endpoint exists */
  hasHealthEndpoint: boolean;

  /** Health endpoint path (if found) */
  healthPath?: string;

  /** Health response status */
  healthStatus?: number;

  /** Whether the health response includes component status */
  hasComponentStatus: boolean;

  /** Response time in milliseconds */
  responseTimeMs?: number;
}
```

## 2B. Summary Type: APIServerSummary

```typescript
/**
 * Compressed representation of a REST API for LLM consumption.
 * Target: 3-5K tokens.
 */
interface APIServerSummary {
  /** Base URL */
  baseUrl: string;

  /** Spec status */
  specStatus: {
    hasSpec: boolean;
    format?: string;
    endpointCount: number;
    hasDescriptions: boolean;
    hasExamples: boolean;
    validationErrorCount: number;
  };

  /** Endpoint inventory */
  endpointInventory: {
    method: string;
    path: string;
    requiresAuth: boolean;
    probeStatusCode?: number;
    responseTimeMs?: number;
    matchesSpec?: boolean;
  }[];

  /** Authentication summary */
  authSummary: {
    schemes: string[];
    properErrors: boolean;
    infoLeaks: boolean;
  };

  /** Rate limiting summary */
  rateLimitSummary: {
    present: boolean;
    hasHeaders: boolean;
    hasRetryAfter: boolean;
  };

  /** Error handling summary */
  errorHandlingSummary: {
    totalTests: number;
    structuredErrorRate: number;
    hasErrorCodes: boolean;
    hasDocLinks: boolean;
    agentUsableRate: number;
  };

  /** Security summary */
  securitySummary: {
    httpsEnforced: boolean;
    hasHsts: boolean;
    hasCsp: boolean;
    leaksStackTraces: boolean;
    exposesServerVersion: boolean;
    corsIssues: string[];
  };

  /** Versioning summary */
  versioningSummary: {
    strategy: string;
    versionsFound: number;
  };

  /** Health endpoint summary */
  healthSummary: {
    exists: boolean;
    responsive: boolean;
  };

  /** Detected patterns and anti-patterns */
  detectedPatterns: string[];

  /** Token estimate */
  tokenEstimate: number;
}
```

## 2C. Evidence Type: APIEvidence

```typescript
/**
 * REST API-specific evidence that a finding is real.
 */
interface APIEvidence {
  /** API base URL */
  baseUrl: string;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** SHA-256 hash of the OpenAPI spec (if available) */
  specHash?: string;

  /** The specific endpoint this finding relates to */
  endpoint: {
    method: string;
    path: string;
  };

  /** The HTTP request that demonstrates the finding */
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    bodyPreview?: string;
  };

  /** The HTTP response that demonstrates the finding */
  response?: {
    statusCode: number;
    headers: Record<string, string>;
    bodyPreview: string;
    responseTimeMs: number;
  };

  /** Spec excerpt showing the discrepancy (if spec-related finding) */
  specExcerpt?: string;

  /** Schema diff (if schema drift finding) */
  schemaDiff?: string;

  /** Which model produced this finding */
  model?: string;

  /** Tokens used */
  tokensUsed?: number;

  /** Reasoning chain */
  reasoning?: string;

  /** Evidence completeness 0-1 */
  completeness: number;
}
```

## 2D. Audit Dimensions (REST API-Specific)

| Dimension | Code | What It Measures | LLM Required? | Severity Criteria |
|-----------|------|-----------------|---------------|-------------------|
| Spec Quality | `api-spec` | OpenAPI completeness, accuracy, examples, error schemas | No (deterministic) | HIGH: no spec; MEDIUM: spec with >5 validation errors |
| Contract Fidelity | `api-contract` | Response matches spec; schema drift; undocumented fields | No (deterministic) | CRITICAL: response schema contradicts spec; HIGH: undocumented fields |
| Error Handling | `api-errors` | Structured errors, error codes, doc links, agent-usable messages | Partially (judging usefulness) | HIGH: 500s with stack traces; MEDIUM: unstructured errors |
| Authentication | `api-auth` | Proper 401/403, no info leaks, JWT validation, key management | No (mostly deterministic) | CRITICAL: auth bypass; HIGH: info leaks in auth errors |
| Rate Limiting | `api-ratelimit` | Headers present, structured response, retry-after | No (deterministic) | HIGH: no rate limiting; MEDIUM: no retry-after header |
| Security Surface | `api-security` | HTTPS, CORS, headers, version exposure, injection | No (mostly deterministic) | CRITICAL: credentials+wildcard CORS; HIGH: no HTTPS |
| Agent-Nativeness | `agent-nativeness` | Parity, granularity, composability, CRUD completeness | Yes (judgment) | Shared AN rubric |
| Versioning & Stability | `api-versioning` | Version strategy, deprecation, sunset headers, backwards compat | No (deterministic) | MEDIUM: no versioning; LOW: no sunset headers |
| Documentation & DX | `api-dx` | Description quality, examples, getting-started experience | Yes (judging quality) | MEDIUM: no descriptions; LOW: no examples |

**Quick Check (free):** Spec Quality + Security Surface + Rate Limiting + Contract Fidelity. Deterministic only.
**Full Audit (paid):** All 9 dimensions.

## 2E. Scoring Rubric

| Check | Type | Severity if Failing |
|-------|------|-------------------|
| HTTPS enforced | Deterministic | CRITICAL |
| OpenAPI spec exists and is valid | Deterministic | HIGH (none), MEDIUM (invalid) |
| Spec descriptions on all endpoints | Deterministic | MEDIUM |
| Spec examples on all endpoints | Deterministic | LOW |
| Spec error response schemas defined | Deterministic | MEDIUM |
| Responses match spec schemas | Deterministic | CRITICAL (major drift), HIGH (minor drift) |
| Proper 401 for unauthenticated requests | Deterministic | HIGH |
| No info leakage in auth errors | Pattern match | HIGH |
| No stack traces in error responses | Pattern match | HIGH |
| Structured JSON error responses | Deterministic | HIGH |
| Error responses include error codes | Deterministic | MEDIUM |
| Error responses include doc links | Deterministic | LOW |
| Rate limiting present | Deterministic | HIGH |
| Rate limit headers (RateLimit-*) | Deterministic | MEDIUM |
| Retry-after on 429 | Deterministic | MEDIUM |
| No wildcard CORS + credentials | Deterministic | CRITICAL |
| CORS allows only expected origins | Deterministic | MEDIUM |
| No server version in headers | Deterministic | LOW |
| HSTS present | Deterministic | MEDIUM |
| Health endpoint exists | Deterministic | MEDIUM |
| Versioning strategy present | Deterministic | MEDIUM |
| Deprecated endpoints marked | Deterministic | LOW |
| Content negotiation works | Deterministic | MEDIUM |
| Pagination on list endpoints | Deterministic | MEDIUM |
| API key in header, not query string | Deterministic | HIGH (if in query) |
| Agent-Nativeness composite | LLM (Sonnet) | Uses AN rubric |
| Documentation completeness | LLM (Haiku) | MEDIUM |

## 2F. Scenario Grammar Extensions (REST API)

### Persona Primitives (REST API)

| Primitive | Description | Affects |
|-----------|-------------|---------|
| `api-first-integrator` | Developer integrating API for first time | Docs, auth, onboarding |
| `api-agent-consumer` | AI agent consuming the API | Structured responses, error handling |
| `api-mobile-client` | Mobile app consuming the API | Payload size, pagination, caching |
| `api-security-researcher` | Security researcher probing for vulns | Auth, injection, information leaks |
| `api-ci-pipeline` | Automated CI/CD pipeline calling API | Health endpoints, rate limits, idempotency |
| `api-competitor-analyst` | Someone evaluating the API against alternatives | DX, completeness, pricing transparency |

### Entry Point Primitives (REST API)

| Primitive | Description | Affects |
|-----------|-------------|---------|
| `api-spec-first` | Reads OpenAPI spec before making calls | Spec quality, examples |
| `api-root-discovery` | Starts at base URL, discovers from there | API root, HATEOAS, link headers |
| `api-docs-first` | Reads developer docs, then calls | Documentation completeness |
| `api-endpoint-direct` | Goes directly to a specific endpoint | Standalone endpoint quality |
| `api-health-check` | Checks health endpoint first | Health endpoint quality |
| `api-sdk-install` | Starts by installing an SDK | SDK quality, generated code |

### Intent Primitives (REST API)

| Primitive | Description | Affects |
|-----------|-------------|---------|
| `api-list-resources` | List/paginate a collection | Pagination, filtering |
| `api-crud-entity` | Create, read, update, delete one entity | CRUD completeness |
| `api-authenticate` | Go through auth flow | Auth UX, key provisioning |
| `api-handle-error` | Trigger and recover from errors | Error handling |
| `api-search-filter` | Search or filter a collection | Query parameter design |
| `api-batch-operation` | Perform bulk operations | Batch endpoints, rate limits |
| `api-webhook-setup` | Configure webhook delivery | Webhook registration, schema |

### Adversarial Condition Primitives (REST API)

| Primitive | Description | Tests |
|-----------|-------------|-------|
| `api-normal` | Everything works | Baseline |
| `api-expired-token` | Use expired auth token | Token refresh, error messages |
| `api-malformed-json` | Send invalid JSON body | Input validation |
| `api-wrong-content-type` | Send wrong Content-Type | Content negotiation |
| `api-oversized-payload` | Very large request body | Size limits |
| `api-high-frequency` | Rapid sequential requests | Rate limiting |
| `api-schema-mismatch` | Send fields not in spec | Extra field handling |
| `api-concurrent-writes` | Parallel PUT/PATCH | Concurrency handling |
| `api-deprecated-version` | Call deprecated API version | Deprecation handling |

**Total API scenarios:** 6 x 6 x 7 x 9 = **2,268 unique configurations**

## 2G. Work Unit Estimates (REST API)

| WU | Title | Agent | Est. Hours | Dependencies | Description |
|----|-------|-------|------------|-------------|-------------|
| WU-A01 | API Discovery & Spec Parser | Codex | 5h | WU-00 (types) | OpenAPI parsing, endpoint discovery, spec validation |
| WU-A02 | API Probe Engine | Opus | 6h | WU-A01, WU-00b (security) | Safe endpoint probing, auth detection, schema cataloging |
| WU-A03 | API Summarizer | Codex | 3h | WU-A02 | Transform APIProbeResult → APIServerSummary |
| WU-A04 | API Audit Primitives (Deterministic) | Codex | 6h | WU-A03 | Spec quality, contract fidelity, security, rate limiting |
| WU-A05 | API Audit Primitives (LLM) | Opus | 4h | WU-A03, WU-05 (model router) | Error usefulness, composability, DX assessment |
| WU-A06 | OWASP API Security Primitive | Opus | 5h | WU-A02 | Top 10 checks: BOLA, auth, injection, SSRF, rate limiting |
| WU-A07 | API Scenario Grammar | Opus | 3h | WU-A04, WU-A05 | Implement API grammar primitives |
| WU-A08 | API Integration & Pipeline | Opus | 4h | WU-A01-A07, WU-06 | Wire into monolithic pipeline |

**Total: 8 WUs, ~36 hours.** Critical path: WU-A01 → WU-A02 → WU-A03 → WU-A04/A05 (parallel) → WU-A08.

---

# Expert 3: GraphQL API Auditing

**Marco Di Stefano — GraphQL Schema Quality Expert**

## 3A. Collection Type: GraphQLIntrospectionResult

```typescript
/**
 * Result of introspecting a GraphQL API. One per audit.
 * Collection process:
 * 1. Run introspection query (if allowed)
 * 2. Analyze schema: types, fields, mutations, subscriptions
 * 3. Test query complexity limits
 * 4. Test N+1 detection via nested queries
 * 5. Test error handling
 * 6. Test deprecated field handling
 * 7. Test batching behavior
 */
interface GraphQLIntrospectionResult {
  /** GraphQL endpoint URL */
  endpointUrl: string;

  /** Whether introspection is enabled */
  introspectionEnabled: boolean;

  /** Schema information (if introspection succeeded or schema provided) */
  schema?: GraphQLSchemaInfo;

  /** Query probe results */
  queryProbes: GraphQLQueryProbeResult[];

  /** Mutation discovery results */
  mutationProbes: GraphQLMutationProbeResult[];

  /** Error handling probe results */
  errorProbes: GraphQLErrorProbeResult[];

  /** Complexity/depth limit probe */
  complexityProbe: GraphQLComplexityProbeResult;

  /** Batching probe */
  batchingProbe: GraphQLBatchingProbeResult;

  /** Authentication probe */
  authProbe: GraphQLAuthProbeResult;

  /** Subscription probe (if applicable) */
  subscriptionProbe?: GraphQLSubscriptionProbeResult;

  /** Security analysis */
  securityAnalysis: GraphQLSecurityAnalysis;

  /** Schema fingerprint */
  schemaFingerprint?: string;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** Total duration */
  totalDurationMs: number;

  /** Reachability */
  connectionSuccessful: boolean;
  connectionError?: string;
}

interface GraphQLSchemaInfo {
  /** Total number of types (excluding built-ins) */
  typeCount: number;

  /** Query type fields */
  queryFields: GraphQLFieldInfo[];

  /** Mutation type fields */
  mutationFields: GraphQLFieldInfo[];

  /** Subscription type fields */
  subscriptionFields: GraphQLFieldInfo[];

  /** Custom types defined */
  customTypes: GraphQLTypeInfo[];

  /** Input types defined */
  inputTypes: GraphQLTypeInfo[];

  /** Enum types defined */
  enumTypes: GraphQLEnumInfo[];

  /** Interface types */
  interfaceTypes: GraphQLTypeInfo[];

  /** Union types */
  unionTypes: GraphQLUnionInfo[];

  /** Deprecated fields/types */
  deprecatedItems: GraphQLDeprecationInfo[];

  /** Schema directives */
  directives: string[];

  /** Maximum nesting depth observed in type graph */
  maxNestingDepth: number;

  /** Circular reference detection */
  circularReferences: string[][];

  /** Whether descriptions are present on types/fields */
  descriptionCoverage: {
    typesWithDescriptions: number;
    totalTypes: number;
    fieldsWithDescriptions: number;
    totalFields: number;
    argumentsWithDescriptions: number;
    totalArguments: number;
  };
}

interface GraphQLFieldInfo {
  name: string;
  type: string;
  description?: string;
  isDeprecated: boolean;
  deprecationReason?: string;
  arguments: GraphQLArgumentInfo[];
  isNonNull: boolean;
  isList: boolean;
}

interface GraphQLArgumentInfo {
  name: string;
  type: string;
  description?: string;
  defaultValue?: unknown;
  isRequired: boolean;
}

interface GraphQLTypeInfo {
  name: string;
  kind: 'OBJECT' | 'INPUT_OBJECT' | 'INTERFACE' | 'SCALAR' | 'ENUM' | 'UNION';
  description?: string;
  fieldCount: number;
  fields: { name: string; type: string; description?: string }[];
}

interface GraphQLEnumInfo {
  name: string;
  description?: string;
  values: { name: string; description?: string; isDeprecated: boolean }[];
}

interface GraphQLUnionInfo {
  name: string;
  description?: string;
  possibleTypes: string[];
}

interface GraphQLDeprecationInfo {
  location: string;
  name: string;
  reason?: string;
  type: 'field' | 'type' | 'enum_value' | 'argument';
}

interface GraphQLQueryProbeResult {
  /** The query sent */
  query: string;

  /** What this probe tests */
  testPurpose: string;

  /** Whether the query succeeded */
  success: boolean;

  /** Response data shape (keys and types, no values) */
  responseShape?: Record<string, string>;

  /** Response time */
  responseTimeMs: number;

  /** Response size */
  responseSizeBytes: number;

  /** Errors returned */
  errors?: GraphQLErrorDetail[];

  /** Whether extensions were returned */
  hasExtensions: boolean;

  /** Complexity score (if server reports it) */
  reportedComplexity?: number;
}

interface GraphQLMutationProbeResult {
  /** Mutation name */
  mutationName: string;

  /** Whether it was safe to probe (read-only test or dry-run) */
  safeToProbe: boolean;

  /** If probed, the result */
  probeResult?: {
    success: boolean;
    responseTimeMs: number;
    errors?: GraphQLErrorDetail[];
  };

  /** Input type analysis */
  inputAnalysis: {
    requiredFields: number;
    optionalFields: number;
    hasValidation: boolean;
  };
}

interface GraphQLErrorDetail {
  message: string;
  hasCode: boolean;
  code?: string;
  hasPath: boolean;
  path?: string[];
  hasLocations: boolean;
  hasExtensions: boolean;
}

interface GraphQLComplexityProbeResult {
  /** Whether the server enforces query depth limits */
  hasDepthLimit: boolean;

  /** Maximum depth allowed (if detected) */
  maxDepthAllowed?: number;

  /** Whether the server enforces query complexity limits */
  hasComplexityLimit: boolean;

  /** Maximum complexity allowed (if detected) */
  maxComplexityAllowed?: number;

  /** Whether the server returns complexity info in extensions */
  reportsComplexity: boolean;

  /** Whether deeply nested queries are rejected */
  rejectsDeepQueries: boolean;

  /** Whether wide queries (many sibling fields) are limited */
  hasWidthLimit: boolean;

  /** The depth at which the server starts rejecting */
  rejectionDepth?: number;
}

interface GraphQLBatchingProbeResult {
  /** Whether the server accepts batched queries */
  supportsBatching: boolean;

  /** Whether batch size is limited */
  hasBatchLimit: boolean;

  /** Maximum batch size (if limited) */
  maxBatchSize?: number;

  /** Whether individual errors in a batch don't fail the whole batch */
  partialBatchSuccess: boolean;
}

interface GraphQLAuthProbeResult {
  /** Whether unauthenticated introspection is allowed */
  unauthenticatedIntrospection: boolean;

  /** Whether unauthenticated queries return proper errors */
  properUnauthenticatedErrors: boolean;

  /** Whether field-level authorization exists */
  fieldLevelAuth: boolean;

  /** Fields accessible without auth (potential issue) */
  unauthenticatedFieldCount: number;
}

interface GraphQLSubscriptionProbeResult {
  /** Whether subscriptions are available */
  available: boolean;

  /** Transport (ws, sse) */
  transport?: 'websocket' | 'sse';

  /** Whether auth is required for subscriptions */
  requiresAuth: boolean;

  /** Whether subscription count is limited */
  hasSubscriptionLimit: boolean;
}

interface GraphQLSecurityAnalysis {
  /** Introspection enabled in production (potential issue) */
  introspectionInProduction: boolean;

  /** Query depth unlimited (DoS risk) */
  unlimitedDepth: boolean;

  /** No query complexity limit (DoS risk) */
  unlimitedComplexity: boolean;

  /** Batching unlimited (DoS amplification) */
  unlimitedBatching: boolean;

  /** Suggestions enabled (information disclosure) */
  suggestionsEnabled: boolean;

  /** Debug mode detected */
  debugModeDetected: boolean;

  /** Stack traces in errors */
  stackTracesInErrors: boolean;

  /** Field-level injection possible */
  injectionVectors: string[];
}
```

## 3B. Summary Type: GraphQLServerSummary

```typescript
/**
 * Compressed representation of a GraphQL API for LLM consumption.
 * Target: 3-5K tokens.
 */
interface GraphQLServerSummary {
  /** Endpoint URL */
  endpointUrl: string;

  /** Introspection status */
  introspectionEnabled: boolean;

  /** Schema overview */
  schemaOverview: {
    queryFieldCount: number;
    mutationFieldCount: number;
    subscriptionFieldCount: number;
    customTypeCount: number;
    enumCount: number;
    inputTypeCount: number;
    deprecatedItemCount: number;
    descriptionCoverage: number;
  };

  /** Top-level query fields (name + return type) */
  queryFields: { name: string; type: string; hasDescription: boolean }[];

  /** Top-level mutation fields (name + input type) */
  mutationFields: { name: string; hasDescription: boolean; inputFieldCount: number }[];

  /** Query probe stats */
  probeStats: {
    totalProbed: number;
    successRate: number;
    averageResponseTimeMs: number;
    errorRate: number;
  };

  /** Error handling quality */
  errorQuality: {
    hasErrorCodes: boolean;
    hasErrorPaths: boolean;
    hasExtensions: boolean;
    structuredErrorRate: number;
  };

  /** Security posture */
  securityPosture: {
    depthLimited: boolean;
    complexityLimited: boolean;
    batchLimited: boolean;
    authRequired: boolean;
    introspectionProtected: boolean;
  };

  /** Detected patterns and anti-patterns */
  detectedPatterns: string[];

  /** Token estimate */
  tokenEstimate: number;
}
```

## 3C. Evidence Type: GraphQLEvidence

```typescript
/**
 * GraphQL-specific evidence that a finding is real.
 */
interface GraphQLEvidence {
  /** GraphQL endpoint URL */
  endpointUrl: string;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** SHA-256 hash of schema (if introspection succeeded) */
  schemaHash?: string;

  /** The specific type/field/mutation this finding relates to */
  subject: {
    type: 'query' | 'mutation' | 'subscription' | 'type' | 'field' | 'schema' | 'transport';
    name: string;
  };

  /** The GraphQL query that demonstrates the finding */
  query?: string;

  /** The variables sent (no sensitive values) */
  variables?: Record<string, unknown>;

  /** The response that demonstrates the finding (truncated to 2KB) */
  responsePayload?: string;

  /** The error response */
  errorPayload?: string;

  /** Schema excerpt showing the issue */
  schemaExcerpt?: string;

  /** Which model produced this finding */
  model?: string;

  /** Tokens used */
  tokensUsed?: number;

  /** Reasoning chain */
  reasoning?: string;

  /** Evidence completeness 0-1 */
  completeness: number;
}
```

## 3D. Audit Dimensions (GraphQL-Specific)

| Dimension | Code | What It Measures | LLM Required? | Severity Criteria |
|-----------|------|-----------------|---------------|-------------------|
| Schema Quality | `gql-schema` | Descriptions, naming conventions, type design, deprecation | Partially (naming judgment) | HIGH: >50% fields undescribed; MEDIUM: naming inconsistency |
| Query Safety | `gql-safety` | Depth limits, complexity limits, batching limits, DoS resistance | No (deterministic) | CRITICAL: no depth+complexity limits; HIGH: unlimited batching |
| Error Handling | `gql-errors` | Error codes, paths, extensions, useful messages | Partially (judging usefulness) | HIGH: no error codes; MEDIUM: missing paths |
| N+1 & Performance | `gql-performance` | Response times, query cost reporting, DataLoader patterns | Partially (detecting N+1) | HIGH: >5s response for simple query; MEDIUM: no cost reporting |
| Auth & Access Control | `gql-auth` | Field-level auth, introspection protection, proper 401s | No (mostly deterministic) | CRITICAL: no auth on mutations; HIGH: unprotected introspection in prod |
| Agent-Nativeness | `agent-nativeness` | Composability, schema self-documentation, predictable errors | Yes (judgment) | Shared AN rubric |
| Documentation & DX | `gql-dx` | Schema descriptions, playground, documentation, examples | Yes (judging quality) | MEDIUM: no descriptions; LOW: no playground |

**Quick Check (free):** Schema Quality (deterministic checks only) + Query Safety + Auth basics. No LLM.
**Full Audit (paid):** All 7 dimensions.

## 3E. Scoring Rubric

| Check | Type | Severity if Failing |
|-------|------|-------------------|
| Introspection protected in production | Deterministic | HIGH |
| Query depth limit enforced | Deterministic | CRITICAL |
| Query complexity limit enforced | Deterministic | CRITICAL |
| Batch query limit enforced | Deterministic | HIGH |
| All types have descriptions | Deterministic | MEDIUM |
| All fields have descriptions | Deterministic | MEDIUM |
| All arguments have descriptions | Deterministic | LOW |
| Naming convention consistent (camelCase) | Deterministic | LOW |
| Deprecated items have deprecation reasons | Deterministic | MEDIUM |
| Error responses include codes | Deterministic | HIGH |
| Error responses include paths | Deterministic | MEDIUM |
| No stack traces in errors | Pattern match | HIGH |
| No suggestions enabled in production | Deterministic | MEDIUM |
| Mutations require auth | Deterministic | CRITICAL |
| Proper 401/403 for unauthorized queries | Deterministic | HIGH |
| Pagination on list fields (connections pattern) | Deterministic | HIGH |
| No circular type references causing infinite recursion | Deterministic | CRITICAL |
| Input validation on mutations | Deterministic | HIGH |
| Subscription auth required | Deterministic | HIGH |
| N+1 detection on nested queries | Deterministic + LLM | HIGH |
| Schema self-documentation quality | LLM (Sonnet) | MEDIUM |
| Composability assessment | LLM (Sonnet) | MEDIUM |

## 3F. Scenario Grammar Extensions (GraphQL)

### Persona Primitives (GraphQL)

| Primitive | Description | Affects |
|-----------|-------------|---------|
| `gql-frontend-dev` | Frontend developer consuming the API | Schema usability, documentation |
| `gql-agent-consumer` | AI agent querying the schema | Self-documentation, error handling |
| `gql-schema-explorer` | Developer using playground/voyager | Introspection, type navigation |
| `gql-security-researcher` | Security researcher testing limits | Depth, complexity, injection |
| `gql-mobile-client` | Mobile app optimizing payload size | Fragments, field selection |
| `gql-federation-consumer` | Service consuming a federated subgraph | Schema composition, boundaries |

### Entry Point Primitives (GraphQL)

| Primitive | Description | Affects |
|-----------|-------------|---------|
| `gql-introspection` | Run introspection query first | Schema availability |
| `gql-playground` | Start with GraphiQL/Playground | DX, discoverability |
| `gql-docs-first` | Read documentation before querying | Documentation quality |
| `gql-query-direct` | Send a specific query directly | Standalone query behavior |
| `gql-schema-download` | Download schema SDL | Schema export |

### Intent Primitives (GraphQL)

| Primitive | Description | Affects |
|-----------|-------------|---------|
| `gql-explore-schema` | Understand available data | Self-documentation |
| `gql-query-data` | Fetch data with a query | Response quality |
| `gql-mutate-data` | Create/update data | Mutation design, validation |
| `gql-handle-error` | Recover from query errors | Error handling |
| `gql-compose-query` | Build a complex multi-level query | Nesting, composition |
| `gql-paginate` | Navigate through list data | Pagination pattern |
| `gql-subscribe` | Subscribe to real-time data | Subscription quality |

### Adversarial Condition Primitives (GraphQL)

| Primitive | Description | Tests |
|-----------|-------------|-------|
| `gql-normal` | Everything works | Baseline |
| `gql-deep-nesting` | Query with 20+ levels of nesting | Depth limits |
| `gql-wide-query` | Select all fields on all types | Complexity limits |
| `gql-batch-attack` | Send 100+ batched queries | Batch limits |
| `gql-alias-attack` | Use aliases to bypass rate limits | Alias-based DoS |
| `gql-fragment-bomb` | Deeply nested fragments | Fragment handling |
| `gql-invalid-types` | Wrong types in variables | Input validation |
| `gql-auth-bypass` | Query protected fields without auth | Auth enforcement |

**Total GraphQL scenarios:** 6 x 5 x 7 x 8 = **1,680 unique configurations**

## 3G. Work Unit Estimates (GraphQL)

| WU | Title | Agent | Est. Hours | Dependencies | Description |
|----|-------|-------|------------|-------------|-------------|
| WU-G01 | GraphQL Introspection Engine | Opus | 5h | WU-00 (types) | Schema introspection, type analysis, circular ref detection |
| WU-G02 | GraphQL Probe Engine | Opus | 6h | WU-G01, WU-00b | Query probing, mutation analysis, safety testing |
| WU-G03 | GraphQL Summarizer | Codex | 3h | WU-G02 | Transform to GraphQLServerSummary |
| WU-G04 | GraphQL Audit Primitives (Deterministic) | Codex | 5h | WU-G03 | Schema quality, query safety, auth checks |
| WU-G05 | GraphQL Audit Primitives (LLM) | Opus | 4h | WU-G03, WU-05 | N+1 detection, composability, DX |
| WU-G06 | GraphQL Scenario Grammar | Opus | 3h | WU-G04, WU-G05 | Grammar primitives |
| WU-G07 | GraphQL Integration & Pipeline | Opus | 3h | WU-G01-G06, WU-06 | Wire into monolithic pipeline |

**Total: 7 WUs, ~29 hours.** Critical path: WU-G01 → WU-G02 → WU-G03 → WU-G04/G05 (parallel) → WU-G07.

---

# Expert 4: Agent Consumer Perspective

**Ayumi Takahashi — Agent Framework Developer**

## What Agents Actually Need (Cross-Surface Analysis)

I build agents that consume APIs, MCP servers, and GraphQL endpoints daily. Here is what breaks agent workflows on each surface, stated as concrete requirements that audit findings must address.

### 4.1 Universal Agent Pain Points

These break agent workflows regardless of surface:

| Pain Point | Impact | Audit Dimension | Severity |
|-----------|--------|----------------|----------|
| **Unpredictable error formats** | Agent can't parse errors, falls into retry loops | Error Handling | HIGH |
| **Undocumented rate limits** | Agent gets 429 with no retry-after, burns tokens retrying | Rate Limiting | HIGH |
| **Schema drift** | Agent's cached schema doesn't match server | Contract Fidelity | CRITICAL |
| **Ambiguous success responses** | 200 OK with empty body — is this success or error? | Response Quality | HIGH |
| **Authentication complexity** | OAuth dance requires browser, agent has no browser | Auth Model | HIGH |
| **No bulk operations** | Agent must make N individual calls instead of 1 batch | Granularity | MEDIUM |
| **HTML error pages** | API returns HTML 500 error page, agent can't parse | Error Handling | HIGH |
| **Inconsistent naming** | `userId` in one endpoint, `user_id` in another | Schema Quality | MEDIUM |
| **Missing pagination** | List endpoint returns all 10,000 items | Performance | HIGH |
| **No idempotency** | Retry on timeout creates duplicate records | Reliability | HIGH |

### 4.2 MCP-Specific Agent Failures

| What Breaks | Why It Breaks Agents | Required Finding |
|-------------|---------------------|-----------------|
| Tool has no description | Agent can't decide when to use it | "Tool `{name}` has no description. Agents select tools by matching descriptions to intent." |
| Parameters have no types | Agent guesses types, gets runtime errors | "Parameter `{param}` on tool `{tool}` has no type constraint." |
| No destructiveHint annotation | Agent calls delete tool thinking it's read-only | "Tool `{name}` modifies state but lacks destructiveHint annotation." |
| Error returns plain text, not structured | Agent can't programmatically recover | "Error response from `{tool}` is unstructured text." |
| Tool names are ambiguous | `get_data` — which data? | "Tool names are ambiguous: `get_data`, `update_info`. Prefer `get_user_by_id`, `update_subscription_plan`." |
| No resource URIs | Agent can't discover what data is available | "Server exposes tools but no resources. Agent cannot browse available data." |

### 4.3 REST API-Specific Agent Failures

| What Breaks | Why It Breaks Agents | Required Finding |
|-------------|---------------------|-----------------|
| No OpenAPI spec | Agent can't discover endpoints programmatically | "No OpenAPI spec found. Agent must guess API surface." |
| 500 returns HTML | Agent expects JSON, gets `<html>` | "Endpoint `{path}` returns HTML on 500. Return structured JSON errors." |
| Auth requires browser redirect | Agent has no browser for OAuth consent screen | "OAuth flow requires browser redirect. Provide API key or client_credentials flow." |
| Rate limit with no headers | Agent can't throttle proactively | "Rate limiting active but no RateLimit-* headers returned." |
| No HATEOAS or link relations | Agent can't navigate between resources | "No link headers or `_links` in responses. Agent cannot discover related resources." |
| Undocumented query params | Agent discovers functionality by accident | "Endpoint `{path}` accepts undocumented query parameters." |

### 4.4 GraphQL-Specific Agent Failures

| What Breaks | Why It Breaks Agents | Required Finding |
|-------------|---------------------|-----------------|
| No introspection | Agent can't discover schema | "Introspection disabled without providing schema documentation alternative." |
| No field descriptions | Agent can't understand what data means | "Field `{field}` has no description." |
| Unlimited depth causes timeout | Agent sends complex query, server hangs | "No depth limit detected. Complex queries may cause timeouts." |
| Error response missing path | Agent can't locate which part of query failed | "Error response lacks `path` field. Agent cannot isolate failing subquery." |
| No pagination (relay connections) | Agent gets massive payloads | "List field `{field}` has no pagination. Returns unbounded results." |
| Subscription requires websocket auth | Agent can't maintain persistent auth | "Subscription auth uses connection_init which lacks token refresh mechanism." |

### 4.5 Agent-Nativeness Sub-Dimensions (Refined)

The existing AN rubric (Parity, Granularity, Composability, CRUD, Error Handling) applies across surfaces but needs surface-specific scoring criteria:

| Sub-Dimension | MCP Scoring | REST API Scoring | GraphQL Scoring |
|--------------|-------------|------------------|-----------------|
| **Parity** | Tools cover all server capabilities? | API covers all UI functionality? | Queries cover all viewable data? |
| **Granularity** | Each tool does one thing? | Each endpoint is one resource? | Each query field is one concept? |
| **Composability** | Tool outputs can feed other tools? | Responses reference related resources? | Types compose via fields/fragments? |
| **CRUD Completeness** | Create+Read+Update+Delete per entity? | POST+GET+PUT/PATCH+DELETE per resource? | Mutation+Query per type? |
| **Error Handling** | Structured errors with codes? | JSON errors with codes+message? | GraphQL errors with code+path+extensions? |

---

# Expert 5: Webhook Producer Auditing

**Dr. Ibrahim Osei — Webhook & Event Architecture Specialist**

## 5A. Collection Type: WebhookProbeResult

```typescript
/**
 * Result of probing a webhook producer. One per audit.
 *
 * KEY CHALLENGE: Auditing webhook producers requires receiving webhooks.
 * Alien Eyes must host a temporary HTTPS endpoint to receive webhook deliveries.
 * This is infrastructure-heavy and has security implications.
 *
 * Collection process:
 * 1. Discover webhook documentation / registration endpoint
 * 2. Register a temporary Alien Eyes callback URL
 * 3. Trigger events (where safe to do so)
 * 4. Receive and analyze webhook deliveries
 * 5. Test retry behavior (by failing first delivery intentionally)
 * 6. Analyze signing/verification
 * 7. Unregister webhook
 */
interface WebhookProbeResult {
  /** The webhook producer being audited */
  producerBaseUrl: string;

  /** How webhook registration works */
  registration: WebhookRegistrationInfo;

  /** Events received during the probe */
  receivedEvents: WebhookEventRecord[];

  /** Delivery analysis */
  deliveryAnalysis: WebhookDeliveryAnalysis;

  /** Signing/verification analysis */
  signingAnalysis: WebhookSigningAnalysis;

  /** Retry behavior analysis */
  retryAnalysis: WebhookRetryAnalysis;

  /** Schema consistency analysis */
  schemaAnalysis: WebhookSchemaAnalysis;

  /** Documentation quality */
  documentationAnalysis: WebhookDocumentationInfo;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** Total duration */
  totalDurationMs: number;

  /** Whether we could register and receive webhooks */
  probeSuccessful: boolean;

  /** Reason for failure (if probeSuccessful is false) */
  failureReason?: string;
}

interface WebhookRegistrationInfo {
  /** How to register (API endpoint, dashboard, config file) */
  registrationMethod: 'api' | 'dashboard' | 'config' | 'unknown';

  /** Whether registration endpoint is documented */
  documented: boolean;

  /** Available event types */
  eventTypes: string[];

  /** Whether filtering by event type is supported */
  supportsEventFiltering: boolean;

  /** Whether the registration supports a secret for signing */
  supportsSigningSecret: boolean;

  /** Whether HTTPS is required for callback URLs */
  requiresHttps: boolean;

  /** Whether the producer verifies callback URL ownership */
  verifiesCallbackUrl: boolean;
}

interface WebhookEventRecord {
  /** Event type */
  eventType: string;

  /** When it was received */
  receivedAt: string;

  /** Time from trigger to delivery (ms) */
  deliveryLatencyMs: number;

  /** HTTP method used */
  method: string;

  /** Headers received */
  headers: Record<string, string>;

  /** Payload size in bytes */
  payloadSizeBytes: number;

  /** Whether payload is valid JSON */
  isValidJson: boolean;

  /** Content type */
  contentType: string;

  /** Whether a signature was included */
  hasSigning: boolean;

  /** Whether the event includes an event ID */
  hasEventId: boolean;

  /** Whether the event includes a timestamp */
  hasTimestamp: boolean;

  /** Whether the event includes a webhook ID for dedup */
  hasIdempotencyKey: boolean;

  /** Payload structure (keys + types, no values) */
  payloadShape: Record<string, string>;

  /** Truncated payload preview (1KB) */
  payloadPreview: string;
}

interface WebhookDeliveryAnalysis {
  /** Average delivery latency */
  averageLatencyMs: number;

  /** p95 delivery latency */
  p95LatencyMs: number;

  /** Whether all events were delivered */
  deliveryRate: number;

  /** Whether events arrived in order */
  inOrderDelivery: boolean;

  /** Whether duplicate events were received */
  duplicatesReceived: boolean;
}

interface WebhookSigningAnalysis {
  /** Whether webhooks are signed */
  isSigned: boolean;

  /** Signing algorithm (HMAC-SHA256, etc.) */
  algorithm?: string;

  /** Whether the signing header name follows conventions */
  standardHeaderName: boolean;

  /** Whether signature verification documentation exists */
  verificationDocumented: boolean;

  /** Whether timestamp is included for replay prevention */
  hasTimestampForReplay: boolean;

  /** Whether tolerance window is documented */
  toleranceDocumented: boolean;
}

interface WebhookRetryAnalysis {
  /** Whether the producer retries failed deliveries */
  hasRetries: boolean;

  /** Number of retry attempts observed */
  retryAttemptsObserved: number;

  /** Whether exponential backoff is used */
  exponentialBackoff: boolean;

  /** Maximum retry duration */
  maxRetryDurationMs?: number;

  /** Whether the producer has a dead letter / failure notification */
  hasDeadLetter: boolean;

  /** Whether retry status is visible in dashboard/API */
  retryStatusVisible: boolean;
}

interface WebhookSchemaAnalysis {
  /** Whether all events follow a consistent envelope */
  consistentEnvelope: boolean;

  /** Envelope fields (type, id, timestamp, data, etc.) */
  envelopeFields: string[];

  /** Whether event schema is documented per event type */
  schemaDocumented: boolean;

  /** Whether event schemas are versioned */
  schemaVersioned: boolean;

  /** Schema consistency across event types */
  crossEventConsistency: number;
}

interface WebhookDocumentationInfo {
  /** Whether webhook documentation exists */
  exists: boolean;

  /** Whether setup guide exists */
  hasSetupGuide: boolean;

  /** Whether verification code examples exist */
  hasVerificationExamples: boolean;

  /** Languages covered in examples */
  exampleLanguages: string[];

  /** Whether event catalog exists */
  hasEventCatalog: boolean;

  /** Whether changelog for webhook schema exists */
  hasChangelog: boolean;
}
```

## 5B. Summary Type: WebhookProducerSummary

```typescript
interface WebhookProducerSummary {
  producerBaseUrl: string;

  registrationSummary: {
    method: string;
    eventTypeCount: number;
    supportsFiltering: boolean;
    supportsSecrets: boolean;
  };

  deliverySummary: {
    averageLatencyMs: number;
    deliveryRate: number;
    inOrder: boolean;
  };

  signingSummary: {
    isSigned: boolean;
    algorithm?: string;
    hasReplayPrevention: boolean;
  };

  retrySummary: {
    hasRetries: boolean;
    backoffType: string;
    hasDeadLetter: boolean;
  };

  schemaSummary: {
    consistentEnvelope: boolean;
    documented: boolean;
    versioned: boolean;
  };

  documentationSummary: {
    exists: boolean;
    hasExamples: boolean;
    hasEventCatalog: boolean;
  };

  detectedPatterns: string[];
  tokenEstimate: number;
}
```

## 5C. Evidence Type: WebhookEvidence

```typescript
interface WebhookEvidence {
  /** Producer base URL */
  producerBaseUrl: string;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** The event type this finding relates to */
  eventType?: string;

  /** The webhook delivery that demonstrates the finding */
  deliveryRecord?: {
    headers: Record<string, string>;
    payloadPreview: string;
    receivedAt: string;
    deliveryLatencyMs: number;
  };

  /** For retry findings: the retry sequence */
  retrySequence?: {
    attemptNumber: number;
    receivedAt: string;
    intervalFromPreviousMs: number;
  }[];

  /** Documentation excerpt */
  documentationExcerpt?: string;

  /** Which model produced this finding */
  model?: string;

  /** Tokens used */
  tokensUsed?: number;

  /** Reasoning chain */
  reasoning?: string;

  /** Evidence completeness 0-1 */
  completeness: number;
}
```

## 5D. Audit Dimensions (Webhook-Specific)

| Dimension | Code | What It Measures | LLM Required? | Severity Criteria |
|-----------|------|-----------------|---------------|-------------------|
| Delivery Reliability | `wh-delivery` | Delivery rate, latency, ordering, dedup | No (deterministic) | CRITICAL: <95% delivery; HIGH: >5s average latency |
| Signing & Verification | `wh-signing` | HMAC, replay prevention, tolerance window | No (deterministic) | CRITICAL: no signing; HIGH: no replay prevention |
| Retry Behavior | `wh-retry` | Retry count, backoff, dead letter, visibility | No (deterministic) | HIGH: no retries; MEDIUM: no exponential backoff |
| Schema Quality | `wh-schema` | Envelope consistency, versioning, event IDs | No (deterministic) | HIGH: inconsistent envelope; MEDIUM: no event IDs |
| Documentation & DX | `wh-dx` | Setup guide, code examples, event catalog | Yes (judging quality) | MEDIUM: no examples; HIGH: no documentation |
| Agent-Nativeness | `agent-nativeness` | Can agents register, receive, verify, and act on events? | Yes | Shared AN rubric |

## 5E-5G: Abbreviated (Scenario Grammar + Work Units)

**Scenario grammar: 864 configurations** (6 personas x 4 entry points x 6 intents x 6 adversarial conditions)

**Work units: 5 WUs, ~22 hours** (webhook listener, delivery analyzer, signing tester, retry tester, pipeline integration)

**Key infrastructure requirement:** Alien Eyes must host temporary HTTPS endpoints to receive webhook deliveries. This is the highest-infrastructure surface and should be deferred per ADR-017 recommendations.

---

# Expert 6: Developer Experience Dimensions

**Sarah Lindström — Developer Experience Researcher**

## Cross-Surface DX Dimensions

These dimensions apply to MCP servers, REST APIs, AND GraphQL APIs. They are not surface-specific — they measure universal developer/agent experience quality.

### 6.1 Unified DX Rubric

| DX Dimension | Code | What It Measures | Applies To | LLM Required? |
|-------------|------|-----------------|-----------|---------------|
| Time-to-First-Success | `dx-ttfs` | How long from discovery to first successful operation | All | Yes (judgment) |
| Error Message Quality | `dx-errors` | Are errors actionable? Do they say what went wrong AND how to fix it? | All | Yes (judgment) |
| Documentation Completeness | `dx-docs` | README, getting started, reference, examples, changelog | All | Yes (judgment) |
| Onboarding Friction | `dx-onboarding` | Number of steps from zero to working integration | All | Yes (judgment) |
| Self-Documentation | `dx-selfdoc` | Does the interface describe itself? (schema descriptions, OpenAPI, introspection) | All | No (deterministic) |
| Error Recoverability | `dx-recovery` | Can a consumer recover from errors without human intervention? | All | Partially |
| SDK/Client Quality | `dx-sdk` | Quality of official SDK/client libraries | REST, GraphQL | Yes (judgment) |
| Changelog/Migration | `dx-changelog` | Are breaking changes documented? Is there a migration path? | All | Yes (judgment) |

### 6.2 DX Scoring Rubric (Cross-Surface)

| Check | Type | Surface | Severity if Failing |
|-------|------|---------|-------------------|
| README exists and explains what the service does | Deterministic + LLM | All | MEDIUM |
| Getting started guide exists | LLM (Haiku) | All | MEDIUM |
| Code examples in >= 2 languages | Deterministic | REST, GraphQL | LOW |
| Error messages include both error code AND human-readable explanation | Deterministic | All | HIGH |
| Error messages suggest a fix action | LLM (Haiku) | All | MEDIUM |
| Authentication setup documented | LLM (Haiku) | All | HIGH (if auth exists) |
| Changelog exists and is current (< 6 months) | Deterministic + LLM | All | LOW |
| Breaking changes documented with migration guide | LLM (Haiku) | All | MEDIUM (if breaking changes exist) |
| All parameters/fields have descriptions | Deterministic | All | MEDIUM |
| Interactive playground available | Deterministic | GraphQL, REST | LOW |
| Official SDK maintained | Deterministic | REST, GraphQL | LOW |
| Time to first success < 15 minutes (from docs alone) | LLM (Sonnet) | All | HIGH (>30 min), MEDIUM (15-30 min) |

### 6.3 DX Evidence Model

DX findings use the surface-specific evidence type (MCPEvidence, APIEvidence, GraphQLEvidence) but with these additional fields for DX-specific findings:

```typescript
interface DXEvidenceExtension {
  /** Where in the documentation the issue was found (or where documentation was expected) */
  documentationLocation?: string;

  /** The error message that was unclear (exact text) */
  errorMessageVerbatim?: string;

  /** Time (seconds) from start to first successful operation */
  measuredTtfsSeconds?: number;

  /** Number of steps required for onboarding */
  onboardingStepCount?: number;

  /** Which step was the friction point */
  frictionStepDescription?: string;
}
```

---

# Expert 7: Reliability Dimensions

**Dr. James Okoye — Distributed Systems Reliability Engineer**

## Cross-Surface Reliability Dimensions

These dimensions measure operational reliability regardless of surface type.

### 7.1 Unified Reliability Rubric

| Reliability Dimension | Code | What It Measures | Applies To | LLM Required? |
|----------------------|------|-----------------|-----------|---------------|
| Health Endpoints | `rel-health` | Does /health (or equivalent) exist, and does it report dependency status? | REST, GraphQL, MCP (HTTP) | No |
| Timeout Behavior | `rel-timeout` | Does the service respond within declared timeouts? Does it communicate timeouts clearly? | All | No |
| Rate Limit Transparency | `rel-ratelimit` | Are rate limits documented, signaled via headers, and recoverable? | REST, GraphQL | No |
| Graceful Degradation | `rel-degradation` | When a dependency is down, does the service return partial results or meaningful errors? | All | Partially |
| Backpressure Signaling | `rel-backpressure` | Does the service communicate when it's overloaded? (503 with Retry-After, queue depth) | All | No |
| Versioning Stability | `rel-versioning` | Is the API versioned? Are breaking changes signaled? Is there a deprecation policy? | REST, GraphQL, MCP | No |
| Idempotency | `rel-idempotency` | Can the same request be safely retried? Are idempotency keys supported? | REST (write ops), MCP (tools) | No |
| Connection Lifecycle | `rel-connection` | Clean connect, keepalive, disconnect, reconnection handling | MCP, GraphQL (subscriptions) | No |

### 7.2 Reliability Scoring Rubric (Cross-Surface)

| Check | Type | Surface | Severity if Failing |
|-------|------|---------|-------------------|
| Health endpoint exists | Deterministic | REST, GraphQL, MCP (HTTP) | MEDIUM |
| Health endpoint reports dependency status | Deterministic | REST, GraphQL, MCP (HTTP) | LOW |
| Responses under 2s (p95) | Deterministic | All | MEDIUM (2-5s), HIGH (>5s) |
| Timeout responses are explicit (408 or documented) | Deterministic | REST, GraphQL | MEDIUM |
| Rate limit headers present | Deterministic | REST, GraphQL | MEDIUM |
| 429 response includes Retry-After | Deterministic | REST, GraphQL | MEDIUM |
| 503 response includes Retry-After | Deterministic | REST, GraphQL, MCP (HTTP) | MEDIUM |
| API version in URL/header | Deterministic | REST | MEDIUM |
| Schema versioning present | Deterministic | GraphQL, MCP | MEDIUM |
| Deprecation notices in responses | Deterministic | REST, GraphQL | LOW |
| Sunset header on deprecated endpoints | Deterministic | REST | LOW |
| Idempotency key header supported on POST/PUT | Deterministic | REST | HIGH (for write operations) |
| MCP destructiveHint on state-changing tools | Deterministic | MCP | MEDIUM |
| Clean connection close | Deterministic | MCP, GraphQL (WS) | LOW |
| Reconnection possible without re-auth | Deterministic | MCP, GraphQL (WS) | MEDIUM |

### 7.3 Reliability Evidence Model

```typescript
interface ReliabilityEvidenceExtension {
  /** Response time measurements (array for percentile calculation) */
  responseTimeSamples?: number[];

  /** Health endpoint response */
  healthResponse?: {
    statusCode: number;
    bodyPreview: string;
    hasComponentStatus: boolean;
  };

  /** Rate limit headers observed */
  rateLimitHeaders?: Record<string, string>;

  /** Whether the timeout behavior was tested and what happened */
  timeoutBehavior?: {
    requestTimeoutMs: number;
    serverBehavior: 'responded' | 'timed-out' | 'connection-reset';
    responseStatusCode?: number;
  };

  /** Idempotency test result */
  idempotencyTest?: {
    firstRequestResult: string;
    retryResult: string;
    wereIdentical: boolean;
  };
}
```

---

# Cross-Panel Synthesis

## S1. Unified Collection Type (TYPE-SPEC v2.0)

```typescript
/**
 * Discriminated union for all surface collection results.
 * This is the TYPE-SPEC v2.0 change that unlocks multi-surface auditing.
 *
 * The surface field is the discriminant.
 * Every primitive receives the appropriate variant based on the audit's surface.
 */
type CollectionResult =
  | { surface: 'web'; data: CrawlResult }
  | { surface: 'mcp'; data: MCPIntrospectionResult }
  | { surface: 'rest-api'; data: APIProbeResult }
  | { surface: 'graphql'; data: GraphQLIntrospectionResult }
  | { surface: 'webhook'; data: WebhookProbeResult };

/**
 * Discriminated union for all surface summaries.
 * Every primitive receives the appropriate variant.
 */
type SurfaceSummary =
  | { surface: 'web'; data: PageSummary[] }
  | { surface: 'mcp'; data: MCPServerSummary }
  | { surface: 'rest-api'; data: APIServerSummary }
  | { surface: 'graphql'; data: GraphQLServerSummary }
  | { surface: 'webhook'; data: WebhookProducerSummary };

/**
 * Surface type literal union.
 */
type AuditSurface = 'web' | 'mcp' | 'rest-api' | 'graphql' | 'webhook';
```

## S2. Unified Evidence Type (TYPE-SPEC v2.0)

```typescript
/**
 * Discriminated union for surface-specific evidence.
 * Finding.evidence becomes this union type.
 *
 * MIGRATION: The existing EvidenceBundle becomes the 'web' variant.
 * Existing web findings remain valid — they are the { surface: 'web', data: EvidenceBundle } variant.
 */
type SurfaceEvidence =
  | { surface: 'web'; data: EvidenceBundle }
  | { surface: 'mcp'; data: MCPEvidence }
  | { surface: 'rest-api'; data: APIEvidence }
  | { surface: 'graphql'; data: GraphQLEvidence }
  | { surface: 'webhook'; data: WebhookEvidence };

/**
 * Extended evidence with optional cross-cutting extensions.
 * DX and reliability evidence can augment any surface evidence.
 */
interface EvidenceWithExtensions {
  /** Surface-specific evidence (required) */
  primary: SurfaceEvidence;

  /** DX-specific evidence (optional, for dx-* dimension findings) */
  dx?: DXEvidenceExtension;

  /** Reliability-specific evidence (optional, for rel-* dimension findings) */
  reliability?: ReliabilityEvidenceExtension;
}
```

## S3. Shared vs Surface-Specific Dimensions

### Shared Dimensions (Apply to 2+ Surfaces)

| Dimension | Code | Applies To | Source Expert |
|-----------|------|-----------|--------------|
| Agent-Nativeness | `agent-nativeness` | ALL surfaces | Takahashi (Expert 4), existing methodology |
| Error Handling | `errors` (surface-prefixed) | ALL surfaces | All experts |
| Documentation & DX | `dx-*` | ALL surfaces | Lindström (Expert 6) |
| Security Surface | `security` (surface-prefixed) | ALL surfaces | Ramirez (Expert 2), Wei (Expert 1) |
| Time-to-First-Success | `dx-ttfs` | ALL surfaces | Lindström (Expert 6) |
| Self-Documentation | `dx-selfdoc` | ALL surfaces | Lindström (Expert 6) |
| Reliability | `rel-*` | All HTTP-based surfaces | Okoye (Expert 7) |
| Schema Quality | varies | MCP, REST, GraphQL | Wei, Ramirez, Di Stefano |

### Surface-Specific Dimensions

| Dimension | Code | Surface Only | Source Expert |
|-----------|------|-------------|--------------|
| SEO | `seo` | Web | Existing methodology |
| Accessibility | `accessibility` | Web | Existing methodology |
| Copy & UX | `copy-ux` | Web | Existing methodology |
| Performance (Web) | `performance` | Web | Existing methodology |
| Protocol Conformance | `mcp-protocol` | MCP | Wei (Expert 1) |
| Tool Reliability | `mcp-reliability` | MCP | Wei (Expert 1) |
| Contract Fidelity | `api-contract` | REST | Ramirez (Expert 2) |
| Rate Limiting | `api-ratelimit` | REST | Ramirez (Expert 2) |
| CORS | part of `api-security` | REST | Ramirez (Expert 2) |
| Versioning & Stability | `api-versioning` | REST | Ramirez (Expert 2) |
| Query Safety | `gql-safety` | GraphQL | Di Stefano (Expert 3) |
| N+1 & Performance | `gql-performance` | GraphQL | Di Stefano (Expert 3) |
| Auth & Access Control | `gql-auth` | GraphQL | Di Stefano (Expert 3) |
| Delivery Reliability | `wh-delivery` | Webhook | Osei (Expert 5) |
| Signing & Verification | `wh-signing` | Webhook | Osei (Expert 5) |
| Retry Behavior | `wh-retry` | Webhook | Osei (Expert 5) |

## S4. Methodology Registry

The methodology registry maps surfaces to applicable dimensions with weights. This replaces the single-surface weight vector in METHODOLOGY-v0.1.

```typescript
/**
 * Methodology registry: maps each surface to its applicable dimensions and weights.
 * The composite satisfaction score for each surface is calculated using only
 * the dimensions and weights defined for that surface.
 */
interface MethodologyRegistry {
  version: string;
  surfaces: Record<AuditSurface, SurfaceMethodology>;
}

interface SurfaceMethodology {
  /** Surface identifier */
  surface: AuditSurface;

  /** Methodology version for this surface */
  methodologyVersion: string;

  /** Dimensions applicable to this surface, with weights */
  dimensions: SurfaceDimensionConfig[];

  /** Quick Check dimensions (free tier — deterministic only) */
  quickCheckDimensions: string[];

  /** Full Audit dimensions (paid tier — all dimensions) */
  fullAuditDimensions: string[];
}

interface SurfaceDimensionConfig {
  /** Dimension code */
  dimension: string;

  /** Weight for composite score (weights must sum to 1.0) */
  weight: number;

  /** Whether this dimension requires ownership verification */
  requiresOwnership: boolean;

  /** Whether this dimension uses LLM */
  usesLLM: boolean;
}
```

### Weight Vectors by Surface

#### Web (Existing — METHODOLOGY-v0.1)
| Dimension | Weight |
|-----------|--------|
| seo | 0.15 |
| accessibility | 0.20 |
| security | 0.15 |
| performance | 0.15 |
| agent-nativeness | 0.15 |
| copy-ux | 0.20 |
| **Total** | **1.00** |

#### MCP Server (New)
| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| mcp-schema | 0.20 | Schema quality is how agents understand the server |
| mcp-reliability | 0.20 | If tools don't work, nothing else matters |
| mcp-errors | 0.15 | Agents need structured errors to recover |
| agent-nativeness | 0.20 | THE core dimension for MCP |
| mcp-security | 0.10 | Important but lower weight — MCP is agent-facing |
| mcp-protocol | 0.05 | Binary pass/fail mostly |
| mcp-dx | 0.10 | Human developer setup experience |
| **Total** | **1.00** |

#### REST API (New)
| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| api-spec | 0.10 | Foundation for everything else |
| api-contract | 0.15 | Responses must match documented behavior |
| api-errors | 0.15 | Error handling determines integration quality |
| api-auth | 0.10 | Authentication must be secure and usable |
| api-ratelimit | 0.05 | Prevents abuse and signals capacity |
| api-security | 0.15 | OWASP Top 10 coverage |
| agent-nativeness | 0.15 | Agent consumption quality |
| api-versioning | 0.05 | Stability over time |
| api-dx | 0.10 | Developer onboarding experience |
| **Total** | **1.00** |

#### GraphQL API (New)
| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| gql-schema | 0.20 | Schema IS the API for GraphQL |
| gql-safety | 0.20 | DoS prevention is existential for GraphQL |
| gql-errors | 0.10 | Error handling quality |
| gql-performance | 0.10 | N+1 and query cost |
| gql-auth | 0.15 | Field-level auth is critical |
| agent-nativeness | 0.15 | Agent consumption quality |
| gql-dx | 0.10 | Schema descriptions, playground |
| **Total** | **1.00** |

#### Webhook Producer (New)
| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| wh-delivery | 0.25 | Delivery reliability is the core purpose |
| wh-signing | 0.25 | Security is non-negotiable for webhooks |
| wh-retry | 0.15 | Retry behavior determines reliability perception |
| wh-schema | 0.15 | Schema consistency enables programmatic consumption |
| agent-nativeness | 0.10 | Agent webhook consumption |
| wh-dx | 0.10 | Setup documentation |
| **Total** | **1.00** |

## S5. Updated AuditDimension Type

```typescript
/**
 * All audit dimensions across all surfaces.
 * V1 implements web dimensions only.
 * V2 adds MCP, REST API, GraphQL, and Webhook dimensions.
 */
type AuditDimension =
  // Web-specific (V1)
  | 'seo'
  | 'accessibility'
  | 'security'
  | 'performance'
  | 'copy-ux'
  // Shared (V1 for web, V2 for others)
  | 'agent-nativeness'
  // MCP-specific (V2)
  | 'mcp-schema'
  | 'mcp-reliability'
  | 'mcp-errors'
  | 'mcp-security'
  | 'mcp-protocol'
  | 'mcp-dx'
  // REST API-specific (V2)
  | 'api-spec'
  | 'api-contract'
  | 'api-errors'
  | 'api-auth'
  | 'api-ratelimit'
  | 'api-security'
  | 'api-versioning'
  | 'api-dx'
  // GraphQL-specific (V2)
  | 'gql-schema'
  | 'gql-safety'
  | 'gql-errors'
  | 'gql-performance'
  | 'gql-auth'
  | 'gql-dx'
  // Webhook-specific (V2)
  | 'wh-delivery'
  | 'wh-signing'
  | 'wh-retry'
  | 'wh-schema'
  | 'wh-dx'
  // Cross-surface DX (V2)
  | 'dx-ttfs'
  | 'dx-errors'
  | 'dx-docs'
  | 'dx-onboarding'
  | 'dx-selfdoc'
  | 'dx-recovery'
  | 'dx-sdk'
  | 'dx-changelog'
  // Cross-surface Reliability (V2)
  | 'rel-health'
  | 'rel-timeout'
  | 'rel-ratelimit'
  | 'rel-degradation'
  | 'rel-backpressure'
  | 'rel-versioning'
  | 'rel-idempotency'
  | 'rel-connection';
```

## S6. Updated AuditPrimitive Interface (V2)

```typescript
/**
 * V2 audit primitive interface.
 * Accepts surface-agnostic CollectionResult + SurfaceSummary instead of
 * web-specific CrawlResult + PageSummary[].
 *
 * BACKWARDS COMPATIBLE: Web primitives still receive CrawlResult and PageSummary[]
 * via the discriminated union. They narrow the type and proceed as before.
 */
interface AuditPrimitiveV2 {
  /** Unique name */
  name: string;

  /** Which dimension */
  dimension: AuditDimension;

  /** Which surfaces this primitive applies to */
  supportedSurfaces: AuditSurface[];

  /** Whether ownership verification is required */
  requiresOwnershipVerification: boolean;

  /** Whether this primitive uses LLM */
  usesLLM: boolean;

  /**
   * Run the primitive against collection data.
   * The primitive narrows the CollectionResult by surface type.
   */
  run(
    collection: CollectionResult,
    summary: SurfaceSummary,
    config: AuditConfigV2
  ): Promise<Envelope<Finding[]>>;
}

/**
 * V2 audit configuration.
 * Extends V1 AuditConfig with surface and methodology registry.
 */
interface AuditConfigV2 extends AuditConfig {
  /** Which surface is being audited */
  surface: AuditSurface;

  /** Methodology registry (determines which dimensions apply) */
  methodologyRegistry: MethodologyRegistry;
}
```

## S7. Updated AuditConfig for Surface Target

```typescript
/**
 * V2 audit target — replaces the simple URL input.
 * Different surfaces require different inputs.
 */
type AuditTarget =
  | { surface: 'web'; url: string }
  | { surface: 'mcp'; target: MCPTarget }
  | { surface: 'rest-api'; baseUrl: string; specUrl?: string; authConfig?: APIAuthConfig }
  | { surface: 'graphql'; endpointUrl: string; authConfig?: APIAuthConfig }
  | { surface: 'webhook'; producerBaseUrl: string; registrationEndpoint?: string; authConfig?: APIAuthConfig };

interface APIAuthConfig {
  /** Auth type */
  type: 'bearer' | 'api-key' | 'basic' | 'none';

  /** Header name (for api-key) */
  headerName?: string;

  /** Token or key value (NEVER stored — used only during audit) */
  credential?: string;

  /** Whether to test authenticated endpoints */
  testAuthenticated: boolean;
}
```

## S8. Updated Pipeline Architecture

```
AuditTarget → TargetValidator → SurfaceRouter
  ├── [web]     → CrawlEngine     → CrawlResult     → PageSummarizer   → PageSummary[]
  ├── [mcp]     → MCPIntrospector  → MCPIntrospection → MCPSummarizer    → MCPServerSummary
  ├── [rest-api] → APIProber       → APIProbeResult   → APISummarizer    → APIServerSummary
  ├── [graphql] → GQLIntrospector  → GQLIntrospection → GQLSummarizer    → GQLServerSummary
  └── [webhook] → WebhookProber    → WebhookProbe     → WebhookSummarizer → WebhookSummary

                → CollectionResult (discriminated union)
                → SurfaceSummary (discriminated union)
                → PrimitiveSelector (picks primitives by surface)
                → AuditPrimitiveV2.run() → Envelope<Finding[]>
                → Synthesizer → SynthesisResult
                → PayloadRenderer → Format A/B/C/JSON
```

The key architectural insight: the pipeline is **branching at collection, converging at synthesis.** Surface-specific work happens only in the collection and summarization phases. From primitives onward, the shared types (Finding, Envelope, SynthesisResult) work identically.

## S9. Updated Database Schema

### New/Modified Tables

```sql
-- Add surface column to audits table
ALTER TABLE audits ADD COLUMN surface TEXT NOT NULL DEFAULT 'web';
-- Values: 'web', 'mcp', 'rest-api', 'graphql', 'webhook'

-- Add surface column to findings table
ALTER TABLE findings ADD COLUMN surface TEXT NOT NULL DEFAULT 'web';

-- Add surface column to patterns table
ALTER TABLE patterns ADD COLUMN surface TEXT NOT NULL DEFAULT 'web';

-- Create surface-specific collection storage
-- (replaces single crawl_results table)
CREATE TABLE collection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL UNIQUE REFERENCES audits(id) ON DELETE CASCADE,
  surface TEXT NOT NULL,

  -- Summary data (kept permanently) — stored as JSONB
  summary JSONB NOT NULL DEFAULT '{}',

  -- Raw data (deleted within 24h)
  raw_data_storage_path TEXT,
  raw_data_expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_collection_results_audit ON collection_results(audit_id);
CREATE INDEX idx_collection_results_surface ON collection_results(surface);

-- Update indexes
CREATE INDEX idx_audits_surface ON audits(surface);
CREATE INDEX idx_findings_surface ON findings(surface);
CREATE INDEX idx_patterns_surface ON patterns(surface);
```

### Migration Strategy

1. Existing `crawl_results` table continues to work for web audits
2. New `collection_results` table is surface-agnostic
3. Migration: add `surface` columns with default `'web'` (non-breaking)
4. Phase out `crawl_results` once web audits use `collection_results`

## S10. Combined Scenario Grammar

### Grammar Engine (Shared)

The composition engine is shared across all surfaces. Only the primitives change.

```typescript
interface MultiSurfaceScenarioConfig {
  surface: AuditSurface;
  personas: string[];
  entryPoints: string[];
  intents: string[];
  dimensionFocus: string;
  conditions: string[];
}

/**
 * Primitive registry: maps surface to available primitives per axis.
 */
interface ScenarioGrammarRegistry {
  surfaces: Record<AuditSurface, {
    personas: string[];
    entryPoints: string[];
    intents: string[];
    dimensionFocuses: string[];
    conditions: string[];
    totalConfigurations: number;
  }>;
}
```

### Total Scenarios Per Surface

| Surface | Personas | Entry Points | Intents | Focus | Conditions | Total |
|---------|----------|-------------|---------|-------|-----------|-------|
| Web | 10 | 7 | 7 | 7 | 8 | 27,440 |
| MCP | 6 | 6 | 6 | 7 | 8 | 1,728* |
| REST API | 6 | 6 | 7 | 9 | 9 | 2,268* |
| GraphQL | 6 | 5 | 7 | 7 | 8 | 1,680* |
| Webhook | 6 | 4 | 6 | 6 | 6 | 864* |
| **Total** | | | | | | **34,080** |

*Focus and conditions use surface-specific dimension lists. Counts use surface-specific focus options.

## S11. Combined Work Unit Estimates

### By Surface

| Surface | WUs | Estimated Hours | Critical Path (hours) | Dependencies |
|---------|-----|----------------|----------------------|-------------|
| MCP | 8 | 34h | 22h | WU-00, WU-00b, WU-05, WU-06 |
| REST API | 8 | 36h | 24h | WU-00, WU-00b, WU-05, WU-06 |
| GraphQL | 7 | 29h | 20h | WU-00, WU-00b, WU-05, WU-06 |
| Webhook | 5 | 22h | 16h | WU-00, WU-00b, infrastructure |
| **Shared infrastructure** | 3 | 12h | 12h | WU-00, WU-06 |
| **Total** | **31** | **133h** | — | — |

### Shared Infrastructure WUs

| WU | Title | Agent | Est. Hours | Description |
|----|-------|-------|------------|-------------|
| WU-S01 | TYPE-SPEC v2.0: Discriminated Unions | Opus | 4h | Implement CollectionResult, SurfaceSummary, SurfaceEvidence unions; update Finding type |
| WU-S02 | Methodology Registry | Opus | 4h | Surface-to-dimension mapping, weight vectors, composite score calculation |
| WU-S03 | Multi-Surface Pipeline Router | Opus | 4h | Surface routing in pipeline, primitive selection by surface, updated synthesis |

### Critical Path (First Non-Web Surface: MCP)

```
WU-S01 (types, 4h)
  → WU-S02 (methodology, 4h) + WU-M01 (MCP client, 4h) [parallel]
  → WU-M02 (introspection, 6h)
  → WU-M03 (summarizer, 3h) + WU-M06 (security, 4h) [parallel]
  → WU-M04 (deterministic, 5h) + WU-M05 (LLM, 5h) [parallel]
  → WU-S03 (router, 4h) + WU-M07 (grammar, 3h) [parallel]
  → WU-M08 (integration, 4h)

Total critical path: ~30 hours (assuming 2 agents in parallel)
```

### Recommended Build Order

**Phase 1: MCP (highest strategic value, no incumbent)**
1. WU-S01, WU-S02, WU-S03 (shared infrastructure)
2. WU-M01 through WU-M08

**Phase 2: REST API (if market demands it)**
3. WU-A01 through WU-A08

**Phase 3: GraphQL (builds on REST infrastructure)**
4. WU-G01 through WU-G07

**Phase 4: Webhook (highest infrastructure cost, defer)**
5. Webhook WUs only if specific customer demand

## S12. TYPE-SPEC v2.0 Compatibility

### Backwards Compatibility Strategy

TYPE-SPEC v2.0 is a **superset** of v1.0. No breaking changes to existing types.

| V1.0 Type | V2.0 Status | Change |
|-----------|-------------|--------|
| Finding | Extended (additive) | Add optional `surface` field (defaults to `'web'`) |
| EvidenceBundle | Preserved | Becomes the `web` variant of SurfaceEvidence |
| CrawlResult | Preserved | Becomes the `web` variant of CollectionResult |
| PageSummary | Preserved | Becomes the `web` variant of SurfaceSummary |
| AuditPrimitive | Preserved (V1 primitives still work) | V2 primitives use AuditPrimitiveV2 |
| AuditConfig | Extended (additive) | V2 adds `surface` field |
| AuditDimension | Extended (additive) | V2 adds new dimension codes |
| Envelope | Unchanged | Works for all surfaces |
| SynthesisResult | Unchanged | Works for all surfaces |
| PayloadRenderer | Unchanged | Works for all surfaces |

### What This Means

- All existing web audit code continues to work without modification
- New surface code uses the V2 interfaces
- The pipeline branches at collection, converges at synthesis
- Finding, Envelope, SynthesisResult, and PayloadRenderer are surface-agnostic by design
- The type system handles surface differences through discriminated unions, not conditional fields

## S13. Completeness Formulas by Surface

Each surface defines what constitutes "complete" evidence for a finding:

### Web Evidence Completeness

```
completeness = (
  (url ? 0.2 : 0) +
  (domSnapshotHash ? 0.2 : 0) +
  (screenshotPath ? 0.1 : 0) +
  (timestamp ? 0.1 : 0) +
  (reasoning ? 0.2 : 0) +
  (relevantHeaders ? 0.1 : 0) +
  (model ? 0.05 : 0) +
  (tokensUsed ? 0.05 : 0)
)
```

### MCP Evidence Completeness

```
completeness = (
  (target ? 0.15 : 0) +
  (schemaHash ? 0.15 : 0) +
  (subject ? 0.15 : 0) +
  (timestamp ? 0.1 : 0) +
  (requestPayload || toolSchema ? 0.15 : 0) +
  (responsePayload || errorResponse ? 0.15 : 0) +
  (reasoning ? 0.15 : 0)
)
```

### REST API Evidence Completeness

```
completeness = (
  (baseUrl ? 0.1 : 0) +
  (endpoint ? 0.15 : 0) +
  (timestamp ? 0.1 : 0) +
  (request ? 0.15 : 0) +
  (response ? 0.2 : 0) +
  (reasoning ? 0.15 : 0) +
  (specHash || specExcerpt ? 0.1 : 0) +
  (model ? 0.05 : 0)
)
```

### GraphQL Evidence Completeness

```
completeness = (
  (endpointUrl ? 0.1 : 0) +
  (schemaHash ? 0.1 : 0) +
  (subject ? 0.15 : 0) +
  (timestamp ? 0.1 : 0) +
  (query ? 0.15 : 0) +
  (responsePayload || errorPayload ? 0.2 : 0) +
  (reasoning ? 0.15 : 0) +
  (schemaExcerpt ? 0.05 : 0)
)
```

### Webhook Evidence Completeness

```
completeness = (
  (producerBaseUrl ? 0.1 : 0) +
  (timestamp ? 0.1 : 0) +
  (eventType ? 0.15 : 0) +
  (deliveryRecord || retrySequence ? 0.3 : 0) +
  (reasoning ? 0.2 : 0) +
  (documentationExcerpt ? 0.1 : 0) +
  (model ? 0.05 : 0)
)
```

### Critical Finding Rule (All Surfaces)

CRITICAL findings require evidence completeness >= 1.0. This rule applies identically across all surfaces. The completeness formula ensures surface-appropriate evidence is required.

---

## S14. ADR Recommendations

### ADR-018: Discriminated Unions for Multi-Surface Types

**Status:** Proposed
**Context:** CrawlResult, PageSummary, and EvidenceBundle are web-specific. Multi-surface auditing requires surface-specific collection, summary, and evidence types.
**Decision:** Implement discriminated unions (CollectionResult, SurfaceSummary, SurfaceEvidence) with surface field as discriminant. Existing web types become the 'web' variant. No breaking changes.
**Consequences:** New surfaces added by adding a variant to each union. Pipeline branches at collection, converges at synthesis. Finding/Envelope/SynthesisResult remain surface-agnostic.

### ADR-019: Surface-Specific Methodology with Registry

**Status:** Proposed
**Context:** METHODOLOGY-v0.1 defines weights for web dimensions only. Non-web surfaces have different dimensions and weights.
**Decision:** Create a MethodologyRegistry that maps each surface to its applicable dimensions and weights. Each surface gets its own methodology version. The composite score is calculated per-surface, not globally.
**Consequences:** Scores are comparable within a surface but NOT across surfaces. "Score 85 for an API" does not mean the same thing as "Score 85 for a website." This is correct — they measure different things.

### ADR-020: MCP First, Then REST, Then GraphQL, Webhooks Last

**Status:** Proposed
**Context:** All non-web surfaces require multiplicative investment. MCP has no incumbent and highest strategic value. Webhooks require infrastructure (public HTTPS listener). REST API has strong incumbents (Postman).
**Decision:** Build surfaces in this order: MCP → REST API → GraphQL → Webhook. MCP begins after web PMF (ADR-017 exception for Rhumb). REST API only if market demands. GraphQL shares REST infrastructure. Webhooks require listener infrastructure.
**Consequences:** Focused engineering investment. MCP gets the best work. Webhook auditing may never ship if demand doesn't materialize.

---

## S15. Open Questions for Human Review

1. **MCP stdio sandboxing:** Running arbitrary MCP servers via stdio requires Docker containers. WU-M01 designs for SSE/HTTP only. Should stdio be WU-M01b or deferred entirely?

2. **REST API auth credential handling:** API audits may require auth credentials. The AuditTarget type accepts credentials but they must NEVER be stored. Should credentials be required via CLI only (no web form) to reduce exposure?

3. **Webhook listener infrastructure:** Webhook auditing requires hosting temporary HTTPS endpoints. This is fundamentally different infrastructure from the existing Playwright worker model. Should webhook auditing be a separate service?

4. **Cross-surface scoring comparability:** The current design explicitly says scores are NOT comparable across surfaces. Is this acceptable, or do stakeholders need a unified score? (Panel recommendation: keep them separate. Cross-surface comparison is meaningless.)

5. **Schema fingerprinting cadence:** For the Rhumb integration, how frequently should schema fingerprints be compared? Every audit? Daily? This affects the monitoring pillar strategy.

6. **GraphQL introspection in production:** Many GraphQL APIs disable introspection in production (and we flag that as a finding). How do we audit the schema if introspection is disabled? Options: (a) require schema SDL as input, (b) infer from query responses, (c) mark as "limited audit."

7. **OWASP API Top 10 vs general API security:** Priya's rubric covers some OWASP Top 10 items but not all (e.g., BOLA requires authenticated context). Should we split into "external security" (no auth needed) and "authenticated security" (auth required)?

---

## S16. Summary Statistics

| Metric | Value |
|--------|-------|
| Total new types defined | 47 |
| Total audit dimensions (all surfaces) | 38 |
| Total scenario grammar configurations (all surfaces) | 34,080 |
| Total new work units | 31 |
| Total estimated hours | 133h |
| Shared infrastructure work units | 3 (12h) |
| Surfaces with no incumbent competition | 1 (MCP) |
| Backwards-breaking changes to TYPE-SPEC v1.0 | 0 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-11 | Initial multi-surface methodology. 7-expert panel output. |
