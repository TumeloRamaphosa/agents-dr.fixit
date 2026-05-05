/**
 * Cost Footer
 * Appends cost line to every reply
 * Tracks token usage and enforces budget limits
 */

import Database from 'better-sqlite3';

export interface CostEntry {
  timestamp: Date;
  agentId: string;
  model: string;
  provider: 'local' | 'anthropic' | 'openai' | 'other';
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  operation: string;
}

export interface BudgetStatus {
  dailySpent: number;
  dailyBudget: number;
  remaining: number;
  percentUsed: number;
  monthToDate: number;
}

export class CostFooter {
  private db: Database.Database;
  private dailyBudget: number = 3.4; // USD per day
  private overageThreshold: number = 0.8; // Alert at 80%
  
  constructor(dbPath: string = './data/costs.db') {
    this.db = new Database(dbPath);
    this.initialize();
  }
  
  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS costs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        model TEXT NOT NULL,
        provider TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        cost_usd REAL NOT NULL,
        operation TEXT NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_costs_date ON costs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_costs_agent ON costs(agent_id);
    `);
  }
  
  /**
   * Track a cost entry
   */
  track(entry: Omit<CostEntry, 'timestamp' | 'costUsd'>): CostEntry {
    const timestamp = new Date();
    
    // Calculate cost based on provider/model
    const costUsd = this.calculateCost(
      entry.provider,
      entry.model,
      entry.inputTokens,
      entry.outputTokens
    );
    
    const fullEntry: CostEntry = {
      ...entry,
      timestamp,
      costUsd
    };
    
    // Store in database
    const stmt = this.db.prepare(`
      INSERT INTO costs (timestamp, agent_id, model, provider, input_tokens, output_tokens, cost_usd, operation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      timestamp.toISOString(),
      entry.agentId,
      entry.model,
      entry.provider,
      entry.inputTokens,
      entry.outputTokens,
      costUsd,
      entry.operation
    );
    
    return fullEntry;
  }
  
  /**
   * Calculate cost based on provider pricing
   */
  private calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      // Local models = free (just electricity)
      'ollama': { input: 0, output: 0 },
      'local': { input: 0, output: 0 },
      
      // Anthropic (per 1K tokens)
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
      
      // OpenAI
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    };
    
    const price = pricing[model] || pricing[provider] || { input: 0, output: 0 };
    
    return (inputTokens / 1000 * price.input) + (outputTokens / 1000 * price.output);
  }
  
  /**
   * Get current day's cost
   */
  getDailyCost(): number {
    const today = new Date().toISOString().split('T')[0];
    
    const result = this.db.prepare(`
      SELECT SUM(cost_usd) as total
      FROM costs
      WHERE date(timestamp) = date(?)
    `).get(today) as { total: number };
    
    return result.total || 0;
  }
  
  /**
   * Get budget status
   */
  getBudgetStatus(): BudgetStatus {
    const dailySpent = this.getDailyCost();
    const remaining = this.dailyBudget - dailySpent;
    const percentUsed = (dailySpent / this.dailyBudget) * 100;
    
    // Get month-to-date
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthResult = this.db.prepare(`
      SELECT SUM(cost_usd) as total
      FROM costs
      WHERE timestamp >= ?
    `).get(startOfMonth.toISOString()) as { total: number };
    
    return {
      dailySpent,
      dailyBudget: this.dailyBudget,
      remaining: Math.max(0, remaining),
      percentUsed,
      monthToDate: monthResult.total || 0
    };
  }
  
  /**
   * Generate cost footer string for appending to messages
   */
  generateFooter(): string {
    const status = this.getBudgetStatus();
    const date = new Date().toISOString().split('T')[0];
    
    return `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Valley OS Cost Tracker | ${date}
Today's Spend: $${status.dailySpent.toFixed(3)} / $${status.dailyBudget.toFixed(2)} (${status.percentUsed.toFixed(1)}%)
Month-to-Date: $${status.monthToDate.toFixed(2)}
Budget Status: ${status.percentUsed < 80 ? '🟢 Healthy' : status.percentUsed < 100 ? '🟠 Caution' : '🔴 Budget Exceeded'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }
  
  /**
   * Generate compact footer for voice/audio
   */
  generateVoiceFooter(): string {
    const status = this.getBudgetStatus();
    return `Cost today: ${status.percentUsed.toFixed(0)} percent of budget used.`;
  }
  
  /**
   * Check if we should escalate to local models
   */
  shouldUseLocal(): boolean {
    const status = this.getBudgetStatus();
    // Switch to local when approaching 80% of budget
    return status.percentUsed >= (this.overageThreshold * 100);
  }
  
  /**
   * Get cost breakdown by agent
   */
  getAgentCosts(): Array<{ agentId: string; totalCost: number; percentage: number }> {
    const today = new Date().toISOString().split('T')[0];
    const totalCost = this.getDailyCost();
    
    const results = this.db.prepare(`
      SELECT agent_id, SUM(cost_usd) as total
      FROM costs
      WHERE date(timestamp) = date(?)
      GROUP BY agent_id
      ORDER BY total DESC
    `).all(today) as Array<{ agent_id: string; total: number }>;
    
    return results.map(r => ({
      agentId: r.agent_id,
      totalCost: r.total,
      percentage: totalCost > 0 ? (r.total / totalCost) * 100 : 0
    }));
  }
  
  /**
   * Get stats for daily report
   */
  getDailyReport(): string {
    const status = this.getBudgetStatus();
    const agentCosts = this.getAgentCosts();
    
    let report = '📊 Valley OS Daily Cost Report\n\n';
    report += `Daily Budget: $${status.dailyBudget.toFixed(2)}\n`;
    report += `Spent Today: $${status.dailySpent.toFixed(4)} (${status.percentUsed.toFixed(2)}%)\n`;
    report += `Remaining: $${status.remaining.toFixed(4)}\n`;
    report += `Month-to-Date: $${status.monthToDate.toFixed(2)}\n\n`;
    
    report += 'By Agent:\n';
    agentCosts.forEach(a => {
      report += `  ${a.agentId}: $${a.totalCost.toFixed(4)} (${a.percentage.toFixed(1)}%)\n`;
    });
    
    report += `\n${status.percentUsed < 80 ? '✅ On budget' : status.percentUsed < 100 ? '⚠️ Approaching limit' : '❌ Budget exceeded'}`;
    
    return report;
  }
}

// Singleton export
export const costFooter = new CostFooter();
