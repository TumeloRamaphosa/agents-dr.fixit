import { BRAIN_NODES, VMS, VM_LOGS } from "./data.js"

/** BaseStudex Command identity — always included. */
export const BASE_SYSTEM = `You are Studex Command — an internal operations copilot for Studex Group.
Ground answers in South African business context when relevant. Keep responses concise unless asked for depth.
If infra or metrics are unknown to you, say you are working from the operator's question and suggest what to verify on Fly.io, Supabase, or local services.
Do not invent live telemetry: the dashboard may show demo or stale data; treat snapshot blocks as operator-provided context unless they say otherwise.`

/**
 * Toggleable skills: each adds a focused slice of behaviour and/or injects context.
 * (This is “skills” in the product sense — prompt + optional static snapshot — not Ollama tool-calling.)
 */
export const ASSISTANT_SKILLS = [
  {
    id: "infra",
    label: "Infrastructure",
    description: "Fly.io layout, VM roles, regions, operational checks",
    prompt: `When discussing infrastructure, prefer Fly.io Machines vocabulary (app, region, machine).
Reference the VM snapshot by name and role. Suggest concrete verification steps (flyctl, logs, health endpoints) when appropriate.`,
  },
  {
    id: "northstar",
    label: "Northstar / SOULDOC",
    description: "Northstar ritual, Soul Documents, agent identity",
    prompt: `When discussing agents, use Studex language: Northstar Framework, Soul Document (SOULDOC), founding memory, Obsidian Brain.
Differentiate “configuration” from “commissioned identity.” Keep founder-facing tone respectful and precise.`,
  },
  {
    id: "exec",
    label: "Executive brief",
    description: "Tight bullets, risks, next actions",
    prompt: `Default format: 3–7 bullets. Start with the decision or risk, then implications, then next actions with owners (operator, platform, client).
Avoid long prose unless the user asks for depth.`,
  },
  {
    id: "board",
    label: "Board snapshot",
    description: "Injects demo VM + brain + log headlines from the dashboard mock data",
    prompt: `A structured snapshot of the current dashboard mock data is appended below. Use it for grounded answers; note it may be illustrative.`,
  },
]

export const DEFAULT_SKILL_IDS = ["infra", "board"]

function formatSnapshot() {
  const vmLines = VMS.map((vm) => `- VM${vm.id} ${vm.name} — ${vm.app} (${vm.region}) — ${vm.role}`).join("\n")
  const hot = BRAIN_NODES.filter((n) => n.hot).map((n) => `- [${n.cat}] ${n.label}`)
  const lines = [
    "### Fly-style apps (mock)",
    vmLines,
    "",
    "### Cognitive nodes (hot)",
    hot.length ? hot.join("\n") : "- (none marked hot)",
    "",
    "### Sample log headlines (first line per VM)",
    ...VMS.map((vm) => {
      const first = (VM_LOGS[vm.id] || [])[0]
      return `- VM${vm.id}: ${first ? `${first.t} ${first.type} — ${first.msg}` : "(no mock log)"}`
    }),
  ]
  return lines.join("\n")
}

/** @param {string[]} skillIds @param {{ activePage?: string }} [ctx] */
export function composeSystemPrompt(skillIds, ctx = {}) {
  const selected = new Set(skillIds)
  const parts = [BASE_SYSTEM]

  if (ctx.activePage) {
    parts.push(`## UI context\nOperator is viewing dashboard page: **${ctx.activePage}**.`)
  }

  for (const s of ASSISTANT_SKILLS) {
    if (!selected.has(s.id)) continue
    if (s.prompt) {
      parts.push(`## Skill: ${s.label}\n${s.prompt}`)
    }
  }

  if (selected.has("board")) {
    parts.push("## Dashboard mock snapshot\n```\n" + formatSnapshot() + "\n```")
  }

  return parts.join("\n\n")
}
