FROM node:26-alpine AS base

WORKDIR /app

FROM base AS build

COPY . .

RUN npm ci
RUN npm run build -w @guessir/backend

FROM base AS deps

# The backend's production dependencies need only the root, shared and backend manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
# npm links a bin into node_modules/.bin only when its file exists, and `npx guessirBackend` needs that link
COPY packages/backend/guessirBackend.js packages/backend/

RUN npm ci --omit=dev -w @guessir/backend

FROM base AS runner

# Only what the backend runs: no sources, no dev dependencies, no env files
COPY --from=deps /app .
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/backend/dist packages/backend/dist
COPY packages/backend/loaders/extensionless.mjs packages/backend/loaders/

EXPOSE 3020

USER node

ENTRYPOINT ["npx", "guessirBackend"]
