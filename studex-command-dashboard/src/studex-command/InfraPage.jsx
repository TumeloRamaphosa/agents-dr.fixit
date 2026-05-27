import { useState } from "react"
import { C } from "./constants.js"
import { VMS } from "./data.js"
import { VMCard } from "./VMCard.jsx"
import { VMMemoryLog } from "./VMMemoryLog.jsx"
import { useFlyMachines } from "./useFlyMachines.js"

export function InfraPage() {
  const [selectedVM, setSelectedVM] = useState(VMS[3])
  const { liveByApp, mode, lastFetched, error, refresh } = useFlyMachines(VMS)

  const fetchedLabel = lastFetched
    ? lastFetched.toLocaleTimeString("en-ZA")
    : new Date().toLocaleTimeString("en-ZA")

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
              {mode === "live"
                ? "Fly Machines API · Live machine state (CPU/mem are allocated resources)"
                : "Fly.io layout · Demo metrics & logs (set VITE_FLY_API_TOKEN for live state)"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              className="mono"
              style={{
                fontSize: ".4rem",
                color: mode === "live" ? C.ok : C.ink4,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                padding: "2px 8px",
                border: `1px solid ${mode === "live" ? "rgba(61,200,122,.35)" : C.rule}`,
              }}
            >
              {mode === "loading" ? "Checking…" : mode === "live" ? "Live" : "Demo"}
            </span>
            <button
              type="button"
              onClick={() => refresh()}
              className="mono"
              style={{
                fontSize: ".4rem",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                padding: "4px 10px",
                background: "transparent",
                border: `1px solid ${C.rule}`,
                color: C.vg,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
            <span className="mono" style={{ fontSize: ".44rem", color: C.ink4, letterSpacing: ".1em" }}>
              {fetchedLabel} · JNB · api.machines.dev
            </span>
          </div>
        </div>
        {error && mode === "demo" ? (
          <div className="mono" style={{ fontSize: ".38rem", color: C.warn, marginTop: 8, letterSpacing: ".06em" }}>
            Fly fallback: {error}
          </div>
        ) : null}
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
            {VMS.length} Apps · Johannesburg Region
          </div>
          {VMS.map((vm) => (
            <VMCard
              key={vm.id}
              vm={vm}
              live={liveByApp[vm.app] ?? null}
              onClick={setSelectedVM}
              selected={selectedVM?.id === vm.id}
            />
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
