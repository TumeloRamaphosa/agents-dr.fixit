import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

const ollamaProxy = {
  target: "http://127.0.0.1:11434",
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/ollama/, ""),
}

/** @param {string | undefined} token */
function flyProxy(token) {
  return {
    target: "https://api.machines.dev",
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/fly/, ""),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const flyToken = env.VITE_FLY_API_TOKEN || env.FLY_API_TOKEN

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/ollama": ollamaProxy,
        "/fly": flyProxy(flyToken),
      },
    },
    preview: {
      proxy: {
        "/ollama": ollamaProxy,
        "/fly": flyProxy(flyToken),
      },
    },
  }
})
