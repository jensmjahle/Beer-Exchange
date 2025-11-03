SELECT
  t.id,
  t.event_id,
  t.event_beer_id,
  t.customer_id,
  t.qty,
  t.unit_price,
  t.created_at AS ts,
  c.name AS customer_name,
  eb.name AS beer_name,
  eb.beer_id AS beer_id
FROM "transaction" t
LEFT JOIN customer c ON c.id = t.customer_id
LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
WHERE t.event_id = ?
ORDER BY datetime(t.created_at) DESC
LIMIT ?;
