SELECT
  SUM(t.qty * t.unit_price) AS total_income,
  SUM(t.qty * eb.base_price) AS fair_income
FROM "transaction" t
JOIN event_beer eb ON eb.id = t.event_beer_id
WHERE t.event_id = $1;
