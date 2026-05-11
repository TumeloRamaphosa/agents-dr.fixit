export { loadSwitches, isEnabled, getSwitch, getSwitchNumber, checkKillPhrase, allSwitches, getIdleHours } from './kill-switches.js';

export { getVaultPath, getValleyOSPath, ensureVaultTree, seedVault, readVaultFile, writeVaultFile, listVaultFiles } from './vault.js';

export { ModelClient } from './model.js';
export type { Provider, ModelConfig, ChatMessage, ChatResponse } from './model.js';

export { classifyIntent, getAgentDescription, getAllCodenames } from './classifier.js';
export type { ClassifierResult } from './classifier.js';

export { MemoryStore } from './memory.js';
export type { MemoryEntry } from './memory.js';

export { AuditLog, newCorrelationId } from './audit.js';
export type { AuditEvent } from './audit.js';

export { checkExfil, guardEnvVars } from './exfil-guard.js';
export type { GuardResult } from './exfil-guard.js';

export { CostFooter } from './cost-footer.js';
export type { DailyAgentSummary } from './cost-footer.js';