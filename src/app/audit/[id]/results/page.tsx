import { AuditResultsClient } from '@/components/results/audit-results-client';

export default async function AuditResultsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="shell results-shell">
      <AuditResultsClient id={id} />
    </main>
  );
}
