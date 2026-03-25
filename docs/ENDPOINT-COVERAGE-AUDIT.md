# Alien Eyes -- Endpoint Coverage Audit

> Date: 2026-03-11
> Status: Round 1 synthesis
> Purpose: Separate what is already mapped from what is still implied, and define the endpoint families Alien Eyes must support and test without hand-waving.

---

## Executive Answer

**No.** The current documentation has thought deeply about the web audit loop and has partially mapped Alien Eyes's own delivery interfaces, but it has **not yet thoroughly mapped or validated all endpoint families** implied by the vision.

The docs currently mix together two different endpoint universes:

1. **Alien Eyes as a product** -- its own web, API, CLI, MCP, auth, history, dispute, and publish surfaces
2. **Products Alien Eyes will evaluate** -- websites, APIs, MCP servers, CLIs, GitHub-native workflows, webhooks, and eventually mobile/native systems

The first universe is partially specified.
The second universe is still mostly visionary outside URL-first website audits.

---

## What Is Actually Well Mapped Today

### 1. URL-first website auditing

This is the only surface that is genuinely specified end-to-end today.

Mapped across:
- `PRODUCT-SPEC.md` -- URL-first entry and phased delivery
- `docs/TYPE-SPEC.md` -- crawl, findings, synthesis, renderers
- `docs/METHODOLOGY-v0.1.md` -- scoring dimensions and severity rules
- `docs/SCENARIO-GRAMMAR.md` -- website-oriented scenario grammar
- `docs/WORK-UNITS.md` -- crawl worker, primitives, orchestrator, renderers

Strengths:
- Clean-browser crawl model
- Deterministic vs probabilistic split
- Evidence bundles
- Re-audit lifecycle
- False-positive feedback loop
- Ownership-gated security and agent findings

### 2. Alien Eyes delivery basics

Partially specified:
- SaaS web interface
- REST API with 5 core endpoints
- CLI local mode and CLI cloud mode
- MCP server with 6 tools

These are real plans, but not yet complete contracts.

---

## Endpoint Universe A: Alien Eyes's Own Interfaces

### Status by interface

| Interface | Current Status | Notes |
|-----------|----------------|-------|
| Web app | Strongly mapped | Main V1 surface |
| REST API | Partially mapped | 5 endpoints named, but contract depth is still thin |
| CLI local | Partially mapped | Good user-story coverage |
| CLI cloud | Partially mapped | Depends on REST API maturity |
| MCP server | Partially mapped | Tool names exist, but no protocol detail yet |
| GitHub connection | Concept only | Mentioned in product model, not contractually specified |
| Webhooks | Mention only | No event schema, signing, retry, or subscription model |
| Progress stream / SSE | Mention only | WU references progress, but no client/server contract |
| Ownership verification API | Workflow exists | No explicit endpoint or state model documented |
| Publish/takedown/report sharing API | Workflow exists | No explicit endpoint contract |

### Currently named API/MCP operations

Already named in docs:
- `POST /api/audit`
- `GET /api/audit/:id`
- `GET /api/audit/:id/findings`
- `POST /api/audit/:id/re-audit`
- `POST /api/audit/:id/findings/:findingId/dispute`
- MCP: `audit_url`, `get_status`, `get_findings`, `get_score`, `re_audit`, `dispute_finding`

### Missing Alien Eyes product endpoints

These are implied by the product but not yet specified:

| Missing Contract | Why It Matters |
|------------------|----------------|
| `cancel_audit` | Required for long-running jobs and CI time budgets |
| `list_audits` / filter history | Required for dashboard, CLI cloud history, and agents |
| `verify_ownership` start/check/complete | Security and agent findings depend on it |
| `publish_report` / `unpublish_report` | Principle 16 requires explicit publish control |
| `create_webhook` / `delete_webhook` / delivery retry rules | Level 3 explicitly promises callbacks |
| `get_evidence` / evidence bundle access policy | Findings require proof; access rules matter |
| `health` / `ready` endpoints for workers | Needed for real infrastructure operation |
| rate-limit headers and quota introspection | Required for CI and agent integrations |
| idempotency behavior for `POST /api/audit` | Prevents duplicate paid audits |
| API versioning strategy | Prevents schema drift from breaking agents |

### Core contract gaps

The current docs do not yet define:
- Auth precedence: session cookie vs API key vs GitHub install token
- Async model: polling only vs webhooks vs SSE, and which surface uses which
- Error taxonomy: stable machine codes, retryable vs terminal, budget-exceeded vs blocked vs inconclusive
- Idempotency and deduplication rules
- Pagination and truncation rules for large finding sets
- Evidence redaction rules across private/public/verified contexts
- Formal JSON examples for every endpoint and MCP tool

