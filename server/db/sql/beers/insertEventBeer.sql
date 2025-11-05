INSERT INTO event_beer (
  id,
  event_id,
  name,
  brewery,
  style,
  abv,
  ibu,
  description,
  image_url,
  base_price,
  min_price,
  max_price,
  current_price,
  position,
  active,
  volumes
)
VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
  $11, $12, $13, $14, $15, $16
);
