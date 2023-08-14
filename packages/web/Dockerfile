FROM node:20-alpine as builder

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build:web

FROM nginx:1-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/packages/web/dist .
ENTRYPOINT [ "nginx", "-g", "daemon off;" ]
