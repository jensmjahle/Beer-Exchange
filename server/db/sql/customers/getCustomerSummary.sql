SELECT COALESCE(SUM(t.qty),0) AS beers, COALESCE(SUM(t.qty * t.unit_price),0) AS tab
FROM "transaction" t
WHERE t.event_id = $1 AND t.customer_id = $2;
