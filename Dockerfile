FROM node:20-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# WICHTIG: Prisma generieren bevor gebaut wird
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma generate
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache openssl

# Erstelle non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiere alle benoetigten Files aus dem Builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Rechte fuer Nextjs anpassen
# (Nicht als nextjs ausfuehren, sondern als root um Synology Volume-Rechte-Probleme zu umgehen)

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Starte erst den Client Generator, dann die DB, dann den Server
CMD npx prisma generate && npx prisma db push --skip-generate && node server.js
