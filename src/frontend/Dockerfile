# Multi-stage build for Vue/Vite frontend
FROM node:18-alpine AS base
WORKDIR /app

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# Production runtime
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4173
ENV VITE_API_BASE_URL=http://localhost:3000/api

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

EXPOSE 4173

CMD ["node", "server.js"]
