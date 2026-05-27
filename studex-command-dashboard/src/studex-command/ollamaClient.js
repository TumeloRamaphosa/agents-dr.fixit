/**
 * Ollama HTTP API base URL.
 * Default `/ollama` expects a reverse proxy (Vite dev, nginx Docker, or your edge).
 * Override with VITE_OLLAMA_BASE_URL for a direct origin (requires Ollama CORS).
 */
export function getOllamaBaseUrl() {
  const fromEnv = import.meta.env.VITE_OLLAMA_BASE_URL
  if (fromEnv && typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, "")
  }
  return "/ollama"
}

export function getDefaultModel() {
  const m = import.meta.env.VITE_OLLAMA_MODEL
  if (m && typeof m === "string" && m.trim()) return m.trim()
  return "llama3.2:latest"
}

/** @param {{ model: string, messages: Array<{ role: string, content: string }>, signal?: AbortSignal }} opts */
export async function ollamaChat({ model, messages, signal }) {
  const base = getOllamaBaseUrl()
  const url = `${base}/api/chat`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Ollama HTTP ${res.status}`)
  }
  const data = await res.json()
  const text = data?.message?.content ?? ""
  if (!text) throw new Error("Empty response from Ollama")
  return text
}
