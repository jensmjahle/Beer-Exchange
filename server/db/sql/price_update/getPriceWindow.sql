-- server/db/sql/price_update/getPriceWindow.sql
WITH last_before AS (
  SELECT
    event_beer_id,
    COALESCE(new_price, old_price) AS price,
    updated_at
  FROM price_update
  WHERE event_beer_id = $1
    AND updated_at <= $2
  ORDER BY updated_at DESC
  LIMIT 1
),
last_after AS (
  SELECT
    event_beer_id,
    COALESCE(new_price, old_price) AS price,
    updated_at
  FROM price_update
  WHERE event_beer_id = $1
  ORDER BY updated_at DESC
  LIMIT 1
)
SELECT
  (SELECT price  FROM last_before) AS old_price,
  (SELECT price  FROM last_after)  AS new_price,
  (SELECT updated_at FROM last_after) AS updated_at;
