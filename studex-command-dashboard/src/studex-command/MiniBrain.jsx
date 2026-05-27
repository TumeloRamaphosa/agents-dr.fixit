import { C, CAT_COLORS } from "./constants.js"

export function MiniBrain({ nodes = [], size = 180 }) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const N = nodes.length
  const phi = (1 + Math.sqrt(5)) / 2

  const pts = nodes.map((node, i) => {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / N)
    const angle = ((2 * Math.PI) / phi) * i
    return {
      x: cx + r * Math.sin(theta) * Math.cos(angle),
      y: cy + r * Math.sin(theta) * Math.sin(angle) * 0.55 + cy * 0.15,
      ...node,
    }
  })

  const lines = []
  for (let i = 0; i < Math.min(6, pts.length); i++) {
    const slice = pts.slice(i + 1, i + 3)
    for (let j = 0; j < slice.length; j++) {
      const q = slice[j]
      const p = pts[i]
      lines.push(
        <line
          key={`${i}-${j}-${p.id}-${q.id}`}
          x1={p.x}
          y1={p.y}
          x2={q.x}
          y2={q.y}
          stroke={C.vg}
          strokeWidth=".5"
          opacity=".08"
        />,
      )
    }
  }

  return (
    <svg width={size} height={size} style={{ overflow: "visible" }} aria-hidden>
      <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke={C.vg} strokeWidth=".5" strokeDasharray="4 8" opacity=".2" />
      <circle cx={cx} cy={cy} r={r * 0.4} fill={`${C.vg}08`} />
      {lines}
      {pts.map((p, i) => (
        <g key={p.id ?? i}>
          {p.hot && (
            <circle cx={p.x} cy={p.y} r={5} fill={CAT_COLORS[p.cat] || C.vg} opacity=".15" />
          )}
          <circle
            cx={p.x}
            cy={p.y}
            r={p.hot ? 3 : 2}
            fill={CAT_COLORS[p.cat] || C.vg}
            opacity={p.hot ? 1 : 0.6}
          />
        </g>
      ))}
    </svg>
  )
}
