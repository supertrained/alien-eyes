#!/usr/bin/env node
import { runAuditCommand, type AuditCommandOptions } from '@/cli/audit';

async function main(argv = process.argv.slice(2)): Promise<number> {
  try {
    const { command, positionals, options } = parseArgs(argv);

    if (options.help || !command) {
      process.stdout.write(helpText());
      return 0;
    }

    if (command !== 'audit') {
      process.stderr.write(`Unknown command: ${command}\n`);
      process.stderr.write(helpText());
      return 2;
    }

    const url = positionals[0];
    if (!url) {
      process.stderr.write('Usage error: missing <url>.\n');
      process.stderr.write(helpText());
      return 2;
    }

    return runAuditCommand(url, options);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'CLI failed.'}\n`);
    return 2;
  }
}

function parseArgs(argv: string[]): {
  command?: string;
  positionals: string[];
  options: AuditCommandOptions & { help: boolean };
} {
  const options: AuditCommandOptions & { help: boolean } = {
    format: 'format-b',
    pageLimit: 30,
    quick: false,
    verbose: false,
    help: false
  };

  const positionals: string[] = [];
  let command: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (!command && !arg.startsWith('-')) {
      command = arg;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--json') {
      options.format = 'format-json';
      continue;
    }
    if (arg === '--quick') {
      options.quick = true;
      continue;
    }
    if (arg === '--verbose') {
      options.verbose = true;
      continue;
    }
    if (arg === '--format') {
      const value = argv[index + 1];
      if (!value || !['format-a', 'format-b', 'format-c', 'format-json', 'a', 'b', 'c', 'json'].includes(value)) {
        throw new Error('--format requires one of: a, b, c, json');
      }
      options.format = normalizeFormat(value);
      index += 1;
      continue;
    }
    if (arg === '--pages') {
      const value = Number(argv[index + 1]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('--pages requires a positive number');
      }
      options.pageLimit = Math.floor(value);
      index += 1;
      continue;
    }

    positionals.push(arg);
  }

  return { command, positionals, options };
}

function normalizeFormat(value: string): AuditCommandOptions['format'] {
  switch (value) {
    case 'a':
      return 'format-a';
    case 'b':
      return 'format-b';
    case 'c':
      return 'format-c';
    case 'json':
      return 'format-json';
    default:
      return value as AuditCommandOptions['format'];
  }
}

function helpText(): string {
  return [
    'Usage: ae audit <url> [options]',
    '',
    'Commands:',
    '  audit <url>           Run an Alien Eyes audit',
    '',
    'Options:',
    '  --format a|b|c|json   Select output format (default: b)',
    '  --json                Shorthand for --format json',
    '  --pages <n>           Override page limit (default: 30)',
    '  --quick               Deterministic quick check, no LLM calls',
    '  --verbose             Show progress in stderr',
    '  --help                Show this help message',
    ''
  ].join('\n');
}

main().then((code) => {
  process.exitCode = code;
});

export { main };
