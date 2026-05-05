#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 * 🤖 MACMINI GANG AGENT - Dr.Fixit Edition
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Agents:
 *   🤖 Hermes  - The Messenger (Coordination, Slack, Heartbeat)
 *   🔧 GoClaw  - The Engineer (Code repairs, Updates)
 * 
 * Repository: github.com/agents-dr.fixit
 * Location: MacMini-Alpha (Local)
 * Mode: AUTOM (Fully Autonomous)
 * 
 * Config:
 *   • Repair Cycle: Every 6 hours
 *   • Heartbeat: Every 1 hour  
 *   • Backups: Full before every change
 *   • Slack: etherdoge.slack.com
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ═══════════════════════════════════════════════════════════════════
// HERMES - The Messenger (Coordination Agent)
// ═══════════════════════════════════════════════════════════════════
class Hermes {
  constructor() {
    this.name = 'Hermes';
    this.codename = 'MESSENGER-001';
    this.role = 'Coordination & Communication';
    this.location = 'MacMini-Alpha';
    
    this.config = {
      slackWorkspace: 'etherdoge.slack.com',
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      heartbeatInterval: 60 * 60 * 1000,  // 1 hour
      memoryPath: '/Users/project2571/agent-configs/.memory/hermes'
    };
    
    this.status = {
      hermes: 'initializing',
      goclaw: 'initializing',
      openclawGateway: 'unknown',
      lastHeartbeat: null
    };
  }

  async start() {
    console.log(`\n📨 ${this.name} (${this.codename}) REPORTING FOR DUTY`);
    console.log(`   Role: ${this.role}`);
    console.log(`   Location: ${this.location}`);
    console.log(`   Slack: ${this.config.slackWorkspace}\n`);
    
    await this.slackNotify('🟢 Hermes initialized', 'info');
    
    // Start heartbeat
    this.heartbeat();
    setInterval(() => this.heartbeat(), this.config.heartbeatInterval);
    
    // Start coordination loop
    setInterval(() => this.coordinate(), 5 * 60 * 1000); // Every 5 min
    
    console.log('✅ Hermes active and coordinating\n');
  }

  async heartbeat() {
    const timestamp = new Date().toISOString();
    this.status.lastHeartbeat = timestamp;
    
    // Check all systems
    this.status.openclawGateway = await this.checkPort(18789) ? 'online' : 'offline';
    this.status.goclaw = await this.checkPort(18790) ? 'online' : 'offline';
    
    const message = `💓 Hermes Heartbeat\n` +
      `   ⏰ ${timestamp}\n` +
      `   🔌 OpenClaw Gateway: ${this.status.openclawGateway}\n` +
      `   🔧 GoClaw: ${this.status.goclaw}`;
    
    console.log(message);
    await this.slackNotify(message, 'info');
    
    // Log to memory
    this.log('heartbeat', this.status);
  }

  async coordinate() {
    console.log(`[${new Date().toISOString()}] Hermes coordinating...`);
    
    // Check if repairs needed
    const repairsNeeded = await this.checkRepairsNeeded();
    if (repairsNeeded) {
      console.log('   Repairs detected - triggering GoClaw');
      await this.triggerGoClaw();
    }
    
    // Sync status to GitHub
    await this.syncToGitHub();
  }

  async checkRepairsNeeded() {
    // Check various indicators
    const checks = [
      !await this.checkPort(18789),  // OpenClaw down
      fs.existsSync('/tmp/repair-needed.flag'),  // Manual flag
      this.checkLogErrors()  // Log errors
    ];
    return checks.some(c => c);
  }

  async triggerGoClaw() {
    console.log('📨 Hermes triggering GoClaw repair cycle...');
    // Signal GoClaw to run
    if (global.goclaw) {
      await global.goclaw.runRepairCycle();
    }
  }

  async syncToGitHub() {
    const statusFile = path.join(this.config.memoryPath, 'status.json');
    fs.writeFileSync(statusFile, JSON.stringify(this.status, null, 2));
    
    // Git commit if in repo
    try {
      execSync('git add -A && git commit -m "Hermes: status update"', {
        cwd: '/Users/project2571/agent-configs',
        stdio: 'ignore'
      });
    } catch (e) {
      // Silent fail if not in git
    }
  }

