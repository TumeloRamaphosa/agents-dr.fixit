const STORAGE_KEY = "studex-command-assistant-v1"

/** @typedef {{ model?: string, skillIds?: string[] }} AssistantPrefs */

/** @returns {AssistantPrefs} */
export function loadAssistantPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

/** @param {AssistantPrefs} prefs */
export function saveAssistantPrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore quota / private mode */
  }
}
