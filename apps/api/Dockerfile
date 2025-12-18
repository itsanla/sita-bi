FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/
RUN pnpm config set network-timeout 600000
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN npm rebuild sharp

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY packages/typescript-config ./packages/typescript-config
COPY packages/db ./packages/db
COPY apps/api ./apps/api

RUN cd packages/db && pnpm db:generate
RUN pnpm --filter @repo/db build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* && \
    groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs apiuser

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/src ./src
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/package.json ./package.json
COPY --from=builder --chown=apiuser:nodejs /app/packages/db ./packages/db
COPY --from=builder --chown=apiuser:nodejs /app/packages/typescript-config ./packages/typescript-config
COPY --from=builder --chown=apiuser:nodejs /app/package.json ./package.json
COPY --from=builder --chown=apiuser:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN mkdir -p uploads/bimbingan uploads/sidang uploads/tugas-akhir uploads/profile documentation/model data && \
    chown -R apiuser:nodejs uploads documentation data && \
    chmod -R 755 uploads documentation data && \
    mkdir -p node_modules/@repo && \
    ln -sf /app/packages/db node_modules/@repo/db

RUN cd /app/packages/db && npx prisma generate

COPY --from=builder --chown=apiuser:nodejs /app/apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

USER apiuser

EXPOSE 3002

HEALTHCHECK --interval=5s --timeout=7s --start-period=40s --retries=2 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENV NODE_PATH=/app/node_modules

ENTRYPOINT ["./docker-entrypoint.sh"]
