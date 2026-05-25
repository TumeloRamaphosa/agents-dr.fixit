import { useCallback, useId, useMemo, useRef, useState } from "react"
import {
  ASSISTANT_SKILLS,
  composeSystemPrompt,
  DEFAULT_SKILL_IDS,
} from "./assistantSkills.js"
import { C } from "./constants.js"
import { getDefaultModel, getOllamaBaseUrl, ollamaChat } from "./ollamaClient.js"

export function OllamaAssistant({ open, onClose }) {
  const panelId = useId()
  const [model, setModel] = useState(() => getDefaultModel())
  const [skillIds, setSkillIds] = useState(() => [...DEFAULT_SKILL_IDS])
  const [input, setInput] = useState("")
  const [transcript, setTranscript] = useState(() => [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const scrollRef = useRef(null)

  const basePreview = useMemo(() => {
    const b = getOllamaBaseUrl()
    return b || "(not configured)"
  }, [])

  const toggleSkill = useCallback((id) => {
    setSkillIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || busy) return

    setInput("")
    setError("")

    const history = [...transcript, { role: "user", content: text }]
    setTranscript(history)
    setBusy(true)

    const system = composeSystemPrompt(skillIds)
    const apiMessages = [{ role: "system", content: system }, ...history]

    try {
      const reply = await ollamaChat({
        model: model.trim() || getDefaultModel(),
        messages: apiMessages,
      })
      setTranscript((prev) => [...prev, { role: "assistant", content: reply }])
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      const modelHint = model.trim() || getDefaultModel()
      setTranscript((prev) => [
        ...prev,
        {
          role: "assistant",
          content: [
            "Could not reach Ollama.",
            "`ollama serve` must be running and the model pulled, e.g. `ollama pull " + modelHint + "`.",
            "With `npm run dev`, requests go to `/ollama` → `http://127.0.0.1:11434`.",
            "Error detail: " + msg,
          ].join(" "),
        },
      ])
    } finally {
      setBusy(false)
      requestAnimationFrame(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
      })
    }
  }, [busy, input, model, skillIds, transcript])

  const clearChat = useCallback(() => {
    setTranscript([])
    setError("")
  }, [])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close assistant"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          background: "rgba(0,0,0,.45)",
          border: "none",
          cursor: "pointer",
        }}
      />
      <aside
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${panelId}-title`}
        aria-label="Ollama assistant"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          zIndex: 10001,
          width: "min(420px,100vw)",
          height: "100%",
          background: C.bg2,
          borderLeft: `1px solid ${C.rule}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0,0,0,.4)",
          animation: "fadeIn .2s ease both",
        }}
      >
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.rule}`, flexShrink: 0 }}>
          <div id={`${panelId}-title`} className="cinzel" style={{ fontSize: ".62rem", fontWeight: 700, color: C.vg, letterSpacing: ".14em", textTransform: "uppercase" }}>
            Local LLM · Ollama
          </div>
          <div className="mono" style={{ fontSize: ".38rem", color: C.ink4, marginTop: 6, letterSpacing: ".06em", wordBreak: "break-word" }}>
            Endpoint: {basePreview}
          </div>
          <label className="mono" htmlFor={`${panelId}-model`} style={{ display: "block", fontSize: ".36rem", color: C.ink4, marginTop: 10 }}>
            MODEL
          </label>
          <input
            id={`${panelId}-model`}
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mono"
            spellCheck={false}
            autoComplete="off"
            style={{
              width: "100%",
              marginTop: 4,
              padding: "8px 10px",
              background: C.bg,
              border: `1px solid ${C.rule}`,
              color: C.gesso,
              fontSize: ".48rem",
            }}
          />
          <fieldset
            style={{ border: "none", padding: 0, marginTop: 12 }}
            aria-labelledby={`${panelId}-skills-legend`}
          >
            <legend id={`${panelId}-skills-legend`} className="mono" style={{ fontSize: ".36rem", color: C.ink4, marginBottom: 6 }}>
              SKILLS
            </legend>
            <div style={{ fontStyle: "italic", fontSize: ".72rem", color: "rgba(253,250,245,.45)", marginBottom: 8, lineHeight: 1.4 }}>
              Extend the system prompt (+ optional dashboard snapshot). Not separate tool APIs.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ASSISTANT_SKILLS.map((s) => {
                const on = skillIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkill(s.id)}
                    title={s.description}
                    aria-pressed={on}
                    style={{
                      padding: "4px 8px",
                      border: `1px solid ${on ? C.vg : C.rule}`,
                      background: on ? "rgba(201,169,98,.14)" : C.bg,
                      color: on ? C.gesso : C.ink4,
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: ".36rem",
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {transcript.length === 0 && !busy && (
            <div style={{ fontStyle: "italic", fontSize: ".88rem", color: "rgba(253,250,245,.5)", lineHeight: 1.55, marginBottom: 12 }}>
              Ask about infra, Soul Documents, or Super Agents. Enable skills to specialise tone and inject a mock dashboard snapshot (`Board snapshot`).
            </div>
          )}
          {transcript.map((m, i) => (
            <div
              key={`${i}-${m.role}-${String(m.content).slice(0, 32)}`}
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 2,
                background: m.role === "user" ? "rgba(0,212,255,.06)" : "rgba(201,169,98,.06)",
                border: `1px solid ${m.role === "user" ? "rgba(0,212,255,.12)" : "rgba(201,169,98,.12)"}`,
              }}
            >
              <div className="mono" style={{ fontSize: ".34rem", color: C.vgl, letterSpacing: ".12em", marginBottom: 6, textTransform: "uppercase" }}>
                {m.role}
              </div>
              <div style={{ fontStyle: "italic", fontSize: ".88rem", color: "rgba(253,250,245,.82)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="mono" style={{ fontSize: ".4rem", color: C.arc, letterSpacing: ".1em" }}>
              Thinking…
            </div>
          )}
        </div>

        {error ? (
          <div className="mono" style={{ padding: "0 16px 8px", fontSize: ".36rem", color: C.err, wordBreak: "break-word" }}>
            {error}
          </div>
        ) : null}

        <div style={{ padding: "12px 16px 16px", borderTop: `1px solid ${C.rule}`, flexShrink: 0 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Studex Command…"
            rows={3}
            style={{
              width: "100%",
              resize: "vertical",
              padding: "10px 12px",
              background: C.bg,
              border: `1px solid ${C.rule}`,
              color: C.gesso,
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: "1rem",
              lineHeight: 1.4,
              marginBottom: 8,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={send}
              disabled={busy}
              style={{
                flex: "1 1 120px",
                padding: "10px 12px",
                background: busy ? "rgba(201,169,98,.2)" : C.vg,
                border: "none",
                color: C.ink,
                fontFamily: "'Cinzel',serif",
                fontSize: ".52rem",
                fontWeight: 700,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              Send
            </button>
            <button
              type="button"
              onClick={clearChat}
              style={{
                padding: "10px 12px",
                background: "transparent",
                border: `1px solid ${C.rule}`,
                color: C.ink4,
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: ".42rem",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 12px",
                background: "transparent",
                border: `1px solid ${C.rule}`,
                color: C.ink4,
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: ".42rem",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
