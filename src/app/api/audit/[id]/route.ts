import { NextResponse } from 'next/server';
import { getAuditJob } from '@/lib/audit-jobs';
import { getOptionalRequestUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await getAuditJob(id);
  if (!job) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
  }

  if (job.userId) {
    const user = await getOptionalRequestUser(request);
    if (!user || user.id !== job.userId) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }
  }

  return NextResponse.json(job);
}
