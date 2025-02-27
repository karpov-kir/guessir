FROM node:22-alpine AS base

FROM base AS packed

WORKDIR /app

# Install necessary build tools and dependencies
RUN apk add --no-cache python3 python3-dev py3-setuptools py3-pip make g++ curl-dev

COPY . .

# The `npm pack` command creates the same packages as `npm publish`, but locally.
# They are thus free from development stuff, e.g. secrets.
RUN npm ci
RUN npm run clean && npm run build && npm pack --workspace @guessir/backend --workspace @guessir/shared

FROM base AS deps

WORKDIR /app

COPY --from=packed /app /app-packed
# Install packed packages (installs only production dependencies)
RUN npm install $(echo /app-packed/*.tgz)

FROM base AS runner

WORKDIR /app

COPY --from=deps /app .

EXPOSE 3020

# HEALTHCHECK CMD curl --fail --head http://localhost:3020

ENV NODE_OPTIONS='--import /app/node_modules/@guessir/backend/loaders/prod.mjs'

ENTRYPOINT ["npx", "guessirBackend"]
