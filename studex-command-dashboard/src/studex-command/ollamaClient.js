/**
 * Ollama HTTP API base URL.
 * - In Vite dev: default `/ollama` is proxied to `http://127.0.0.1:11434` (see vite.config.js).
 * - In production / preview: set `VITE_OLLAMA_BASE_URL` (and enable CORS on Ollama via `OLLAMA_ORIGINS`, see README).
 */
export function getOllamaBaseUrl() {
  const fromEnv = import.meta.env.VITE_OLLAMA_BASE_URL
  if (fromEnv && typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, "")
  }
  if (import.meta.env.DEV) {
    return "/ollama"
  }
  return ""
}

export function getDefaultModel() {
  const m = import.meta.env.VITE_OLLAMA_MODEL
  if (m && typeof m === "string" && m.trim()) return m.trim()
  return "llama3.2:latest"
}

/** @param {{ model: string, messages: Array<{ role: string, content: string }>, signal?: AbortSignal }} opts */
export async function ollamaChat({ model, messages, signal }) {
  const base = getOllamaBaseUrl()
  if (!base) {
    throw new Error(
      "No Ollama base URL. Run `npm run dev` (proxy) or set VITE_OLLAMA_BASE_URL with CORS on Ollama.",
    )
  }
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
