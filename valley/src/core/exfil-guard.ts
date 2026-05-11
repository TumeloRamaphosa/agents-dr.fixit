import { isEnabled } from './kill-switches.js';

export interface GuardResult {
  allowed: boolean;
  reason?: string;
  blocked?: string;
}

const BLOCKED_PATTERNS = [
  /password/i,
  /secret/i,
  /private[_-]?key/i,
  /\.env/i,
  /credit[_-]?card/i,
  /ssn/i,
  /social[_-]?security/i,
  /api[_-]?key.*=.*[a-zA-Z0-9]{20,}/i,
];

const BLOCKED_DOMAINS = [
  'pastebin.com',
  'dumpz.org',
];

export function checkExfil(content: string, destination?: string): GuardResult {
  if (!isEnabled('EXFIL_GUARD_ENABLED')) {
    return { allowed: true };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return {
        allowed: false,
        reason: 'Content matches sensitive pattern',
        blocked: pattern.source,
      };
    }
  }

  if (destination) {
    for (const domain of BLOCKED_DOMAINS) {
      if (destination.includes(domain)) {
        return {
          allowed: false,
          reason: `Blocked destination: ${domain}`,
          blocked: domain,
        };
      }
    }
  }

  const hexPattern = /[a-fA-F0-9]{40,}/g;
  const matches = content.match(hexPattern);
  if (matches && matches.length > 0) {
    return {
      allowed: false,
      reason: 'Content contains potential secret/key material',
      blocked: 'long-hex-string',
    };
  }

  return { allowed: true };
}

export function guardEnvVars(envString: string): GuardResult {
  if (!isEnabled('EXFIL_GUARD_ENABLED')) {
    return { allowed: true };
  }

  const lines = envString.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const value = trimmed.slice(eq + 1).trim();
    if (value && !value.includes('your_') && !value.includes('xxx') && value.length > 3) {
      return {
        allowed: false,
        reason: 'Contains populated environment variables',
        blocked: 'env-values',
      };
    }
  }
  return { allowed: true };
}