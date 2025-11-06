-- Summer total NOK brukt per kunde
SELECT
  c.id,
  c.name,
  c.profile_image_url,
  ROUND(SUM(t.qty * t.unit_price), 0) AS score
FROM "transaction" t
JOIN customer c ON c.id = t.customer_id
WHERE t.event_id = $1
GROUP BY c.id, c.name, c.profile_image_url
ORDER BY score DESC
LIMIT 3;
