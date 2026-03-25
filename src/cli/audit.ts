import type { AuditConfig, RendererRegistry } from '@/types';
import { runAuditPipeline } from '@/orchestrator/pipeline';
import { ProgressEmitter } from '@/orchestrator/progress';

export interface AuditCommandOptions {
  format: keyof RendererRegistry;
  pageLimit: number;
  quick: boolean;
  verbose: boolean;
}

export interface AuditCommandIO {
  stdout: { write: (chunk: string) => void };
  stderr: { write: (chunk: string) => void };
}

export async function runAuditCommand(
  url: string,
  options: AuditCommandOptions,
  io: AuditCommandIO = { stdout: process.stdout, stderr: process.stderr },
  runPipeline: typeof runAuditPipeline = runAuditPipeline
): Promise<number> {
  const progressEmitter = new ProgressEmitter();
  const spinner = createSpinner(io.stderr, options.verbose);
  progressEmitter.onProgress((event) => spinner.update(event.message));

  const config: AuditConfig = {
    tier: options.quick ? 'quick_check' : 'full_audit',
    ownershipVerified: false,
    pageLimit: options.pageLimit,
    costBudget: 5,
    methodologyVersion: 'v0.1',
    isReAudit: false
  };

  if (!options.quick && !process.env.ANTHROPIC_API_KEY) {
    io.stderr.write('ANTHROPIC_API_KEY is required for full audits. Use --quick for deterministic mode.\n');
    return 2;
  }

  try {
    spinner.start();
    const result = await runPipeline(url, config, { progressEmitter });
    spinner.stop();
    io.stdout.write(result.rendered[options.format] + '\n');
    return result.synthesis.findings.length > 0 ? 1 : 0;
  } catch (error) {
    spinner.stop();
    io.stderr.write(`${error instanceof Error ? error.message : 'Audit failed.'}\n`);
    return 2;
  }
}

function createSpinner(stream: AuditCommandIO['stderr'], enabled: boolean) {
  const frames = ['-', '\\', '|', '/'];
  let index = 0;
  let timer: NodeJS.Timeout | undefined;
  let message = 'Starting audit';

  return {
    start() {
      if (!enabled) {
        return;
      }
      timer = setInterval(() => {
        stream.write(`\r${frames[index % frames.length]} ${message}`);
        index += 1;
      }, 80);
    },
    update(nextMessage: string) {
      message = nextMessage;
      if (enabled) {
        stream.write(`\r${frames[index % frames.length]} ${message}`);
      }
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
      if (enabled) {
        stream.write('\r');
        stream.write(' '.repeat(Math.max(10, message.length + 4)));
        stream.write('\r');
      }
    }
  };
}
