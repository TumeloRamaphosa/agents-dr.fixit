import { useCallback, useEffect, useState } from "react"
import { fetchHubHealth, fetchHubInventory } from "./hubClient.js"

export function useSuperAgentsHub() {
  const [health, setHealth] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    const [h, inv] = await Promise.all([fetchHubHealth(), fetchHubInventory()])
    if (h.ok) setHealth(h.data)
    else setHealth(null)
    if (inv.ok) setInventory(inv.data)
    else setInventory(null)
    const err = !h.ok ? h.error : !inv.ok ? inv.error : ""
    if (err) setError(err)
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh()
    }, 0)
    const id = window.setInterval(() => {
      void refresh()
    }, 60_000)
    return () => {
      window.clearTimeout(t)
      window.clearInterval(id)
    }
  }, [refresh])

  return { health, inventory, loading, error, refresh, configured: Boolean(inventory || health) }
}
