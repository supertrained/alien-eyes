import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { startAuditJob } from '@/lib/audit-jobs';
import { getOptionalRequestUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

const requestSchema = z.object({
  url: z.string().url(),
  quick: z.boolean().optional(),
  pageLimit: z.number().int().positive().max(50).optional()
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const user = await getOptionalRequestUser(request);
    const job = await startAuditJob({
      ...body,
      userId: user?.id
    });

    const backgroundWork = (job as typeof job & { _backgroundWork?: Promise<void> })._backgroundWork;
    if (backgroundWork) {
      after(backgroundWork);
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      phase: job.phase,
      progress: job.progress
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid audit request';
    const status = error instanceof z.ZodError || error instanceof SyntaxError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
