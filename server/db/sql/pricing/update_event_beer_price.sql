UPDATE event_beer
SET current_price = $1
WHERE id = $2;
