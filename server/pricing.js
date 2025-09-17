// server/pricing.js

// Evenly reduce others, clamp, then push back to exact targetSum using fair as weights.
export function rebalanceWeighted({
  prices,
  boughtIndex,
  delta = 1.0,
  minArr,
  maxArr,
  fair,
  targetSum,
  roundTo = 0.5
}) {
  const n = prices.length
  if (!n) return []

  const p = prices.slice()
  p[boughtIndex] += delta
  const dec = delta / Math.max(1, n - 1)
  for (let i = 0; i < n; i++) if (i !== boughtIndex) p[i] -= dec

  // clamp
  for (let i = 0; i < n; i++) {
    p[i] = Math.max(minArr[i], Math.min(maxArr[i], p[i]))
  }

  // adjust back to exact targetSum using fair as weights
  const sum = p.reduce((a, b) => a + b, 0)
  const diff = sum - targetSum // positive => need to subtract diff

  if (Math.abs(diff) > 1e-9) {
    redistributeToTargetSum(p, diff, minArr, maxArr, fair)
  }

  // optional rounding and tiny correction
  if (roundTo && roundTo > 0) {
    for (let i = 0; i < n; i++) {
      p[i] = Math.round(p[i] / roundTo) * roundTo
      p[i] = Math.max(minArr[i], Math.min(maxArr[i], p[i]))
    }
    const s2 = p.reduce((a, b) => a + b, 0)
    const drift = s2 - targetSum
    if (Math.abs(drift) >= roundTo / 2 - 1e-9) {
      const dir = drift > 0 ? -1 : +1
      // prefer to push correction into the bought item
      const i = boughtIndex
      const candidate = p[i] + dir * roundTo
      if (candidate >= minArr[i] - 1e-9 && candidate <= maxArr[i] + 1e-9) {
        p[i] = candidate
      }
    }
  }

  return p
}

// internal helper: distribute a total diff across items with bounds, using weights
function redistributeToTargetSum(p, diff, minArr, maxArr, weights) {
  const n = p.length
  if (!n) return p
  let remaining = Math.abs(diff)
  const dir = diff > 0 ? -1 : +1 // +1 means add, -1 means subtract
  const EPS = 1e-9

  for (let iter = 0; iter < 10 && remaining > EPS; iter++) {
    const movable = []
    for (let i = 0; i < n; i++) {
      if (dir > 0) { // add
        if (p[i] + EPS < maxArr[i]) movable.push(i)
      } else { // subtract
        if (p[i] > minArr[i] + EPS) movable.push(i)
      }
    }
    if (!movable.length) break

    let wSum = 0
    for (const i of movable) wSum += Math.max(0, weights[i])
    const equal = wSum <= EPS

    let allocated = 0
    for (const i of movable) {
      const w = equal ? 1 : Math.max(0, weights[i])
      const share = (equal ? 1 / movable.length : w / wSum) * remaining
      if (dir > 0) {
        const room = maxArr[i] - p[i]
        const add = Math.min(share, room)
        p[i] += add
        allocated += add
      } else {
        const room = p[i] - minArr[i]
        const sub = Math.min(share, room)
        p[i] -= sub
        allocated += sub
      }
    }
    if (allocated <= EPS) break
    remaining -= allocated
  }
  return p
}
