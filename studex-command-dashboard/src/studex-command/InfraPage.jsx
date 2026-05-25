import { useState } from "react"
import { C } from "./constants.js"
import { VMS } from "./data.js"
import { VMCard } from "./VMCard.jsx"
import { VMMemoryLog } from "./VMMemoryLog.jsx"

export function InfraPage() {
  const [selectedVM, setSelectedVM] = useState(VMS[3])
  const [lastFetched] = useState(() => new Date().toLocaleTimeString("en-ZA"))

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.rule}`, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div
              className="cinzel"
              style={{
                fontSize: ".6rem",
                fontWeight: 700,
                color: C.vg,
                letterSpacing: ".24em",
                textTransform: "uppercase",
              }}
            >
              Infrastructure
            </div>
            <div style={{ fontStyle: "italic", fontSize: ".88rem", color: C.ink4 }}>
              Fly.io layout · Demo metrics & logs (wire to Machines API when ready)
            </div>
          </div>
          <div className="mono" style={{ fontSize: ".44rem", color: C.ink4, letterSpacing: ".1em" }}>
            Snapshot: {lastFetched} · Region: JNB · api.fly.io/v1
          </div>
        </div>
      </div>

      <div className="studex-command-infra-grid">
        <div
          className="studex-command-infra-left"
          style={{
            overflowY: "auto",
            padding: "16px",
            borderRight: `1px solid ${C.rule}`,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: ".44rem",
              color: C.arc,
              letterSpacing: ".2em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            5 Machines · Johannesburg Region
          </div>
          {VMS.map((vm) => (
            <VMCard key={vm.id} vm={vm} onClick={setSelectedVM} selected={selectedVM?.id === vm.id} />
          ))}
        </div>

        <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {selectedVM ? (
            <VMMemoryLog vm={selectedVM} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <div style={{ fontStyle: "italic", color: C.ink4 }}>Select a VM to view its memory log</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
