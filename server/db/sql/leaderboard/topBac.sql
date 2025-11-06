-- Summer volum per kunde, returner topp 3 i liter
SELECT
  c.id,
  c.name,
  c.profile_image_url,
  ROUND(SUM(t.qty * t.volume_ml) / 1000.0, 2) AS score -- L
FROM "transaction" t
JOIN customer c ON c.id = t.customer_id
JOIN event_beer eb ON eb.id = t.event_beer_id
WHERE t.event_id = $1
GROUP BY c.id, c.name, c.profile_image_url
ORDER BY score DESC
LIMIT 3;
