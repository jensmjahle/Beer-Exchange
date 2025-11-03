INSERT INTO "transaction"
(id, event_id, event_beer_id, customer_id, qty, volume_ml, unit_price, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
