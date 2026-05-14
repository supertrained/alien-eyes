import { NextResponse } from 'next/server';
import { z } from 'zod';
import registry from '@/lib/primitive-registry';
import { runPrimitives } from '@/orchestrator/primitive-runner';
import { getRequiredRequestUser, RequestAuthError } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

const requestSchema = z.object({
  domain: z.string().min(1).max(253).regex(DOMAIN_RE, 'Invalid domain format'),
  primitives: z.array(z.string()).optional(),
  config: z.object({
    tier: z.enum(['quick_check', 'full_audit']).optional(),
    pageLimit: z.number().int().positive().max(50).optional(),
  }).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getRequiredRequestUser(request);
    const body = requestSchema.parse(await request.json());

    const resolvedNames = body.primitives?.length
      ? registry.resolveDependencies(body.primitives)
      : registry.names();

    const missingKeys = registry.checkRequiredKeys(resolvedNames);
    if (missingKeys.length > 0) {
      return NextResponse.json({
        error: 'Missing required API keys for requested primitives',
        missingKeys,
      }, { status: 422 });
    }

    const result = await runPrimitives({
      domain: body.domain,
      primitives: body.primitives,
      config: {
        tier: body.config?.tier ?? 'quick_check',
        pageLimit: body.config?.pageLimit ?? 10,
      },
    });

    return NextResponse.json({
      domain: result.domain,
      durationMs: result.durationMs,
      executionOrder: result.executionOrder,
      userId: user.id,
      results: Object.fromEntries(
        [...result.results].map(([name, envelope]) => [name, {
          status: envelope.status,
          findingCount: envelope.data.length,
          confidence: envelope.confidence,
          confidenceFactors: envelope.confidenceFactors,
          findings: envelope.data,
          metadata: envelope.metadata,
        }])
      ),
    });
  } catch (error) {
    if (error instanceof RequestAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Invalid request';
    const status = error instanceof z.ZodError || error instanceof SyntaxError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
