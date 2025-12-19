FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 1: Install dependencies with pnpm
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# Stage 2: Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY packages/typescript-config ./packages/typescript-config
COPY packages/db ./packages/db
COPY apps/api ./apps/api
COPY package.json pnpm-workspace.yaml ./

# Generate Prisma client
RUN cd packages/db && pnpm db:generate

# Build API
WORKDIR /app/apps/api
RUN pnpm build

# Stage 3: Create production deployment with pnpm deploy
FROM base AS pruner
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/
RUN pnpm deploy --filter=api --prod /prod/api

# Stage 4: Final runtime image
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Install runtime tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init && \
    rm -rf /var/lib/apt/lists/*

# Create user first
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs apiuser

# Copy pruned dependencies from pnpm deploy
COPY --from=pruner /prod/api ./

# Copy Prisma schema and generate client
COPY --from=builder /app/packages/db/prisma ./prisma
RUN node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

# Copy built code
COPY --from=builder /app/apps/api/dist ./

# Set ownership
RUN chown -R apiuser:nodejs /app

USER apiuser

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
