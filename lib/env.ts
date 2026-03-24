const required = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const buildDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = required("POSTGRES_HOST");
  const port = process.env.POSTGRES_PORT ?? "5432";
  const database = required("POSTGRES_DB");
  const user = required("POSTGRES_USER");
  const password = required("POSTGRES_PASSWORD");

  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
};

export const env = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  cookieName: process.env.COOKIE_NAME ?? "daily_align_session",
  databaseUrl: buildDatabaseUrl(),
  jwtSecret: required("JWT_SECRET"),
};
