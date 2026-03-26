import { Pool } from "pg";
import { env } from "@/lib/env";

declare global {
  var postgresPool: Pool | undefined;
}

const getPool = () => {
  if (!global.postgresPool) {
    global.postgresPool = new Pool({
      connectionString: env.databaseUrl,
    });
  }

  return global.postgresPool;
};

const query: Pool["query"] = ((text: unknown, values?: unknown) =>
  getPool().query(text as never, values as never)) as Pool["query"];

export const db: Pick<Pool, "query"> = {
  query,
};