---

## Endpoint Universe B: Product Interfaces Alien Eyes Intends To Evaluate

This is the larger gap.

### Current reality

The product vision claims future support for:
- websites
- APIs
- MCP servers
- CLIs
- libraries
- GitHub-connected and diff-aware workflows
- mobile-adjacent backend/API evaluation

But the operational model is still overwhelmingly website-first.

### Status by target surface

| Target Surface | Status | Reality |
|----------------|--------|---------|
| Public websites | Strongly mapped | Real V1 surface |
| SPAs/PWAs/mobile web | Partially mapped | Still URL-first |
| Behind-login web apps | Explicitly out of scope in V1 | Needs credential model |
| REST/OpenAPI APIs | Concept only | No input contract or harness |
| GraphQL APIs | Unmapped | No schema/introspection strategy |
| MCP servers | Concept only | No transport/capability test grammar |
| CLIs | Concept only | No binary/package/install/runtime harness |
| GitHub Apps / Actions / PR bots | Unmapped | Mentioned as workflow, not test target |
| Webhooks | Unmapped | No request capture/replay model |
| SSE / WebSockets / streaming APIs | Unmapped | No event-stream methodology |
| Native mobile apps | Deferred | Not a V1 claim |

### The key problem

`docs/SCENARIO-GRAMMAR.md` is currently a **website grammar with light API references**, not a cross-surface grammar.

Examples:
- `homepage`
- `deep-link`
- `search-result`
- `social-share`
- `cookies-declined`
- `large-viewport`
- `small-viewport`

These work for websites. They do **not** define how to test:
- an MCP server over stdio vs SSE
- a CLI installed via npm vs Homebrew vs pipx
- a REST API requiring API keys, OAuth, or signed webhooks
- a GitHub Action running inside CI

---

## Multi-Round Expert Synthesis

### Round 1: Protocol Designer

Objection:
You do not yet have a primary endpoint family per product category. "Agent-nativeness" is not enough. A website, API, CLI, and MCP server need different completion criteria.

Implication:
Define success separately for each target surface before claiming cross-category support.

### Round 2: GitHub Platform Engineer

Objection:
"GitHub connected" is treated as a feature toggle, but it is actually its own integration domain: repo connection, installation scope, default branch, monorepo path mapping, PR annotations, diff scoping, commit-status lifecycle.

Implication:
GitHub needs its own contract, not a footnote under Format C.

### Round 3: MCP Runtime Engineer

Objection:
MCP support is currently named at the tool level only. It does not specify transport, capability discovery, auth, pagination, streaming, server health, or how Alien Eyes will evaluate third-party MCP servers.

Implication:
There are two separate MCP problems:
- Alien Eyes exposing MCP tools
- Alien Eyes auditing other MCP servers

They need separate specs.

### Round 4: CLI Reliability Engineer

Objection:
CLI testing is not "run a command once." It requires install path, OS matrix, shell matrix, env injection, stdout/stderr contract, exit-code stability, timeout behavior, side-effect isolation, and fixture-based verification.

Implication:
A CLI audit harness is a distinct product surface, not an extension of URL crawling.

### Round 5: Adversarial Security Engineer

Objection:
Every new endpoint family multiplies abuse risk. OpenAPI ingestion, GitHub connection, CLI execution, webhook capture, and MCP probing all create new SSRF, secret-exfiltration, and cost-amplification paths.

Implication:
Each target surface needs a separate threat model before implementation.

### Round 6: QA/Measurement Scientist

Objection:
There is no endpoint coverage matrix tying product claims to repeatable fixtures, evidence expectations, and launch gates.

Implication:
Without a matrix, "supported" will quietly mean "works on a few anecdotal examples."

---

## Required Target-Surface Taxonomy

Alien Eyes should explicitly model the thing being tested as one of these surface families:

| Family | Required Input | Primary Outcome |
|--------|----------------|-----------------|
| `website_public` | URL | Can humans and crawlers understand and use it? |
| `website_authenticated` | URL + credentials/test env | Can verified users complete core flows? |
| `api_rest` | base URL + OpenAPI/examples + auth | Can clients integrate and recover from failure? |
| `api_graphql` | endpoint + schema/introspection + auth | Can clients discover and query safely? |
| `mcp_server` | command/URL + transport + auth | Can agents discover and use tools/resources/prompts reliably? |
| `cli_tool` | package/binary + install method + env | Can operators install, configure, and run it predictably? |
| `github_app_or_action` | repo/install scope/workflow ref | Does it behave safely and predictably in CI/PR contexts? |
| `webhook_producer` | callback spec + signing model | Are events delivered, signed, retried, and documented correctly? |
| `streaming_endpoint` | SSE/WebSocket/gRPC contract | Is stream setup, erroring, and reconnection agent-safe? |

