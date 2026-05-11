import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

let switches: Record<string, string> = {};

export function loadSwitches(envPath?: string): void {
  if (envPath && existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      switches[key] = val;
    }
  }
  // env vars override file
  for (const key of Object.keys(process.env)) {
    if (key in switches || isSwitchKey(key)) {
      switches[key] = process.env[key] ?? '';
    }
  }
}

function isSwitchKey(key: string): boolean {
  return [
    'SCHEDULER_ENABLED',
    'MISSION_AUTO_ASSIGN_ENABLED',
    'EXFIL_GUARD_ENABLED',
    'WAR_ROOM_ENABLED',
    'COUNCIL_ENABLED',
    'NIGHT_BUILD_ENABLED',
    'NIGHT_BUILD_PRODUCT_COUNT',
    'NIGHT_BUILD_MODE',
    'CURSOR_BACKGROUND_AGENTS_ENABLED',
    'IDLE_HOURS',
    'KILL_PHRASE',
  ].includes(key);
}

export function isEnabled(key: string): boolean {
  const val = switches[key] ?? process.env[key] ?? 'false';
  return val.toLowerCase() === 'true';
}

export function getSwitch(key: string): string {
  return switches[key] ?? process.env[key] ?? '';
}

export function getSwitchNumber(key: string, fallback: number): number {
  const val = switches[key] ?? process.env[key];
  if (val === undefined || val === '') return fallback;
  const n = Number(val);
  return Number.isNaN(n) ? fallback : n;
}

export function checkKillPhrase(input: string): boolean {
  const phrase = getSwitch('KILL_PHRASE');
  if (!phrase) return false;
  return input.trim().toLowerCase() === phrase.toLowerCase();
}

export function allSwitches(): Record<string, string> {
  return { ...switches };
}

export function getIdleHours(): { start: number; end: number } {
  const raw = getSwitch('IDLE_HOURS') || '22-02';
  const [start, end] = raw.split('-').map(Number);
  return { start: Number.isNaN(start) ? 22 : start, end: Number.isNaN(end) ? 2 : end };
}

// Load on import
loadSwitches(resolve(process.cwd(), '.env'));