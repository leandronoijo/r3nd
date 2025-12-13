FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENV PORT=3000
ENV MONGODB_URI=mongodb://mongo:27017/r3nd

EXPOSE 3000

CMD ["node", "dist/main.js"]
