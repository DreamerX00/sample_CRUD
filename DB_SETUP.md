# Database Setup

Use either `DATABASE_URL` or the explicit Postgres fields in `.env.local`.

Required Postgres fields:

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

To create the app tables:

```bash
npm run db:setup
```

That command reads [`sample/.env.local`](/home/akash-singh/BASIC_CRUD/sample/.env.local) and applies [`sample/db/schema.sql`](/home/akash-singh/BASIC_CRUD/sample/db/schema.sql).
