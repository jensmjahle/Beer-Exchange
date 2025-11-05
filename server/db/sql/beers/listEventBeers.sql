SELECT *
FROM event_beer
WHERE event_id = $1
ORDER BY position, id;
