# Alien Eyes — Multi-Surface Audit Specification

> Version: 1.0 | Date: 2026-03-11
> Status: DESIGN-COMPLETE. Implementation deferred per ADR-017 (Single Surface Until PMF).
> Source: 7-expert panel — CLI usability, package ecosystem security, repo quality, documentation engineering, open source health, supply chain security, devtool product design
> Purpose: Implementation-ready specifications for 4 non-web surfaces: CLI Tools, Package Registries, GitHub Repositories, Documentation Sites
> Relationship to SURFACE-COVERAGE-SYNTHESIS.md: That document recommends MCP-first expansion. This document provides the design specs so that when ANY surface expansion is greenlit, the architecture is ready. Design now, build later.

---

## Preamble: Strategic Context

The SURFACE-COVERAGE-SYNTHESIS.md (3 prior panels, 23 experts) established:

1. Current types, methodology, evidence, and grammar are web-locked
2. MCP is the only no-incumbent surface worth prioritizing
3. Single-surface focus until web PMF (ADR-017)

This specification does NOT override those decisions. It provides the design work so that surface expansion — whenever it happens — starts from complete specifications rather than discovery. The build order remains: Web -> MCP -> then whichever of these 4 surfaces the market demands.

### How This Document Extends TYPE-SPEC v1.0

TYPE-SPEC v1.0 is FROZEN. This document defines TYPE-SPEC v2.0 additive types that will be implemented only when a surface expansion is approved. The discriminated union pattern described here is the required approach (per SURFACE-COVERAGE-SYNTHESIS.md CRITICAL-1).

---

## Table of Contents

