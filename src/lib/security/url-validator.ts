import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import type { URLValidationResult } from '@/types';

type LookupFn = (hostname: string, options: { all: true }) => Promise<Array<{ address: string; family: number }>>;

export interface URLValidatorOptions {
  allowHttp?: boolean;
  allowIpAddresses?: boolean;
  lookupFn?: LookupFn;
}

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal']);
const BLOCKED_IPV4 = [
  { cidr: '127.0.0.0/8', reason: 'loopback address' },
  { cidr: '10.0.0.0/8', reason: 'private RFC1918 range' },
  { cidr: '172.16.0.0/12', reason: 'private RFC1918 range' },
  { cidr: '192.168.0.0/16', reason: 'private RFC1918 range' },
  { cidr: '169.254.0.0/16', reason: 'link-local address' },
  { cidr: '169.254.169.254/32', reason: 'cloud metadata address' }
];
const BLOCKED_IPV6 = [
  { prefix: '::1', bits: 128, reason: 'loopback address' },
  { prefix: 'fc00::', bits: 7, reason: 'private unique-local address' },
  { prefix: 'fe80::', bits: 10, reason: 'link-local address' }
];

export class URLValidator {
  private readonly allowHttp: boolean;
  private readonly allowIpAddresses: boolean;
  private readonly lookupFn: LookupFn;

  constructor(options: URLValidatorOptions = {}) {
    this.allowHttp = options.allowHttp ?? false;
    this.allowIpAddresses = options.allowIpAddresses ?? false;
    this.lookupFn = options.lookupFn ?? ((hostname, opts) => lookup(hostname, opts));
  }

  async validate(rawUrl: string): Promise<URLValidationResult> {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return this.blocked(rawUrl, 'invalid URL format');
    }

    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return this.blocked(parsed.toString(), 'unsupported URL scheme');
    }
    if (parsed.protocol === 'http:' && !this.allowHttp) {
      return this.blocked(parsed.toString(), 'http URLs are blocked unless explicitly allowed');
    }

    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return this.blocked(parsed.toString(), 'blocked hostname');
    }

    if (isIP(hostname)) {
      if (!this.allowIpAddresses) {
        return this.blocked(parsed.toString(), 'IP addresses are blocked unless explicitly allowed');
      }
      const ipBlockReason = getIpBlockReason(hostname);
      if (ipBlockReason) {
        return this.blocked(parsed.toString(), ipBlockReason, [hostname]);
      }
      return {
        valid: true,
        url: parsed.toString(),
        resolvedIPs: [hostname],
        blocked: false
      };
    }

    const firstResolution = await this.resolveAndValidate(hostname, parsed.toString());
    if (firstResolution.blocked) {
      return firstResolution;
    }

    const secondResolution = await this.resolveAndValidate(hostname, parsed.toString());
    if (secondResolution.blocked) {
      return secondResolution;
    }

    const firstSet = new Set(firstResolution.resolvedIPs);
    const secondSet = new Set(secondResolution.resolvedIPs);
    if (firstSet.size !== secondSet.size || [...firstSet].some((ip) => !secondSet.has(ip))) {
      return this.blocked(parsed.toString(), 'DNS rebinding detected', secondResolution.resolvedIPs);
    }

    return {
      valid: true,
      url: parsed.toString(),
      resolvedIPs: firstResolution.resolvedIPs,
      blocked: false
    };
  }

  private async resolveAndValidate(hostname: string, url: string): Promise<URLValidationResult> {
    let entries: Array<{ address: string; family: number }>;
    try {
      entries = await Promise.race([
        this.lookupFn(hostname, { all: true }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('DNS lookup timeout')), 10_000)
        ),
      ]);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code === 'ENOTFOUND' || code === 'ENODATA') {
        return this.blocked(url, 'DNS resolution failed');
      }
      return this.blocked(url, 'DNS resolution failed (transient)');
    }

    const resolvedIPs = Array.from(new Set(entries.map((entry) => entry.address)));
    for (const ip of resolvedIPs) {
      const reason = getIpBlockReason(ip);
      if (reason) {
        return this.blocked(url, reason, resolvedIPs);
      }
    }

    return {
      valid: true,
      url,
      resolvedIPs,
      blocked: false
    };
  }

  private blocked(url: string, reason: string, resolvedIPs: string[] = []): URLValidationResult {
    return {
      valid: false,
      url,
      resolvedIPs,
      blocked: true,
      blockReason: reason
    };
  }
}

function getIpBlockReason(ip: string): string | undefined {
  if (isIP(ip) === 4) {
    const value = ipv4ToInt(ip);
    for (const blocked of BLOCKED_IPV4) {
      const [network, bits] = blocked.cidr.split('/');
      const maskBits = Number(bits);
      const networkValue = ipv4ToInt(network);
      const mask = maskBits === 0 ? 0 : (~((1 << (32 - maskBits)) - 1)) >>> 0;
      if ((value & mask) === (networkValue & mask)) {
        return blocked.reason;
      }
    }
    return undefined;
  }

  if (isIP(ip) === 6) {
    const candidate = ipv6ToBigInt(ip);
    for (const blocked of BLOCKED_IPV6) {
      const prefixValue = ipv6ToBigInt(blocked.prefix);
      const shift = BigInt(128 - blocked.bits);
      if ((candidate >> shift) === (prefixValue >> shift)) {
        return blocked.reason;
      }
    }
  }

  return undefined;
}

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + Number(octet)) >>> 0, 0);
}

function ipv6ToBigInt(ip: string): bigint {
  const [head, tail = ''] = ip.split('::');
  const headParts = head ? head.split(':').filter(Boolean) : [];
  const tailParts = tail ? tail.split(':').filter(Boolean) : [];
  const missing = 8 - (headParts.length + tailParts.length);
  const parts = [
    ...headParts,
    ...Array.from({ length: Math.max(missing, 0) }, () => '0'),
    ...tailParts
  ];

  return parts.reduce((acc, part) => (acc << 16n) + BigInt(parseInt(part || '0', 16)), 0n);
}
