/**
 * Agent Registry
 * All 12 Valley OS agents
 */

export { robusca, RobuscaAgent } from './robusca.js';
export { cto, CTOAgent } from './cto.js';
export { openclaw, OpenClawAgent } from './openclaw.js';
export { cashclaw, CashClawAgent } from './cashclaw.js';
export { denchclaw, DenchClawAgent } from './denchclaw.js';
export { charlie, CharlieAgent } from './charlie.js';
export { goose, GooseAgent } from './goose.js';
export { hermes, HermesAgent } from './hermes.js';
export { skunkworks, SkunkWorksAgent } from './skunkworks.js';
export { clawx, ClawXAgent } from './clawx.js';
export { research, ResearchAgent } from './research.js';
export { drfixit, DrFixItAgent } from './drfixit.js';

import { robusca } from './robusca.js';
import { cto } from './cto.js';
import { openclaw } from './openclaw.js';
import { cashclaw } from './cashclaw.js';
import { denchclaw } from './denchclaw.js';
import { charlie } from './charlie.js';
import { goose } from './goose.js';
import { hermes } from './hermes.js';
import { skunkworks } from './skunkworks.js';
import { clawx } from './clawx.js';
import { research } from './research.js';
import { drfixit } from './drfixit.js';
import { BaseAgent } from '../core/agent-base.js';

export const ALL_AGENTS: BaseAgent[] = [
  robusca, cto, openclaw, cashclaw, denchclaw, charlie,
  goose, hermes, skunkworks, clawx, research, drfixit
];

export const AGENT_MAP: Record<string, BaseAgent> = {
  robusca, cto, openclaw, cashclaw, denchclaw, charlie,
  goose, hermes, skunkworks, clawx, research, drfixit
};
