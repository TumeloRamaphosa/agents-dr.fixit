import { C } from "./constants.js"
import { VM_LOGS } from "./data.js"

export function VMMemoryLog({ vm }) {
  const logs = VM_LOGS[vm.id] || []
  const typeColors = {
    system: C.arc,
    agent: C.vg,
    code: "#9B59B6",
    mail: "#E8A030",
    slack: "#3DC87A",
    jarvis: C.arc,
    signup: C.vg,
  }
  const typeIcons = {
    system: "⚙",
    agent: "🤖",
    code: "💻",
    mail: "📧",
    slack: "💬",
    jarvis: "⚡",
    signup: "✍",
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.rule}`, flexShrink: 0 }}>
        <div
          className="mono"
          style={{
            fontSize: ".44rem",
            color: C.vg,
            letterSpacing: ".2em",
            textTransform: "uppercase",
            marginBottom: 2,
          }}
        >
          {vm.name} · Daily Memory Log
        </div>
        <div style={{ fontStyle: "italic", fontSize: ".78rem", color: C.ink4 }}>
          {new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {logs.map((log, i) => (
          <div
            key={`${vm.id}-${i}-${log.t}`}
            style={{
              padding: "8px 16px",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              borderBottom: "1px solid rgba(201,169,98,.04)",
              animation: `fadeUp .3s ease ${i * 0.04}s both`,
            }}
          >
            <span className="mono" style={{ fontSize: ".44rem", color: C.ink4, flexShrink: 0, paddingTop: 2 }}>
              {log.t}
            </span>
            <span style={{ fontSize: ".8rem", flexShrink: 0 }} aria-hidden>
              {typeIcons[log.type] || "·"}
            </span>
            <div>
              <span
                className="mono"
                style={{
                  fontSize: ".4rem",
                  color: typeColors[log.type] || C.vg,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                {log.type}
              </span>
              <div style={{ fontStyle: "italic", fontSize: ".85rem", color: "rgba(253,250,245,.7)", lineHeight: 1.5 }}>
                {log.msg}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.rule}`, flexShrink: 0 }}>
        <div
          className="mono"
          style={{ fontSize: ".42rem", color: C.ink4, letterSpacing: ".1em", textTransform: "uppercase" }}
        >
          {logs.length} events logged today · Auto-saved at midnight
        </div>
      </div>
    </div>
  )
}
