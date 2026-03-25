import { AuthActions } from '@/components/account/auth-actions';

export default function SignupPage() {
  return (
    <main id="main-content" className="shell section">
      <AuthActions mode="signup" />
    </main>
  );
}
