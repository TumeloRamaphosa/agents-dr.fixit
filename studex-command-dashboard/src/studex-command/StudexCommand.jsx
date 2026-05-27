import { useEffect, useState } from "react"
import { C } from "./constants.js"
import { VMS } from "./data.js"
import { OllamaAssistant } from "./OllamaAssistant.jsx"
import "./studex-command.css"
import { CognitivePage } from "./CognitivePage.jsx"
import { InfraPage } from "./InfraPage.jsx"
import { SoulDocPage } from "./SoulDocPage.jsx"

const PAGES = [
  { id: "infra", label: "Infrastructure", icon: "🖥️", component: InfraPage },
  { id: "cognitive", label: "Cognitive Repository", icon: "🧠", component: CognitivePage },
  {
    id: "founder",
    label: "Founder's Brain",
    icon: "⚡",
    component: () => <CognitivePage isFounder title="Founder's Brain" />,
  },
  { id: "souldoc", label: "Soul Document", icon: "📜", component: SoulDocPage },
]

export default function StudexCommand() {
  const [page, setPage] = useState("infra")
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [time, setTime] = useState(
    () => new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  )

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const Active = PAGES.find((p) => p.id === page)?.component ?? InfraPage

  return (
    <div className="studex-command">
      <div className="studex-command-grain" aria-hidden />
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
        <header
          className="studex-command-header"
          style={{
            minHeight: 48,
            flexShrink: 0,
            padding: "8px 24px",
            background: "rgba(10,8,6,.95)",
            borderBottom: `1px solid ${C.rule}`,
          }}
        >
          <div className="studex-command-nav-shell">
            <div className="cinzel" style={{ fontSize: ".7rem", fontWeight: 900, color: C.vg, letterSpacing: ".2em", textTransform: "uppercase" }}>
              Studex Command
            </div>
            <div style={{ width: 1, height: 20, background: C.rule }} aria-hidden />
            <nav className="studex-command-nav-scroll" aria-label="Primary">
              {PAGES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPage(p.id)}
                  aria-current={page === p.id ? "page" : undefined}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: `2px solid ${page === p.id ? C.vg : "transparent"}`,
                    color: page === p.id ? C.vgl : C.ink4,
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: ".44rem",
                    fontWeight: 500,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    padding: "4px 12px",
                    cursor: "pointer",
                    transition: "all .2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span aria-hidden>{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="studex-command-header-right" style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setAssistantOpen(true)}
              className="mono"
              style={{
                padding: "6px 12px",
                background: "rgba(0,212,255,.08)",
                border: `1px solid rgba(0,212,255,.25)`,
                color: C.arc,
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: ".4rem",
                letterSpacing: ".12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Ask LLM
            </button>
            <div style={{ display: "flex", gap: 4 }} aria-hidden>
              {VMS.map((v, i) => (
                <div
                  key={v.id}
                  title={v.name}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: C.ok,
                    animation: `pip ${1.5 + i * 0.3}s infinite`,
                  }}
                />
              ))}
            </div>
            <div style={{ width: 1, height: 16, background: C.rule }} aria-hidden />
            <span className="mono" style={{ fontSize: ".44rem", color: C.arc, letterSpacing: ".1em" }}>
              {time}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.ok, animation: "pip 2s infinite" }} aria-hidden />
              <span className="mono" style={{ fontSize: ".44rem", color: C.ok, letterSpacing: ".1em", textTransform: "uppercase" }}>
                All Systems Operational
              </span>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflow: "hidden", position: "relative", zIndex: 1 }}>
          <Active />
        </div>

        <OllamaAssistant
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          activePage={PAGES.find((p) => p.id === page)?.label ?? page}
        />
      </div>
    </div>
  )
}
