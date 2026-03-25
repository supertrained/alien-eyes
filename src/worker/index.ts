import { createServer } from 'node:http';
import type { Job } from 'bullmq';
import { createAuditWorker, getQueueConfigFromEnv } from '@/lib/queue';
import { isSupabaseConfigured } from '@/lib/supabase-admin';
import { runAuditJob, type AuditQueueJobData } from '@/lib/audit-jobs';

const port = Number(process.env.PORT ?? 8080);
const queueConfig = getQueueConfigFromEnv();

const server = createServer((_request, response) => {
  const url = _request.url ?? '/';

  if (url === '/healthz') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url === '/readyz') {
    const ready = Boolean(queueConfig) && isSupabaseConfigured();
    response.writeHead(ready ? 200 : 503, { 'content-type': 'application/json' });
    response.end(JSON.stringify({
      ok: ready,
      queueConfigured: Boolean(queueConfig),
      supabaseConfigured: isSupabaseConfigured()
    }));
    return;
  }

  response.writeHead(404, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ error: 'Not found' }));
});

async function main(): Promise<void> {
  if (!queueConfig) {
    throw new Error('REDIS_URL is required for worker mode');
  }

  const worker = createAuditWorker<AuditQueueJobData>(queueConfig, async (job: Job<AuditQueueJobData>) => {
    await runAuditJob(job.data);
    return { ok: true };
  });

  worker.on('failed', (job, error) => {
    console.error('worker job failed', job?.id, error);
  });

  worker.on('completed', (job) => {
    console.log('worker job completed', job.id);
  });

  server.listen(port, () => {
    console.log(`alien-eyes worker listening on :${port}`);
  });

  const shutdown = async () => {
    await worker.close();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  };

  process.on('SIGINT', () => {
    shutdown().finally(() => process.exit(0));
  });
  process.on('SIGTERM', () => {
    shutdown().finally(() => process.exit(0));
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
