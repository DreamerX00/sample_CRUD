import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const required = (key) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgres://${encodeURIComponent(required("POSTGRES_USER"))}:${encodeURIComponent(
    required("POSTGRES_PASSWORD"),
  )}@${required("POSTGRES_HOST")}:${process.env.POSTGRES_PORT || "5432"}/${required("POSTGRES_DB")}`;

const schemaPath = path.join(process.cwd(), "db", "schema.sql");
const schema = await fs.readFile(schemaPath, "utf8");

const client = new pg.Client({
  connectionString: databaseUrl,
});

try {
  await client.connect();
  await client.query(schema);
  console.log("Database schema applied successfully.");
} finally {
  await client.end();
}
