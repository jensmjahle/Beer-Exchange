// server/pricing-context.ts
export type EventBeerRow = {
  id: string;
  base_price: number | string;
  min_price: number | string;
  max_price: number | string;
  current_price: number | string;
};

export function buildPricingContext(rows: EventBeerRow[]) {
  const ids = rows.map((r) => r.id);
  const prices = rows.map((r) => Number(r.current_price) || 0);
  const base = rows.map((r) => Number(r.base_price) || 0);
  const minArr = rows.map((r) => Number(r.min_price) || 0);
  const maxArr = rows.map((r) => Number(r.max_price) || 0);
  const targetSum = base.reduce((a, b) => a + b, 0);
  const fair = base;
  return { ids, prices, base, fair, minArr, maxArr, targetSum };
}
