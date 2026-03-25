import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createApiKeyForUser,
  getRequiredRequestUser,
  listApiKeysForUser,
  RequestAuthError,
  upsertAppUserFromAuthUser
} from '@/lib/auth';

export const runtime = 'nodejs';

const createSchema = z.object({
  name: z.string().trim().min(1).max(80)
});

export async function GET(request: Request) {
  try {
    const user = await getRequiredRequestUser(request);
    const apiKeys = await listApiKeysForUser(user.id);
    return NextResponse.json({ apiKeys });
  } catch (error) {
    if (error instanceof RequestAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : 'Failed to load API keys';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequiredRequestUser(request);
    await upsertAppUserFromAuthUser(user);
    const body = createSchema.parse(await request.json());
    const apiKey = await createApiKeyForUser(user.id, body.name);
    return NextResponse.json({ apiKey });
  } catch (error) {
    if (error instanceof RequestAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const status = error instanceof z.ZodError || error instanceof SyntaxError ? 400 : 500;
    const message = error instanceof Error ? error.message : 'Failed to create API key';
    return NextResponse.json({ error: message }, { status });
  }
}
