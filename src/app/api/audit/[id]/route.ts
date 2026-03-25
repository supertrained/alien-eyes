import { NextResponse } from 'next/server';
import { getAuditJob } from '@/lib/audit-jobs';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await getAuditJob(id);
  if (!job) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}
