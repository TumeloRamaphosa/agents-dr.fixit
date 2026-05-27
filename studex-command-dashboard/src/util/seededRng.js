/** Deterministic RNG for demo UI (stable across mounts, avoids hydration surprises). */
export function seededRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}
