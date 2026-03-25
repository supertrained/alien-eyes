import { AuditProgress } from '@/components/audit/progress';

export default async function AuditProgressPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="shell section">
      <AuditProgress id={id} />
    </main>
  );
}
