import { createHash } from 'node:crypto';
import type { Envelope, Finding, RendererRegistry, SynthesisResult } from '@/types';
import type { AuditConfig, PageSummary } from '@/types';
import type { CrawlResult } from '@/types';
import type { AuditPipelineResult } from '@/orchestrator/pipeline';
import type { FieldNote } from '@/orchestrator/field-notes';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase-admin';

export interface StoredAuditResult {
  synthesis: SynthesisResult;
  rendered: Record<keyof RendererRegistry, string>;
}

export interface AuditJobRecord {
  id: string;
  url: string;
  userId?: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  progress: number;
  phase: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  config: AuditConfig;
  result?: StoredAuditResult;
  fieldNotes?: FieldNote[];
  error?: string;
}

export interface AuditRepository {
  create(job: AuditJobRecord): Promise<void>;
  update(id: string, patch: Partial<AuditJobRecord>): Promise<void>;
  complete(id: string, result: AuditPipelineResult, config: AuditConfig): Promise<void>;
  get(id: string): Promise<AuditJobRecord | undefined>;
}

class MemoryAuditRepository implements AuditRepository {
  private readonly jobs: Map<string, AuditJobRecord>;

  constructor() {
    this.jobs = getGlobalJobsMap();
  }

  async create(job: AuditJobRecord): Promise<void> {
    this.jobs.set(job.id, structuredClone(job));
  }

  async update(id: string, patch: Partial<AuditJobRecord>): Promise<void> {
    const existing = this.jobs.get(id);
    if (!existing) {
      return;
    }
    this.jobs.set(id, {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString()
    });
  }

  async complete(id: string, result: AuditPipelineResult): Promise<void> {
    const existing = this.jobs.get(id);
    if (!existing) {
      return;
    }
    this.jobs.set(id, {
      ...existing,
      status: 'complete',
      progress: 100,
      phase: 'complete',
      message: 'Audit complete.',
      result: toStoredAuditResult(result),
      fieldNotes: result.fieldNotes,
      updatedAt: new Date().toISOString()
    });
  }

  async get(id: string): Promise<AuditJobRecord | undefined> {
    const record = this.jobs.get(id);
    return record ? structuredClone(record) : undefined;
  }
}

class SupabaseAuditRepository implements AuditRepository {
  async create(job: AuditJobRecord): Promise<void> {
    const client = getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase is not configured');
    }

    const normalizedUrl = normalizeUrl(job.url);
    const { error } = await client.from('aeb_audits').insert({
      id: job.id,
      user_id: job.userId ?? null,
      url: job.url,
      normalized_url: normalizedUrl,
      domain: extractDomain(job.url),
      tier: job.config.tier,
      methodology_version: job.config.methodologyVersion,
      ownership_verified: job.config.ownershipVerified,
      page_limit: job.config.pageLimit,
      cost_budget: job.config.costBudget,
      targeted_dimensions: job.config.targetedDimensions ?? null,
      is_re_audit: job.config.isReAudit,
      previous_audit_id: job.config.previousAuditId ?? null,
      status: job.status,
      progress: job.progress,
      current_phase: job.phase,
      started_at: job.createdAt,
      created_at: job.createdAt
    });

