import { useState } from "react"
import { C, CAT_COLORS } from "./constants.js"
import { BRAIN_NODES } from "./data.js"
import { MiniBrain } from "./MiniBrain.jsx"

export function CognitivePage({ isFounder = false, title = "Cognitive Repository" }) {
  const [selectedNode, setSelectedNode] = useState(null)
  const [filter, setFilter] = useState("all")
  const nodes = BRAIN_NODES
  const filtered = filter === "all" ? nodes : nodes.filter((n) => n.cat === filter)
  const cats = [...new Set(nodes.map((n) => n.cat))]

  const todayLog = [
    { t: "06:00", cat: "system", entry: "Cognitive system initialised — 18 nodes loaded" },
    { t: "08:30", cat: "strategy", entry: "Africa Tour — Mozambique venue confirmed · memory updated" },
    { t: "09:15", cat: "tech", entry: "VM5 portal deployed to Fly.io — architecture node updated" },
    { t: "10:00", cat: "revenue", entry: "Super Agents R100M target — pipeline review logged" },
    { t: "11:30", cat: "product", entry: "Northstar Framework — new ritual flow designed" },
    { t: "14:00", cat: "infra", entry: "Cloudflare tunnel reconfigured — port 4001 added" },
    { t: "16:30", cat: "agents", entry: "Naledi recovered R627 cart — brain performance noted" },
    { t: "18:00", cat: "system", entry: "Daily cognitive snapshot saved — 18 active nodes" },
  ]

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.rule}`, flexShrink: 0 }}>
        <div className="cinzel" style={{ fontSize: ".6rem", fontWeight: 700, color: C.vg, letterSpacing: ".24em", textTransform: "uppercase" }}>
          {title}
        </div>
        <div style={{ fontStyle: "italic", fontSize: ".88rem", color: C.ink4 }}>
          {isFounder ? "Tumelo Ramaphosa · Founder & CEO · Personal knowledge graph" : "Studex Group · Shared intelligence layer · Updated daily"}
        </div>
      </div>

      <div className="studex-command-cognitive-grid">
        <div
          className="studex-command-cognitive-sidebar"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            borderRight: `1px solid ${C.rule}`,
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,169,98,.04), transparent)",
          }}
        >
          <MiniBrain nodes={nodes} size={160} />
          <div
            className="mono"
            style={{
              fontSize: ".42rem",
              color: C.vg,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              marginTop: 12,
              textAlign: "center",
            }}
          >
            {nodes.length} Nodes
          </div>
          <div style={{ fontStyle: "italic", fontSize: ".72rem", color: C.ink4, textAlign: "center", marginTop: 4 }}>
            Cognitive graph
          </div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
            {cats.map((cat) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: CAT_COLORS[cat] || C.vg, flexShrink: 0 }} />
                <span className="mono" style={{ fontSize: ".38rem", color: C.ink4, letterSpacing: ".06em", textTransform: "uppercase" }}>
                  {cat}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="studex-command-cognitive-middle"
          style={{ overflowY: "auto", padding: "12px 0", borderRight: `1px solid ${C.rule}` }}
        >
          <div style={{ padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: 4 }}>
            {["all", ...cats].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                style={{
                  padding: "2px 8px",
                  border: "none",
                  cursor: "pointer",
                  background: filter === c ? CAT_COLORS[c] || C.vg : "rgba(201,169,98,.06)",
                  color: filter === c ? C.ink : C.ink4,
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".4rem",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  transition: "all .15s",
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {filtered.map((node, i) => (
            <div
              key={node.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedNode(node)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setSelectedNode(node)
                }
              }}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                background: selectedNode?.id === node.id ? "rgba(201,169,98,.08)" : "transparent",
                borderLeft: `2px solid ${selectedNode?.id === node.id ? CAT_COLORS[node.cat] : "transparent"}`,
                transition: "all .15s",
                animation: `fadeUp .3s ease ${i * 0.03}s both`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: CAT_COLORS[node.cat],
                    flexShrink: 0,
                    animation: node.hot ? "pip 2s infinite" : "none",
                  }}
                />
                <span style={{ fontStyle: "italic", fontSize: ".88rem", color: "rgba(253,250,245,.78)", lineHeight: 1.4 }}>
                  {node.label}
                </span>
              </div>
              <div style={{ marginLeft: 14, display: "flex", gap: 8 }}>
                <span
                  className="mono"
                  style={{
                    fontSize: ".4rem",
                    color: CAT_COLORS[node.cat],
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                  }}
                >
                  {node.cat}
                </span>
                {node.hot && (
                  <span
                    className="mono"
                    style={{
                      fontSize: ".38rem",
                      color: C.ok,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      padding: "1px 5px",
                      background: "rgba(61,200,122,.08)",
                    }}
                  >
                    active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.rule}`, flexShrink: 0 }}>
            <div className="mono" style={{ fontSize: ".44rem", color: C.vg, letterSpacing: ".18em", textTransform: "uppercase" }}>
              Daily Memory Log
            </div>
            <div style={{ fontStyle: "italic", fontSize: ".72rem", color: C.ink4, marginTop: 2 }}>
              {new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {todayLog.map((log, i) => (
              <div
                key={`${log.t}-${i}`}
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(201,169,98,.04)",
                  animation: `fadeUp .3s ease ${i * 0.04}s both`,
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                  <span className="mono" style={{ fontSize: ".42rem", color: C.ink4 }}>
                    {log.t}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: ".4rem",
                      color: CAT_COLORS[log.cat] || C.vg,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {log.cat}
                  </span>
                </div>
                <div style={{ fontStyle: "italic", fontSize: ".82rem", color: "rgba(253,250,245,.65)", lineHeight: 1.5 }}>
                  {log.entry}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.rule}`, flexShrink: 0 }}>
            <div className="mono" style={{ fontSize: ".4rem", color: C.ink4, letterSpacing: ".1em", textTransform: "uppercase" }}>
              {todayLog.length} entries today · Saved automatically
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
