-- server/sql/listPriceHistory.sql
SELECT
  new_price AS price,
  updated_at AS ts
FROM "PriceUpdate"
WHERE event_beer_id = $1
  AND ($2::timestamp IS NULL OR updated_at >= $2)
ORDER BY updated_at ASC;
