'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/auth';

export function AccountNav() {
  const supabase = useMemo(() => {
    try {
      return getSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(Boolean(data.session));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <nav className="account-nav" aria-label="Account">
      <a href="/">Home</a>
      {isAuthenticated ? <a href="/dashboard">Dashboard</a> : <a href="/auth/login">Sign in</a>}
    </nav>
  );
}
