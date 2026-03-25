import { Card } from '@/components/ui/card';

export function Narrative({ text }: { text: string }) {
  return (
    <Card style={{ padding: '1.5rem' }}>
      <h2 className="section-title">What It Felt Like</h2>
      <p className="muted">{text}</p>
    </Card>
  );
}
