const required = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const optional = (key: string) => process.env[key];

const buildDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = optional("POSTGRES_HOST");
  const port = process.env.POSTGRES_PORT ?? "5432";
  const database = optional("POSTGRES_DB");
  const user = optional("POSTGRES_USER");
  const password = optional("POSTGRES_PASSWORD");

  if (!host || !database || !user || !password) {
    return null;
  }

  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
};

export const env = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  cookieName: process.env.COOKIE_NAME ?? "daily_align_session",
  get databaseUrl() {
    const url = buildDatabaseUrl();

    if (!url) {
      throw new Error(
        "Missing database configuration. Set DATABASE_URL or POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, and POSTGRES_PASSWORD.",
      );
    }

    return url;
  },
  get jwtSecret() {
    return required("JWT_SECRET");
  },
};
