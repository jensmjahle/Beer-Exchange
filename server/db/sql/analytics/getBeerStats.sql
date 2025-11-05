WITH txs AS (
  SELECT
    t.id,
    t.event_id,
    t.event_beer_id,
    t.customer_id,
    t.unit_price,
    t.qty,
    t.created_at,
    c.name AS customer_name,
    (t.unit_price / NULLIF(t.qty, 0)) AS price_per_unit
  FROM "transaction" t
  LEFT JOIN customer c ON c.id = t.customer_id
  WHERE t.event_id = $1
    AND t.event_beer_id = $2
),

summary AS (
  SELECT
    COUNT(*) AS trade_count,
    COALESCE(SUM(qty), 0) AS total_sold,
    COALESCE(AVG(unit_price), 0) AS avg_price,
    MAX(unit_price) AS ath,
    MIN(unit_price) AS atl,
    MIN(created_at) AS first_ts,
    MAX(created_at) AS last_ts
  FROM txs
),

best_trade AS (
  SELECT
    jsonb_build_object(
      'customer', customer_name,
      'price', unit_price,
      'qty', qty,
      'ts', created_at,
      'price_per_unit', price_per_unit
    ) AS data
  FROM txs
  ORDER BY price_per_unit ASC NULLS LAST
  LIMIT 1
),

worst_trade AS (
  SELECT
    jsonb_build_object(
      'customer', customer_name,
      'price', unit_price,
      'qty', qty,
      'ts', created_at,
      'price_per_unit', price_per_unit
    ) AS data
  FROM txs
  ORDER BY price_per_unit DESC NULLS LAST
  LIMIT 1
),

-- Topp 5 kunder, beregnet i en separat CTE uten nesting
top_customer_rows AS (
  SELECT
    customer_name,
    SUM(qty) AS total_qty,
    SUM(qty * unit_price) AS total_spent
  FROM txs
  WHERE customer_name IS NOT NULL
  GROUP BY customer_name
  ORDER BY total_qty DESC
  LIMIT 5
),
top_customers AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'customer', customer_name,
      'total_qty', total_qty,
      'total_spent', total_spent
    )
    ORDER BY total_qty DESC
  ) AS data
  FROM top_customer_rows
),

recent_trade_rows AS (
  SELECT
    customer_name,
    unit_price,
    qty,
    created_at
  FROM txs
  ORDER BY created_at DESC
  LIMIT 10
),
recent_trades AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'customer', customer_name,
      'price', unit_price,
      'qty', qty,
      'ts', created_at
    )
    ORDER BY created_at DESC
  ) AS data
  FROM recent_trade_rows
)

SELECT
  s.trade_count,
  s.total_sold,
  s.avg_price,
  s.ath,
  s.atl,
  s.first_ts,
  s.last_ts,
  (SELECT data FROM best_trade) AS best_trade,
  (SELECT data FROM worst_trade) AS worst_trade,
  COALESCE((SELECT data FROM top_customers), '[]') AS top_customers,
  COALESCE((SELECT data FROM recent_trades), '[]') AS recent_trades
FROM summary s;
