import { NextResponse } from 'next/server';
import { getRequiredRequestUser, RequestAuthError, upsertAppUserFromAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await getRequiredRequestUser(request);
    const synced = await upsertAppUserFromAuthUser(user);
    return NextResponse.json({ user: synced });
  } catch (error) {
    if (error instanceof RequestAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : 'Failed to sync account';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
