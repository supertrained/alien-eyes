import { describe, expect, it } from 'vitest';
import { URLValidator } from '@/lib/security/url-validator';

describe('URLValidator', () => {
  it('blocks RFC1918 IPv4 ranges', async () => {
    const validator = new URLValidator({ allowIpAddresses: true });
    const result = await validator.validate('https://10.1.2.3/path');
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain('private');
  });

  it('blocks cloud metadata addresses', async () => {
    const validator = new URLValidator({ allowIpAddresses: true });
    const result = await validator.validate('https://169.254.169.254/latest/meta-data');
    expect(result.blocked).toBe(true);
  });

  it('blocks localhost hostnames', async () => {
    const validator = new URLValidator();
    const result = await validator.validate('https://localhost:3000');
    expect(result.blocked).toBe(true);
  });

  it('detects DNS rebinding when resolved IPs change', async () => {
    let callCount = 0;
    const validator = new URLValidator({
      lookupFn: async () => {
        callCount += 1;
        return callCount === 1
          ? [{ address: '93.184.216.34', family: 4 }]
          : [{ address: '93.184.216.35', family: 4 }];
      }
    });

    const result = await validator.validate('https://example.com');
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain('DNS rebinding');
  });

  it('accepts a legitimate public URL', async () => {
    const validator = new URLValidator({
      lookupFn: async () => [{ address: '93.184.216.34', family: 4 }]
    });

    const result = await validator.validate('https://example.com');
    expect(result.valid).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.resolvedIPs).toEqual(['93.184.216.34']);
  });

  it('blocks http by default', async () => {
    const validator = new URLValidator({
      lookupFn: async () => [{ address: '93.184.216.34', family: 4 }]
    });

    const result = await validator.validate('http://example.com');
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain('http URLs');
  });
});
