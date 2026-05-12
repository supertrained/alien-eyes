import { randomUUID } from 'node:crypto';
import type { AuditConfig } from '@/types';
import type { AuditPipelineResult } from '@/orchestrator/pipeline';
import { ProgressEmitter, type ProgressEvent } from '@/orchestrator/progress';
import { getAuditRepository, type AuditJobRecord } from '@/lib/audit-repository';
import { createAuditQueue, getQueueConfigFromEnv, type QueueConfig } from '@/lib/queue';

async function loadPipeline(): Promise<(url: string, config: AuditConfig, opts: { progressEmitter: ProgressEmitter }) => Promise<AuditPipelineResult>> {
  const { runAuditPipeline } = await import('@/orchestrator/pipeline');
  return runAuditPipeline;
}

export interface AuditQueueJobData {
  auditId: string;
  url: string;
  config: AuditConfig;
}

interface QueueLike {
  add(name: string, data: AuditQueueJobData): Promise<unknown>;
  close(): Promise<unknown>;
}

interface AuditJobDependencies {
  loadPipeline: typeof loadPipeline;
  getQueueConfig: () => QueueConfig | null;
  createQueue: (config: QueueConfig) => QueueLike;
  runLocalAudit: (data: AuditQueueJobData) => Promise<void>;
}

const defaultDependencies: AuditJobDependencies = {
  loadPipeline,
  getQueueConfig: getQueueConfigFromEnv,
  createQueue: createAuditQueue,
  runLocalAudit: (data) => runAuditJob(data)
};

let dependencies: AuditJobDependencies = defaultDependencies;

export async function startAuditJob(input: {
  url: string;
  quick?: boolean;
  pageLimit?: number;
  userId?: string;
}): Promise<AuditJobRecord> {
  const config: AuditConfig = {
    tier: input.quick === false ? 'full_audit' : 'quick_check',
    ownershipVerified: false,
    pageLimit: input.pageLimit ?? 30,
    costBudget: 5,
    methodologyVersion: 'v0.1',
    isReAudit: false
  };

  const now = new Date().toISOString();
  const job: AuditJobRecord = {
    id: randomUUID(),
    url: input.url,
    userId: input.userId,
    status: 'pending',
    progress: 0,
    phase: 'pending',
    message: 'Queued for audit.',
    createdAt: now,
    updatedAt: now,
    config
  };
  const repository = getAuditRepository();
  await repository.create(job);

  const queueConfig = dependencies.getQueueConfig();
  if (queueConfig) {
    const queue = dependencies.createQueue(queueConfig);
    try {
      await queue.add('audit', {
        auditId: job.id,
        url: input.url,
        config
      } satisfies AuditQueueJobData);
    } finally {
      await queue.close();
    }

    return (await getAuditJob(job.id))!;
  }

  const backgroundWork = dependencies.runLocalAudit({
    auditId: job.id,
    url: input.url,
    config
  }).catch((error) => {
    console.error(`[audit ${job.id}] runLocalAudit failed:`, error instanceof Error ? error.message : error);
  });

  const result = (await getAuditJob(job.id))!;
  (result as AuditJobRecord & { _backgroundWork?: Promise<void> })._backgroundWork = backgroundWork;
  return result;
}

export async function runAuditJob(data: AuditQueueJobData): Promise<void> {
  const emitter = new ProgressEmitter();
  emitter.onProgress((event) => {
    void applyProgress(data.auditId, event);
  });

  await setJob(data.auditId, {
    status: 'running',
    phase: 'validating',
    message: 'Validating audit target.'
  });

  try {
    const runPipeline = await dependencies.loadPipeline();
    const result = await runPipeline(data.url, data.config, {
      progressEmitter: emitter
    });

    await getAuditRepository().complete(data.auditId, result, data.config);
  } catch (error) {
    await setJob(data.auditId, {
      status: 'error',
      phase: 'error',
      progress: 100,
      message: 'Audit failed.',
      error: error instanceof Error ? error.message : 'Unknown audit failure'
    });
    throw error;
  }
}

export async function getAuditJob(id: string): Promise<AuditJobRecord | undefined> {
  return getAuditRepository().get(id);
}

async function applyProgress(id: string, event: ProgressEvent): Promise<void> {
  const current = await getAuditRepository().get(id);
  if (!current) {
    return;
  }
  if (current.status === 'complete' || current.status === 'error') {
    return;
  }
  if (event.progress < current.progress) {
    return;
  }

  const patch: Partial<AuditJobRecord> = {
    phase: event.state,
    progress: event.progress,
    message: event.message
  };

  if (event.observation) {
    const existingNotes = current.fieldNotes ?? [];
    patch.fieldNotes = [...existingNotes, event.observation];
  }

  await setJob(id, patch);
}

async function setJob(id: string, patch: Partial<AuditJobRecord>): Promise<void> {
  await getAuditRepository().update(id, patch);
}

export function setAuditJobDependenciesForTests(overrides: Partial<AuditJobDependencies>): void {
  dependencies = {
    ...defaultDependencies,
    ...overrides
  };
}

export function resetAuditJobDependenciesForTests(): void {
  dependencies = defaultDependencies;
}
