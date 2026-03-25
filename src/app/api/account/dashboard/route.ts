import { NextResponse } from 'next/server';
import {
  buildDashboardTrendSeries,
  getRequiredRequestUser,
  listAuditsForUser,
  RequestAuthError
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getRequiredRequestUser(request);
    const audits = await listAuditsForUser(user.id);
    const trendSeries = buildDashboardTrendSeries(audits);
    return NextResponse.json({ audits, trendSeries });
  } catch (error) {
    if (error instanceof RequestAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : 'Failed to load dashboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