    if (error) {
      throw new Error(`Failed to create audit: ${error.message}`);
    }
  }

  async update(id: string, patch: Partial<AuditJobRecord>): Promise<void> {
    const client = getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase is not configured');
    }

    const updates: Record<string, unknown> = {};
    if (patch.status) updates.status = patch.status;
    if (patch.progress !== undefined) updates.progress = patch.progress;
    if (patch.phase) updates.current_phase = patch.phase;
    if (patch.message) updates.error_message = patch.status === 'error' ? patch.message : null;
    if (patch.error !== undefined) updates.error_message = patch.error;
    if (patch.status === 'running') updates.started_at = new Date().toISOString();
    if (patch.status === 'complete') updates.completed_at = new Date().toISOString();

    if (Object.keys(updates).length === 0) {
      return;
    }

    let query = client.from('aeb_audits').update(updates).eq('id', id);
    const isProgressOnlyUpdate = !patch.status;
    if (isProgressOnlyUpdate) {
      query = query.neq('status', 'complete').neq('status', 'error');
      if (patch.progress !== undefined) {
        query = query.lte('progress', patch.progress);
      }
    }

    const { error } = await query;
    if (error) {
      throw new Error(`Failed to update audit: ${error.message}`);
    }
  }

  async complete(id: string, result: AuditPipelineResult, config: AuditConfig): Promise<void> {
    const client = getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase is not configured');
    }

    const stored = toStoredAuditResult(result);
    const completionTime = new Date().toISOString();
    const findings = stored.synthesis.findings;
    const primitiveResults = result.primitiveResults;

    const auditUpdate = {
      status: 'complete',
      progress: 100,
      current_phase: 'complete',
      completed_at: completionTime,
      satisfaction_score: stored.synthesis.satisfactionScore.value,
      satisfaction_confidence_low: stored.synthesis.satisfactionScore.confidenceLow,
      satisfaction_confidence_high: stored.synthesis.satisfactionScore.confidenceHigh,
      human_native_score: stored.synthesis.humanNativeScore.value,
      agent_nativeness_score: stored.synthesis.agentNativenessScore.value,
      finding_count: findings.length,
      critical_count: findings.filter((finding) => finding.severity === 'critical').length,
      high_count: findings.filter((finding) => finding.severity === 'high').length,
      medium_count: findings.filter((finding) => finding.severity === 'medium').length,
      low_count: findings.filter((finding) => finding.severity === 'low').length,
      total_cost_usd: stored.synthesis.meta.totalCostUsd,
      cost_by_primitive: stored.synthesis.meta.costByPrimitive,
      detected_stack: stored.synthesis.meta.detectedStack ?? [],
      ownership_verified: config.ownershipVerified
    };

    const { error: crawlError } = await client.from('aeb_crawl_results').upsert({
      audit_id: id,
      pages_crawled: result.crawl.pages.length,
      pages_discovered: result.crawl.pages.length + result.crawl.pagesSkipped,
      pages_skipped: result.crawl.pagesSkipped,
      total_duration_ms: result.crawl.totalDurationMs,
      robots_txt_status: result.crawl.robotsTxtStatus,
      detected_stack: result.crawl.detectedStack ?? [],
      page_summaries: result.summaries,
      created_at: completionTime
    }, { onConflict: 'audit_id' });
    if (crawlError) {
      throw new Error(`Failed to persist crawl result: ${crawlError.message}`);
    }

    await client.from('aeb_primitive_results').delete().eq('audit_id', id);
    if (primitiveResults.length > 0) {
      const { error: primitiveError } = await client.from('aeb_primitive_results').insert(
        primitiveResults.map((envelope) => toPrimitiveRow(id, envelope))
      );
      if (primitiveError) {
        throw new Error(`Failed to persist primitive results: ${primitiveError.message}`);
      }
    }

    await client.from('aeb_findings').delete().eq('audit_id', id);
    if (findings.length > 0) {
      const { error: findingsError } = await client.from('aeb_findings').insert(
        findings.map((finding) => toFindingRow(id, finding))
      );
      if (findingsError) {
        throw new Error(`Failed to persist findings: ${findingsError.message}`);
      }
    }

    await client.from('aeb_reports').delete().eq('audit_id', id);
    const reports = (Object.entries(stored.rendered) as Array<[keyof RendererRegistry, string]>).map(([format, content]) => ({
      audit_id: id,
      format,
      content,
      content_hash: hashContent(content)
    }));
    const { error: reportsError } = await client.from('aeb_reports').insert(reports);
    if (reportsError) {
      throw new Error(`Failed to persist reports: ${reportsError.message}`);
    }

    const { error: auditError } = await client.from('aeb_audits').update(auditUpdate).eq('id', id);
    if (auditError) {
      throw new Error(`Failed to finalize audit: ${auditError.message}`);
    }
  }

  async get(id: string): Promise<AuditJobRecord | undefined> {
    const client = getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase is not configured');
    }

    const { data: audit, error: auditError } = await client
      .from('aeb_audits')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (auditError) {
      throw new Error(`Failed to load audit: ${auditError.message}`);
    }
    if (!audit) {
      return undefined;
    }

    const { data: reports, error: reportsError } = await client
      .from('aeb_reports')
      .select('format, content')
      .eq('audit_id', id);
    if (reportsError) {
      throw new Error(`Failed to load reports: ${reportsError.message}`);
    }

    const reportMap = Object.fromEntries((reports ?? []).map((report) => [report.format, report.content])) as Partial<Record<keyof RendererRegistry, string>>;
    let result: StoredAuditResult | undefined;

    if (reportMap['format-json']) {
      const synthesis = JSON.parse(reportMap['format-json']) as SynthesisResult;
      result = {
        synthesis,
        rendered: {
          'format-a': reportMap['format-a'] ?? '',
          'format-b': reportMap['format-b'] ?? '',
          'format-c': reportMap['format-c'] ?? '',
          'format-json': reportMap['format-json']
        }
      };
    }

    return {
      id: audit.id,
      url: audit.url,
      status: audit.status,
      progress: Number(audit.progress ?? 0),
      phase: audit.current_phase ?? 'pending',
      message: buildAuditMessage(audit),
      createdAt: audit.created_at,
      updatedAt: audit.completed_at ?? audit.started_at ?? audit.created_at,
      config: {
        tier: audit.tier,
        ownershipVerified: audit.ownership_verified,
        pageLimit: audit.page_limit,
        costBudget: Number(audit.cost_budget ?? 5),
        methodologyVersion: audit.methodology_version,
        isReAudit: audit.is_re_audit,
        previousAuditId: audit.previous_audit_id ?? undefined,
        targetedDimensions: audit.targeted_dimensions ?? undefined
      },
      result,
      error: audit.error_message ?? undefined
    };
  }
}

