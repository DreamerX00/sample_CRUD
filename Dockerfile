FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/db ./db
COPY --from=builder /app/next.config.ts ./next.config.ts

RUN chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 3000

# Best-effort schema bootstrap (safe to skip if DB is unavailable), then start Next.
CMD ["sh", "-c", "node scripts/setup-db.mjs || true; node node_modules/next/dist/bin/next start -H 0.0.0.0 -p ${PORT:-3000}"]
