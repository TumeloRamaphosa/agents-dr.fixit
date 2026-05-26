/**
 * Valley OS - Main Entry Point
 * Agent Operating System with Fastify HTTP/WebSocket server
 * Ports: 4200 (API), 3141 (dashboard)
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Classifier } from './core/classifier.js';
import { costFooter } from './core/cost-footer.js';
import { exfilGuard } from './core/exfil-guard.js';
import { robusca } from './agents/robusca.js';
import { cto } from './agents/cto.js';
import dotenv from 'dotenv';

dotenv.config();

const API_PORT = parseInt(process.env.API_PORT || '4200');
const DASHBOARD_PORT = parseInt(process.env.DASHBOARD_PORT || '3141');

const app = Fastify({ logger: true });

async function start() {
  await app.register(cors, { origin: true });

  const classifier = new Classifier();

  app.get('/health', async () => {
    return { status: 'ok', service: 'valley-os', timestamp: new Date().toISOString() };
  });

  app.get('/api/agents', async () => {
    return {
      agents: [
        robusca.getStatus(),
        cto.getStatus(),
      ],
      total: 2
    };
  });

  app.get('/api/costs', async () => {
    return costFooter.getBudgetStatus();
  });

  app.get('/api/costs/report', async () => {
    return { report: costFooter.getDailyReport() };
  });

  app.post<{ Body: { message: string; channel?: string; userId?: string } }>(
    '/api/classify',
    async (request) => {
      const { message, channel, userId } = request.body;
      const result = await classifier.classify({
        id: crypto.randomUUID(),
        content: message,
        channel: channel || 'api',
        userId: userId || 'anonymous',
        timestamp: new Date()
      });
      return result;
    }
  );

  app.post<{ Body: { message: string } }>(
    '/api/chat',
    async (request) => {
      const { message } = request.body;

      const securityCheck = exfilGuard.scan(message);
      if (!securityCheck.safe) {
        return { error: 'Security check failed', findings: securityCheck.findings };
      }

      const response = await robusca.process(message);
      return { agent: 'robusca', response };
    }
  );

  app.get('/api/greet', async () => {
    const greeting = await robusca.greet();
    return { greeting };
  });

  try {
    await app.listen({ port: API_PORT, host: '0.0.0.0' });
    console.log(`\n🏔️  Valley OS started`);
    console.log(`   API:       http://localhost:${API_PORT}`);
    console.log(`   Health:    http://localhost:${API_PORT}/health`);
    console.log(`   Agents:    http://localhost:${API_PORT}/api/agents`);
    console.log(`   Costs:     http://localhost:${API_PORT}/api/costs`);
    console.log(`   Chat:      POST http://localhost:${API_PORT}/api/chat`);
    console.log(`   Classify:  POST http://localhost:${API_PORT}/api/classify`);
    console.log(`\n   Ready for requests.`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
