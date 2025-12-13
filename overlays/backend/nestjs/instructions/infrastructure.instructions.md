```instructions
---
title: Infrastructure Instructions - NestJS Backend
applyTo: src/backend/Dockerfile, docker-compose.yml
---

# NestJS Backend Infrastructure Instructions

These instructions provide framework-specific configuration for containerizing and deploying the NestJS backend.

---

## Stack Requirements

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20+ (required for NestJS 11) |
| Database | MongoDB | 8+ |
| Package Manager | npm | Latest stable |
| Base Image | node:20-alpine | Lightweight Alpine Linux |

---

## Dockerfile Configuration

### Base Image

```dockerfile
FROM node:20-alpine AS builder
```

**Why Node 20**: NestJS 11 requires Node.js 20+ for ESM support and modern TypeScript features.

### Build Stage

```dockerfile
# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies (use ci for reproducible builds)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build
```

### Runtime Stage

```dockerfile
# Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose backend port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
```

**Important Notes:**
- NestJS builds to `dist/main.js` by default.
- Use `npm ci` for reproducible builds (requires `package-lock.json`).
- Use `--omit=dev` to skip devDependencies in production.
- If build output path differs (e.g., `dist/src/main.js`), adjust CMD accordingly.

---

## Docker Compose Configuration

### Database Service (MongoDB)

```yaml
services:
  mongo:
    image: mongo:6
    container_name: r3nd-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: r3nd
    networks:
      - app-net

volumes:
  mongo-data:
```

### Backend Service

```yaml
  backend:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    container_name: r3nd-backend
    depends_on:
      - mongo
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      MONGODB_URI: mongodb://mongo:27017/r3nd
      NODE_ENV: production
    networks:
      - app-net
```

**Environment Variables:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP server port |
| `MONGODB_URI` | Yes | `mongodb://mongo:27017/r3nd` | MongoDB connection string (use service name `mongo` for container networking) |
| `NODE_ENV` | No | `production` | Node environment (affects logging, error handling) |

**Connection String Format:**
- **Container-to-container**: `mongodb://mongo:27017/r3nd` (use service name)
- **Host-to-container**: `mongodb://localhost:27017/r3nd` (use localhost)

---

## Build Commands

```bash
# Build Docker image
docker build -t r3nd-backend ./src/backend

# Build with Docker Compose
docker-compose build backend

# Build without cache (clean build)
docker-compose build --no-cache backend
```

---

## Run Commands

```bash
# Start backend service only
docker-compose up backend

# Start backend with database
docker-compose up mongo backend

# Start all services
docker-compose up

# Run in background (detached)
docker-compose up -d
```

---

## Database Connection

### In Application Code

NestJS uses `@nestjs/mongoose` for MongoDB integration:

```typescript
// app.module.ts
MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    uri: config.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/r3nd',
  }),
})
```

### Connection String Components

```
mongodb://[username:password@]host[:port]/database[?options]
```

For local development (Docker Compose):
```
mongodb://mongo:27017/r3nd
```

---

## Smoke Tests

### Backend Health Check

```bash
# Test backend is running
curl http://localhost:3000/api/greetings

# Expected response: HTTP 200 with JSON
{
  "greeting": "Hello from NestJS!",
  "fact": { ... }
}
```

### Database Connection Test

```bash
# Access MongoDB from container
docker exec -it r3nd-mongo mongosh

# In mongosh
use r3nd
db.facts.find().limit(1)
```

---

## Common Issues & Solutions

### Issue: `npm ci` fails in Docker

**Cause**: `package-lock.json` out of sync with `package.json`.

**Solution**:
```bash
# Run locally before building Docker image
npm install

# Commit updated package-lock.json
git add package-lock.json
git commit -m "Update package-lock.json"
```

### Issue: Backend can't connect to MongoDB

**Symptom**: `MongooseError: Could not connect to MongoDB`

**Causes & Solutions**:
1. **Wrong connection string**: Use `mongo` (service name), not `localhost`
2. **MongoDB not ready**: Add health check or `depends_on` with condition
3. **Network issues**: Ensure both services on same Docker network

### Issue: `ValidationPipe` fails at runtime

**Cause**: Missing `class-validator` and `class-transformer` in production dependencies.

**Solution**:
```bash
# Add as regular dependencies (not devDependencies)
npm install class-validator class-transformer
```

### Issue: Build output path doesn't match CMD

**Symptom**: `Error: Cannot find module '/app/dist/main.js'`

**Solution**: Check `tsconfig.build.json` `outDir` and adjust Dockerfile CMD:
```dockerfile
# If build outputs to dist/src/main.js
CMD ["node", "dist/src/main.js"]
```

---

## .dockerignore

```
node_modules
dist
npm-debug.log*
.env*
.git
coverage
*.log
.DS_Store
.vscode
.idea
```

**Purpose**: Reduce build context size, prevent copying unnecessary files.

---

## Security Best Practices

1. **Don't run as root**: Add `USER node` in Dockerfile
2. **Use .dockerignore**: Prevent secrets from being copied
3. **Multi-stage builds**: Minimize attack surface in runtime image
4. **Pin versions**: Use specific image tags, not `latest`
5. **Scan images**: Use `docker scan` or similar tools
6. **Environment variables**: Never hardcode secrets in Dockerfile

---

## Performance Optimization

1. **Layer caching**: Copy `package*.json` before source code
2. **Production deps only**: Use `npm ci --omit=dev` in runtime stage
3. **Alpine Linux**: Smaller image size (~50MB vs ~200MB)
4. **Health checks**: Add `HEALTHCHECK` instruction for monitoring

---

## Example Complete Dockerfile

```dockerfile
# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner

# Run as non-root user
USER node

WORKDIR /app

# Copy package files
COPY --chown=node:node package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application
COPY --chown=node:node --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["node", "dist/main.js"]
```

---

## Integration with Frontend

The frontend needs to know the backend API URL. In Docker Compose:

```yaml
frontend:
  # ...
  environment:
    VITE_API_BASE_URL: http://localhost:3000/api  # For browser access from host
```

**Critical**: Use `localhost` (not `backend` service name) because the browser makes requests from the host machine, not from inside the container.

---

## CI/CD Considerations

```bash
# Build without cache in CI
docker-compose build --no-cache

# Run smoke tests
docker-compose up -d
sleep 10  # Wait for services to start
curl -f http://localhost:3000/api/greetings || exit 1

# Cleanup
docker-compose down -v
```

---

## Reference

- NestJS Docker documentation: https://docs.nestjs.com/recipes/docker
- Node.js Docker best practices: https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
- MongoDB Docker image: https://hub.docker.com/_/mongo
```
