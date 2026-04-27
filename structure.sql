-- 1. Core: products
CREATE TABLE products (
  product_id       BIGSERIAL PRIMARY KEY,
  sku              VARCHAR(64) NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  category_id      INT,                       -- FK to categories
  base_price       NUMERIC(12,2) NOT NULL,    -- reference price
  cost_price       NUMERIC(12,2) NOT NULL,    -- last known cost
  current_price    NUMERIC(12,2) NOT NULL,    -- price used by POS
  min_price        NUMERIC(12,2) DEFAULT 0.00, -- administrative floor
  max_discount_pct NUMERIC(5,2) DEFAULT 50.00, -- e.g. 50%
  shelf_life_days  INT,                        -- typical shelf-life if relevant
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
  version          BIGINT DEFAULT 0
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);

-- 2. Batches: per-receipt inventory batch with expiry
CREATE TABLE batches (
  batch_id         BIGSERIAL PRIMARY KEY,
  product_id       BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  batch_code       VARCHAR(128),                   -- lot/batch identifier
  quantity_received INT NOT NULL,
  quantity_available INT NOT NULL,                 -- available for sale (not reserved)
  manufacture_date DATE,
  expiry_date      DATE,                            -- critical for expiry-driven pricing
  location_id      INT,                             -- warehouse zone
  received_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, batch_code)
);

CREATE INDEX idx_batches_expiry ON batches(expiry_date);

-- 3. Warehouses & locations
CREATE TABLE warehouses (
  warehouse_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  address TEXT,
  timezone TEXT DEFAULT 'UTC'
);

CREATE TABLE locations (
  location_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  warehouse_id INT REFERENCES warehouses(warehouse_id),
  code VARCHAR(32),
  description TEXT
);
CREATE INDEX idx_locations_warehouse ON locations(warehouse_id);

-- 4. Inventory (aggregate quantities per product-location, for fast ACID updates)
CREATE TABLE inventory (
  inventory_id BIGSERIAL PRIMARY KEY,
  product_id   BIGINT NOT NULL REFERENCES products(product_id),
  location_id  INT REFERENCES locations(location_id),
  quantity     INT NOT NULL DEFAULT 0,
  reserved     INT NOT NULL DEFAULT 0,
  safety_stock INT NOT NULL DEFAULT 0,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, location_id)
);
CREATE INDEX idx_inventory_product ON inventory(product_id);

-- 5. Customers
CREATE TABLE customers (
  customer_id BIGSERIAL PRIMARY KEY,
  name TEXT,
  email VARCHAR(256),
  phone VARCHAR(32),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_customers_email ON customers(email);

-- 6. Orders & items (POS / e-commerce orders)
CREATE TABLE orders (
  order_id BIGSERIAL PRIMARY KEY,
  order_no VARCHAR(64) UNIQUE,
  customer_id BIGINT REFERENCES customers(customer_id),
  order_ts TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(32) NOT NULL,   -- e.g., new, paid, shipped, cancelled
  payment_method VARCHAR(32),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  version BIGINT DEFAULT 0
);
CREATE INDEX idx_orders_order_ts ON orders(order_ts);

CREATE TABLE order_items (
  order_item_id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(product_id),
  batch_id BIGINT REFERENCES batches(batch_id), -- optional: which batch was sold
  qty INT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- 7. Purchase orders (PO) & receipts (replenishment)
CREATE TABLE purchase_orders (
  po_id BIGSERIAL PRIMARY KEY,
  po_no VARCHAR(64) UNIQUE,
  supplier_id BIGINT REFERENCES suppliers(supplier_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expected_at DATE,
  status VARCHAR(32) DEFAULT 'created',
  total_amount NUMERIC(12,2)
);

CREATE TABLE po_items (
  po_item_id BIGSERIAL PRIMARY KEY,
  po_id BIGINT REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(product_id),
  qty_ordered INT,
  unit_cost NUMERIC(12,2)
);

CREATE TABLE receipts (
  receipt_id BIGSERIAL PRIMARY KEY,
  po_id BIGINT REFERENCES purchase_orders(po_id),
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  receiver TEXT
);

-- 8. Suppliers
CREATE TABLE suppliers (
  supplier_id BIGSERIAL PRIMARY KEY,
  name TEXT,
  contact_email VARCHAR(256),
  lead_time_days INT DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Price history / audit for pricing changes
CREATE TABLE price_history (
  price_history_id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(product_id),
  batch_id BIGINT REFERENCES batches(batch_id),
  old_price NUMERIC(12,2),
  new_price NUMERIC(12,2),
  reason VARCHAR(128),     -- 'expiry_time_decay', 'ml_optimizer', 'manual', etc.
  computed_by VARCHAR(64), -- 'worker-v1', 'ml-service', 'admin'
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  effective_to TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_price_history_product_ts ON price_history(product_id, computed_at);

-- 10. Price optimization trace (store candidate prices, expected demand/profit)
CREATE TABLE price_opt_trace (
  trace_id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(product_id),
  run_id UUID,                           -- correlate to a model run or batch job
  candidate_price NUMERIC(12,2),
  expected_demand NUMERIC(12,4),
  expected_profit NUMERIC(12,4),
  constraint_violated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_price_opt_trace_run ON price_opt_trace(run_id);

-- 11. Forecasts & ML runs
CREATE TABLE ml_model_runs (
  run_id UUID PRIMARY KEY,
  model_name TEXT,
  model_version TEXT,
  parameters JSONB,
  metrics JSONB,
  run_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE forecasts (
  forecast_id BIGSERIAL PRIMARY KEY,
  run_id UUID REFERENCES ml_model_runs(run_id),
  product_id BIGINT REFERENCES products(product_id),
  forecast_date DATE,      -- date for which forecast applies
  horizon_days INT,        -- horizon
  expected_qty NUMERIC(12,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_forecasts_product_date ON forecasts(product_id, forecast_date);

-- 12. Audit log & blockchain references (immutable trail)
CREATE TABLE audit_log (
  audit_id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(64),   -- 'order', 'price_change', 'receipt'
  entity_id TEXT,           -- id or composite key
  action VARCHAR(32),
  payload JSONB,            -- snapshot or diff
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by VARCHAR(128)
);

CREATE TABLE blockchain_refs (
  blk_id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(64),
  event_id TEXT,
  event_hash VARCHAR(128) UNIQUE,
  chain_tx_id VARCHAR(256),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13. Event & CDC metadata (help Debezium / consumers)
CREATE TABLE events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type VARCHAR(64),
  aggregate_id TEXT,
  event_type VARCHAR(64),
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed BOOLEAN DEFAULT FALSE
);

-- 14. Users & roles (for admin operations)
CREATE TABLE users (
  user_id BIGSERIAL PRIMARY KEY,
  username VARCHAR(128) UNIQUE,
  password_hash TEXT,
  email VARCHAR(256),
  role VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 15. Index & partition suggestions
-- Orders can be range-partitioned by order_ts for scale:
-- CREATE TABLE orders_y2025 PARTITION OF orders FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Triggers to keep updated_at/version for CDC (example)
CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$;
-- Attach to products, batches, inventory, orders, etc.
CREATE TRIGGER trg_products_touch BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_batches_touch BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
