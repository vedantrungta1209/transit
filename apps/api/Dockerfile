FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/
RUN npm install --workspace=packages/shared --workspace=apps/api --include-workspace-root

# Build shared package first so @transit/shared resolves at runtime
RUN cd packages/shared && npx tsc

COPY apps/api/ ./apps/api/
RUN cd apps/api && npx prisma generate && npx tsc

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api
EXPOSE 3000
CMD npx prisma db push --accept-data-loss && node dist/apps/api/src/server.js
