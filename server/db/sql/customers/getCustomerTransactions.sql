SELECT
  t.id, t.qty, t.unit_price, t.created_at AS ts,
  eb.name AS beer_name, eb.beer_id AS beer_id
FROM "transaction" t
LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
WHERE t.event_id = $1 AND t.customer_id = $2
ORDER BY t.created_at DESC;
