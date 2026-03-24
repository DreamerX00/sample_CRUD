import { Pool } from "pg";
import { env } from "@/lib/env";

declare global {
  var postgresPool: Pool | undefined;
}

export const db =
  global.postgresPool ??
  new Pool({
    connectionString: env.databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  global.postgresPool = db;
}
