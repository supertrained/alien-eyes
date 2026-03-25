import { Queue, Worker, type JobsOptions, type Processor } from 'bullmq';

export interface QueueConfig {
  connection: {
    host: string;
    port: number;
    password?: string;
    tls?: object;
  };
}

export function getQueueConfigFromEnv(): QueueConfig | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  try {
    const parsed = new URL(redisUrl);
    const tls = parsed.protocol === 'rediss:' ? {} : undefined;
    return {
      connection: {
        host: parsed.hostname,
        port: Number(parsed.port || (parsed.protocol === 'rediss:' ? 6380 : 6379)),
        password: parsed.password || undefined,
        tls
      }
    };
  } catch {
    return null;
  }
}

export function createAuditQueue(config: QueueConfig): Queue {
  return new Queue('alien-eyes-audits', {
    connection: config.connection,
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: 100
    } satisfies JobsOptions
  });
}

export function createAuditWorker<T>(config: QueueConfig, processor: Processor<T>): Worker<T> {
  return new Worker<T>('alien-eyes-audits', processor, {
    connection: config.connection,
    concurrency: 1
  });
}
