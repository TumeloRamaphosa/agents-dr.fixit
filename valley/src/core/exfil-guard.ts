/**
 * Exfil Guard
 * Secret scanner before any tool calls or external requests
 * Prevents API keys, tokens, passwords from leaking
 */

import * as crypto from 'crypto';

export class ExfilGuard {
  private patterns: RegExp[];
  private redactionToken: string = '[REDACTED]';
  
  constructor() {
    // Patterns for detecting sensitive data
    this.patterns = [
      // API Keys
      /sk-[a-zA-Z0-9]{48,}/g,               // OpenAI
      /sk-or-[a-zA-Z0-9]{32,}/g,            // OpenRouter
      /sk-sr[a-zA-Z0-9]{24,}/g,             // Perplexity
      /[a-zA-Z0-9]{32,}-[a-zA-Z0-9]{16,}/g, // Generic keys
      
      // Tokens
      /ghp_[a-zA-Z0-9]{36,}/g,              // GitHub
      /glpat-[a-zA-Z0-9]{20,}/g,            // GitLab
      /[0-9a-f]{64}/g,                      // Hashes that look like tokens
      
      // Secrets
      /password[=:]\s*['"]?[^\s'"]+['"]?/gi,
      /api_key[=:]\s*['"]?[^\s'"]+['"]?/gi,
      /secret[=:]\s*['"]?[^\s'"]+['"]?/gi,
      /token[=:]\s*['"]?[^\s'"]+['"]?/gi,
      
      // AWS Keys
      /AKIA[0-9A-Z]{16}/g,
      
      // Bank/Credit Card (basic patterns)
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      
      // Email with password
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}:[^\s]+/g,
    ];
  }
  
  /**
   * Scan text for sensitive data
   * Returns { safe: boolean, findings: Array, sanitized: string }
   */
  scan(text: string): { 
    safe: boolean; 
    findings: Array<{ type: string; position: number; redacted: string }>; 
    sanitized: string 
  } {
    let sanitized = text;
    const findings: Array<{ type: string; position: number; redacted: string }> = [];
    
    // Check each pattern
    for (const pattern of this.patterns) {
      const matches = text.matchAll(pattern);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          const type = this.classifyType(match[0]);
          const hash = crypto.createHash('sha256').update(match[0]).digest('hex').slice(0, 8);
          
          findings.push({
            type,
            position: match.index,
            redacted: `[${type}:${hash}]`
          });
          
          // Replace in sanitized version
          sanitized = sanitized.replace(match[0], this.redactionToken);
        }
      }
    }
    
    return {
      safe: findings.length === 0,
      findings,
      sanitized
    };
  }
  
  /**
   * Quick check - returns true if safe, false if secrets detected
   */
  quickScan(text: string): boolean {
    for (const pattern of this.patterns) {
      if (pattern.test(text)) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Classify the type of sensitive data
   */
  private classifyType(match: string): string {
    if (match.startsWith('sk-')) return 'API_KEY';
    if (match.startsWith('ghp_')) return 'GITHUB_TOKEN';
    if (match.startsWith('glpat-')) return 'GITLAB_TOKEN';
    if (match.startsWith('AKIA')) return 'AWS_KEY';
    if (match.includes('@') && match.includes(':')) return 'CREDENTIALS';
    if (/\d{4}[\s-]?\d{4}/.test(match)) return 'CARD_NUMBER';
    if (match.toLowerCase().includes('password')) return 'PASSWORD';
    if (match.toLowerCase().includes('secret')) return 'SECRET';
    return 'SENSITIVE';
  }
  
  /**
   * Log blocked attempts (audit trail)
   */
  logBlocked(content: string, context: string): void {
    const timestamp = new Date().toISOString();
    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
    
    console.warn(`[ExfilGuard] Blocked: ${context} | Hash: ${hash} | Time: ${timestamp}`);
    
    // Write to audit log
    // This would connect to audit-log.ts in production
  }
  
  /**
   * Add custom patterns
   */
  addPattern(pattern: RegExp): void {
    this.patterns.push(pattern);
  }
  
  /**
   * Validate before tool call
   */
  validateToolCall(toolName: string, params: Record<string, any>): { allowed: boolean; reason?: string } {
    const paramsString = JSON.stringify(params);
    const scan = this.scan(paramsString);
    
    if (!scan.safe) {
      this.logBlocked(paramsString, `Tool: ${toolName}`);
      return {
        allowed: false,
        reason: `Secrets detected: ${scan.findings.map(f => f.type).join(', ')}`
      };
    }
    
    return { allowed: true };
  }
}

// Singleton export
export const exfilGuard = new ExfilGuard();
