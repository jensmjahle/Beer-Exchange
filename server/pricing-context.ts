export type EventBeerRow = {
  id: string
  base_price: number
  min_price: number
  max_price: number
  current_price: number
}

export function buildPricingContext(rows: EventBeerRow[]) {
  // Keep arrays aligned by the order of `rows`
  const ids = rows.map(r => r.id)
  const prices = rows.map(r => Number(r.current_price))
  const base = rows.map(r => Number(r.base_price))
  const minArr = rows.map(r => Number(r.min_price))
  const maxArr = rows.map(r => Number(r.max_price))

  // Event-specific target: sum of bases
  const targetSum = base.reduce((a, b) => a + b, 0)

  // "Fair" vector is the base by default (sum=fairSum=targetSum)
  const fair = base

  return { ids, prices, base, fair, minArr, maxArr, targetSum }
}
