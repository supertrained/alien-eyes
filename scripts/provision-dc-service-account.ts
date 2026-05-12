import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';

const SERVICE_EMAIL = 'dc-service@alieneyes.dev';
const SERVICE_NAME = 'Dual Cognition Service';
const API_KEY_NAME = 'dc-audit-trigger';

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Create Supabase auth user (or retrieve if exists)
  let userId: string;

  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existing = existingUsers?.users.find((u) => u.email === SERVICE_EMAIL);

  if (existing) {
    userId = existing.id;
    console.log(`Auth user already exists: ${userId}`);
  } else {
    const password = randomBytes(32).toString('hex');
    const { data: created, error } = await admin.auth.admin.createUser({
      email: SERVICE_EMAIL,
      password,
      email_confirm: true,
      user_metadata: { full_name: SERVICE_NAME, role: 'service_account' },
    });
    if (error || !created.user) {
      console.error('Failed to create auth user:', error?.message);
      process.exit(1);
    }
    userId = created.user.id;
    console.log(`Created auth user: ${userId}`);
  }

  // 2. Upsert into aeb_users
  const { error: upsertError } = await admin.from('aeb_users').upsert(
    {
      id: userId,
      email: SERVICE_EMAIL,
      display_name: SERVICE_NAME,
      avatar_url: null,
      auth_provider: 'service_account',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (upsertError) {
    console.error('Failed to upsert aeb_users row:', upsertError.message);
    process.exit(1);
  }
  console.log('aeb_users row synced');

  // 3. Check for existing active API key
  const { data: existingKeys } = await admin
    .from('aeb_api_keys')
    .select('id, name, key_prefix, is_active')
    .eq('user_id', userId)
    .eq('name', API_KEY_NAME)
    .eq('is_active', true);

  if (existingKeys && existingKeys.length > 0) {
    console.log(`\nActive API key already exists for "${API_KEY_NAME}" (prefix: ${existingKeys[0].key_prefix})`);
    console.log('Deactivate it first if you need to rotate.');
    process.exit(0);
  }

  // 4. Create API key with ae_live_ prefix
  const rawKey = `ae_live_${randomBytes(18).toString('hex')}`;
  const keyPrefix = rawKey.slice(0, 8);
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const { data: keyRow, error: keyError } = await admin
    .from('aeb_api_keys')
    .insert({
      user_id: userId,
      name: API_KEY_NAME,
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })
    .select('id')
    .single();

  if (keyError || !keyRow) {
    console.error('Failed to create API key:', keyError?.message);
    process.exit(1);
  }

  console.log('\n=== DC Service Account Provisioned ===');
  console.log(`User ID:  ${userId}`);
  console.log(`Email:    ${SERVICE_EMAIL}`);
  console.log(`Key ID:   ${keyRow.id}`);
  console.log(`API Key:  ${rawKey}`);
  console.log('\nStore this key securely — it cannot be retrieved again.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
