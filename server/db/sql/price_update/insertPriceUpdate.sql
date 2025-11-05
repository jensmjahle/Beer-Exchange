INSERT INTO price_update (
  id,
  event_beer_id,
  old_price,
  new_price,
  updated_at
)
VALUES ($1, $2, $3, $4, NOW())
RETURNING *;
