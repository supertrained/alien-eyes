import type { AuditPrimitive } from '@/types';
import type { ModelRouter } from '@/lib/llm/model-router';
import { AccessibilityPrimitive } from '@/primitives/accessibility';
import { AgentNativenessPrimitive } from '@/primitives/agent-nativeness';
import { CopyUxPrimitive } from '@/primitives/copy-ux';
import { PerformancePrimitive } from '@/primitives/performance';
import { SecurityPrimitive } from '@/primitives/security';
import { SeoPrimitive } from '@/primitives/seo';

export function createPrimitiveRegistry(router?: ModelRouter): AuditPrimitive[] {
  return [
    new SeoPrimitive({ router }),
    new AccessibilityPrimitive({ router }),
    new SecurityPrimitive({ router }),
    new PerformancePrimitive({ router }),
    new AgentNativenessPrimitive({ router }),
    new CopyUxPrimitive({ router })
  ];
}

export {
  AccessibilityPrimitive,
  AgentNativenessPrimitive,
  CopyUxPrimitive,
  PerformancePrimitive,
  SecurityPrimitive,
  SeoPrimitive
};
