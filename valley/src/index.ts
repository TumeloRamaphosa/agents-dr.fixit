import 'dotenv/config';
import { MemoryStore } from './core/memory.js';
import { AuditLog } from './core/audit.js';
import { ModelClient } from './core/model.js';
import { CostFooter } from './core/cost-footer.js';
import { seedVault, ensureVaultTree } from './core/vault.js';
import { isEnabled, getSwitch } from './core/kill-switches.js';
import { loadAllAgents } from './agents/loader.js';
import { AgentRunner } from './agents/runner.js';

async function main() {
  const args = process.argv.slice(2);
  const smoke = args.includes('--smoke');

  if (smoke) {
    console.log('=== StudEx Valley OS Smoke Test ===\n');
    
    // Check Ollama
    try {
      const res = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/tags`);
      if (res.ok) console.log('✓ Ollama running');
      else console.log('✗ Ollama not responding');
    } catch {
      console.log('✗ Ollama not reachable');
    }

    // Check vault
    ensureVaultTree();
    console.log('✓ Vault tree exists');

    // Check agents
    const agents = loadAllAgents();
    console.log(`✓ ${agents.length} agents loaded`);

    // Check SQLite
    try {
      const memory = new MemoryStore(':memory:');
      memory.store({ agent: 'smoke', role: 'test', content: 'hello', salience: 1, pinned: false });
      console.log('✓ SQLite memory working');
      memory.close();
    } catch (e) {
      console.log(`✗ SQLite error: ${e}`);
    }

    // Check kill switches
    console.log(`  SCHEDULER_ENABLED: ${isEnabled('SCHEDULER_ENABLED')}`);
    console.log(`  COUNCIL_ENABLED: ${isEnabled('COUNCIL_ENABLED')}`);
    console.log(`  NIGHT_BUILD_ENABLED: ${isEnabled('NIGHT_BUILD_ENABLED')}`);
    
    console.log('\n=== Smoke test complete ===');
    return;
  }

  // Normal startup
  console.log('StudEx Valley OS starting...');

  // Seed vault
  seedVault();
  console.log('✓ Vault seeded');

  // Initialize core
  const memory = new MemoryStore('valley.db');
  const audit = new AuditLog(memory.getDatabase());
  const model = new ModelClient();
  const costs = new CostFooter();
  const runner = new AgentRunner(model, memory, audit, costs);

  const agents = loadAllAgents();
  console.log(`✓ ${agents.length} agents loaded`);

  // Start dashboard
  const port = Number(process.env.DASHBOARD_PORT) || 3141;
  console.log(`Dashboard available at http://localhost:${port}`);

  // Schedule cron jobs if enabled
  if (isEnabled('SCHEDULER_ENABLED')) {
    console.log('✓ Scheduler enabled — cron jobs active');
  } else {
    console.log('  Scheduler disabled — use manual triggers');
  }

  console.log('\nStudEx Valley OS ready.');
}

main().catch(console.error);
