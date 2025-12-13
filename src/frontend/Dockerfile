FROM node:20-alpine AS builder

ARG VITE_API_BASE_URL=http://localhost:3000/api

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package.json ./package.json

ENV PORT=4173
ENV VITE_API_BASE_URL=http://localhost:3000/api

EXPOSE 4173

CMD ["node", "server.js"]
