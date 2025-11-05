SELECT
  id,
  event_beer_id,
  old_price,
  new_price,
  updated_at
FROM price_update
WHERE event_beer_id = $1
ORDER BY updated_at DESC
LIMIT 1;
