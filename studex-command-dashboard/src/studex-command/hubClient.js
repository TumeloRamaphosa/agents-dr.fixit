/**
 * Super Agents hub — /health and /api/inventory (Fly app super-agents).
 * Set VITE_SUPER_AGENTS_HUB_URL=https://super-agents.fly.dev (no trailing slash).
 */

export function getHubBase() {
  const fromEnv = import.meta.env.VITE_SUPER_AGENTS_HUB_URL
  if (fromEnv && typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, "")
  }
  if (import.meta.env.DEV) {
    return "/hub"
  }
  return ""
}

/** @returns {Promise<{ ok: boolean, data?: unknown, error?: string }>} */
export async function fetchHubHealth() {
  const base = getHubBase()
  if (!base) return { ok: false, error: "VITE_SUPER_AGENTS_HUB_URL not set" }
  try {
    const res = await fetch(`${base}/health`, { headers: { Accept: "application/json" } })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    return { ok: true, data: await res.json() }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** @returns {Promise<{ ok: boolean, data?: unknown, error?: string }>} */
export async function fetchHubInventory() {
  const base = getHubBase()
  if (!base) return { ok: false, error: "VITE_SUPER_AGENTS_HUB_URL not set" }
  try {
    const res = await fetch(`${base}/api/inventory`, { headers: { Accept: "application/json" } })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    return { ok: true, data: await res.json() }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
