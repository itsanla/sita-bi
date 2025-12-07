# Production Deployment Guide

## Architecture: 2 Images (Recommended)

```
┌─────────────┐     ┌─────────────┐
│   API       │     │    Web      │
│ + Prisma    │◄────┤  (Next.js)  │
│   :3002     │     │    :3001    │
└─────────────┘     └─────────────┘
```

**Why 2 images?**
- ✅ Independent scaling (API: 3x, Web: 2x)
- ✅ Independent restart
- ✅ Parallel builds (faster CI/CD)
- ✅ Smaller image sizes
- ✅ Industry standard

**Why not 3 images (API, Web, Prisma)?**
- ❌ Prisma is a library, not a service
- ❌ Unnecessary complexity
- ✅ Prisma client already in API image

### Prisma Configuration

**Build Process:**
```dockerfile
1. Install dependencies (includes @prisma/client)
2. Copy packages/db (contains schema.prisma)
3. Run: pnpm db:generate → Generate Prisma Client
4. Build API with generated client
5. Copy to runtime image
```

**Runtime:**
- Prisma Client: ✅ Included in node_modules
- Schema: ✅ Copied to /app/prisma
- Migrations: ✅ Auto-run on container start

**No separate Prisma image needed!**

**Why not 1 image (monolith)?**
- ❌ Cannot scale independently
- ❌ Restart API = restart Web
- ❌ Huge image size (>1GB)
- ❌ Long build time

## Docker Deployment

### Prerequisites
- Docker & Docker Compose installed
- Environment variables configured

### Environment Setup

Create `.env` file:
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:3001"
```

### Quick Start

```bash
# Build and start services
docker-compose up -d

# Check health
curl http://localhost:3002/health

# View logs
docker-compose logs -f api

# Restart if needed
docker-compose restart api
```

## Auto-Restart Features

### 1. Health Check
- Runs every 30 seconds
- Checks database connectivity
- Auto-restarts if unhealthy (3 failed checks)

### 2. Restart Policy
- **on-failure**: Restarts only if container crashes
- **max_attempts**: 3 attempts before giving up
- **delay**: 5 seconds between restarts

### 3. Resource Limits
- **CPU**: Max 1 core, reserved 0.5 core
- **Memory**: Max 512MB, reserved 256MB
- Prevents memory leaks from crashing host

## Monitoring

### Check Container Status
```bash
docker-compose ps
```

### Check Health Status
```bash
docker inspect --format='{{.State.Health.Status}}' sita-bi-api-1
```

### View Restart Count
```bash
docker inspect --format='{{.RestartCount}}' sita-bi-api-1
```

## Common Issues

### Backend Not Responding
1. Check health: `curl http://localhost:3002/health`
2. Check logs: `docker-compose logs api --tail=50`
3. Restart: `docker-compose restart api`

### Database Connection Lost
- Health check will detect and auto-restart
- Check DATABASE_URL in .env

### Memory Issues
- Container will restart if exceeds 512MB
- Check logs for memory leaks

## Production Best Practices

1. **Use orchestrator**: Kubernetes/Docker Swarm for multi-node
2. **Load balancer**: Nginx/Traefik for multiple instances
3. **Monitoring**: Prometheus + Grafana
4. **Logging**: ELK Stack or Loki
5. **Backup**: Automated database backups

## Scaling (High Traffic)

```bash
# Scale API to 3 instances
docker-compose up -d --scale api=3

# Scale Web to 2 instances
docker-compose up -d --scale web=2

# Use scaling config
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

**Benefits:**
- Load distribution across instances
- Zero-downtime deployment
- Better fault tolerance

## Manual Restart (Last Resort)

```bash
# Restart single service
docker-compose restart api

# Full restart
docker-compose down && docker-compose up -d

# Force recreate
docker-compose up -d --force-recreate api
```

## Difference from Development

| Feature | Development | Production |
|---------|-------------|------------|
| Hot reload | ✅ Nodemon | ❌ None |
| Auto-restart | On file change | On crash only |
| Health check | ❌ Not needed | ✅ Every 30s |
| Restart policy | Manual | Automatic |
| Resource limits | None | CPU/Memory capped |
| Logging | Console | File rotation |

**Conclusion**: In production, manual restart is **rarely needed** thanks to:
- Health checks
- Auto-restart policies
- Resource limits
- Proper error handling