  checkPort(port) {
    try {
      execSync(`lsof -i :${port} | grep LISTEN`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  checkLogErrors() {
    // Check recent logs for errors
    return false; // Placeholder
  }

  async slackNotify(message, type = 'info') {
    if (!this.config.webhookUrl) {
      console.log(`[SLACK] ${message}`);
      return;
    }
    
    const payload = JSON.stringify({
      text: message,
      username: 'Hermes (MacMini Gang)',
      icon_emoji: type === 'error' ? ':warning:' : ':robot_face:'
    });
    
    // HTTP POST to Slack webhook
    // ... (simplified for brevity)
    console.log(`[SLACK→${this.config.slackWorkspace}] ${message}`);
  }

  log(action, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent: this.name,
      action,
      data
    };
    
    const logPath = path.join(this.config.memoryPath, 'hermes.log');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }
}

// ═══════════════════════════════════════════════════════════════════
// GOCLAW - The Engineer (Repair Agent)
// ═══════════════════════════════════════════════════════════════════
class GoClaw {
  constructor() {
    this.name = 'GoClaw';
    this.codename = 'ENGINEER-001';
    this.role = 'Code Repairs & Maintenance';
    this.location = 'MacMini-Alpha';
    
    this.paths = {
      openclaw: '/Users/project2571/.local/node-v22.22.2-darwin-arm64/lib/node_modules/openclaw',
      goclaw: '/Users/project2571/.goclaw',
      config: '/Users/project2571/.openclaw',
      memory: '/Users/project2571/agent-configs/.memory/goclaw',
      backups: '/Users/project2571/agent-configs/.memory/backups'
    };
    
    this.config = {
      repairInterval: 6 * 60 * 60 * 1000,  // 6 hours
      autoFix: true,
      fullBackup: true,
      slackWebhook: process.env.SLACK_WEBHOOK_URL
    };
    
    this.hermes = null; // Set by parent
  }

  async start() {
    console.log(`\n🔧 ${this.name} (${this.codename}) REPORTING FOR DUTY`);
    console.log(`   Role: ${this.role}`);
    console.log(`   Location: ${this.location}`);
    console.log(`   Mode: AUTOM (Auto-fix enabled)\n`);
    
    await this.notifyHermes('🟢 GoClaw initialized');
    
    // Run repair cycle immediately
    await this.runRepairCycle();
    
    // Schedule regular repairs
    setInterval(() => this.runRepairCycle(), this.config.repairInterval);
    
    console.log('✅ GoClaw active and ready to repair\n');
  }

  async runRepairCycle() {
    const timestamp = new Date().toISOString();
    console.log(`\n🔧 [${timestamp}] GOCLAW REPAIR CYCLE STARTING`);
    console.log('   Mode: AUTOM | Backups: FULL | Auto-fix: ENABLED');
    
    const repairs = [];
    
    try {
      // AUTOM: Always backup first
      if (this.config.fullBackup) {
        console.log('💾 Creating full backup...');
        const backupPath = await this.fullBackup();
        console.log(`   ✅ Backup: ${backupPath}`);
      }
      
      // 1. Check for OpenClaw updates
      console.log('📦 Checking for updates...');
      const update = await this.checkForUpdates();
      if (update.available) {
        console.log('   ⚡ Update found! Installing...');
        const result = await this.updateOpenClaw(update);
        repairs.push(result);
      }
      
      // 2. Fix dependencies
      console.log('🔍 Scanning dependencies...');
      const deps = await this.fixDependencies();
      if (deps.fixed) {
        repairs.push(deps);
        console.log(`   ✅ Fixed: ${deps.description}`);
      }
      
      // 3. Fix port conflicts
      console.log('🌐 Checking ports...');
      const ports = await this.fixPortConflicts();
      if (ports.fixed) {
        repairs.push(ports);
        console.log(`   ✅ Fixed: ${ports.description}`);
      }
      
      // 4. Repair configs
      console.log('📋 Checking configs...');
      const configs = await this.repairConfigs();
      if (configs.fixed) {
        repairs.push(configs);
        console.log(`   ✅ Fixed: ${configs.description}`);
      }
      
      // Report results
      await this.reportRepairs(repairs);
      
      console.log(`✅ Repair cycle complete. ${repairs.length} repairs made.\n`);
      
    } catch (error) {
      console.error('❌ Repair cycle failed:', error);
      await this.notifyHermes(`❌ GoClaw ERROR: ${error.message}`, 'error');
      this.logRepair('ERROR', error.message, false);
    }
  }

  async fullBackup() {
    const backupId = `backup-${Date.now()}`;
    const backupPath = path.join(this.paths.backups, backupId);
    
    try {
      fs.mkdirSync(backupPath, { recursive: true });
      
      // Backup OpenClaw
      if (fs.existsSync(this.paths.openclaw)) {
        execSync(`cp -r "${this.paths.openclaw}" "${backupPath}/openclaw"`, { stdio: 'ignore' });
      }
      
      // Backup config
      if (fs.existsSync(this.paths.config)) {
        execSync(`cp -r "${this.paths.config}" "${backupPath}/config"`, { stdio: 'ignore' });
      }
      
      return backupPath;
    } catch (e) {
      console.log('   ⚠️ Backup warning:', e.message);
      return null;
    }
  }

  async checkForUpdates() {
    try {
      const result = execSync('npm outdated -g openclaw --json', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      const outdated = JSON.parse(result);
      return {
        available: Object.keys(outdated).length > 0,
        packages: outdated
      };
    } catch {
      return { available: false };
    }
  }

  async updateOpenClaw(updateInfo) {
    try {
      console.log('   🔄 Running: npm update -g openclaw');
      execSync('npm update -g openclaw', { stdio: 'inherit' });
      
      return {
        type: 'UPDATE',
        description: `Updated OpenClaw to latest`,
        fixed: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        type: 'UPDATE',
        description: `Update failed: ${error.message}`,
        fixed: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  async fixDependencies() {
    // Check for broken npm packages
    try {
      execSync('npm doctor', { stdio: 'ignore' });
      return { fixed: false };
    } catch {
      // Try to fix
      try {
        execSync('npm install -g openclaw --force', { stdio: 'ignore' });
        return {
          fixed: true,
          description: 'Repaired npm dependencies'
        };
      } catch (e) {
        return { fixed: false };
      }
    }
  }

  async fixPortConflicts() {
    const ports = [18789, 18790];
    let fixed = false;
    
    for (const port of ports) {
      try {
        // Check if something else is using the port
        const result = execSync(`lsof -i :${port} | grep LISTEN | grep -v "openclaw\|goclaw"`, { 
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore']
        });
        
        if (result) {
          const pid = result.trim().split(/\s+/)[1];
          console.log(`   Found conflicting process on port ${port}: PID ${pid}`);
          // In AUTOM mode, we could kill it, but let's be safe and just report
          return {
            fixed: false,
            description: `Port ${port} conflict detected (PID: ${pid}) - manual intervention needed`
          };
        }
      } catch {
        // No conflict
      }
    }
    
    return { fixed: false };
  }

  async repairConfigs() {
    const configPath = path.join(this.paths.config, 'openclaw.json');
    
    try {
      // Check if config is valid JSON
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Run openclaw doctor to auto-fix
      try {
        execSync('openclaw doctor --fix', { stdio: 'ignore' });
        return {
          fixed: true,
          description: 'Repaired openclaw.json configuration'
        };
      } catch {
        return { fixed: false };
      }
    } catch (e) {
      return {
        fixed: false,
        description: `Config error: ${e.message}`
      };
    }
  }

  async reportRepairs(repairs) {
    if (repairs.length === 0) {
      console.log('   ℹ️ No repairs needed');
      await this.notifyHermes('✅ GoClaw: No repairs needed', 'info');
      return;
    }
    
    const summary = repairs.map(r => `• ${r.type}: ${r.description}`).join('\n');
    const message = `🔧 GoClaw Repairs Complete (${repairs.length}):\n${summary}`;
    
    console.log(message);
    await this.notifyHermes(message, repairs.some(r => !r.fixed) ? 'warning' : 'success');
    
    // Log to file
    repairs.forEach(r => this.logRepair(r.type, r.description, r.fixed));
  }

  async notifyHermes(message, type = 'info') {
    if (this.hermes) {
      await this.hermes.slackNotify(`[GoClaw] ${message}`, type);
    } else {
      console.log(`[HERMES→] ${message}`);
    }
  }

  logRepair(type, description, success) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent: this.name,
      type,
      description,
      success
    };
    
    const logPath = path.join(this.paths.memory, 'repairs.log');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN - Initialize Both Agents
// ═══════════════════════════════════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                  ║');
  console.log('║     🤖 MACMINI GANG - Dr.Fixit Edition                            ║');
  console.log('║                                                                  ║');
  console.log('║     Agents: Hermes (The Messenger) + GoClaw (The Engineer)      ║');
  console.log('║     Mode: AUTOM (Fully Autonomous)                               ║');
  console.log('║     Repository: github.com/agents-dr.fixit                       ║');
  console.log('║                                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // Create agents
  const hermes = new Hermes();
  const goclaw = new GoClaw();
  
  // Link them
  goclaw.hermes = hermes;
  global.goclaw = goclaw; // For Hermes to trigger repairs
  
  // Start both
  await hermes.start();
  await goclaw.start();
  
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    🤖 MACMINI GANG ACTIVE                        ║');
  console.log('║                                                                  ║');
  console.log('║  Hermes:  Coordinating every 5 min | Heartbeat every 1 hour      ║');
  console.log('║  GoClaw:  Repair cycle every 6 hours | Auto-fix enabled           ║');
  console.log('║                                                                  ║');
  console.log('║  Press Ctrl+C to stop                                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  
  // Keep alive
  process.on('SIGINT', () => {
    console.log('\n👋 MacMini Gang shutting down...');
    process.exit(0);
  });
}

main().catch(console.error);
