import { listPrimitives, runPrimitives } from '@/orchestrator/primitive-runner';

interface PrimitivesOptions {
  primitives?: string[];
  quick?: boolean;
  format?: string;
  pageLimit?: number;
  help?: boolean;
}

export async function runPrimitivesCommand(
  positionals: string[],
  options: PrimitivesOptions
): Promise<number> {
  const subcommand = positionals[0];

  if (options.help || !subcommand) {
    process.stdout.write(primitivesHelp());
    return 0;
  }

  if (subcommand === 'list') {
    return listCommand(options);
  }

  if (subcommand === 'run') {
    const domain = positionals[1];
    if (!domain) {
      process.stderr.write('Usage: ae primitives run <domain> [--primitives seo,traffic-analysis]\n');
      return 2;
    }
    return runCommand(domain, options);
  }

  process.stderr.write(`Unknown subcommand: primitives ${subcommand}\n`);
  return 2;
}

function listCommand(options: PrimitivesOptions): number {
  const all = listPrimitives();
  const isJson = options.format === 'format-json';

  if (isJson) {
    process.stdout.write(JSON.stringify(all.map(p => ({
      name: p.name,
      type: p.type,
      dimension: p.dimension,
      category: p.category,
      usesLLM: p.usesLLM,
      costEstimate: p.costEstimate,
      dependencies: p.dependencies ?? [],
      requiresKeys: p.requiresKeys ?? [],
    })), null, 2) + '\n');
    return 0;
  }

  const quality = all.filter(p => p.category === 'quality');
  const marketing = all.filter(p => p.category === 'marketing');

  process.stdout.write(`\n  Quality primitives (${quality.length}):\n`);
  for (const p of quality) {
    const llm = p.usesLLM ? ' [LLM]' : '';
    process.stdout.write(`    ${p.name.padEnd(22)} ${p.type.padEnd(8)} ${p.dimension}${llm}\n`);
  }

  process.stdout.write(`\n  Marketing primitives (${marketing.length}):\n`);
  for (const p of marketing) {
    const llm = p.usesLLM ? ' [LLM]' : '';
    const deps = p.dependencies?.length ? ` (needs: ${p.dependencies.join(', ')})` : '';
    process.stdout.write(`    ${p.name.padEnd(22)} ${p.type.padEnd(8)} ${p.dimension}${llm}${deps}\n`);
  }

  process.stdout.write(`\n  Total: ${all.length} primitives\n\n`);
  return 0;
}

async function runCommand(domain: string, options: PrimitivesOptions): Promise<number> {
  const isJson = options.format === 'format-json';

  try {
    const result = await runPrimitives({
      domain,
      primitives: options.primitives,
      config: {
        tier: options.quick ? 'quick_check' : 'full_audit',
        pageLimit: options.pageLimit ?? 10,
      },
    });

    if (isJson) {
      const output: Record<string, unknown> = {
        domain: result.domain,
        durationMs: result.durationMs,
        executionOrder: result.executionOrder,
        results: Object.fromEntries(result.results),
      };
      process.stdout.write(JSON.stringify(output, null, 2) + '\n');
    } else {
      process.stdout.write(`\n  Ran ${result.results.size} primitives on ${result.domain} (${result.durationMs}ms)\n\n`);
      for (const [name, envelope] of result.results) {
        const count = envelope.data.length;
        const status = envelope.status === 'success' ? 'OK' : 'ERR';
        process.stdout.write(`    ${name.padEnd(22)} ${status.padEnd(5)} ${count} findings (confidence: ${envelope.confidence})\n`);
      }
      const total = [...result.results.values()].reduce((sum, e) => sum + e.data.length, 0);
      process.stdout.write(`\n  Total findings: ${total}\n\n`);
    }

    return 0;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Primitive run failed.'}\n`);
    return 2;
  }
}

function primitivesHelp(): string {
  return [
    'Usage: ae primitives <subcommand> [options]',
    '',
    'Subcommands:',
    '  list                  List all registered primitives',
    '  run <domain>          Run primitives on a domain',
    '',
    'Run Options:',
    '  --primitives <list>   Comma-separated names (default: all)',
    '  --json                Output as JSON',
    '  --quick               Deterministic mode, no LLM',
    '  --pages <n>           Page limit for crawl primitives',
    ''
  ].join('\n');
}
