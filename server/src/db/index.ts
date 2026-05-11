import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "./schema.js";
import "dotenv/config";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
  release();
  console.log("Database connected");
});

export const db = drizzle(pool, { schema });
export { pool };