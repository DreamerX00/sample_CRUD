# Database Setup

Use either `DATABASE_URL` or the explicit Postgres fields in `.env.local`.

Required Postgres fields:

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

On app startup:

```bash
npm run dev
```

or

```bash
npm start
```

The app now checks the database connection first. If Postgres is reachable, it applies the schema automatically. If Postgres is unavailable or not configured yet, startup continues and the database bootstrap is skipped.

To create the app tables manually and fail fast on errors:

```bash
npm run db:setup
```

For the non-blocking startup check used by `dev` and `start`:

```bash
npm run db:bootstrap
```

These commands read [`sample/.env.local`](/home/akash-singh/BASIC_CRUD/sample/.env.local) and apply [`sample/db/schema.sql`](/home/akash-singh/BASIC_CRUD/sample/db/schema.sql) when a connection is available.
