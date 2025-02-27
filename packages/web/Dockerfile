FROM node:22-alpine AS builder

WORKDIR /app

# Install necessary build tools and dependencies
RUN apk add --no-cache python3 python3-dev py3-setuptools py3-pip make g++ curl-dev

COPY . .

RUN npm ci
RUN npm run clean && npm run build:web

FROM nginx:1-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/packages/web/dist .
ENTRYPOINT [ "nginx", "-g", "daemon off;" ]
