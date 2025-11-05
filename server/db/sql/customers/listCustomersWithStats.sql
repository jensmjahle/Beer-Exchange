SELECT
  c.id, c.event_id, c.name, c.phone,
  c.shoe_size, c.weight, c.profile_image_url, c.work_relationship,
  c.gender, c.sexual_orientation, c.ethnicity, c.experience_level,
  COALESCE(SUM(t.qty),0) AS beers,
  COALESCE(SUM(t.qty * t.unit_price),0) AS tab
FROM customer c
LEFT JOIN "transaction" t ON t.customer_id = c.id AND t.event_id = c.event_id
WHERE c.event_id = $1
GROUP BY c.id
ORDER BY tab DESC, name ASC;