1. [Shared Architecture](#1-shared-architecture)
2. [Surface 1: CLI Tools](#2-cli-tools)
3. [Surface 2: Package Registries](#3-package-registries)
4. [Surface 3: GitHub Repositories](#4-github-repositories)
5. [Surface 4: Documentation Sites](#5-documentation-sites)
6. [Cross-Surface Health Dimensions](#6-cross-surface-health-dimensions)
7. [Supply Chain Security Dimensions](#7-supply-chain-security-dimensions)
8. [First Encounter Framework](#8-first-encounter-framework)
9. [Cross-Panel Synthesis](#9-cross-panel-synthesis)
10. [Work Unit Estimates](#10-work-unit-estimates)
11. [Build Priority](#11-build-priority)

---

## 1. Shared Architecture

### 1.1 Discriminated Union: CollectionResult

The top-level input type for all surfaces. Replaces the web-only `CrawlResult` as the universal input.

```typescript
/**
 * TYPE-SPEC v2.0 — Discriminated union for all audit surfaces.
 * Each surface has its own collection result type.
 * The AuditPrimitive.run() signature changes from:
 *   run(crawl: CrawlResult, summaries: PageSummary[], config: AuditConfig)
 * to:
 *   run(collection: CollectionResult, summaries: SurfaceSummary[], config: AuditConfig)
 */
type CollectionResult =
  | WebCrawlResult        // Existing CrawlResult, renamed for clarity
  | CLIProbeResult
  | PackageProbeResult
  | RepoProbeResult
  | DocsCollectionResult;

/** Discriminant field present on all variants */
interface BaseCollectionResult {
  /** Discriminant — determines which variant this is */
  surface: SurfaceType;

  /** The input identifier (URL, package name, repo slug, CLI name) */
  target: string;

  /** ISO 8601 timestamp when collection started */
  timestamp: string;

  /** Total collection duration in milliseconds */
  totalDurationMs: number;

  /** Methodology version */
  methodologyVersion: string;
}

type SurfaceType = 'web' | 'cli' | 'package' | 'repo' | 'docs';
```

### 1.2 Discriminated Union: SurfaceSummary

Compressed representation for LLM consumption, per surface.

```typescript
type SurfaceSummary =
  | PageSummary           // Existing, for web
  | CLISummary
  | PackageSummary
  | RepoSummary
  | DocsSummary;
```

### 1.3 Discriminated Union: EvidenceBundle

Surface-specific proof that a finding is real.

```typescript
type EvidenceBundle =
  | WebEvidence           // Existing EvidenceBundle, renamed
  | CLIEvidence
  | PackageEvidence
  | RepoEvidence
  | DocsEvidence;

/** Shared fields across all evidence types */
interface BaseEvidence {
  /** Discriminant */
  surface: SurfaceType;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** Which model produced this finding (if LLM-generated) */
  model?: string;

  /** Token count used */
  tokensUsed?: number;

  /** Reasoning chain */
  reasoning?: string;

  /** Completeness score 0-1 */
  completeness: number;
}
```

### 1.4 Extended AuditDimension

```typescript
type AuditDimension =
  // Web dimensions (existing)
  | 'seo' | 'aeo' | 'geo' | 'meo'
  | 'accessibility' | 'security' | 'performance'
  | 'ux' | 'copy' | 'analytics' | 'legal'
  | 'agent-nativeness' | 'email' | 'api-quality'
  // Cross-surface dimensions (new)
  | 'install-experience'
  | 'documentation-quality'
  | 'error-handling'
  | 'composability'
  | 'maintenance-health'
  | 'supply-chain'
  | 'discoverability'
  | 'onboarding'
  | 'trustworthiness'
  | 'contributor-experience';
```

### 1.5 Methodology Registry

```typescript
/**
 * Maps each surface to its applicable dimensions with weights.
 * Replaces the single web weight vector from METHODOLOGY-v0.1.
 */
interface MethodologyRegistry {
  [surface: string]: {
    version: string;
    dimensions: {
      dimension: AuditDimension;
      weight: number;
      llmRequired: boolean;
      ownershipRequired: boolean;
    }[];
    quickCheckDimensions: AuditDimension[];
    fullAuditDimensions: AuditDimension[];
  };
}
```

### 1.6 AuditConfig Extension

```typescript
interface AuditConfig {
  /** Existing fields preserved */
  tier: 'quick_check' | 'full_audit';
  ownershipVerified: boolean;
  costBudget: number;
  methodologyVersion: string;
  isReAudit: boolean;
  previousAuditId?: string;
  targetedDimensions?: AuditDimension[];

  /** New: which surface is being audited */
  surface: SurfaceType;

  /** New: surface-specific config (replaces pageLimit for non-web) */
  surfaceConfig: WebConfig | CLIConfig | PackageConfig | RepoConfig | DocsConfig;
}
```

---

## 2. CLI Tools

> Expert: Dr. Rachel Kim — CLI Usability Researcher

### 2A. Collection Type: CLIProbeResult

```typescript
/**
 * Result of probing a CLI tool. Collected inside a Docker sandbox.
 * The probe follows a structured sequence: install -> discover -> exercise -> stress.
 */
interface CLIProbeResult extends BaseCollectionResult {
  surface: 'cli';

  /** How the CLI was identified (npm package, PyPI package, binary URL, Homebrew formula) */
  installSource: CLIInstallSource;

  /** Installation probe results */
  install: CLIInstallProbe;

  /** Discovery probe results — what the CLI tells you about itself */
  discovery: CLIDiscoveryProbe;

  /** Exercise probe results — running actual commands */
  exercises: CLIExerciseResult[];

  /** Environment info */
  environment: CLISandboxEnvironment;

  /** Detected characteristics */
  characteristics: CLICharacteristics;
}

interface CLIInstallSource {
  type: 'npm' | 'pypi' | 'homebrew' | 'cargo' | 'go' | 'binary_url' | 'apt' | 'docker';
  identifier: string;         // e.g., "alien-eyes" for npm, "alien-eyes" for PyPI
  requestedVersion?: string;  // e.g., "latest", "^2.0.0"
  resolvedVersion: string;    // Actual installed version
}

interface CLIInstallProbe {
  /** Whether installation succeeded */
  success: boolean;

  /** Exit code of install command */
  exitCode: number;

  /** Full install command used */
  command: string;

  /** Stdout from install (truncated to 10KB) */
  stdout: string;

  /** Stderr from install (truncated to 10KB) */
  stderr: string;

  /** Duration in milliseconds */
  durationMs: number;

  /** Size of installed artifact in bytes */
  installedSizeBytes: number;

  /** Number of dependencies pulled in */
  dependencyCount: number;

  /** Whether install scripts ran (postinstall, etc.) */
  installScriptsRan: boolean;

  /** What install scripts did (file writes, network calls, env reads) */
  installScriptBehavior?: CLIScriptBehavior;

  /** Warnings emitted during install */
  warnings: string[];

  /** Deprecation notices */
  deprecationNotices: string[];
}

interface CLIScriptBehavior {
  /** Files written outside node_modules/site-packages */
  filesWritten: string[];
  /** Network connections attempted */
  networkConnections: { host: string; port: number; protocol: string }[];
  /** Environment variables read */
  envVarsRead: string[];
  /** Child processes spawned */
  processesSpawned: string[];
}

interface CLIDiscoveryProbe {
  /** Does --help exist and produce output? */
  helpExists: boolean;

  /** Full --help output (truncated to 20KB) */
  helpOutput: string;

  /** Does --version exist? */
  versionExists: boolean;

  /** Version string returned */
  versionOutput: string;

  /** Does the tool have subcommands? */
  hasSubcommands: boolean;

  /** Discovered subcommands (from --help parsing) */
  subcommands: CLISubcommand[];

  /** Does the tool have man pages? */
  hasManPage: boolean;

  /** Does the tool support shell completions? */
  shellCompletions: {
    bash: boolean;
    zsh: boolean;
    fish: boolean;
    powershell: boolean;
  };

  /** Does the tool have a config file? */
  configFileSupport: {
    exists: boolean;
    formats: string[];       // e.g., ["json", "yaml", "toml"]
    discoveryMethod: string; // e.g., "--config flag", "~/.toolrc", "env var"
  };

  /** Global flags discovered */
  globalFlags: CLIFlag[];

  /** Does --help mention examples? */
  hasExamples: boolean;

  /** Does the tool print colored output? */
  usesColor: boolean;

  /** Does the tool respect NO_COLOR? */
  respectsNoColor: boolean;

  /** Does the tool support --json or structured output? */
  structuredOutputSupport: {
    json: boolean;
    csv: boolean;
    yaml: boolean;
    other: string[];
  };
}

interface CLISubcommand {
  name: string;
  description: string;
  helpOutput: string;       // Subcommand-specific --help
  flags: CLIFlag[];
  hasExamples: boolean;
}

interface CLIFlag {
  long: string;             // e.g., "--output"
  short?: string;           // e.g., "-o"
  description: string;
  takesValue: boolean;
  required: boolean;
  defaultValue?: string;
}

interface CLIExerciseResult {
  /** Description of what was being tested */
  intent: string;

  /** Full command run */
  command: string;

  /** Exit code */
  exitCode: number;

  /** Stdout (truncated to 50KB) */
  stdout: string;

  /** Stderr (truncated to 50KB) */
  stderr: string;

  /** Duration in milliseconds */
  durationMs: number;

  /** Whether the command was a known-good path or adversarial */
  exerciseType: 'happy_path' | 'error_path' | 'edge_case' | 'adversarial';

  /** Side effects observed (files created, network calls, etc.) */
  sideEffects: CLISideEffect[];
}

interface CLISideEffect {
  type: 'file_created' | 'file_modified' | 'file_deleted'
      | 'network_call' | 'env_modified' | 'process_spawned';
  detail: string;
}

interface CLISandboxEnvironment {
  os: string;               // e.g., "linux-amd64"
  shell: string;            // e.g., "/bin/bash"
  nodeVersion?: string;
  pythonVersion?: string;
  dockerImage: string;       // Exact image used for reproducibility
  networkPolicy: 'restricted' | 'allowed';  // Whether outbound network was permitted
}

interface CLICharacteristics {
  /** Is this a single binary or a script requiring a runtime? */
  binaryType: 'compiled' | 'interpreted_node' | 'interpreted_python' | 'interpreted_other' | 'shell_script';

  /** Does it follow POSIX conventions? */
  posixCompliant: boolean;

  /** Does it use stdin/stdout/stderr correctly? */
  stdioCorrectness: {
    usesStdoutForOutput: boolean;
    usesStderrForErrors: boolean;
    usesStderrForProgress: boolean;
    acceptsStdinPipe: boolean;
  };

  /** Does it handle signals (SIGINT, SIGTERM)? */
  signalHandling: {
    siginTested: boolean;
    cleanShutdown: boolean;
  };

  /** Exit code conventions */
  exitCodeConventions: {
    zeroOnSuccess: boolean;
    nonZeroOnError: boolean;
    distinctCodesPerError: boolean;
    documentedCodes: boolean;
  };
}

interface CLIConfig {
  /** Package identifier */
  package: string;

  /** Install method */
  installMethod: CLIInstallSource['type'];

  /** Specific version to test (default: latest) */
  version?: string;

  /** Max commands to exercise */
  maxExercises: number;

  /** Whether to allow network in sandbox */
  allowNetwork: boolean;

  /** Timeout per command in milliseconds */
  commandTimeoutMs: number;

  /** Max total probe time in milliseconds */
  totalTimeoutMs: number;
}
```

### 2B. Summary Type: CLISummary

```typescript
/**
 * Compressed CLI representation for LLM consumption.
 * Target: 2-5K tokens.
 */
interface CLISummary {
  surface: 'cli';

  /** Package name and version */
  identity: {
    name: string;
    version: string;
    installSource: string;
    binaryType: string;
  };

  /** Install experience summary */
  installSummary: {
    success: boolean;
    durationMs: number;
    dependencyCount: number;
    installedSizeBytes: number;
    warnings: string[];
    installScriptsRan: boolean;
    suspiciousBehavior: string[];  // Extracted from CLIScriptBehavior
  };

  /** Help quality summary */
  helpQuality: {
    helpExists: boolean;
    versionExists: boolean;
    subcommandCount: number;
    examplesPresent: boolean;
    globalFlagCount: number;
    completionsAvailable: string[];
    structuredOutputFormats: string[];
  };

  /** Command exercise summary */
  exerciseSummary: {
    totalExercised: number;
    happyPathSuccessRate: number;
    errorPathQuality: string;      // "excellent" | "adequate" | "poor" | "absent"
    averageDurationMs: number;
    exitCodeConsistency: boolean;
  };

  /** Composability signals */
  composability: {
    acceptsStdin: boolean;
    jsonOutput: boolean;
    respectsNoColor: boolean;
    exitCodesDocumented: boolean;
    stderrForErrors: boolean;
    pipelineFriendly: boolean;      // Derived: stdin + stdout + exit codes + no-color
  };

  /** Agent-friendliness signals */
  agentFriendliness: {
    structuredOutput: boolean;
    predictableExitCodes: boolean;
    parsableHelp: boolean;
    noInteractivePrompts: boolean;
    configViaFlags: boolean;        // Can be fully configured via flags, not interactive
    machineReadableErrors: boolean;
  };

  /** Token estimate */
  tokenEstimate: number;
}
```

### 2C. Evidence Type: CLIEvidence

```typescript
interface CLIEvidence extends BaseEvidence {
  surface: 'cli';

  /** The command that was run */
  command: string;

  /** Exit code observed */
  exitCode: number;

  /** SHA-256 hash of stdout at the time of observation */
  stdoutHash: string;

  /** SHA-256 hash of stderr at the time of observation */
  stderrHash: string;

  /** First 2KB of stdout (for human review) */
  stdoutSnippet: string;

  /** First 2KB of stderr (for human review) */
  stderrSnippet: string;

  /** Docker image + tag used (reproducibility) */
  sandboxImage: string;

  /** Environment variables that affected the result */
  relevantEnvVars: Record<string, string>;

  /** Duration of the command */
  durationMs: number;

  /** Storage path to full probe log */
  probeLogPath?: string;
}
```

### 2D. Audit Dimensions

| Dimension | Code | What It Measures | LLM Required? | Deterministic Checks Available? |
|-----------|------|-----------------|---------------|-------------------------------|
| Install Experience | `install-experience` | Can you install it? How long? How big? Warnings? | No | Yes: exit code, duration, size, warnings, deprecations |
| Discoverability | `discoverability` | Can you figure out what it does and how to use it? | Yes (help quality judgment) | Partial: --help exists, --version exists, examples present |
| Error Handling | `error-handling` | Does it fail gracefully with useful messages? | Yes (message quality) | Partial: exit codes, stderr usage, error on bad input |
| Composability | `composability` | Can it be piped, scripted, used in automation? | No | Yes: stdin, stdout/stderr separation, JSON output, NO_COLOR, exit codes |
| Agent-Nativeness | `agent-nativeness` | Can an AI agent use this tool programmatically? | Yes (judgment) | Partial: structured output, predictable behavior, no interactive prompts |
| Security Surface | `supply-chain` | Install scripts, dependency health, known vulns | No | Yes: install script behavior, dependency audit, CVE check |
| Documentation Quality | `documentation-quality` | Help text, man pages, README, examples | Yes (completeness judgment) | Partial: help exists, examples present, man page exists |
| Maintenance Health | `maintenance-health` | Release cadence, deprecation notices, version age | No | Yes: version age, deprecation warnings, last publish date |

**Quick Check (free):** Install Experience + Composability + Maintenance Health. Deterministic only.

**Full Audit (paid):** All 8 dimensions.

### 2E. Scoring Rubric

| Check | Type | Severity if Failing | Evidence Required |
|-------|------|-------------------|------------------|
| Install fails with non-zero exit code | Deterministic | CRITICAL | Command + exit code + stderr |
| Install takes > 60 seconds | Deterministic | MEDIUM | Command + duration |
| Install pulls > 200 dependencies | Deterministic | LOW | Dependency count |
| Install scripts make network calls | Deterministic | HIGH | Script behavior log |
| Install scripts write outside package dir | Deterministic | HIGH | Script behavior log |
| --help missing or empty | Deterministic | HIGH | Command + stdout |
| --version missing | Deterministic | MEDIUM | Command + exit code |
| No examples in help text | LLM (Haiku) | MEDIUM | Help output |
| Help text does not explain what the tool does | LLM (Sonnet) | HIGH | Help output |
| Error on invalid input returns exit code 0 | Deterministic | HIGH | Command + exit code |
| Error messages go to stdout instead of stderr | Deterministic | MEDIUM | Command + stdout/stderr |
| Error messages are unhelpful (stack traces, no guidance) | LLM (Sonnet) | MEDIUM | Stderr snippet |
| No structured output option (--json or similar) | Deterministic | MEDIUM | Help output |
| Does not respect NO_COLOR env var | Deterministic | LOW | Stdout comparison |
| Interactive prompts with no --yes or --non-interactive flag | Deterministic | HIGH (for agents) | Command + behavior |
| SIGINT does not produce clean shutdown | Deterministic | MEDIUM | Signal test result |
| Exit codes not documented | LLM (Haiku) | LOW | Help output |
| Exit codes inconsistent (0 on error, non-0 on success) | Deterministic | HIGH | Exercise results |
| No shell completions available | Deterministic | LOW | Discovery results |
| Known CVEs in dependencies | Deterministic | CRITICAL (if exploitable) / MEDIUM | Audit output |
| Deprecated dependencies | Deterministic | LOW | Dependency list |
| Last published > 2 years ago | Deterministic | MEDIUM | Registry metadata |
| No stdin support for pipeable tool | LLM (Haiku) | MEDIUM | Exercise results |

### 2F. Scenario Grammar Primitives

**Axis 1: Persona**

| Primitive | Description |
|-----------|-------------|
| `cli-first-timer` | Developer who has never used this tool, found it via Google/npm search |
| `cli-power-user` | Experienced developer, expects POSIX conventions, uses pipes extensively |
| `ci-pipeline` | Non-interactive CI environment (GitHub Actions, GitLab CI) |
| `shell-scripter` | Writing a bash/zsh script that calls this tool |
| `ai-agent-cli` | AI coding agent executing this tool via subprocess |
| `windows-developer` | Using PowerShell or cmd.exe, not bash |
| `docker-container` | Running in a minimal container (no man, no color, limited env) |

**Axis 2: Entry Point**

| Primitive | Description |
|-----------|-------------|
| `npm-install` | `npm install -g <package>` |
| `npx-run` | `npx <package>` (no global install) |
| `pip-install` | `pip install <package>` |
| `pipx-run` | `pipx run <package>` |
| `brew-install` | `brew install <formula>` |
| `binary-download` | Download binary from GitHub releases |
| `docker-run` | `docker run <image>` |

**Axis 3: Intent**

| Primitive | Description |
|-----------|-------------|
| `understand-tool` | Run --help, --version, figure out what it does |
| `first-command` | Run the most basic happy-path command |
| `integrate-pipeline` | Use in a shell script or CI pipeline |
| `handle-error` | Trigger an error condition, evaluate recovery |
| `parse-output` | Capture and parse structured output |
| `configure-tool` | Set up config file or environment |
| `upgrade-version` | Update from a previous version |

**Axis 4: Dimension Focus**

| Primitive | Description |
|-----------|-------------|
| `install-focus` | Emphasize installation experience |
| `composability-focus` | Emphasize piping, scripting, automation |
| `agent-focus` | Emphasize machine-readability and predictability |
| `error-focus` | Emphasize error handling and recovery |
| `docs-focus` | Emphasize help text and documentation quality |
| `security-focus` | Emphasize supply chain and install safety |
| `balanced` | Equal weight |

**Axis 5: Adversarial Condition**

| Primitive | Description |
|-----------|-------------|
| `normal` | Standard environment, everything works |
| `no-network` | Network access blocked after install |
| `missing-env-var` | Required env var not set |
| `readonly-filesystem` | Cannot write to working directory |
| `stdin-closed` | No stdin (piped from /dev/null) |
| `large-input` | Very large file or input piped in |
| `concurrent-execution` | Multiple instances running simultaneously |
| `outdated-runtime` | Older Node.js/Python version |

**Total configurations:** 7 x 7 x 7 x 7 x 8 = **19,208**

### 2G. Infrastructure Requirements

| Requirement | Detail |
|-------------|--------|
| **Execution environment** | Docker container per probe. Image: `node:20-slim` + `python:3.12-slim` base images, switchable. |
| **Sandboxing** | gVisor or similar container runtime. No host filesystem access. Network restricted post-install (configurable). |
| **Resource limits** | 512MB RAM, 1 CPU core, 10GB disk per probe. Hard kill at timeout. |
| **Security** | No root in container. Seccomp profile restricting syscalls. Install script monitoring via strace/eBPF. |
| **Cost** | ~$0.02-0.05 compute per probe (5-10 min container on Railway). LLM cost: $0.50-2.00 for full audit. Total COGS: $0.52-2.05 per CLI audit. |
| **Time budget** | Quick Check: < 90 seconds (install + deterministic checks). Full Audit: < 10 minutes. |
| **Storage** | Probe logs stored 24h (same as web raw data). Summaries stored permanently. |

### 2H. Work Unit Estimates

| WU | Description | Agent | Hours | Dependencies |
|----|-------------|-------|-------|-------------|
| WU-CLI-00 | CLI type definitions (CLIProbeResult, CLISummary, CLIEvidence) | Opus | 2 | TYPE-SPEC v2.0 approval |
| WU-CLI-01 | Docker sandbox orchestrator (create, run, monitor, teardown containers) | Opus | 4 | WU-CLI-00 |
| WU-CLI-02 | Install prober (run install, capture output, monitor scripts) | Codex | 3 | WU-CLI-01 |
| WU-CLI-03 | Discovery prober (--help, --version, subcommands, flags, completions) | Codex | 3 | WU-CLI-01 |
| WU-CLI-04 | Exercise engine (generate + run happy/error/edge commands) | Opus | 4 | WU-CLI-02, WU-CLI-03 |
| WU-CLI-05 | CLI summarizer (CLIProbeResult -> CLISummary) | Codex | 2 | WU-CLI-00 |
| WU-CLI-06 | CLI audit primitives (8 dimensions, deterministic + LLM) | Opus | 6 | WU-CLI-04, WU-CLI-05 |
| WU-CLI-07 | CLI scenario grammar (primitives, selection, composition) | Opus | 3 | WU-CLI-06 |
| WU-CLI-08 | CLI integration into pipeline + synthesis | Codex | 3 | WU-CLI-06 |
| **Total** | | | **30 hours** | |

---

## 3. Package Registries

> Expert: Jordan Rivera — Package Ecosystem Security Expert

### 3A. Collection Type: PackageProbeResult

```typescript
/**
 * Result of probing a package from npm or PyPI.
 * Collection is registry-API-first: metadata, tarball inspection, dependency analysis.
 * No execution happens during collection (that is the CLI surface's job).
 */
interface PackageProbeResult extends BaseCollectionResult {
  surface: 'package';

  /** Which registry */
  registry: 'npm' | 'pypi' | 'crates' | 'rubygems' | 'go';

  /** Package identity */
  identity: PackageIdentity;

  /** Registry metadata (from API) */
  registryMetadata: RegistryMetadata;

  /** README content and quality signals */
  readme: PackageReadme;

  /** Dependency analysis */
  dependencies: DependencyAnalysis;

  /** Type definitions analysis */
  typeDefinitions: TypeDefinitionAnalysis;

  /** Tarball/wheel inspection (static, no execution) */
  artifactInspection: ArtifactInspection;

  /** Changelog/release notes analysis */
  changelog: ChangelogAnalysis;

  /** Security signals */
  securitySignals: PackageSecuritySignals;

  /** Linked repository analysis (if repo URL in package.json/setup.cfg) */
  linkedRepo?: LinkedRepoSummary;
}

interface PackageIdentity {
  name: string;
  version: string;                  // Latest or specified
  allVersions: string[];            // Recent 20 versions
  firstPublished: string;           // ISO 8601
  lastPublished: string;            // ISO 8601
  publishFrequency: number;         // Average days between releases (last 10)
  maintainers: PackageMaintainer[];
  license: string | null;
  repositoryUrl: string | null;
  homepageUrl: string | null;
  keywords: string[];
}

interface PackageMaintainer {
  name: string;
  /** Whether this maintainer has published other packages */
  otherPackageCount: number;
  /** Account age (if available from registry) */
  accountAgeDays?: number;
}

interface RegistryMetadata {
  weeklyDownloads: number;
  totalDownloads?: number;
  dependentCount: number;          // How many packages depend on this
  starCount?: number;
  /** npm: "latest" dist-tag version. PyPI: latest non-pre release */
  latestStableVersion: string;
  /** Whether there are pre-release versions published */
  hasPreReleases: boolean;
  /** Deprecation message if package is deprecated */
  deprecationMessage?: string;
  /** npm provenance attestation or PyPI Trusted Publisher */
  provenanceAttested: boolean;
  /** SLSA build level (if attestation present) */
  slsaLevel?: number;
}

interface PackageReadme {
  exists: boolean;
  /** Length in characters */
  length: number;
  /** Raw content (truncated to 50KB) */
  content: string;
  /** Structural signals */
  hasInstallInstructions: boolean;
  hasUsageExamples: boolean;
  hasApiDocumentation: boolean;
  hasBadges: boolean;
  hasContributing: boolean;
  hasLicense: boolean;
  hasChangelog: boolean;
  /** Code blocks count */
  codeBlockCount: number;
  /** Whether code examples look runnable (imports present, complete snippets) */
  codeExamplesRunnable: boolean;
  /** Languages used in code blocks */
  codeLanguages: string[];
}

interface DependencyAnalysis {
  /** Direct production dependencies */
  directCount: number;
  /** Transitive production dependencies (full tree) */
  transitiveCount: number;
  /** Dev dependencies */
  devDependencyCount: number;

  /** Dependencies with known CVEs */
  vulnerableDeps: VulnerableDependency[];

  /** Dependencies that are deprecated */
  deprecatedDeps: { name: string; message: string }[];

  /** Dependencies with no recent activity (> 2 years) */
  staleDeps: { name: string; lastPublished: string }[];

  /** Dependencies with very few downloads (< 100/week) — typosquatting signal */
  lowPopularityDeps: { name: string; weeklyDownloads: number }[];

  /** Dependency tree depth */
  maxTreeDepth: number;

  /** Duplicate dependencies at different versions */
  duplicateDeps: { name: string; versions: string[] }[];

  /** Install size of full dependency tree */
  totalInstallSizeBytes: number;

  /** Peer dependencies declared */
  peerDependencies: { name: string; range: string }[];
}

interface VulnerableDependency {
  name: string;
  version: string;
  cveIds: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  fixAvailable: boolean;
  fixVersion?: string;
  /** Whether this is a direct or transitive dependency */
  isDirect: boolean;
}

interface TypeDefinitionAnalysis {
  /** For npm: are types included or in @types/? For PyPI: py.typed? */
  hasTypes: boolean;
  typeSource: 'bundled' | 'definitely_typed' | 'stub_package' | 'none';
  /** Type coverage (if measurable) */
  typeCoverage?: number;
  /** Are all exported functions typed? */
  exportsFullyTyped: boolean;
  /** TypeScript target version (if applicable) */
  tsTarget?: string;
}

interface ArtifactInspection {
  /** Artifact type */
  format: 'tarball' | 'wheel' | 'sdist' | 'binary';
  /** Compressed size */
  compressedSizeBytes: number;
  /** Uncompressed size */
  uncompressedSizeBytes: number;
  /** File count in package */
  fileCount: number;
  /** File types present */
  fileTypes: Record<string, number>;  // e.g., { ".js": 45, ".d.ts": 45, ".json": 3 }
  /** Suspicious files (binaries, scripts, unusual extensions) */
  suspiciousFiles: { path: string; reason: string }[];
  /** Whether .npmignore/.gitignore properly excludes dev files */
  devFilesExcluded: boolean;
  /** Whether tests are included in the published package */
  testsIncluded: boolean;
  /** Whether source maps are included */
  sourceMapsIncluded: boolean;
  /** Minified? */
  isMinified: boolean;
  /** Install scripts present (preinstall, postinstall, etc.) */
  installScripts: { name: string; command: string }[];
}

interface ChangelogAnalysis {
  exists: boolean;
  format: 'keep-a-changelog' | 'conventional-commits' | 'github-releases' | 'unstructured' | 'none';
  /** Number of entries */
  entryCount: number;
  /** Most recent entry version */
  latestEntryVersion: string;
  /** Whether breaking changes are clearly marked */
  breakingChangesMarked: boolean;
  /** Content of most recent entry (truncated to 2KB) */
  latestEntryContent: string;
}

interface PackageSecuritySignals {
  /** Known CVEs for this specific package version */
  knownCves: { id: string; severity: string; description: string }[];
  /** npm provenance / PyPI Trusted Publisher */
  provenanceAttested: boolean;
  /** Whether 2FA is required for publishing (npm) */
  requires2FA?: boolean;
  /** Install scripts that run arbitrary code */
  hasInstallScripts: boolean;
  /** Whether the package name is similar to popular packages (typosquatting risk) */
  typosquattingRisk: {
    isRisk: boolean;
    similarTo?: string;
    editDistance?: number;
  };
  /** OSSF Scorecard score (if available) */
  ossfScore?: number;
  /** Socket.dev risk score (if available) */
  socketRiskScore?: number;
}

interface LinkedRepoSummary {
  /** URL from package.json repository field */
  url: string;
  /** Whether the repo exists and is accessible */
  accessible: boolean;
  /** Star count */
  stars: number;
  /** Open issue count */
  openIssues: number;
  /** Last commit date */
  lastCommitDate: string;
  /** Whether README in repo matches README in package */
  readmeMatchesPackage: boolean;
  /** Whether version tags exist and match published versions */
  versionTagsMatch: boolean;
}

interface PackageConfig {
  /** Package name */
  package: string;
  /** Registry */
  registry: 'npm' | 'pypi';
  /** Version to analyze (default: latest) */
  version?: string;
  /** Whether to do full dependency tree analysis (expensive for large trees) */
  fullDependencyTree: boolean;
  /** Whether to inspect tarball contents */
  inspectArtifact: boolean;
  /** Max dependencies to individually analyze */
  maxDependencyDepth: number;
}
```

### 3B. Summary Type: PackageSummary

```typescript
interface PackageSummary {
  surface: 'package';

  identity: {
    name: string;
    version: string;
    registry: string;
    license: string | null;
    firstPublished: string;
    lastPublished: string;
    weeklyDownloads: number;
    maintainerCount: number;
  };

  qualitySignals: {
    readmeExists: boolean;
    readmeHasInstall: boolean;
    readmeHasExamples: boolean;
    readmeLength: number;
    codeExamplesRunnable: boolean;
    hasTypes: boolean;
    typeSource: string;
    hasChangelog: boolean;
    breakingChangesMarked: boolean;
    devFilesExcluded: boolean;
  };

  healthSignals: {
    publishFrequencyDays: number;
    dependentCount: number;
    directDependencyCount: number;
    transitiveDependencyCount: number;
    totalInstallSizeBytes: number;
    vulnerableDependencyCount: number;
    deprecatedDependencyCount: number;
    staleDependencyCount: number;
  };

  securitySignals: {
    knownCveCount: number;
    hasInstallScripts: boolean;
    provenanceAttested: boolean;
    typosquattingRisk: boolean;
    suspiciousFileCount: number;
  };

  agentFriendliness: {
    hasTypes: boolean;
    readmeHasApiDocs: boolean;
    structuredChangelog: boolean;
    predictableVersioning: boolean;
    codeExamplesComplete: boolean;
  };

  tokenEstimate: number;
}
```

### 3C. Evidence Type: PackageEvidence

```typescript
interface PackageEvidence extends BaseEvidence {
  surface: 'package';

  /** Registry API URL queried */
  registryApiUrl: string;

  /** SHA-256 hash of package tarball/wheel */
  artifactHash: string;

  /** Registry API response hash (for metadata findings) */
  registryResponseHash: string;

  /** Specific file in package (for file-level findings) */
  packageFilePath?: string;

  /** Content snippet from file (first 2KB) */
  fileSnippet?: string;

  /** Dependency audit output (for vulnerability findings) */
  auditOutput?: string;

  /** CVE database version used (for reproducibility) */
  cveDbVersion?: string;
}
```

### 3D. Audit Dimensions

| Dimension | Code | What It Measures | LLM Required? | Deterministic Checks? |
|-----------|------|-----------------|---------------|----------------------|
| Documentation Quality | `documentation-quality` | README completeness, examples, API docs | Yes (quality judgment) | Partial: exists, length, structure |
| Install Experience | `install-experience` | Size, speed, dependency count, warnings | No | Yes: all metrics are numeric |
| Trustworthiness | `trustworthiness` | Provenance, maintainer reputation, CVEs, popularity | No | Yes: all signals are factual |
| Supply Chain | `supply-chain` | Dependency health, install scripts, typosquatting | No | Yes: automated scanning |
| Maintenance Health | `maintenance-health` | Publish frequency, deprecations, version freshness | No | Yes: dates and counts |
| Agent-Nativeness | `agent-nativeness` | Types, structured docs, predictable API, complete examples | Yes (judgment) | Partial: types exist, examples exist |
| Composability | `composability` | Bundle size, tree-shaking, peer deps, ESM/CJS | No | Yes: artifact inspection |
| Discoverability | `discoverability` | Keywords, description, search ranking signals | Yes (quality) | Partial: keywords exist, description length |

**Quick Check (free):** Install Experience + Trustworthiness + Maintenance Health. Deterministic only.

**Full Audit (paid):** All 8 dimensions.

### 3E. Scoring Rubric

| Check | Type | Severity | Evidence |
|-------|------|----------|----------|
| Known CRITICAL CVE in package itself | Deterministic | CRITICAL | CVE ID + description |
| Known CRITICAL CVE in direct dependency | Deterministic | HIGH | CVE ID + dependency |
| Install scripts make network calls | Deterministic | HIGH | Script content |
| No README | Deterministic | HIGH | Registry API response |
| README has no install instructions | LLM (Haiku) | MEDIUM | README content |
| README has no usage examples | LLM (Haiku) | MEDIUM | README content |
| Code examples are incomplete (missing imports, not runnable) | LLM (Sonnet) | MEDIUM | Code block content |
| No type definitions | Deterministic | MEDIUM | Package inspection |
| > 500 transitive dependencies | Deterministic | MEDIUM | Dependency tree |
| Install size > 50MB | Deterministic | MEDIUM | Artifact size |
| No changelog | Deterministic | MEDIUM | Package inspection |
| Breaking changes not marked in changelog | LLM (Haiku) | MEDIUM | Changelog content |
| Package deprecated | Deterministic | HIGH | Registry metadata |
| Last published > 2 years ago | Deterministic | MEDIUM | Registry metadata |
| Last published > 5 years ago | Deterministic | HIGH | Registry metadata |
| Typosquatting risk (edit distance <= 2 from popular package) | Deterministic | HIGH | Name analysis |
| No provenance attestation | Deterministic | LOW | Registry metadata |
| Dev files published (tests, configs, IDE files) | Deterministic | LOW | Artifact inspection |
| Source maps expose source code | Deterministic | MEDIUM | Artifact inspection |
| Single maintainer with no 2FA | Deterministic | MEDIUM | Registry metadata |
| No license | Deterministic | HIGH | Package metadata |
| License incompatible with common use | LLM (Haiku) | MEDIUM | License text |
| Version 0.x.x with > 10K weekly downloads (semver immaturity) | Deterministic | LOW | Registry metadata |

### 3F. Scenario Grammar Primitives

**Axis 1: Persona**

| Primitive | Description |
|-----------|-------------|
| `package-evaluator` | Developer deciding whether to add this dependency |
| `package-integrator` | Developer actively integrating this package into a project |
| `security-auditor` | Security team reviewing dependencies |
| `agent-package-consumer` | AI agent evaluating and using this package |
| `open-source-contributor` | Developer considering contributing to this package |
| `enterprise-compliance` | Compliance officer checking license and security |
| `ci-dependency-checker` | CI pipeline running dependency audit |

**Axis 2: Entry Point**

| Primitive | Description |
|-----------|-------------|
| `npm-search` | Found via `npm search` or npmjs.com |
| `pypi-search` | Found via PyPI search or pip search |
| `github-discovery` | Found the repo first, then the package |
| `blog-recommendation` | Linked from a tutorial or blog post |
| `agent-recommendation` | AI agent recommended this package |
| `dependency-of-dependency` | Discovered as a transitive dependency |
| `bundlephobia-comparison` | Found while comparing package sizes |

**Axis 3: Intent**

| Primitive | Description |
|-----------|-------------|
| `evaluate-quality` | Decide whether to use this package |
| `install-and-use` | Get it working in a project |
| `audit-security` | Check for vulnerabilities and risks |
| `compare-alternatives` | Evaluate against competing packages |
| `check-maintenance` | Assess whether the package is actively maintained |
| `understand-api` | Learn the API surface and usage patterns |
| `upgrade-version` | Migrate from an older version |

**Axis 4: Dimension Focus**

Same as CLI (balanced, security-focus, docs-focus, etc.) with addition of:

| Primitive | Description |
|-----------|-------------|
| `supply-chain-focus` | Emphasize dependency health and provenance |
| `size-focus` | Emphasize bundle size and tree-shaking |

**Axis 5: Adversarial Condition**

| Primitive | Description |
|-----------|-------------|
| `normal` | Standard conditions |
| `no-types` | TypeScript project needing types |
| `monorepo` | Installing in a monorepo context |
| `air-gapped` | No network after initial install |
| `version-conflict` | Peer dependency conflict with existing deps |
| `breaking-upgrade` | Major version bump with breaking changes |
| `registry-outage` | Registry intermittently available |

**Total configurations:** 7 x 7 x 7 x 9 x 7 = **21,609**

### 3G. Infrastructure Requirements

| Requirement | Detail |
|-------------|--------|
| **Execution environment** | No Docker needed for collection. HTTP client for registry APIs. tarball extraction in temp dir. |
| **Security** | No code execution. Static analysis only. Tarball extracted in sandboxed temp dir with size limits. |
| **APIs required** | npm registry API, PyPI JSON API, npm audit API, Snyk/OSV vulnerability DB |
| **Cost** | ~$0.01 compute (API calls only). LLM: $0.30-1.50 for full audit. Total COGS: $0.31-1.51. |
| **Time budget** | Quick Check: < 30 seconds. Full Audit: < 3 minutes. |
| **Rate limits** | npm API: 1000 req/hour. PyPI: ~100 req/min. Must respect. |

### 3H. Work Unit Estimates

| WU | Description | Agent | Hours | Dependencies |
|----|-------------|-------|-------|-------------|
| WU-PKG-00 | Package type definitions | Opus | 2 | TYPE-SPEC v2.0 |
| WU-PKG-01 | Registry API client (npm + PyPI, metadata + tarball) | Codex | 3 | WU-PKG-00 |
| WU-PKG-02 | Dependency analyzer (tree, vulns, deprecations, staleness) | Codex | 4 | WU-PKG-01 |
| WU-PKG-03 | Artifact inspector (tarball contents, file types, install scripts) | Codex | 3 | WU-PKG-01 |
| WU-PKG-04 | Package summarizer (PackageProbeResult -> PackageSummary) | Codex | 2 | WU-PKG-00 |
| WU-PKG-05 | Package audit primitives (8 dimensions) | Opus | 5 | WU-PKG-02, WU-PKG-03, WU-PKG-04 |
| WU-PKG-06 | Package scenario grammar | Opus | 2 | WU-PKG-05 |
| WU-PKG-07 | Pipeline integration + synthesis | Codex | 2 | WU-PKG-05 |
| **Total** | | | **23 hours** | |

---

## 4. GitHub Repositories

> Expert: Dr. Amara Okafor — GitHub Repository Quality Evaluator

### 4A. Collection Type: RepoProbeResult

```typescript
/**
 * Result of probing a GitHub repository.
 * Collection is GitHub-API-first: REST API + GraphQL for rich metadata.
 * No code execution. No cloning (too expensive). Selective file fetching.
 */
interface RepoProbeResult extends BaseCollectionResult {
  surface: 'repo';

  /** Repository identity */
  identity: RepoIdentity;

  /** Repository health signals (from GitHub API) */
  health: RepoHealthSignals;

  /** Community signals */
  community: RepoCommunitySignals;

  /** Documentation files (selectively fetched) */
  documentation: RepoDocumentation;

  /** CI/CD configuration */
  ci: RepoCISignals;

  /** Security posture */
  security: RepoSecuritySignals;

  /** Release management */
  releases: RepoReleaseSignals;

  /** Codebase signals (from API, not cloning) */
  codebaseSignals: RepoCodebaseSignals;

  /** Agent-consumption readiness */
  agentReadiness: RepoAgentReadiness;
}

interface RepoIdentity {
  owner: string;
  name: string;
  fullName: string;              // "owner/name"
  description: string | null;
  homepage: string | null;
  language: string | null;
  languages: Record<string, number>;  // bytes per language
  topics: string[];
  license: { spdxId: string; name: string } | null;
  createdAt: string;
  pushedAt: string;
  isArchived: boolean;
  isFork: boolean;
  isTemplate: boolean;
  defaultBranch: string;
  visibility: 'public' | 'private';
  size: number;                  // KB
  stargazerCount: number;
  forkCount: number;
  watcherCount: number;
}

interface RepoHealthSignals {
  /** Commits in last 90 days */
  recentCommitCount: number;
  /** Unique contributors in last 90 days */
  recentContributorCount: number;
  /** Total contributor count (all time) */
  totalContributorCount: number;
  /** Whether default branch is protected */
  branchProtection: boolean;
  /** Whether merge requires reviews */
  requiresReview: boolean;
  /** Whether merge requires status checks */
  requiresStatusChecks: boolean;
  /** Last commit date on default branch */
  lastCommitDate: string;
  /** Commit frequency (average per week, last 52 weeks from participation API) */
  weeklyCommitAverage: number;
  /** Bus factor estimate (contributors with > 10% of recent commits) */
  busFactor: number;
}

interface RepoCommunitySignals {
  /** README exists */
  hasReadme: boolean;
  /** CONTRIBUTING.md exists */
  hasContributing: boolean;
  /** CODE_OF_CONDUCT.md exists */
  hasCodeOfConduct: boolean;
  /** Issue templates exist */
  hasIssueTemplates: boolean;
  /** PR template exists */
  hasPrTemplate: boolean;
  /** FUNDING.yml exists */
  hasFunding: boolean;
  /** CODEOWNERS exists */
  hasCodeowners: boolean;
  /** Open issue count */
  openIssueCount: number;
  /** Closed issue count */
  closedIssueCount: number;
  /** Issue close rate (closed / total) */
  issueCloseRate: number;
  /** Median time to first response on issues (last 20) */
  medianFirstResponseDays: number | null;
  /** Median time to close issues (last 20) */
  medianCloseTimeDays: number | null;
  /** Open PR count */
  openPrCount: number;
  /** Merged PR count */
  mergedPrCount: number;
  /** PR merge rate */
  prMergeRate: number;
  /** Stale issues (no activity > 90 days) */
  staleIssueCount: number;
  /** Discussion forum enabled */
  hasDiscussions: boolean;
}

interface RepoDocumentation {
  /** README content (truncated to 50KB) */
  readme: { exists: boolean; content: string; length: number };
  /** CONTRIBUTING content */
  contributing: { exists: boolean; content: string };
  /** CHANGELOG content */
  changelog: { exists: boolean; content: string; format: string };
  /** LICENSE content */
  licenseFile: { exists: boolean; spdxId: string | null };
  /** SECURITY.md content */
  securityPolicy: { exists: boolean; content: string };
  /** docs/ directory exists */
  hasDocsDirectory: boolean;
  /** API documentation exists */
  hasApiDocs: boolean;
  /** Whether llms.txt exists at root */
  hasLlmsTxt: boolean;
  /** .github/ISSUE_TEMPLATE/ contents */
  issueTemplates: { name: string; hasBody: boolean }[];
  /** .github/pull_request_template.md */
  prTemplate: { exists: boolean; hasChecklist: boolean };
}

interface RepoCISignals {
  /** CI system detected */
  ciSystem: 'github_actions' | 'circleci' | 'travis' | 'jenkins' | 'gitlab_ci' | 'none' | 'multiple';
  /** Number of workflow files */
  workflowCount: number;
  /** Status of last CI run on default branch */
  lastCIStatus: 'success' | 'failure' | 'pending' | 'unknown';
  /** Whether CI runs on PRs */
  ciRunsOnPR: boolean;
  /** Whether CI includes tests */
  ciIncludesTests: boolean;
  /** Whether CI includes linting */
  ciIncludesLinting: boolean;
  /** Whether CI includes security scanning */
  ciIncludesSecurityScan: boolean;
  /** Whether CI includes type checking */
  ciIncludesTypeCheck: boolean;
  /** Status badges in README */
  hasStatusBadges: boolean;
}

interface RepoSecuritySignals {
  /** SECURITY.md exists */
  hasSecurityPolicy: boolean;
  /** security.txt exists (/.well-known/security.txt or /security.txt) */
  hasSecurityTxt: boolean;
  /** Dependabot enabled */
  hasDependabot: boolean;
  /** Code scanning enabled (CodeQL, etc.) */
  hasCodeScanning: boolean;
  /** Secret scanning enabled */
  hasSecretScanning: boolean;
  /** Signed commits on default branch */
  hasSignedCommits: boolean;
  /** OSSF Scorecard score (if available) */
  ossfScorecardScore: number | null;
  /** Dependency graph enabled */
  hasDependencyGraph: boolean;
  /** GitHub Advisory Database entries for this repo */
  advisoryCount: number;
  /** Whether .env or credentials appear in repo (spot check) */
  exposedSecretsDetected: boolean;
}

interface RepoReleaseSignals {
  /** Total release count */
  releaseCount: number;
  /** Latest release tag */
  latestRelease: {
    tag: string;
    name: string;
    publishedAt: string;
    isPreRelease: boolean;
    hasReleaseNotes: boolean;
    releaseNotesLength: number;
    hasAssets: boolean;
  } | null;
  /** Release cadence (average days between releases, last 10) */
  releaseCadenceDays: number | null;
  /** Whether releases follow semver */
  usesSemver: boolean;
  /** Whether releases have changelogs/release notes */
  releasesHaveNotes: boolean;
  /** Whether tags match package versions (if linked to a registry) */
  tagsMatchPackageVersions: boolean;
}

interface RepoCodebaseSignals {
  /** Primary language */
  primaryLanguage: string | null;
  /** Language distribution (top 5) */
  languageDistribution: { language: string; percentage: number }[];
  /** Whether .gitignore exists and is appropriate */
  hasGitignore: boolean;
  /** Whether .editorconfig exists */
  hasEditorConfig: boolean;
  /** Whether linter config exists */
  hasLinterConfig: boolean;
  /** Whether formatter config exists */
  hasFormatterConfig: boolean;
  /** Whether lock file exists (package-lock.json, yarn.lock, etc.) */
  hasLockFile: boolean;
  /** File count estimate (from tree API, first level) */
  rootFileCount: number;
  rootDirectoryCount: number;
  /** Key files present */
  keyFiles: {
    packageJson: boolean;
    setupPy: boolean;
    setupCfg: boolean;
    pyprojectToml: boolean;
    cargoToml: boolean;
    goMod: boolean;
    makefile: boolean;
    dockerfile: boolean;
    dockerCompose: boolean;
  };
}

interface RepoAgentReadiness {
  /** llms.txt or similar agent guidance */
  hasAgentGuidance: boolean;
  /** Structured API documentation (OpenAPI, GraphQL schema) */
  hasStructuredApiDocs: boolean;
  /** Machine-readable issue labels */
  hasStructuredLabels: boolean;
  /** GitHub Actions with well-defined inputs/outputs */
  hasReusableActions: boolean;
  /** MCP server configuration */
  hasMcpConfig: boolean;
  /** Whether README has structured sections parseable by agents */
  readmeStructuredForAgents: boolean;
}

interface RepoConfig {
  /** Repository full name (owner/repo) */
  repo: string;
  /** Branch to analyze (default: default branch) */
  branch?: string;
  /** How many recent issues/PRs to analyze */
  recentActivityWindow: number;
  /** Whether to fetch file contents (README, CONTRIBUTING, etc.) */
  fetchFileContents: boolean;
  /** Max API calls per probe */
  maxApiCalls: number;
}
```

### 4B. Summary Type: RepoSummary

```typescript
interface RepoSummary {
  surface: 'repo';

  identity: {
    fullName: string;
    description: string | null;
    primaryLanguage: string | null;
    license: string | null;
    stars: number;
    forks: number;
    createdAt: string;
    isArchived: boolean;
  };

  healthSignals: {
    recentCommitCount: number;
    recentContributorCount: number;
    busFactor: number;
    weeklyCommitAverage: number;
    lastCommitDate: string;
    branchProtection: boolean;
  };

  communitySignals: {
    issueCloseRate: number;
    medianFirstResponseDays: number | null;
    staleIssueCount: number;
    openIssueCount: number;
    hasIssueTemplates: boolean;
    hasPrTemplate: boolean;
    hasContributing: boolean;
    hasCodeOfConduct: boolean;
  };

  documentationSignals: {
    hasReadme: boolean;
    hasChangelog: boolean;
    hasSecurityPolicy: boolean;
    hasDocsDirectory: boolean;
    hasApiDocs: boolean;
    hasLlmsTxt: boolean;
  };

  securitySignals: {
    hasDependabot: boolean;
    hasCodeScanning: boolean;
    hasSecretScanning: boolean;
    ossfScorecardScore: number | null;
    advisoryCount: number;
    exposedSecretsDetected: boolean;
  };

  releaseSignals: {
    releaseCount: number;
    latestReleaseDate: string | null;
    releaseCadenceDays: number | null;
    usesSemver: boolean;
    releasesHaveNotes: boolean;
  };

  ciSignals: {
    ciSystem: string;
    lastCIStatus: string;
    ciIncludesTests: boolean;
    ciIncludesLinting: boolean;
    ciIncludesSecurityScan: boolean;
  };

  agentReadiness: {
    hasAgentGuidance: boolean;
    hasStructuredApiDocs: boolean;
    readmeStructuredForAgents: boolean;
  };

  tokenEstimate: number;
}
```

### 4C. Evidence Type: RepoEvidence

```typescript
interface RepoEvidence extends BaseEvidence {
  surface: 'repo';

  /** GitHub API URL that produced this evidence */
  apiUrl: string;

  /** Git commit SHA at the time of observation */
  commitSha: string;

  /** Specific file path (for file-level findings) */
  filePath?: string;

  /** File content hash (SHA-256, for content findings) */
  fileContentHash?: string;

  /** API response hash (for metadata findings) */
  apiResponseHash: string;

  /** Issue or PR number (for community findings) */
  issueOrPrNumber?: number;

  /** Snippet from file or API response (first 2KB) */
  snippet?: string;
}
```

### 4D. Audit Dimensions

| Dimension | Code | What It Measures | LLM Required? | Deterministic Checks? |
|-----------|------|-----------------|---------------|----------------------|
| Documentation Quality | `documentation-quality` | README, CONTRIBUTING, CHANGELOG, API docs completeness | Yes (quality judgment) | Partial: file existence, length |
| Maintenance Health | `maintenance-health` | Commit frequency, release cadence, contributor activity | No | Yes: all from API |
| Trustworthiness | `trustworthiness` | Stars, forks, contributor count, issue responsiveness | No | Yes: all from API |
| Security Surface | `security` | Security policy, scanning, dependabot, secrets detection | No | Yes: all from API |
| Contributor Experience | `contributor-experience` | Issue templates, PR template, contributing guide, labels, CI | No (mostly) | Yes: file existence + CI config |
| Agent-Nativeness | `agent-nativeness` | llms.txt, structured docs, machine-readable labels, MCP config | Yes (judgment) | Partial: file existence |
| Onboarding | `onboarding` | Can a new developer understand and contribute quickly? | Yes (judgment) | Partial: key file presence |
| Composability | `composability` | Is this repo designed to be a dependency? Types, exports, modularity | Yes (judgment) | Partial: type defs, exports |

**Quick Check (free):** Maintenance Health + Trustworthiness + Security. Deterministic only.

**Full Audit (paid):** All 8 dimensions.

### 4E. Scoring Rubric

| Check | Type | Severity | Evidence |
|-------|------|----------|----------|
| Repository archived | Deterministic | CRITICAL | API response |
| No commits in > 1 year | Deterministic | HIGH | Commit history |
| No README | Deterministic | HIGH | API file check |
| No license | Deterministic | HIGH | API response |
| Exposed secrets in repository | Deterministic | CRITICAL | File content scan |
| No CI/CD configured | Deterministic | MEDIUM | Workflow check |
| CI failing on default branch | Deterministic | HIGH | Status check |
| No issue templates | Deterministic | LOW | Directory check |
| No PR template | Deterministic | LOW | File check |
| No CONTRIBUTING.md | Deterministic | MEDIUM | File check |
| No SECURITY.md | Deterministic | MEDIUM | File check |
| No dependabot/renovate | Deterministic | MEDIUM | Config check |
| No code scanning | Deterministic | LOW | Settings check |
| Bus factor = 1 | Deterministic | MEDIUM | Contributor analysis |
| > 50% of issues stale (> 90 days no response) | Deterministic | MEDIUM | Issue analysis |
| Median first response > 14 days | Deterministic | MEDIUM | Issue analysis |
| No releases in > 1 year | Deterministic | MEDIUM | Release check |
| Releases lack release notes | Deterministic | LOW | Release check |
| No changelog | Deterministic | MEDIUM | File check |
| README does not explain what the project does | LLM (Sonnet) | HIGH | README content |
| README examples are incomplete or broken | LLM (Sonnet) | MEDIUM | README content |
| No llms.txt or agent guidance | Deterministic | LOW | File check |
| Branch protection disabled | Deterministic | MEDIUM | API response |
| No lock file (for package projects) | Deterministic | LOW | File check |
| OSSF Scorecard < 4.0 | Deterministic | MEDIUM | Scorecard API |
| GitHub security advisories unpatched | Deterministic | HIGH | Advisory API |

### 4F. Scenario Grammar Primitives

**Axis 1: Persona**

| Primitive | Description |
|-----------|-------------|
| `repo-evaluator` | Developer deciding whether to use/depend on this project |
| `new-contributor` | Developer wanting to make their first contribution |
| `bug-reporter` | User experiencing a problem, filing an issue |
| `security-researcher` | Looking for vulnerabilities or security posture |
| `agent-repo-consumer` | AI agent evaluating this repo for integration |
| `enterprise-evaluator` | Assessing license, maintenance, and compliance risk |
| `dependency-auditor` | Checking this repo as a transitive dependency |

**Axis 2: Entry Point**

| Primitive | Description |
|-----------|-------------|
| `github-search` | Found via GitHub search or Explore |
| `package-link` | Followed repository link from npm/PyPI package |
| `blog-link` | Linked from a blog post or tutorial |
| `awesome-list` | Found on an awesome-* list |
| `agent-discovery` | AI agent discovered this repo |
| `dependency-tree` | Discovered as a dependency of another project |
| `issue-reference` | Followed a link from another project's issue |

**Axis 3: Intent**

| Primitive | Description |
|-----------|-------------|
| `evaluate-project` | Decide if this project is trustworthy and well-maintained |
| `understand-codebase` | Understand what it does and how it works |
| `file-issue` | Report a bug or request a feature |
| `contribute-code` | Submit a PR |
| `audit-security` | Assess security posture |
| `check-license` | Verify license compatibility |
| `fork-and-modify` | Fork for custom use |

**Axis 4: Dimension Focus**

| Primitive | Description |
|-----------|-------------|
| `health-focus` | Maintenance and activity signals |
| `community-focus` | Issue response, contributor friendliness |
| `security-focus` | Security policy and scanning |
| `docs-focus` | Documentation quality |
| `agent-focus` | Machine-readability |
| `onboarding-focus` | New contributor experience |
| `balanced` | Equal weight |

**Axis 5: Adversarial Condition**

| Primitive | Description |
|-----------|-------------|
| `normal` | Standard conditions |
| `single-maintainer` | Only one active contributor |
| `stale-project` | No recent activity |
| `no-releases` | Code changes but no tagged releases |
| `failing-ci` | CI is broken on default branch |
| `license-change` | License recently changed |
| `ownership-transfer` | Repo recently transferred to new owner |

**Total configurations:** 7 x 7 x 7 x 7 x 7 = **16,807**

### 4G. Infrastructure Requirements

| Requirement | Detail |
|-------------|--------|
| **Execution environment** | HTTP client only. GitHub REST + GraphQL API. No code execution. No cloning. |
| **Authentication** | GitHub App or Personal Access Token. Rate limits: 5000 req/hour (authenticated). |
| **Security** | No code execution. File contents fetched selectively (README, configs only). Never fetch large binary files. |
| **Cost** | ~$0.01 compute. LLM: $0.30-1.00 for full audit. Total COGS: $0.31-1.01. |
| **Time budget** | Quick Check: < 20 seconds. Full Audit: < 2 minutes. |
| **Rate limits** | Must implement request budgeting. GraphQL: 5000 points/hour. REST: 5000 req/hour. |

### 4H. Work Unit Estimates

| WU | Description | Agent | Hours | Dependencies |
|----|-------------|-------|-------|-------------|
| WU-REPO-00 | Repo type definitions | Opus | 2 | TYPE-SPEC v2.0 |
| WU-REPO-01 | GitHub API client (REST + GraphQL, paginated, rate-limited) | Codex | 4 | WU-REPO-00 |
| WU-REPO-02 | Health/community signal collector | Codex | 3 | WU-REPO-01 |
| WU-REPO-03 | Documentation/security/release signal collector | Codex | 3 | WU-REPO-01 |
| WU-REPO-04 | Repo summarizer (RepoProbeResult -> RepoSummary) | Codex | 2 | WU-REPO-00 |
| WU-REPO-05 | Repo audit primitives (8 dimensions) | Opus | 5 | WU-REPO-02, WU-REPO-03, WU-REPO-04 |
| WU-REPO-06 | Repo scenario grammar | Opus | 2 | WU-REPO-05 |
| WU-REPO-07 | Pipeline integration + synthesis | Codex | 2 | WU-REPO-05 |
| **Total** | | | **23 hours** | |

---

## 5. Documentation Sites

> Expert: Professor Li Zhang — Documentation Quality Engineer

### 5A. Collection Type: DocsCollectionResult

```typescript
/**
 * Result of probing documentation quality.
 * This LAYERS ON TOP of the web crawl — docs ARE web pages.
 * The web crawl handles rendering. This type handles doc-specific signals.
 * Requires: the web CrawlResult for the same URL as a prerequisite.
 */
interface DocsCollectionResult extends BaseCollectionResult {
  surface: 'docs';

  /** The web crawl this layers on */
  webCrawlId: string;

  /** Documentation structure analysis */
  structure: DocsStructure;

  /** Content quality signals */
  contentQuality: DocsContentQuality;

  /** Code examples analysis */
  codeExamples: DocsCodeExamples;

  /** Search and navigation analysis */
  searchAndNav: DocsSearchNav;

  /** Freshness signals */
  freshness: DocsFreshness;

  /** Agent-consumption readiness */
  agentReadiness: DocsAgentReadiness;

  /** Error documentation analysis */
  errorDocs: DocsErrorCoverage;
}

interface DocsStructure {
  /** Total documentation pages crawled */
  pageCount: number;

  /** Documentation framework detected */
  framework: 'docusaurus' | 'gitbook' | 'mkdocs' | 'sphinx' | 'vitepress'
           | 'nextra' | 'readme.io' | 'custom' | 'unknown';

  /** Top-level navigation structure */
  topLevelSections: DocsSection[];

  /** Maximum navigation depth */
  maxDepth: number;

  /** Whether there is a clear hierarchy (Getting Started -> Guides -> API Reference) */
  hasProgressiveStructure: boolean;

  /** Orphan pages (not linked from navigation) */
  orphanPages: string[];

  /** Broken internal links */
  brokenInternalLinks: { from: string; to: string; text: string }[];

  /** Whether there is a single entry point (index/landing page) */
  hasClearEntryPoint: boolean;

  /** Sidebar/navigation consistency across pages */
  navigationConsistent: boolean;

  /** Whether breadcrumbs exist */
  hasBreadcrumbs: boolean;

  /** Whether versioning exists */
  hasVersioning: boolean;
  availableVersions: string[];
}

interface DocsSection {
  title: string;
  path: string;
  childCount: number;
  depth: number;
  /** Section type inferred from title/content */
  sectionType: 'getting-started' | 'tutorial' | 'guide' | 'api-reference'
             | 'examples' | 'faq' | 'troubleshooting' | 'changelog'
             | 'contributing' | 'other';
}

interface DocsContentQuality {
  /** Average word count per page */
  averageWordCount: number;

  /** Pages with very thin content (< 100 words) */
  thinPages: { url: string; wordCount: number }[];

  /** Pages with placeholder content ("TODO", "Coming soon", "TBD") */
  placeholderPages: { url: string; placeholderText: string }[];

  /** Whether a "Getting Started" or "Quick Start" section exists */
  hasGettingStarted: boolean;

  /** Whether installation instructions are present */
  hasInstallInstructions: boolean;

  /** Whether there are tutorials (multi-step guides) */
  hasTutorials: boolean;

  /** Whether there is API reference documentation */
  hasApiReference: boolean;

  /** Whether there is a FAQ or troubleshooting section */
  hasFaq: boolean;

  /** Whether there is a migration/upgrade guide */
  hasMigrationGuide: boolean;

  /** Readability metrics (average across pages) */
  readability: {
    fleschKincaid: number;      // Grade level
    averageSentenceLength: number;
    jargonDensity: number;      // Technical terms per 100 words
  };

  /** Whether content uses progressive disclosure (simple first, advanced later) */
  usesProgressiveDisclosure: boolean;
}

interface DocsCodeExamples {
  /** Total code blocks across all pages */
  totalCodeBlocks: number;

  /** Code blocks per page (average) */
  averageCodeBlocksPerPage: number;

  /** Pages with zero code blocks */
  pagesWithNoCode: { url: string; sectionType: string }[];

  /** Languages used in code blocks */
  languages: Record<string, number>;

  /** Whether code blocks have language annotations */
  codeBlocksAnnotated: number;
  codeBlocksUnannotated: number;

  /** Whether code examples are runnable (have imports, are complete) */
  runnableExamples: {
    total: number;
    runnable: number;
    snippetOnly: number;         // Partial, not standalone
    broken: number;              // Syntax errors, missing imports
  };

  /** Whether there is a "copy" button on code blocks */
  hasCopyButton: boolean;

  /** Whether examples show expected output */
  examplesShowOutput: number;

  /** Whether examples handle errors */
  examplesHandleErrors: number;
}

interface DocsSearchNav {
  /** Whether site-wide search exists */
  hasSearch: boolean;

  /** Search implementation */
  searchType: 'algolia' | 'lunr' | 'pagefind' | 'built-in' | 'none' | 'unknown';

  /** Whether search returns relevant results (tested with 3 common queries) */
  searchQuality: 'good' | 'poor' | 'untestable' | 'no_search';

  /** Whether there is a table of contents on long pages */
  hasTableOfContents: boolean;

  /** Whether pages have prev/next navigation */
  hasPrevNextNav: boolean;

  /** Whether there are cross-references between related pages */
  hasCrossReferences: boolean;

  /** 404 behavior for docs pages */
  custom404: boolean;
}

interface DocsFreshness {
  /** Whether pages show last-updated dates */
  showsLastUpdated: boolean;

  /** Pages that reference deprecated APIs or features */
  staleReferences: { url: string; reference: string; reason: string }[];

  /** Whether version numbers in examples match current version */
  versionNumbersCurrent: boolean;

  /** Whether external links are alive */
  deadExternalLinks: { url: string; link: string; statusCode: number }[];

  /** Last significant content update (if detectable) */
  lastContentUpdate: string | null;
}

interface DocsAgentReadiness {
  /** Whether llms.txt exists */
  hasLlmsTxt: boolean;

  /** llms.txt content (if exists) */
  llmsTxtContent: string | null;

  /** Whether content is well-structured for extraction (semantic HTML, clear headings) */
  semanticHtmlQuality: 'good' | 'adequate' | 'poor';

  /** Whether API reference has structured/parseable format */
  apiDocsStructured: boolean;

  /** Whether code examples are extractable (properly fenced, language-tagged) */
  codeExamplesExtractable: boolean;

  /** Whether pages have clear topic sentences (first paragraph summarizes page) */
  hasTopicSentences: boolean;

  /** RSS/Atom feed for doc updates */
  hasUpdateFeed: boolean;

  /** Whether OpenAPI/AsyncAPI spec is linked from docs */
  hasApiSpec: boolean;
}

interface DocsErrorCoverage {
  /** Whether error codes/messages are documented */
  hasErrorDocs: boolean;

  /** Number of documented error codes */
  documentedErrorCount: number;

  /** Whether errors include troubleshooting steps */
  errorsHaveTroubleshooting: boolean;

  /** Whether there is a "Common Errors" or troubleshooting page */
  hasTroubleshootingPage: boolean;

  /** Whether error documentation includes examples of the error */
  errorsHaveExamples: boolean;
}

interface DocsConfig {
  /** URL of documentation site */
  url: string;

  /** Max pages to analyze */
  pageLimit: number;

  /** Whether to test search functionality */
  testSearch: boolean;

  /** Whether to check external links */
  checkExternalLinks: boolean;

  /** Search queries to test (if testSearch is true) */
  testSearchQueries: string[];

  /** Whether to deeply analyze code examples */
  analyzeCodeExamples: boolean;
}
```

### 5B. Summary Type: DocsSummary

```typescript
interface DocsSummary {
  surface: 'docs';

  identity: {
    url: string;
    framework: string;
    pageCount: number;
    hasVersioning: boolean;
  };

  structureSignals: {
    maxDepth: number;
    hasProgressiveStructure: boolean;
    orphanPageCount: number;
    brokenInternalLinkCount: number;
    hasClearEntryPoint: boolean;
    hasBreadcrumbs: boolean;
  };

  contentSignals: {
    hasGettingStarted: boolean;
    hasInstallInstructions: boolean;
    hasTutorials: boolean;
    hasApiReference: boolean;
    hasFaq: boolean;
    thinPageCount: number;
    placeholderPageCount: number;
    averageWordCount: number;
    usesProgressiveDisclosure: boolean;
  };

  codeExampleSignals: {
    totalCodeBlocks: number;
    runnableRate: number;
    annotatedRate: number;
    hasCopyButton: boolean;
    showsExpectedOutput: boolean;
  };

  navigationSignals: {
    hasSearch: boolean;
    searchQuality: string;
    hasTableOfContents: boolean;
    hasPrevNextNav: boolean;
    hasCrossReferences: boolean;
  };

  freshnessSignals: {
    showsLastUpdated: boolean;
    staleReferenceCount: number;
    deadExternalLinkCount: number;
    versionNumbersCurrent: boolean;
  };

  agentReadiness: {
    hasLlmsTxt: boolean;
    semanticHtmlQuality: string;
    apiDocsStructured: boolean;
    codeExamplesExtractable: boolean;
  };

  tokenEstimate: number;
}
```

### 5C. Evidence Type: DocsEvidence

```typescript
interface DocsEvidence extends BaseEvidence {
  surface: 'docs';

  /** URL of the specific docs page */
  pageUrl: string;

  /** SHA-256 hash of page content at time of observation */
  contentHash: string;

  /** Screenshot path (reuses web crawl screenshots) */
  screenshotPath?: string;

  /** Specific section heading where finding was observed */
  sectionHeading?: string;

  /** Content snippet (first 2KB of relevant section) */
  contentSnippet?: string;

  /** Code block that was analyzed (for code example findings) */
  codeBlock?: string;

  /** Search query tested (for search quality findings) */
  searchQuery?: string;

  /** Search results returned (for search quality findings) */
  searchResults?: string[];
}
```

### 5D. Audit Dimensions

| Dimension | Code | What It Measures | LLM Required? | Deterministic Checks? |
|-----------|------|-----------------|---------------|----------------------|
| Documentation Quality | `documentation-quality` | Overall completeness: getting started, tutorials, API ref, FAQ | Yes (gap assessment) | Partial: section existence |
| Onboarding | `onboarding` | Can a first-time user get to "hello world" quickly? | Yes (journey assessment) | Partial: getting started exists, install exists |
| Discoverability | `discoverability` | Can users find what they need? Search, nav, cross-refs | No (mostly) | Yes: search exists, TOC exists, breadcrumbs |
| Error Handling | `error-handling` | Are errors documented with troubleshooting steps? | Yes (quality judgment) | Partial: error docs exist |
| Agent-Nativeness | `agent-nativeness` | llms.txt, semantic HTML, extractable code, structured API docs | Yes (judgment) | Partial: file existence, HTML analysis |
| Maintenance Health | `maintenance-health` | Content freshness, stale references, dead links, current versions | No | Yes: dates, link checks, version checks |
| Composability | `composability` | Code examples: runnable, complete, show output, handle errors | Yes (code quality) | Partial: annotation rate, import detection |
| Performance | `performance` | Page load, search speed (reuse web performance dimension) | No | Yes: reuse web metrics |

**Quick Check (free):** Discoverability + Maintenance Health + Performance. Deterministic only.

**Full Audit (paid):** All 8 dimensions.

### 5E. Scoring Rubric

| Check | Type | Severity | Evidence |
|-------|------|----------|----------|
| No Getting Started / Quick Start section | Deterministic + LLM | HIGH | Structure analysis |
| No install instructions | Deterministic + LLM | HIGH | Content analysis |
| Placeholder content ("TODO", "Coming Soon") | Deterministic | MEDIUM | Content scan |
| > 20% thin pages (< 100 words) | Deterministic | MEDIUM | Word count |
| No API reference (for projects with an API) | LLM (Sonnet) | HIGH | Structure analysis |
| No code examples on reference pages | Deterministic | MEDIUM | Code block count |
| Code examples missing language annotations | Deterministic | LOW | Annotation rate |
| Code examples not runnable (missing imports, incomplete) | LLM (Sonnet) | MEDIUM | Code block analysis |
| No search functionality | Deterministic | MEDIUM | DOM analysis |
| Search returns poor results | Deterministic (test queries) | MEDIUM | Search test results |
| No table of contents on long pages | Deterministic | LOW | Page analysis |
| Broken internal links | Deterministic | MEDIUM | Link crawl |
| Dead external links | Deterministic | LOW | Link check |
| Orphan pages (not in navigation) | Deterministic | MEDIUM | Structure analysis |
| No breadcrumbs | Deterministic | LOW | DOM analysis |
| No prev/next navigation | Deterministic | LOW | DOM analysis |
| Stale version references | Deterministic + LLM | MEDIUM | Version check |
| No last-updated dates | Deterministic | LOW | Page analysis |
| No llms.txt | Deterministic | LOW | File check |
| No error documentation | LLM (Haiku) | MEDIUM | Structure analysis |
| Error docs lack troubleshooting steps | LLM (Sonnet) | MEDIUM | Content analysis |
| No FAQ or troubleshooting section | Deterministic | LOW | Structure analysis |
| No migration/upgrade guide (for versioned projects) | LLM (Haiku) | MEDIUM | Structure analysis |
| Documentation not structured for agent extraction | LLM (Sonnet) | LOW | HTML/content analysis |
| No versioned documentation (for versioned projects) | Deterministic | MEDIUM | Version detection |

### 5F. Scenario Grammar Primitives

**Axis 1: Persona**

| Primitive | Description |
|-----------|-------------|
| `docs-first-timer` | Developer reading docs for the first time |
| `docs-reference-user` | Experienced user looking up a specific API method |
| `docs-troubleshooter` | User experiencing an error, searching for help |
| `docs-evaluator` | Deciding whether to use this product based on docs quality |
| `agent-docs-consumer` | AI agent reading docs to learn how to use a tool |
| `docs-contributor` | Someone wanting to improve the documentation |
| `non-english-reader` | Non-native English speaker reading technical docs |

**Axis 2: Entry Point**

| Primitive | Description |
|-----------|-------------|
| `docs-homepage` | Landing on docs index/home |
| `search-engine-result` | Arrived from Google search for a specific topic |
| `in-docs-search` | Using the docs site's own search |
| `api-reference-direct` | Deep link to a specific API method |
| `error-message-search` | Searching for an error message they encountered |
| `readme-link` | Followed "Documentation" link from README |
| `agent-llms-txt` | Agent reading llms.txt first |

**Axis 3: Intent**

| Primitive | Description |
|-----------|-------------|
| `get-started` | First-time setup, hello world |
| `find-api-method` | Look up specific method/function signature |
| `troubleshoot-error` | Find solution to an error |
| `understand-concept` | Understand a conceptual topic |
| `find-example` | Find a code example for a specific use case |
| `migrate-version` | Upgrade from one version to another |
| `evaluate-capabilities` | Determine if the product can do what they need |

**Axis 4: Dimension Focus**

| Primitive | Description |
|-----------|-------------|
| `completeness-focus` | Does the documentation cover everything? |
| `accuracy-focus` | Is the documentation correct and current? |
| `findability-focus` | Can users find what they need? |
| `example-focus` | Are code examples sufficient and correct? |
| `agent-focus` | Can agents consume this documentation? |
| `freshness-focus` | Is the documentation up to date? |
| `balanced` | Equal weight |

**Axis 5: Adversarial Condition**

| Primitive | Description |
|-----------|-------------|
| `normal` | Standard conditions |
| `no-search` | Search is broken or absent |
| `js-disabled` | JavaScript disabled (affects many doc frameworks) |
| `mobile-device` | Reading docs on a phone |
| `stale-docs` | Documentation clearly behind current version |
| `incomplete-migration` | Docs partially migrated between frameworks |
| `no-examples` | Code examples stripped or missing |

**Total configurations:** 7 x 7 x 7 x 7 x 7 = **16,807**

### 5G. Infrastructure Requirements

| Requirement | Detail |
|-------------|--------|
| **Execution environment** | Reuses web crawl infrastructure (Playwright). Adds doc-specific extractors. |
| **Security** | Same as web (URLValidator, SSRF defense). No additional risk. |
| **Cost** | Marginal cost on top of web crawl. Doc extractors are deterministic. LLM: $0.50-2.00 for full audit. Total marginal COGS: $0.50-2.00 (plus web crawl base). |
| **Time budget** | Quick Check: adds < 10 seconds to web crawl. Full Audit: adds < 2 minutes. |
| **Special requirements** | Search testing requires JavaScript execution (already available via Playwright). External link checking adds latency (parallel HTTP HEAD requests). |

### 5H. Work Unit Estimates

| WU | Description | Agent | Hours | Dependencies |
|----|-------------|-------|-------|-------------|
| WU-DOCS-00 | Docs type definitions | Opus | 2 | TYPE-SPEC v2.0 |
| WU-DOCS-01 | Doc structure analyzer (navigation, sections, hierarchy) | Codex | 3 | WU-DOCS-00, web crawl WUs |
| WU-DOCS-02 | Code example analyzer (extraction, annotation, runnability) | Opus | 3 | WU-DOCS-01 |
| WU-DOCS-03 | Freshness analyzer (dates, versions, link checking) | Codex | 2 | WU-DOCS-01 |
| WU-DOCS-04 | Docs summarizer (DocsCollectionResult -> DocsSummary) | Codex | 2 | WU-DOCS-00 |
| WU-DOCS-05 | Docs audit primitives (8 dimensions) | Opus | 5 | WU-DOCS-01-04 |
| WU-DOCS-06 | Docs scenario grammar | Opus | 2 | WU-DOCS-05 |
| WU-DOCS-07 | Pipeline integration (layers on web crawl) | Codex | 2 | WU-DOCS-05 |
| **Total** | | | **21 hours** | |

---

## 6. Cross-Surface Health Dimensions

> Expert: Tomoko Hasegawa — Open Source Project Health Expert

These dimensions apply across ALL four non-web surfaces (and partially to web). They are not duplicated per surface but scored from surface-specific evidence.

### 6.1 Maintenance Velocity

| Signal | CLI Evidence | Package Evidence | Repo Evidence | Docs Evidence |
|--------|-------------|-----------------|---------------|---------------|
| Release cadence | Version age from registry | Publish frequency from API | Release API | Content last-updated dates |
| Active development | N/A (use linked repo) | N/A (use linked repo) | Commit frequency | Content change frequency |
| Deprecation communication | Deprecation warnings in CLI output | Registry deprecation message | Archived flag, README notice | Deprecation notices in docs |
| Breaking change frequency | Version jump analysis | Changelog analysis | Release notes | Migration guide presence |

### 6.2 Bus Factor

| Signal | How Measured | Scoring |
|--------|-------------|---------|
| Unique contributors (90 days) | GitHub API | 1 = MEDIUM risk, 2-3 = LOW risk, 4+ = minimal |
| Commit concentration | Top contributor % of commits | > 90% = HIGH, > 70% = MEDIUM |
| Maintainer diversity | Package maintainer count | 1 = MEDIUM, 2+ = good |
| Organization backing | GitHub org vs personal account | Org = positive signal |

### 6.3 Response Time

| Metric | Source | Threshold |
|--------|--------|-----------|
| Median first response (issues) | GitHub API | < 7 days = good, < 30 = adequate, > 30 = poor |
| Median close time (issues) | GitHub API | < 30 days = good, < 90 = adequate, > 90 = poor |
| Stale issue rate | GitHub API | < 20% = good, < 50% = adequate, > 50% = poor |

### 6.4 Cross-Surface Scoring

These health dimensions contribute to the `maintenance-health` and `trustworthiness` dimensions in each surface's methodology. The weight varies:

| Surface | Maintenance Health Weight | Trustworthiness Weight |
|---------|--------------------------|----------------------|
| CLI | 0.10 | 0.10 |
| Package | 0.15 | 0.20 |
| Repo | 0.25 | 0.20 |
| Docs | 0.10 | 0.05 |

---

## 7. Supply Chain Security Dimensions

> Expert: Dr. Martin Schwarz — Supply Chain Security Researcher

These dimensions go BEYOND web security headers. They address the hostile realities of package ecosystems and CLI tool distribution.

### 7.1 Install-Time Risks

| Risk | Surface | Detection Method | Severity |
|------|---------|-----------------|----------|
| postinstall script makes network calls | CLI, Package | strace/eBPF monitoring in sandbox | HIGH |
| postinstall script writes to filesystem outside package | CLI, Package | strace/eBPF | HIGH |
| postinstall script reads environment variables | CLI, Package | strace/eBPF | MEDIUM |
| postinstall script spawns child processes | CLI, Package | strace/eBPF | MEDIUM |
| Binary downloaded during install (not from registry) | CLI, Package | Network monitoring | HIGH |

### 7.2 Dependency Risks

| Risk | Detection | Severity |
|------|-----------|----------|
| Known CVE in direct dependency | npm audit / pip-audit / OSV | Matches CVE severity |
| Known CVE in transitive dependency | Full tree audit | One level lower than CVE |
| Dependency confusion candidate (private name matches public) | Name registry check | HIGH |
| Typosquatting (edit distance <= 2 from popular package) | Levenshtein + popularity | HIGH |
| Low-popularity dependency (< 50 downloads/week) | Registry API | MEDIUM |
| Deprecated dependency | Registry API | LOW |
| Unmaintained dependency (> 3 years since publish) | Registry API | MEDIUM |
| Dependency with no repository link | Registry API | MEDIUM |
| Circular dependency | Tree analysis | LOW |

### 7.3 Provenance

| Signal | What It Means | Scoring |
|--------|--------------|---------|
| npm provenance attestation | Build linked to specific source commit | Positive (+5 trust score) |
| PyPI Trusted Publisher | Published from verified GitHub Actions | Positive (+5) |
| SLSA Level 3+ | Hermetic, source-attested build | Strong positive (+10) |
| Sigstore-signed | Cryptographic build provenance | Positive (+5) |
| No provenance of any kind | Cannot verify build-source link | Neutral (0, not negative — most packages lack this today) |

### 7.4 Security Evidence Type Extensions

For supply-chain findings, the evidence bundle must include:

```typescript
interface SupplyChainEvidence {
  /** CVE IDs (for vulnerability findings) */
  cveIds?: string[];

  /** Dependency path from root to vulnerable package */
  dependencyPath?: string[];

  /** Install script content (for install-time risk findings) */
  scriptContent?: string;

  /** Network call log from sandbox (for install-time risk) */
  networkLog?: { host: string; port: number; timestamp: string }[];

  /** File system operations log from sandbox */
  fsLog?: { operation: string; path: string; timestamp: string }[];

  /** Vulnerability database version used */
  vulnDbVersion?: string;

  /** SLSA attestation content (if present) */
  slsaAttestation?: string;
}
```

---

## 8. First Encounter Framework

> Expert: Kenji Watanabe — DevTool Product Designer

### 8.1 The Core Question Per Surface

The "alien perspective" applied to each surface:

| Surface | First Encounter Question |
|---------|------------------------|
| CLI | "I just installed this tool. Can I figure out what it does and use it successfully in under 5 minutes?" |
| Package | "I found this package on npm/PyPI. Should I trust it, add it to my project, and can I get it working?" |
| Repo | "I landed on this GitHub repo. Is this project healthy, should I use/depend on it, and could I contribute?" |
| Docs | "I opened the documentation. Can I find what I need and get to working code quickly?" |

### 8.2 Time to Value Metrics

| Surface | Metric | Good | Adequate | Poor |
|---------|--------|------|----------|------|
| CLI | Time from install to first successful command output | < 2 min | < 5 min | > 5 min |
| Package | Time from `npm install` to working import + first function call | < 5 min | < 15 min | > 15 min |
| Repo | Time from landing on repo to understanding what it does | < 30 sec | < 2 min | > 2 min |
| Docs | Time from docs landing to first working code example | < 3 min | < 10 min | > 10 min |

### 8.3 First Encounter Checklist (Per Surface)

**CLI First Encounter:**
1. Can I install it in one command?
2. Does `--help` tell me what the tool does (not just flags)?
3. Is there a clear example of the most common use case?
4. Does the first command I try actually work?
5. If it fails, does the error message tell me what to do?
6. Can I get output in a format I can pipe somewhere?

**Package First Encounter:**
1. Does the README tell me what this package does in the first paragraph?
2. Can I install it without warnings or errors?
3. Is there a code example I can copy-paste to verify it works?
4. Does the example actually run (imports, types, everything)?
5. Can I see the API surface (types, exported functions)?
6. Is it clear how to handle errors?

**Repo First Encounter:**
1. Does the description/README explain what this project is?
2. Can I tell if it is actively maintained (recent commits, releases)?
3. Is there a license?
4. Is there documentation beyond the README?
5. If I have a problem, is there a clear way to report it?
6. If I wanted to contribute, is there guidance?

**Docs First Encounter:**
1. Is there a clear "Getting Started" section?
2. Can I find install instructions within 30 seconds?
3. Can I find a working code example within 2 minutes?
4. If I search for something, do I get relevant results?
5. If I'm looking at a specific API method, is there an example?
6. If something goes wrong, can I find error documentation?

### 8.4 Mapping to Audit Primitives

Each first-encounter question maps to specific checks:

```typescript
interface FirstEncounterMapping {
  surface: SurfaceType;
  question: string;
  checks: {
    deterministic: string[];   // Checks that require no LLM
    llmRequired: string[];     // Checks that require judgment
  };
  timeToValueMs: number;       // Measured or estimated
  successCriteria: string;     // What counts as "successful first encounter"
}
```

---

## 9. Cross-Panel Synthesis

### 9.1 Shared Dimensions Across Surfaces

| Dimension | CLI | Package | Repo | Docs | Web |
|-----------|-----|---------|------|------|-----|
| Documentation Quality | X | X | X | X | |
| Install Experience | X | X | | | |
| Error Handling | X | | | X | X |
| Composability | X | X | X | | |
| Agent-Nativeness | X | X | X | X | X |
| Maintenance Health | X | X | X | X | |
| Trustworthiness | | X | X | | |
| Supply Chain | X | X | | | |
| Discoverability | | X | | X | |
| Onboarding | | | X | X | |
| Contributor Experience | | | X | | |
| Security Surface | | | X | | X |
| Performance | | | | X | X |

### 9.2 Surface-Specific Dimensions (Unique)

| Surface | Unique Dimension | Why Unique |
|---------|-----------------|------------|
| CLI | Composability (stdin/stdout/exit codes) | Only CLIs have POSIX pipe semantics |
| Package | Supply Chain (typosquatting, dependency confusion) | Only packages have install-time execution risks |
| Repo | Contributor Experience | Only repos have contribution workflows |
| Docs | Onboarding (progressive disclosure, getting started) | Docs are the primary onboarding vehicle |

### 9.3 Infrastructure Matrix

| Surface | Docker | Playwright | GitHub API | Registry API | HTTP Client | LLM |
|---------|--------|-----------|------------|-------------|-------------|-----|
| CLI | Required | No | Optional | Yes (for metadata) | No | Yes (Full Audit) |
| Package | No | No | Optional | Required | Yes (for tarball) | Yes (Full Audit) |
| Repo | No | No | Required | No | No | Yes (Full Audit) |
| Docs | No | Shared w/web | No | No | Yes (link check) | Yes (Full Audit) |
| Web | No | Required | No | No | No | Yes (Full Audit) |

### 9.4 Security Model Per Surface

| Surface | Threat Model | Sandbox Required | Network Policy |
|---------|-------------|-----------------|----------------|
| CLI | Arbitrary code execution. Tool could be malware. | Yes (Docker + gVisor) | Restricted post-install |
| Package | Static analysis only. Tarball inspection. No execution. | Minimal (temp dir) | API calls only |
| Repo | Read-only API access. No code execution. | None | GitHub API only |
| Docs | Same as web crawl. | Same as web | Same as web (URLValidator) |

### 9.5 Cost Matrix (Per Audit)

| Surface | Quick Check COGS | Full Audit COGS | Infrastructure |
|---------|-----------------|-----------------|----------------|
| CLI | $0.02-0.05 | $0.52-2.05 | Docker container on Railway |
| Package | $0.01 | $0.31-1.51 | HTTP client only |
| Repo | $0.01 | $0.31-1.01 | HTTP client only |
| Docs | $0.01 (marginal) | $0.50-2.00 (marginal) | Reuses web Playwright |
| Web (existing) | ~$0.10 | $1.90-4.40 | Playwright on Railway |

### 9.6 Methodology Registry (Complete)

```typescript
const methodologyRegistry: MethodologyRegistry = {
  web: {
    version: 'v0.1',
    dimensions: [
      { dimension: 'seo', weight: 0.15, llmRequired: false, ownershipRequired: false },
      { dimension: 'accessibility', weight: 0.20, llmRequired: true, ownershipRequired: false },
      { dimension: 'security', weight: 0.15, llmRequired: false, ownershipRequired: true },
      { dimension: 'performance', weight: 0.15, llmRequired: false, ownershipRequired: false },
      { dimension: 'agent-nativeness', weight: 0.15, llmRequired: true, ownershipRequired: true },
      { dimension: 'copy', weight: 0.20, llmRequired: true, ownershipRequired: false },
    ],
    quickCheckDimensions: ['seo', 'performance', 'accessibility'],
    fullAuditDimensions: ['seo', 'accessibility', 'security', 'performance', 'agent-nativeness', 'copy'],
  },

  cli: {
    version: 'v0.1',
    dimensions: [
      { dimension: 'install-experience', weight: 0.20, llmRequired: false, ownershipRequired: false },
      { dimension: 'discoverability', weight: 0.15, llmRequired: true, ownershipRequired: false },
      { dimension: 'error-handling', weight: 0.15, llmRequired: true, ownershipRequired: false },
      { dimension: 'composability', weight: 0.15, llmRequired: false, ownershipRequired: false },
      { dimension: 'agent-nativeness', weight: 0.15, llmRequired: true, ownershipRequired: false },
      { dimension: 'supply-chain', weight: 0.10, llmRequired: false, ownershipRequired: false },
      { dimension: 'documentation-quality', weight: 0.05, llmRequired: true, ownershipRequired: false },
      { dimension: 'maintenance-health', weight: 0.05, llmRequired: false, ownershipRequired: false },
    ],
    quickCheckDimensions: ['install-experience', 'composability', 'maintenance-health'],
    fullAuditDimensions: ['install-experience', 'discoverability', 'error-handling', 'composability',
                          'agent-nativeness', 'supply-chain', 'documentation-quality', 'maintenance-health'],
  },

  package: {
    version: 'v0.1',
    dimensions: [
      { dimension: 'documentation-quality', weight: 0.15, llmRequired: true, ownershipRequired: false },
      { dimension: 'install-experience', weight: 0.10, llmRequired: false, ownershipRequired: false },
      { dimension: 'trustworthiness', weight: 0.20, llmRequired: false, ownershipRequired: false },
      { dimension: 'supply-chain', weight: 0.20, llmRequired: false, ownershipRequired: false },
      { dimension: 'maintenance-health', weight: 0.15, llmRequired: false, ownershipRequired: false },
      { dimension: 'agent-nativeness', weight: 0.10, llmRequired: true, ownershipRequired: false },
      { dimension: 'composability', weight: 0.05, llmRequired: false, ownershipRequired: false },
      { dimension: 'discoverability', weight: 0.05, llmRequired: true, ownershipRequired: false },
    ],
    quickCheckDimensions: ['install-experience', 'trustworthiness', 'maintenance-health'],
    fullAuditDimensions: ['documentation-quality', 'install-experience', 'trustworthiness', 'supply-chain',
                          'maintenance-health', 'agent-nativeness', 'composability', 'discoverability'],
  },

  repo: {
    version: 'v0.1',
    dimensions: [
      { dimension: 'documentation-quality', weight: 0.15, llmRequired: true, ownershipRequired: false },
      { dimension: 'maintenance-health', weight: 0.25, llmRequired: false, ownershipRequired: false },
      { dimension: 'trustworthiness', weight: 0.15, llmRequired: false, ownershipRequired: false },
      { dimension: 'security', weight: 0.15, llmRequired: false, ownershipRequired: false },
      { dimension: 'contributor-experience', weight: 0.10, llmRequired: false, ownershipRequired: false },
      { dimension: 'agent-nativeness', weight: 0.10, llmRequired: true, ownershipRequired: false },
      { dimension: 'onboarding', weight: 0.05, llmRequired: true, ownershipRequired: false },
      { dimension: 'composability', weight: 0.05, llmRequired: true, ownershipRequired: false },
    ],
    quickCheckDimensions: ['maintenance-health', 'trustworthiness', 'security'],
    fullAuditDimensions: ['documentation-quality', 'maintenance-health', 'trustworthiness', 'security',
                          'contributor-experience', 'agent-nativeness', 'onboarding', 'composability'],
  },

  docs: {
    version: 'v0.1',
    dimensions: [
      { dimension: 'documentation-quality', weight: 0.25, llmRequired: true, ownershipRequired: false },
      { dimension: 'onboarding', weight: 0.20, llmRequired: true, ownershipRequired: false },
      { dimension: 'discoverability', weight: 0.15, llmRequired: false, ownershipRequired: false },
      { dimension: 'error-handling', weight: 0.10, llmRequired: true, ownershipRequired: false },
      { dimension: 'agent-nativeness', weight: 0.10, llmRequired: true, ownershipRequired: false },
      { dimension: 'maintenance-health', weight: 0.10, llmRequired: false, ownershipRequired: false },
      { dimension: 'composability', weight: 0.05, llmRequired: true, ownershipRequired: false },
      { dimension: 'performance', weight: 0.05, llmRequired: false, ownershipRequired: false },
    ],
    quickCheckDimensions: ['discoverability', 'maintenance-health', 'performance'],
    fullAuditDimensions: ['documentation-quality', 'onboarding', 'discoverability', 'error-handling',
                          'agent-nativeness', 'maintenance-health', 'composability', 'performance'],
  },
};
```

---

## 10. Work Unit Estimates

### 10.1 Per-Surface Totals

| Surface | WUs | Hours | Notes |
|---------|-----|-------|-------|
| CLI | 9 | 30 | Docker sandbox is the hard part |
| Package | 8 | 23 | No execution = simpler infrastructure |
| Repo | 8 | 23 | GitHub API client is the foundation |
| Docs | 8 | 21 | Layers on web crawl = cheapest |
| **Total** | **33** | **97** | |

### 10.2 Shared Infrastructure WUs

| WU | Description | Agent | Hours | Dependencies |
|----|-------------|-------|-------|-------------|
| WU-MULTI-00 | TYPE-SPEC v2.0: discriminated unions, BaseCollectionResult, BaseSummary, BaseEvidence | Opus | 3 | Human approval for v2.0 |
| WU-MULTI-01 | Methodology registry implementation | Opus | 2 | WU-MULTI-00 |
| WU-MULTI-02 | Surface router (dispatch to correct collection engine based on input type) | Opus | 2 | WU-MULTI-00 |
| WU-MULTI-03 | Schema migration (audits table gains surface column, new collection tables) | Codex | 3 | WU-MULTI-00 |
| WU-MULTI-04 | Synthesis engine generalization (surface-aware scoring, surface-specific weight vectors) | Opus | 4 | WU-MULTI-01 |
| WU-MULTI-05 | Renderer generalization (Format B for non-web findings) | Codex | 2 | WU-MULTI-04 |
| **Total** | | | **16** | |

### 10.3 Combined Critical Path

```
WU-MULTI-00 (types, 3h)
  ├── WU-MULTI-01 (methodology, 2h)
  ├── WU-MULTI-02 (router, 2h)
  ├── WU-MULTI-03 (schema, 3h)
  └── [Surface WUs start in parallel]
      ├── CLI: WU-CLI-00 → 01 → 02+03 → 04 → 05 → 06+07+08
      ├── Package: WU-PKG-00 → 01 → 02+03 → 04 → 05 → 06+07
      ├── Repo: WU-REPO-00 → 01 → 02+03 → 04 → 05 → 06+07
      └── Docs: WU-DOCS-00 → 01 → 02+03 → 04 → 05 → 06+07

WU-MULTI-04 (synthesis, 4h) — after at least one surface completes
WU-MULTI-05 (renderers, 2h) — after WU-MULTI-04
```

**Total hours (all surfaces + shared):** 97 + 16 = **113 hours**

**If building one surface at a time:**
- Shared (16h) + Docs (21h) = **37 hours** (cheapest, layers on web)
- Shared (16h) + Repo (23h) = **39 hours** (second cheapest, API-only)
- Shared (16h) + Package (23h) = **39 hours** (same as repo, API-only)
- Shared (16h) + CLI (30h) = **46 hours** (most expensive, needs Docker)

---

## 11. Build Priority

### 11.1 Ranking (This Panel's Assessment)

| Rank | Surface | Rationale |
|------|---------|-----------|
| 1 | **Docs** | Layers on existing web crawl (lowest marginal infrastructure). No new execution environments. Natural extension: "we already crawl your site, now we also evaluate your docs." Differentiator: no incumbent for docs-as-product-quality auditing. |
| 2 | **Repo** | API-only (no execution). GitHub is the center of the developer universe. Lowest COGS ($0.31-1.01). Strong Rhumb integration (repo health signals). Incumbent (OSSF Scorecard) measures metrics, not experience. |
| 3 | **Package** | API-only (no execution for collection). High strategic value for Rhumb (package quality data). Incumbent gap: Snyk/Socket do security, not quality. Supply chain angle differentiates. |
| 4 | **CLI** | Requires Docker sandboxing (highest infrastructure cost and complexity). Running arbitrary CLI tools is the hardest security problem. Lowest strategic value (free tools are adequate for correctness; experience gap is real but niche). |

### 11.2 Reconciliation with SURFACE-COVERAGE-SYNTHESIS.md

That document recommended: Web -> MCP -> (defer everything else).

This document does NOT override that recommendation for build order. It provides the design so that when the market signals demand for a specific surface, the specification is ready. The recommended sequence considering both documents:

1. **Web** (now — in progress)
2. **MCP** (after web PMF — per SURFACE-COVERAGE-SYNTHESIS.md)
3. **Docs** (after MCP — lowest marginal cost, layers on web)
4. **Repo** (after Docs or in parallel — API-only)
5. **Package** (after Repo — API-only, supply chain differentiation)
6. **CLI** (last — highest infrastructure cost)

### 11.3 Gate Criteria for Each Surface

No surface begins engineering work until:

| Gate | Criteria |
|------|----------|
| Pre-requisite | Web audit at PMF (1,000 paid audits, <5% FP rate, positive unit economics) |
| Design approval | Human review of this document's surface-specific sections |
| TYPE-SPEC v2.0 | Discriminated unions approved and implemented |
| Methodology v0.2 | Surface-specific methodology pre-registered |
| Calibration plan | 200+ manual calibration audits planned for the surface |
| Infrastructure ready | Surface-specific infra provisioned and tested |

---

## 12. Database Schema Extensions

### 12.1 Audits Table Extension

```sql
-- Add surface column to audits table
ALTER TABLE audits ADD COLUMN surface TEXT NOT NULL DEFAULT 'web';
-- Values: 'web', 'cli', 'package', 'repo', 'docs'

-- Add surface-specific target identifier
ALTER TABLE audits ADD COLUMN target_identifier TEXT;
-- For web: same as url. For cli: package name. For package: "npm/react" or "pypi/requests".
-- For repo: "owner/name". For docs: url (same as web but with surface='docs').

-- Index
CREATE INDEX idx_audits_surface ON audits(surface);
```

### 12.2 New Collection Tables

```sql
-- CLI probe results (one per CLI audit)
CREATE TABLE cli_probe_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL UNIQUE REFERENCES audits(id) ON DELETE CASCADE,
  install_success BOOLEAN NOT NULL,
  install_duration_ms INT,
  install_size_bytes BIGINT,
  dependency_count INT,
  help_exists BOOLEAN,
  version_exists BOOLEAN,
  subcommand_count INT,
  structured_output_support JSONB DEFAULT '{}',
  exercises_run INT DEFAULT 0,
  sandbox_image TEXT,
  raw_data_storage_path TEXT,
  raw_data_expires_at TIMESTAMPTZ,
  summary JSONB NOT NULL DEFAULT '{}',    -- CLISummary as JSON
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Package probe results (one per package audit)
CREATE TABLE package_probe_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL UNIQUE REFERENCES audits(id) ON DELETE CASCADE,
  registry TEXT NOT NULL,                 -- 'npm' | 'pypi'
  package_name TEXT NOT NULL,
  package_version TEXT NOT NULL,
  weekly_downloads BIGINT,
  dependent_count INT,
  direct_dependency_count INT,
  transitive_dependency_count INT,
  vulnerable_dependency_count INT,
  has_types BOOLEAN,
  has_readme BOOLEAN,
  has_changelog BOOLEAN,
  provenance_attested BOOLEAN,
  install_size_bytes BIGINT,
  summary JSONB NOT NULL DEFAULT '{}',    -- PackageSummary as JSON
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Repo probe results (one per repo audit)
CREATE TABLE repo_probe_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL UNIQUE REFERENCES audits(id) ON DELETE CASCADE,
  repo_full_name TEXT NOT NULL,
  stars INT,
  forks INT,
  recent_commit_count INT,
  bus_factor INT,
  issue_close_rate NUMERIC(3,2),
  ci_status TEXT,
  has_security_policy BOOLEAN,
  ossf_score NUMERIC(3,1),
  last_commit_date TIMESTAMPTZ,
  summary JSONB NOT NULL DEFAULT '{}',    -- RepoSummary as JSON
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Docs collection results (one per docs audit, links to web crawl)
CREATE TABLE docs_collection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL UNIQUE REFERENCES audits(id) ON DELETE CASCADE,
  web_crawl_id UUID REFERENCES crawl_results(id),
  framework TEXT,
  page_count INT,
  has_getting_started BOOLEAN,
  has_api_reference BOOLEAN,
  has_search BOOLEAN,
  code_block_count INT,
  runnable_example_rate NUMERIC(3,2),
  broken_internal_link_count INT,
  summary JSONB NOT NULL DEFAULT '{}',    -- DocsSummary as JSON
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies (same pattern as existing tables)
ALTER TABLE cli_probe_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY cli_own ON cli_probe_results FOR ALL
  USING (audit_id IN (SELECT id FROM audits WHERE user_id = auth.uid() OR user_id IS NULL));

ALTER TABLE package_probe_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY package_own ON package_probe_results FOR ALL
  USING (audit_id IN (SELECT id FROM audits WHERE user_id = auth.uid() OR user_id IS NULL));

ALTER TABLE repo_probe_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY repo_own ON repo_probe_results FOR ALL
  USING (audit_id IN (SELECT id FROM audits WHERE user_id = auth.uid() OR user_id IS NULL));

ALTER TABLE docs_collection_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY docs_own ON docs_collection_results FOR ALL
  USING (audit_id IN (SELECT id FROM audits WHERE user_id = auth.uid() OR user_id IS NULL));
```

### 12.3 Patterns Table Extension

```sql
-- Add surface to patterns for cross-surface analysis
ALTER TABLE patterns ADD COLUMN surface TEXT NOT NULL DEFAULT 'web';
CREATE INDEX idx_patterns_surface ON patterns(surface);

-- Cross-surface pattern queries become possible:
-- "67% of npm packages with > 100 deps have at least one HIGH CVE"
-- "Repos with bus factor = 1 have 3x the stale issue rate"
```

---

## Appendix A: Calibration Requirements

Before ANY surface goes to production:

| Calibration Step | Count | Purpose |
|-----------------|-------|---------|
| Manual audits by the panel team | 50 | Establish ground truth |
| Automated audits with manual FP review | 200 | Measure actual FP rate |
| Cross-reviewer agreement | 20 (3 reviewers each) | Measure inter-rater reliability |
| Edge case collection | 30 | Known tricky cases per surface |
| Regression test suite | 50 | Prevent methodology changes from breaking known-good results |

---

## Appendix B: Pricing Considerations Per Surface

| Surface | Quick Check | Full Audit | Re-test | Rationale |
|---------|------------|------------|---------|-----------|
| CLI | Free | $14-29 | $5 | Lower COGS than web. Docker infra is fixed cost. |
| Package | Free | $9-19 | $3 | Lowest COGS. No execution. API calls only. |
| Repo | Free | $9-19 | $3 | Lowest COGS. No execution. API calls only. |
| Docs | Free | $14-29 (bundled w/web) | $5 | Natural upsell from web audit. |
| Web | Free | $19-49 | $5-9 | Existing pricing (unchanged). |

**Bundle opportunity:** "Full Product Audit" = web + docs + repo + package for a single product. Price: $49-99. Alien Eyes becomes the one-stop quality check.

---

## Appendix C: ADR Extensions

### ADR-018: Discriminated Unions for Multi-Surface Types

**Status:** Proposed (requires human approval)
**Context:** TYPE-SPEC v1.0 types are web-locked. Multi-surface requires surface-specific collection, summary, and evidence types.
**Decision:** Implement discriminated unions with `surface` discriminant field. Each surface gets its own types that extend shared base interfaces.
**Consequences:** TYPE-SPEC v2.0 required. Additive change (v1.0 types become the `web` variant). All existing code continues to work with type narrowing.

### ADR-019: Docker Sandbox for CLI Auditing

**Status:** Proposed
**Context:** CLI auditing requires executing arbitrary tools. This is the highest-risk operation Alien Eyes performs.
**Decision:** Every CLI probe runs in a fresh Docker container with gVisor runtime, restricted network, resource limits, and ephemeral filesystem. No host access.
**Consequences:** Adds Docker dependency to CLI audit workers. Adds ~$0.02-0.05 per probe in compute cost. Required for safety.

### ADR-020: Docs Auditing Layers on Web Crawl

**Status:** Proposed
**Context:** Documentation sites ARE websites. Re-crawling is wasteful.
**Decision:** Docs auditing reuses the web crawl result and adds doc-specific extractors and analysis on top. A single audit can produce both web and docs findings.
**Consequences:** Docs surface has lowest marginal cost. Requires web crawl infrastructure to be operational first. Natural upsell path.

### ADR-021: Package Auditing Is Read-Only

**Status:** Proposed
**Context:** Packages could contain malware. Executing package code during auditing is dangerous.
**Decision:** Package auditing NEVER executes package code. Collection is registry API + tarball static analysis only. If CLI-level testing is desired, that is a separate CLI audit.
**Consequences:** Package audits cannot detect runtime behavior issues. Acceptable: CLI surface handles execution testing.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-11 | Initial specification. 4 surfaces, 7 experts, full types/methodology/evidence/grammar/WUs. |
