FROM node:26-alpine AS base

WORKDIR /app

FROM base AS build

COPY . .

RUN npm ci
RUN npm run build -w @guessir/backend

FROM base AS deps

# The backend's production dependencies need only the root, game and backend manifests
COPY package.json package-lock.json .npmrc ./
COPY packages/game/package.json packages/game/
COPY apps/backend/package.json apps/backend/
# npm links a bin into node_modules/.bin only when its file exists, and `npx guessirBackend` needs
# that link
COPY apps/backend/guessirBackend.js apps/backend/

RUN npm ci --omit=dev -w @guessir/backend

FROM base AS runner

# Only what the backend runs: no sources, no dev dependencies, no env files
COPY --from=deps /app .
COPY --from=build /app/packages/game/dist packages/game/dist
COPY --from=build /app/apps/backend/dist apps/backend/dist

USER node

ENTRYPOINT ["npx", "guessirBackend"]
