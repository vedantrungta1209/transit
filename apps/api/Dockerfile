FROM node:20-alpine AS builder
WORKDIR /app

# Copy monorepo root config and shared package (needed for workspace resolution)
COPY package.json turbo.json tsconfig.base.json ./
COPY packages/ ./packages/

# Copy API app
COPY apps/api/package.json ./apps/api/
RUN npm install --workspace=apps/api --include-workspace-root

COPY apps/api/ ./apps/api/
RUN cd apps/api && npx prisma generate && npx tsc

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 3000
CMD npx prisma migrate deploy && node dist/server.js
