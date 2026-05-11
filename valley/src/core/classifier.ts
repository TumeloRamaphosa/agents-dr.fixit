import type { ModelClient } from './model.js';

const AGENT_DESCRIPTIONS: Record<string, string> = {
  robusca: 'Chief of Staff — standup, council, scheduling, delegation',
  cashclaw: 'Sales — pipeline, CRM, revenue, Studex Meat',
  denchclaw: 'Customer — signups, support, onboarding',
  charlie: 'Customer — Studex Meat customer queue',
  research: 'Research — findings, insights, frameworks, Night Build problem picks',
  openfang: 'Research — web scrape, social, SGM partner news',
  cto: 'DevOps — infrastructure, agent uptime, Cursor IDE, architecture',
  skunkworks: 'DevOps — builds, prototypes, Night Build hand-offs',
  drfixit: 'DevOps — heartbeat, monitoring, restarts, anomalies',
  'the-lady': 'Media — content performance, audience, brand',
};

const KEYWORD_MAP: Record<string, string[]> = {
  robusca: ['schedule', 'standup', 'council', 'priority', 'agenda', 'meeting', 'delegat'],
  cashclaw: ['sale', 'pipeline', 'revenue', 'crm', 'deal', 'lead', 'studex meat'],
  denchclaw: ['signup', 'support', 'ticket', 'onboard', 'customer service'],
  charlie: ['meat queue', 'order', 'delivery', 'studex meat customer'],
  research: ['research', 'insight', 'framework', 'analysis', 'trend', 'find'],
  openfang: ['scrape', 'web', 'social', 'sgm', 'partner', 'news', 'market'],
  cto: ['infra', 'server', 'uptime', 'cursor', 'deploy', 'architecture', 'api'],
  skunkworks: ['build', 'prototype', 'night build', 'project', 'scaffold'],
  drfixit: ['heartbeat', 'monitor', 'restart', 'health', 'anomaly', 'fix', 'repair'],
  'the-lady': ['content', 'brand', 'audience', 'media', 'instagram', 'post', 'engagement'],
};

export interface ClassifierResult {
  codename: string;
  confidence: number;
}

export async function classifyIntent(prompt: string, model?: ModelClient): Promise<ClassifierResult> {
  const lower = prompt.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [agent, keywords] of Object.entries(KEYWORD_MAP)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    scores[agent] = score;
  }

  // Find best match
  let best = 'robusca'; // default to chief of staff
  let bestScore = 0;

  for (const [agent, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = agent;
    }
  }

  // If no keywords matched, use model for classification
  if (bestScore === 0 && model) {
    try {
      const response = await model.chat([
        { role: 'system', content: 'You are an agent classifier. Given a user prompt, return ONLY the codename of the best agent from: robusca, cashclaw, denchclaw, charlie, research, openfang, cto, skunkworks, drfixit, the-lady. No explanation.' },
        { role: 'user', content: prompt },
      ]);
      const matched = response.content.trim().toLowerCase();
      if (AGENT_DESCRIPTIONS[matched]) {
        return { codename: matched, confidence: 0.7 };
      }
    } catch {
      // fallback
    }
  }

  const confidence = bestScore > 0 ? Math.min(bestScore / 3, 1) : 0.3;
  return { codename: best, confidence };
}

export function getAgentDescription(codename: string): string {
  return AGENT_DESCRIPTIONS[codename] || 'Unknown agent';
}

export function getAllCodenames(): string[] {
  return Object.keys(AGENT_DESCRIPTIONS);
}