FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/admin/package.json ./apps/admin/
RUN npm install --workspace=apps/admin --include-workspace-root

COPY apps/admin/ ./apps/admin/
RUN cd apps/admin && npm run build

FROM nginx:alpine
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
