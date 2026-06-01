import { useMemo } from "react"
import { C } from "./constants.js"
import { seededRng } from "../util/seededRng.js"

/** @param {{ vm: object, onClick: (vm: object) => void, selected: boolean, live?: object | null }} props */
export function VMCard({ vm, onClick, selected, live = null }) {
  const demo = useMemo(() => {
    const rng = seededRng(Number(vm.id) * 9973 + 1337)
    const run = rng() > 0.15 ? "running" : "stopped"
    return {
      status: run,
      metrics: {
        cpu: Math.floor(rng() * 45 + 5),
        mem: Math.floor(rng() * 60 + 20),
      },
    }
  }, [vm.id])

  const status = live?.status ?? demo.status
  const statusColor = status === "running" ? C.ok : C.err

  const metricCells = live
    ? [
        { label: "CPU", value: `${live.cpus || vm.cpu} vCPU`, bar: null },
        { label: "MEM", value: `${live.memoryMb || vm.mem} MB`, bar: null },
        { label: "Region", value: (live.region || vm.region.toUpperCase()).toUpperCase(), bar: null },
      ]
    : [
        { label: "CPU", value: `${demo.metrics.cpu}%`, bar: demo.metrics.cpu },
        { label: "MEM", value: `${demo.metrics.mem}%`, bar: demo.metrics.mem },
        { label: "Region", value: vm.region.toUpperCase(), bar: null },
      ]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(vm)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick(vm)
        }
      }}
      style={{
        background: selected ? "rgba(201,169,98,.08)" : C.bg2,
        border: `1px solid ${selected ? C.vg : C.rule}`,
        borderTop: `2px solid ${selected ? C.vg : statusColor}`,
        padding: "16px",
        cursor: "pointer",
        transition: "all .2s",
        animation: "fadeUp .3s ease both",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: "1.3rem" }} aria-hidden>
          {vm.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div
            className="cinzel"
            style={{
              fontSize: ".62rem",
              fontWeight: 700,
              color: C.gesso,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            VM {vm.id} — {vm.name}
          </div>
          <div
            className="mono"
            style={{ fontSize: ".42rem", color: C.ink4, letterSpacing: ".06em", marginTop: 2 }}
          >
            {vm.app}.fly.dev
            {live?.machineCount && live.machineCount > 1 ? ` · ${live.machineCount} machines` : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: statusColor,
              animation: status === "running" ? "pip 2s infinite" : "none",
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: ".42rem",
              color: statusColor,
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            {status}
          </span>
        </div>
      </div>

      <div style={{ fontStyle: "italic", fontSize: ".82rem", color: C.ink4, marginBottom: 12, lineHeight: 1.4 }}>
        {vm.role}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {metricCells.map((m) => (
          <div key={m.label}>
            <div
              className="mono"
              style={{
                fontSize: ".4rem",
                color: C.ink4,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                marginBottom: 3,
              }}
            >
              {m.label}
            </div>
            <div
              className="mono"
              style={{
                fontSize: ".56rem",
                color: m.bar && m.bar > 70 ? C.warn : C.vg,
                marginBottom: m.bar ? 4 : 0,
              }}
            >
              {m.value}
            </div>
            {m.bar !== null && (
              <div style={{ height: 2, background: "rgba(201,169,98,.1)", borderRadius: 1, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 1,
                    background: m.bar > 70 ? C.warn : C.vg,
                    width: `${m.bar}%`,
                    transition: "width .5s ease",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
