# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy application source
COPY . .

# Build application with API URL as build arg
ARG VITE_API_BASE_URL=http://localhost:3000/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install only express for serving
RUN npm init -y && npm install express

# Copy built application
COPY --from=builder /app/dist/frontend ./dist
COPY server.js .

# Expose port
EXPOSE 4173

# Set environment variables (can be overridden at runtime)
ENV PORT=4173
ENV VITE_API_BASE_URL=http://localhost:3000/api/v1

# Start server
CMD ["node", "server.js"]
