# Alien Eyes JSON Schemas

Stable output contracts for external consumers.

## audit-output.schema.json

JSON Schema for the output of `ae audit --json`. This is the primary integration contract for systems that consume Alien Eyes audit results programmatically.

### Usage

**Python (jsonschema):**
```python
import json
from jsonschema import validate

with open("schemas/audit-output.schema.json") as f:
    schema = json.load(f)

validate(instance=audit_result, schema=schema)
```

**TypeScript (direct import):**
```typescript
import type { SynthesisResult, Finding, Envelope } from 'alien-eyes/types';
```

### Versioning

The schema follows the `methodologyVersion` field in the output. Breaking changes to the output format increment the methodology version and are documented in the changelog.

### Key types for integration

| Type | Description |
|------|-------------|
| `SynthesisResult` | Top-level output of `ae audit --json` |
| `Finding` | Atomic unit of output — what/where/why/verify/severity |
| `Envelope<T>` | Wrapper for individual primitive results |
| `Score` | Numeric score with confidence interval and grade |
| `EvidenceBundle` | Proof that a finding is real |

### Envelope types

Preflight primitives return `Envelope<Finding[]>` with structured Finding objects.

Marketing primitives (Growth Audit) return `Envelope<any>` with free-form JSON per primitive. The `Envelope` schema in this file documents the wrapper; the inner data shape varies by primitive.

External consumers that need to handle both should use adapter interfaces. See the [Dual Cognition integration layer](https://github.com/supertrained/dual-cognition/tree/main/tools/audit-tools/ae-integration) for an example.