let repository: AuditRepository | null = null;

export function getAuditRepository(): AuditRepository {
  if (!repository) {
    repository = isSupabaseConfigured() ? new SupabaseAuditRepository() : new MemoryAuditRepository();
  }
  return repository;
}

export function setAuditRepositoryForTests(nextRepository: AuditRepository | null): void {
  repository = nextRepository;
}

export function resetAuditRepositoryForTests(): void {
  repository = null;
  getGlobalJobsMap().clear();
}

export function createMemoryAuditRepositoryForTests(): AuditRepository {
  return new MemoryAuditRepository();
}

export function createSupabaseAuditRepositoryForTests(): AuditRepository {
  return new SupabaseAuditRepository();
}

export function toStoredAuditResult(result: AuditPipelineResult): StoredAuditResult {
  return {
    synthesis: result.synthesis,
    rendered: result.rendered
  };
}

function toPrimitiveRow(auditId: string, envelope: Envelope<Finding[]>) {
  return {
    audit_id: auditId,
    primitive_name: envelope.primitive,
    dimension: envelope.data[0]?.dimension ?? inferPrimitiveDimension(envelope.primitive),
    status: envelope.status,
    confidence: envelope.confidence,
    confidence_factors: envelope.confidenceFactors,
    reasoning: envelope.reasoning ?? null,
    model: envelope.metadata.model ?? null,
    tokens_used: envelope.metadata.tokensUsed ?? 0,
    cost_usd: envelope.metadata.costUsd ?? 0,
    duration_ms: envelope.metadata.durationMs,
    methodology_version: envelope.metadata.methodologyVersion,
    finding_count: envelope.data.length
  };
}

function toFindingRow(auditId: string, finding: Finding) {
  return {
    audit_id: auditId,
    primitive_name: finding.id.split('-')[0] ?? finding.dimension,
    finding_id: finding.id,
    what: finding.what,
    where_found: finding.where,
    expected: finding.expected,
    why: finding.why,
    verify: finding.verify,
    severity: finding.severity,
    dimension: finding.dimension,
    causal_chain: finding.causalChain,
    confidence: finding.confidence,
    requires_human_judgment: finding.requiresHumanJudgment ?? false,
    human_judgment_reason: finding.humanJudgmentReason ?? null,
    evidence: finding.evidence,
    lifecycle_state: finding.lifecycle.state,
    lifecycle_updated_at: finding.lifecycle.updatedAt,
    lifecycle_updated_by: finding.lifecycle.updatedBy ?? null,
    lifecycle_reason: finding.lifecycle.reason ?? null,
    lifecycle_platform: finding.lifecycle.platform ?? null,
    lifecycle_third_party: finding.lifecycle.thirdPartyService ?? null,
    delta_status: null
  };
}

function hashContent(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function buildAuditMessage(audit: Record<string, unknown>): string {
  if (typeof audit.error_message === 'string' && audit.error_message) {
    return audit.error_message;
  }
  switch (audit.status) {
    case 'complete':
      return 'Audit complete.';
    case 'error':
      return 'Audit failed.';
    case 'running':
      return typeof audit.current_phase === 'string' ? `Audit ${audit.current_phase}.` : 'Audit running.';
    default:
      return 'Queued for audit.';
  }
}

function inferPrimitiveDimension(primitive: string): string {
  switch (primitive) {
    case 'accessibility':
      return 'accessibility';
    case 'performance':
      return 'performance';
    case 'security':
      return 'security';
    case 'seo':
      return 'seo';
    case 'copy-ux':
      return 'ux';
    case 'agent-nativeness':
      return 'agent-nativeness';
    default:
      return 'ux';
  }
}

function getGlobalJobsMap(): Map<string, AuditJobRecord> {
  const globalKey = '__alienEyesAuditJobs';
  const globalState = globalThis as typeof globalThis & {
    [globalKey]?: Map<string, AuditJobRecord>;
  };

  if (!globalState[globalKey]) {
    globalState[globalKey] = new Map<string, AuditJobRecord>();
  }

  return globalState[globalKey]!;
}
