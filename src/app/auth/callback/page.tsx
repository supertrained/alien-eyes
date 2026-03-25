import { Suspense } from 'react';
import { AuthCallbackClient } from '@/components/account/auth-callback-client';

export default function AuthCallbackPage() {
  return (
    <main id="main-content" className="shell section">
      <Suspense fallback={
        <div className="panel auth-panel">
          <span className="eyebrow">Auth callback</span>
          <h1 className="section-title">Finishing sign-in…</h1>
          <p className="muted">Exchanging your session and syncing your Alien Eyes account.</p>
        </div>
      }>
        <AuthCallbackClient />
      </Suspense>
    </main>
  );
}
