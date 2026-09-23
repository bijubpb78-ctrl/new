CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT,
  subject TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS product_overrides (
  id TEXT PRIMARY KEY, data TEXT, deleted INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS shipments (
  order_id TEXT PRIMARY KEY, cj_order_id TEXT, tracking_number TEXT, carrier TEXT,
  tracking_url TEXT, status TEXT NOT NULL DEFAULT 'Processing', events TEXT NOT NULL DEFAULT '[]',
  source TEXT NOT NULL DEFAULT 'manual', updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY, topic TEXT NOT NULL, order_id TEXT, payload TEXT NOT NULL,
  received_at TEXT NOT NULL
);
