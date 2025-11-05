INSERT INTO event (
  id, name, currency, status, starts_at, ends_at, created_at, image_url
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
