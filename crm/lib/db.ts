import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize SQLite database
const dbPath = process.env.NODE_ENV === 'production'
  ? '/tmp/crm.db'
  : path.join(process.cwd(), 'data', 'crm.db');

// Create data directory if it doesn't exist
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      tier TEXT DEFAULT 'bronze',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_purchase_date TEXT,
      total_spend REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS segments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      criteria TEXT NOT NULL,
      customer_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      segment_id TEXT NOT NULL,
      name TEXT NOT NULL,
      message_template TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      sent_at TEXT,
      FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS communications (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      message TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      sent_at TEXT,
      delivered_at TEXT,
      opened_at TEXT,
      read_at TEXT,
      clicked_at TEXT,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_customer_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_customer_tier ON customers(tier);
    CREATE INDEX IF NOT EXISTS idx_campaign_status ON campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_communication_campaign ON communications(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_communication_status ON communications(status);
  `);
}

// Call this when the module is loaded
initializeDatabase();

export default db;
