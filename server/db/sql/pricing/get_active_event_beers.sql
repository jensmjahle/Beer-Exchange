SELECT
  id,
  event_id,
  base_price,
  min_price,
  max_price,
  current_price,
  active
FROM event_beer
WHERE event_id = $1
  AND active = TRUE
ORDER BY position, id;
