/**
 * Fly Machines API (via Vite `/fly` proxy when token is set server-side in vite.config).
 * Without a token the proxy returns 401 and callers fall back to demo metrics.
 */

export function getFlyProxyBase() {
  const fromEnv = import.meta.env.VITE_FLY_API_BASE_URL
  if (fromEnv && typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, "")
  }
  return "/fly"
}

/** @typedef {{ status: string, cpus: number, memoryMb: number, region: string, machineId: string | null, machineCount: number }} FlyLiveSnapshot */

/** @param {unknown} machine */
function mapMachine(machine) {
  if (!machine || typeof machine !== "object") return null
  const m = /** @type {Record<string, unknown>} */ (machine)
  const config = /** @type {Record<string, unknown>} */ (m.config ?? {})
  const guest = /** @type {Record<string, unknown>} */ (config.guest ?? {})
  const state = String(m.state ?? "unknown")
  return {
    status: state === "started" || state === "starting" ? "running" : "stopped",
    cpus: Number(guest.cpus ?? 0) || 0,
    memoryMb: Number(guest.memory_mb ?? 0) || 0,
    region: String(m.region ?? "").toUpperCase() || "—",
    machineId: m.id ? String(m.id) : null,
    machineCount: 1,
  }
}

/** @param {unknown} machines */
function summarizeMachines(machines) {
  const list = Array.isArray(machines) ? machines : []
  if (!list.length) return null

  const started = list.find((m) => mapMachine(m)?.status === "running")
  const primary = started ?? list[0]
  const snap = mapMachine(primary)
  if (!snap) return null

  return { ...snap, machineCount: list.length }
}

/** @param {string} appName */
export async function fetchFlyAppSnapshot(appName) {
  const base = getFlyProxyBase()
  if (!base) {
    throw new Error("Fly proxy unavailable (set VITE_FLY_API_TOKEN for dev/preview proxy)")
  }

  const res = await fetch(`${base}/v1/apps/${encodeURIComponent(appName)}/machines`, {
    headers: { Accept: "application/json" },
  })

  if (res.status === 401 || res.status === 403) {
    throw new Error("Fly API unauthorized — check VITE_FLY_API_TOKEN")
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Fly HTTP ${res.status}`)
  }

  const data = await res.json()
  return summarizeMachines(data)
}

/** @param {Array<{ app: string }>} apps */
export async function fetchAllFlySnapshots(apps) {
  /** @type {Record<string, FlyLiveSnapshot>} */
  const out = {}
  let firstError = ""
  const results = await Promise.allSettled(apps.map((vm) => fetchFlyAppSnapshot(vm.app)))

  for (let i = 0; i < apps.length; i++) {
    const r = results[i]
    if (r.status === "fulfilled" && r.value) {
      out[apps[i].app] = r.value
    } else if (r.status === "rejected" && !firstError) {
      firstError = r.reason instanceof Error ? r.reason.message : String(r.reason)
    }
  }

  if (!Object.keys(out).length && firstError) {
    throw new Error(firstError)
  }

  return out
}
