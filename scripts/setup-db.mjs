import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const isRequired = process.argv.includes("--required");

const resolveDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.POSTGRES_HOST;
  const database = process.env.POSTGRES_DB;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;

  if (!host || !database || !user || !password) {
    if (isRequired) {
      throw new Error(
        "Missing database configuration. Set DATABASE_URL or POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, and POSTGRES_PASSWORD.",
      );
    }

    console.log(
      "Database bootstrap skipped: missing DATABASE_URL or explicit Postgres credentials in .env.local.",
    );
    return null;
  }

  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${process.env.POSTGRES_PORT || "5432"}/${database}`;
};

const schemaPath = path.join(process.cwd(), "db", "schema.sql");
const databaseUrl = resolveDatabaseUrl();

if (databaseUrl) {
  const schema = await fs.readFile(schemaPath, "utf8");
  const client = new pg.Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    await client.query(schema);
    console.log("Database schema applied successfully.");
  } catch (error) {
    if (isRequired) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown connection error.";
    console.log(`Database bootstrap skipped: ${message}`);
  } finally {
    try {
      await client.end();
    } catch {
      // Ignore cleanup failures during best-effort bootstrap.
    }
  }
}
