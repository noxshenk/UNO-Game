import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

// Fallback to local SQLite if Turso isn't configured
const url = process.env.TURSO_DB_URL && process.env.TURSO_DB_URL !== "PASTE_YOUR_TURSO_URL_HERE" 
  ? process.env.TURSO_DB_URL 
  : "file:local.db";

const authToken = process.env.TURSO_AUTH_TOKEN || "";

if (url === "file:local.db") {
  console.log("⚠️ TURSO_DB_URL not found in .env. Falling back to local SQLite (local.db).");
} else {
  console.log(`🚀 Connecting to Turso Database: ${url}`);
}

export const db = createClient({
  url,
  authToken,
});

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      is_guest BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      host_id TEXT NOT NULL,
      status TEXT DEFAULT 'waiting',
      max_players INTEGER DEFAULT 4,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      room_id TEXT UNIQUE NOT NULL,
      state JSON NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
