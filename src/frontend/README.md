# Frontend Docker Deployment

This directory contains the Vue 3 + Vuetify frontend application for the R3ND seed repository.

## Docker Production Build

### Build the Image

```bash
# From the src/frontend directory
docker build -t r3nd-frontend:latest .

# Or with a specific tag
docker build -t r3nd-frontend:1.0.0 .
```

### Run the Container

```bash
# Run on port 8080
docker run -d -p 8080:80 --name r3nd-frontend r3nd-frontend:latest

# Run on port 80
docker run -d -p 80:80 --name r3nd-frontend r3nd-frontend:latest
```

### Health Check

The container includes a health check endpoint at `/health`:

```bash
curl http://localhost:8080/health
```

## Docker Compose (Local Development)

For local development with the full stack, use the docker-compose file in the repository root.

## Configuration

### Environment Variables

The frontend is a static SPA and does not require runtime environment variables. API endpoints should be configured at build time through Vite's environment variables:

1. Create environment-specific files in the `src/frontend` directory:
   - `.env.staging` for staging builds
   - `.env.production` for production builds

2. Use the `VITE_MODE` build argument to select which env file to use:
   ```bash
   # Uses .env.production (default)
   docker build -t r3nd-frontend:prod .
   
   # Uses .env.staging
   docker build --build-arg VITE_MODE=staging -t r3nd-frontend:staging .
   ```

Example `.env.production`:
```
VITE_API_URL=https://api.example.com
```

Example `.env.staging`:
```
VITE_API_URL=https://api-staging.example.com
```

> **Note:** Vite automatically loads the appropriate `.env.[mode]` file based on the `--mode` flag during build.

### Nginx Configuration

The `nginx.conf` file provides:

- **SPA Routing**: All routes fallback to `index.html`
- **Caching**: Optimized cache headers for static assets
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Gzip Compression**: Enabled for text-based assets
- **Health Endpoint**: `/health` for container orchestration

## Staging vs Production

### Staging Build

```bash
docker build --build-arg VITE_MODE=staging -t r3nd-frontend:staging .
```

### Production Build

```bash
docker build --build-arg VITE_MODE=production -t r3nd-frontend:production .
```

## Deployment

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: r3nd-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: r3nd-frontend
  template:
    metadata:
      labels:
        app: r3nd-frontend
    spec:
      containers:
      - name: frontend
        image: r3nd-frontend:latest
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
```

### Docker Swarm

```bash
docker service create \
  --name r3nd-frontend \
  --publish 80:80 \
  --replicas 2 \
  r3nd-frontend:latest
```

## Image Size Optimization

The multi-stage build results in a minimal production image:

1. **Build Stage**: Uses Node.js Alpine to install dependencies and build
2. **Production Stage**: Uses Nginx Alpine (~20MB) to serve static assets

Expected image size: ~25-35MB (depending on application assets)