If a product cannot be classified cleanly, Alien Eyes should mark the audit `inconclusive` rather than pretending URL-first coverage applies.

---

## Required Alien Eyes Interface Taxonomy

Alien Eyes itself should explicitly commit to these interface families:

| Family | Minimum Contract |
|--------|------------------|
| Web UI | submit, progress, results, history, publish, dispute |
| REST API | async audit lifecycle, findings retrieval, re-audit, dispute, ownership |
| CLI local | local execution, formats, deterministic exit codes |
| CLI cloud | remote submit/poll/result parity with local |
| MCP server | audit lifecycle tools with stable JSON schemas |
| GitHub integration | repo connect, file mapping, diff scoping, PR annotations |
| Webhooks | signed async completion events |
| Worker ops | health, readiness, budget, queue visibility |

---

## The Missing Test Matrix

For each surface family, Alien Eyes needs a pre-registered test matrix with four layers:

### 1. Contract tests

Does the interface itself obey a stable schema?

Examples:
- JSON schema stable
- exit codes stable
- MCP tool schemas stable
- webhook signature validation stable

### 2. Workflow tests

Can a human or agent complete the intended job?

Examples:
- start audit -> poll -> retrieve findings
- install CLI -> run help -> run command -> parse output
- discover MCP tools -> call tool -> handle tool error

### 3. Adversarial tests

How does it fail under weird or hostile conditions?

Examples:
- malformed auth
- expired token
- partial network failure
- large output
- time budget exceeded
- replayed webhook
- schema drift

### 4. Evidence tests

Can Alien Eyes prove what it observed without leaking protected methodology or secrets?

Examples:
- screenshot or DOM hash for web finding
- request/response metadata for API finding
- stdout/stderr capture for CLI finding
- MCP transcript fragment for MCP finding

---

## Launch Truth Table

### Safe claims today

Alien Eyes has enough documentation to credibly claim:
- URL-first public website auditing is the V1 core
- Alien Eyes will expose web and REST surfaces first
- CLI and MCP are phased delivery surfaces
- re-audit and dispute are first-class behaviors

### Unsafe claims today

Alien Eyes should **not** currently claim that it has thoroughly mapped:
- API auditing
- MCP server auditing
- CLI auditing
- GitHub-native testing
- webhook/streaming endpoint evaluation
- cross-category comparable scoring

Those are strategy claims, not design-complete capabilities.

---

## Recommended Scope Decision

### V1 truth

Commit V1 to:
- public website audits
- Alien Eyes web UI
- Alien Eyes REST API
- re-audit
- dispute lifecycle
- ownership verification for sensitive dimensions

### Phase 1 truth

Add:
- Alien Eyes CLI local/cloud
- GitHub-connected file mapping and PR annotations
- webhooks for async completion

### Phase 2 truth

Add new target surfaces one by one:
- REST/OpenAPI audit mode
- MCP server audit mode
- CLI audit mode

Do not bundle them into one generic "non-web support" promise.

---

## Documents That Need To Exist Next

Before claiming endpoint completeness, add:

1. `docs/INTERFACE-INVENTORY.md`
   One canonical list of every Alien Eyes interface and every target-surface family.

2. `docs/API-SPEC.md`
   Full REST contract: auth, errors, idempotency, examples, rate limits, webhook model.

3. `docs/MCP-SPEC.md`
   Alien Eyes as MCP server: tools, schemas, auth, status model, error model.

4. `docs/GITHUB-SPEC.md`
   Repo connection, permissions, monorepos, diff-aware retest, PR annotations.

5. `docs/TARGET-SURFACES.md`
   How Alien Eyes audits websites vs APIs vs MCP vs CLI, with explicit required inputs.

6. `docs/TEST-MATRIX.md`
   Pre-registered coverage matrix by surface family, endpoint family, adversarial condition, and evidence requirement.

---

## Hard Conclusion

Alien Eyes has done the hard conceptual work for the website audit loop.
It has **not yet done equivalent endpoint thinking** for APIs, MCP servers, CLIs, GitHub-native workflows, webhooks, or streaming interfaces.

The next strategic move is not "add more endpoint promises."
It is:

1. freeze the interface inventory
2. separate product interfaces from target-product surfaces
3. choose one non-web surface to design properly
4. build a real test matrix before expanding claims
