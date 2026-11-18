# The build runs natively on the builder: its output is static files, the same on every platform
FROM --platform=$BUILDPLATFORM node:26-alpine AS builder

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build -w @guessir/web

FROM nginx:1-alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
