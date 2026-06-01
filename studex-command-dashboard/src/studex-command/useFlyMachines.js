import { useCallback, useEffect, useState } from "react"
import { fetchAllFlySnapshots } from "./flyClient.js"

/**
 * @param {Array<{ app: string }>} apps
 * @param {{ refreshMs?: number }} [opts]
 */
export function useFlyMachines(apps, opts = {}) {
  const refreshMs = opts.refreshMs ?? 60_000
  const [liveByApp, setLiveByApp] = useState(() => ({}))
  const [mode, setMode] = useState(/** @type {"demo" | "live" | "loading"} */ ("loading"))
  const [lastFetched, setLastFetched] = useState(/** @type {Date | null} */ (null))
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setError("")
    try {
      const map = await fetchAllFlySnapshots(apps)
      if (Object.keys(map).length > 0) {
        setLiveByApp(map)
        setMode("live")
        setLastFetched(new Date())
      } else {
        setLiveByApp({})
        setMode("demo")
      }
    } catch (e) {
      setLiveByApp({})
      setMode("demo")
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [apps])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await refresh()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  useEffect(() => {
    if (refreshMs <= 0) return undefined
    const t = setInterval(refresh, refreshMs)
    return () => clearInterval(t)
  }, [refresh, refreshMs])

  return { liveByApp, mode, lastFetched, error, refresh }
}
