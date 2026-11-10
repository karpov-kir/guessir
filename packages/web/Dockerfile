FROM node:26-alpine AS builder

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build:web

FROM nginx:1-alpine

COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
COPY packages/web/nginx-logs.conf /etc/nginx/conf.d/logs.conf
