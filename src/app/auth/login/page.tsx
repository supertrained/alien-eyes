import { AuthActions } from '@/components/account/auth-actions';

export default function LoginPage() {
  return (
    <main id="main-content" className="shell section">
      <AuthActions mode="login" />
    </main>
  );
}
