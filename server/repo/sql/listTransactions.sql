-- server/sql/listTransactions.sql
SELECT
  t.*,
  c.name AS customer_name,
  c.profile_image_url AS customer_profile_image_url,
  c.sexual_orientation AS customer_sexual_orientation,
  eb.name AS beer_name,
  eb.abv AS beer_abv
FROM "transaction" t
LEFT JOIN customer c ON c.id = t.customer_id
LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
WHERE t.event_id = $1
ORDER BY t.created_at DESC
LIMIT $2;
