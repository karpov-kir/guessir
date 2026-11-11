FROM node:26-alpine AS builder

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build -w @guessir/web

FROM nginx:1-alpine

COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
