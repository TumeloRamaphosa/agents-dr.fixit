/**
 * Valley OS - Main Entry Point
 * AI Agent Operating System for StudEx Group
 *
 * Architecture:
 * - 12 AI agents with specialized roles
 * - Fastify HTTP API (port 4200)
 * - WebSocket real-time events
 * - Ritual scheduler (morning standup, board meeting, day close)
 * - ElevenLabs voice synthesis
 * - Event-driven agent-to-agent communication
 * - Real-time dashboard (port 3141)
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { orchestrator } from './core/orchestrator.js';
import { eventBus } from './core/event-bus.js';
import { costFooter } from './core/cost-footer.js';
import { scheduler } from './core/scheduler.js';
import { voiceEngine } from './core/voice.js';
import { exfilGuard } from './core/exfil-guard.js';
import { llmProvider } from './core/llm-provider.js';
import { sessionManager } from './core/sessions.js';
import { memoryTree } from './core/memory-tree.js';
import { ALL_AGENTS } from './agents/index.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_PORT = parseInt(process.env.API_PORT || '4200');
const DASHBOARD_PORT = parseInt(process.env.DASHBOARD_PORT || '3141');

// ─── Main API Server ─────────────────────────────────────────────────────────

const api = Fastify({ logger: { level: 'info' } });

async function startAPI() {
  await api.register(cors, { origin: true });
  await api.register(fastifyWebsocket);

  // ─── WebSocket ──────────────────────────────────────────────────────────────

  const wsClients = new Set<any>();

  api.register(async function (app) {
    app.get('/ws', { websocket: true }, (connection) => {
      const socket = connection.socket;
      wsClients.add(socket);
      socket.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));

      socket.on('close', () => wsClients.delete(socket));
      socket.on('message', async (msg: any) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.type === 'chat') {
            const result = await orchestrator.route(data.message, 'websocket', data.userId);
            socket.send(JSON.stringify({ type: 'response', ...result }));
          }
        } catch { /* ignore malformed messages */ }
      });
    });
  });

  // Broadcast events to all WebSocket clients
  eventBus.on('event', (event) => {
    const payload = JSON.stringify({ type: 'event', ...event });
    wsClients.forEach(client => {
      try { client.send(payload); } catch { wsClients.delete(client); }
    });
  });

  // ─── Health & System ────────────────────────────────────────────────────────

  api.get('/health', async () => ({
    status: 'ok',
    service: 'valley-os',
    version: '2.0.0',
    agents: orchestrator.getStats().agentCount,
    uptime: orchestrator.getStats().uptime,
    timestamp: new Date().toISOString()
  }));

  api.get('/api/health', async () => orchestrator.getHealthReport());

  api.get('/api/stats', async () => ({
    orchestrator: orchestrator.getStats(),
    events: eventBus.getStats(),
    scheduler: scheduler.getStatus(),
    voice: { enabled: voiceEngine.isEnabled(), voices: voiceEngine.getAvailableVoices() }
  }));

  // ─── Agents ─────────────────────────────────────────────────────────────────

  api.get('/api/agents', async () => ({
    agents: orchestrator.getAgentStatuses(),
    total: orchestrator.getAgentStatuses().length
  }));

  api.get<{ Params: { id: string } }>('/api/agents/:id', async (request) => {
    const agent = orchestrator.getAgent(request.params.id);
    if (!agent) return { error: 'Agent not found' };
    return agent.getStatus();
  });

  api.post<{ Params: { id: string }; Body: { message: string } }>(
    '/api/agents/:id/chat',
    async (request) => {
      const response = await orchestrator.directMessage(
        request.params.id,
        request.body.message
      );
      return { agent: request.params.id, response };
    }
  );

  // ─── Smart Routing ──────────────────────────────────────────────────────────

  api.post<{ Body: { message: string; channel?: string; userId?: string } }>(
    '/api/route',
    async (request) => {
      const { message, channel, userId } = request.body;
      return orchestrator.route(message, channel || 'api', userId || 'anonymous');
    }
  );

  api.post<{ Body: { message: string; channel?: string; userId?: string } }>(
    '/api/chat',
    async (request) => {
      const { message, channel, userId } = request.body;
      return orchestrator.route(message, channel || 'api', userId || 'anonymous');
    }
  );

  api.post<{ Body: { message: string; channel?: string; userId?: string } }>(
    '/api/classify',
    async (request) => {
      const { message, channel, userId } = request.body;
      const result = await orchestrator.route(message, channel || 'api', userId || 'anonymous');
      return { agentId: result.agentId, confidence: result.confidence, escalated: result.escalated };
    }
  );

  // ─── Costs ──────────────────────────────────────────────────────────────────

  api.get('/api/costs', async () => costFooter.getBudgetStatus());
  api.get('/api/costs/report', async () => ({ report: costFooter.getDailyReport() }));
  api.get('/api/costs/agents', async () => ({ breakdown: costFooter.getAgentCosts() }));

  // ─── Scheduler ──────────────────────────────────────────────────────────────

  api.get('/api/scheduler', async () => scheduler.getStatus());

  api.post<{ Params: { name: string } }>('/api/scheduler/trigger/:name', async (request) => {
    try {
      await scheduler.triggerManual(request.params.name);
      return { success: true, ritual: request.params.name };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // ─── Voice ──────────────────────────────────────────────────────────────────

  api.post<{ Body: { agentId: string; text: string } }>('/api/voice/synthesize', async (request, reply) => {
    const { agentId, text } = request.body;
    const audio = await voiceEngine.synthesize(agentId, text);
    if (!audio) return { error: 'Voice synthesis unavailable or agent has no voice' };
    reply.header('Content-Type', 'audio/mpeg');
    return reply.send(audio);
  });

  api.get('/api/voice/agents', async () => ({
    enabled: voiceEngine.isEnabled(),
    voices: voiceEngine.getAvailableVoices()
  }));

  // ─── Events ─────────────────────────────────────────────────────────────────

  api.get('/api/events', async (request) => {
    const query = request.query as any;
    return eventBus.getHistory({
      type: query.type,
      source: query.source,
      limit: parseInt(query.limit || '50')
    });
  });

  // ─── Sessions ───────────────────────────────────────────────────────────────

  api.get('/api/sessions', async (request) => {
    const query = request.query as any;
    return sessionManager.getSessions(query.agentId, parseInt(query.limit || '50'));
  });

  api.post<{ Body: { agentId: string; title?: string } }>('/api/sessions', async (request) => {
    return sessionManager.createSession(request.body.agentId, request.body.title);
  });

  api.get<{ Params: { id: string } }>('/api/sessions/:id/messages', async (request) => {
    return sessionManager.getMessages(request.params.id);
  });

  api.delete<{ Params: { id: string } }>('/api/sessions/:id', async (request) => {
    sessionManager.deleteSession(request.params.id);
    return { success: true };
  });

  // ─── Memory Tree ────────────────────────────────────────────────────────────

  api.get('/api/memory/tree', async () => memoryTree.getTree());

  api.get<{ Params: { '*': string } }>('/api/memory/file/*', async (request) => {
    const content = await memoryTree.getFile(request.params['*']);
    return content ? { content } : { error: 'Not found' };
  });

  api.post<{ Body: { category: string; title: string; content: string } }>('/api/memory/store', async (request) => {
    const { category, title, content } = request.body;
    const filePath = await memoryTree.store(category, title, content);
    return { success: true, path: filePath };
  });

  api.post<{ Body: { query: string } }>('/api/memory/search', async (request) => {
    return memoryTree.search(request.body.query);
  });

  // ─── LLM Provider ─────────────────────────────────────────────────────────

  api.get('/api/llm', async () => ({
    active: llmProvider.getActiveProvider(),
    providers: llmProvider.getProviders()
  }));

  api.post<{ Body: { provider: string } }>('/api/llm/switch', async (request) => {
    const success = llmProvider.setActiveProvider(request.body.provider);
    return { success, active: llmProvider.getActiveProvider() };
  });

  // ─── Security ───────────────────────────────────────────────────────────────

  api.post<{ Body: { text: string } }>('/api/security/scan', async (request) => {
    return exfilGuard.scan(request.body.text);
  });

  // ─── Greeting ───────────────────────────────────────────────────────────────

  api.get('/api/greet', async () => {
    const robusca = orchestrator.getAgent('robusca') as any;
    if (robusca?.greet) {
      return { greeting: await robusca.greet() };
    }
    return { greeting: 'Welcome to Valley OS' };
  });

  // ─── Start API ──────────────────────────────────────────────────────────────

  await api.listen({ port: API_PORT, host: '0.0.0.0' });
}

// ─── Dashboard Server ─────────────────────────────────────────────────────────

const dashboard = Fastify({ logger: false });

async function startDashboard() {
  await dashboard.register(cors, { origin: true });
  await dashboard.register(fastifyStatic, {
    root: path.join(__dirname, 'dashboard'),
    prefix: '/'
  });

  await dashboard.listen({ port: DASHBOARD_PORT, host: '0.0.0.0' });
}

// ─── Boot Sequence ────────────────────────────────────────────────────────────

async function boot() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════════╗');
  console.log('  ║           🏔️  VALLEY OS v2.0 - BOOT SEQUENCE            ║');
  console.log('  ║         StudEx Group AI Operating System                 ║');
  console.log('  ╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // Register all agents
  console.log('  ┌─ Registering Agents ─────────────────────────────────────');
  ALL_AGENTS.forEach(agent => {
    orchestrator.register(agent);
    console.log(`  │  ✓ ${agent.name.padEnd(12)} [${agent.role}]`);
  });
  console.log(`  └─ ${ALL_AGENTS.length} agents registered`);
  console.log('');

  // Start API server
  await startAPI();
  console.log(`  ⚡ API Server:      http://localhost:${API_PORT}`);
  console.log(`     ├─ Health:       /health`);
  console.log(`     ├─ Agents:       /api/agents`);
  console.log(`     ├─ Route:        POST /api/route`);
  console.log(`     ├─ Chat:         POST /api/chat`);
  console.log(`     ├─ Costs:        /api/costs`);
  console.log(`     ├─ Scheduler:    /api/scheduler`);
  console.log(`     ├─ Events:       /api/events`);
  console.log(`     ├─ Voice:        POST /api/voice/synthesize`);
  console.log(`     └─ WebSocket:    ws://localhost:${API_PORT}/ws`);
  console.log('');

  // Start Dashboard
  try {
    await startDashboard();
    console.log(`  🖥️  Dashboard:      http://localhost:${DASHBOARD_PORT}`);
  } catch {
    console.log(`  ⚠️  Dashboard:      Port ${DASHBOARD_PORT} unavailable (non-critical)`);
  }
  console.log('');

  // Start Scheduler
  scheduler.start();
  console.log('');

  // Voice status
  if (voiceEngine.isEnabled()) {
    console.log(`  🎙️  Voice Engine:   ACTIVE (${voiceEngine.getAvailableVoices().length} voices)`);
  } else {
    console.log('  🎙️  Voice Engine:   INACTIVE (set ELEVENLABS_API_KEY to enable)');
  }
  console.log('');

  // System ready
  const budget = costFooter.getBudgetStatus();
  console.log('  ┌─ System Status ──────────────────────────────────────────');
  console.log(`  │  Agents:     ${ALL_AGENTS.length} registered, all ready`);
  console.log(`  │  Budget:     $${budget.dailyBudget}/day ($${budget.remaining.toFixed(2)} remaining)`);
  console.log(`  │  Scheduler:  ${scheduler.getRituals().length} rituals configured`);
  console.log(`  │  Timezone:   Africa/Johannesburg (SAST)`);
  console.log('  └─────────────────────────────────────────────────────────');
  console.log('');
  console.log('  🟢 Valley OS is ready. All systems operational.');
  console.log('');
}

boot().catch((err) => {
  console.error('❌ Valley OS boot failed:', err);
  process.exit(1);
});
