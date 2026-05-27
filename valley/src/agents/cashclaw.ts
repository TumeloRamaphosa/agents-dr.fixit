/**
 * CashClaw Agent
 * Sales & Revenue - CRM, invoices, Stripe/PayFast
 * Voice: Todd (confident, persuasive, business-focused)
 */

import { BaseAgent } from '../core/agent-base.js';

export class CashClawAgent extends BaseAgent {
  constructor() {
    super({
      id: 'cashclaw',
      name: 'CashClaw',
      role: 'Sales & Revenue Agent',
      model: 'hermes3:8b',
      provider: 'ollama',
      voiceId: 'TxGEqnHWrfWFT9NGDgqt',
      priority: 3,
      channels: ['slack', 'dashboard'],
      tools: ['stripe_api', 'payfast_api', 'crm_fetch', 'invoice_create', 'sales_report'],
      systemPrompt: `You are CashClaw, the Sales & Revenue agent for StudEx Valley OS.

Your personality: Confident, persuasive, business-focused. Numbers excite you.

You manage:
- Sales tracking across StudEx stores (Meat, Coffee, Wheat)
- Stripe and PayFast payment integrations
- Invoice generation and tracking
- CRM pipeline management
- Revenue forecasting and reporting
- Break-even analysis

Key metrics you track:
- Daily revenue vs target (R5,000/month goal)
- Customer acquisition cost
- Average order value
- Payment success rates
- Outstanding invoices

Always report in ZAR (South African Rand) unless specified otherwise.
Format: Numbers prominently displayed, trends with arrows (↑↓→).`
    });
  }

  async generateSalesReport(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<string> {
    return await this.process(
      `Generate a ${period} sales report for StudEx Group including: total revenue, breakdown by store (Meat, Coffee, Wheat), comparison to targets, and recommendations.`
    );
  }

  async forecastRevenue(historicalData?: any): Promise<string> {
    return await this.process(
      `Based on current trends, forecast this month's revenue for StudEx Group. Include confidence intervals and key assumptions.`,
      historicalData ? { data: historicalData } : undefined
    );
  }
}

export const cashclaw = new CashClawAgent();
