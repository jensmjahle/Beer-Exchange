// server/pricing-context.ts
export type EventBeerRow = {
  id: string;
  base_price: number;
  min_price: number;
  max_price: number;
  current_price: number;
};

export function buildPricingContext(rows: EventBeerRow[]) {
  const ids = rows.map((r) => r.id);
  const prices = rows.map((r) => Number(r.current_price));
  const base = rows.map((r) => Number(r.base_price));
  const minArr = rows.map((r) => Number(r.min_price));
  const maxArr = rows.map((r) => Number(r.max_price));
  const targetSum = base.reduce((a, b) => a + b, 0);
  const fair = base;
  return { ids, prices, base, fair, minArr, maxArr, targetSum };
}
