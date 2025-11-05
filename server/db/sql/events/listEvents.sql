SELECT *
FROM event
ORDER BY
  CASE status
    WHEN 'live' THEN 0
    WHEN 'draft' THEN 1
    ELSE 2
  END,
  created_at DESC;
