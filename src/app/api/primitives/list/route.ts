import { NextResponse } from 'next/server';
import { listPrimitives } from '@/orchestrator/primitive-runner';

export async function GET() {
  const all = listPrimitives();
  return NextResponse.json(all.map(p => ({
    name: p.name,
    type: p.type,
    dimension: p.dimension,
    category: p.category,
    usesLLM: p.usesLLM,
    costEstimate: p.costEstimate,
    dependencies: p.dependencies ?? [],
    requiresKeys: p.requiresKeys ?? [],
  })));
}
