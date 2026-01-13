# Frontend Dockerfile for ConvLens
# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Build Next.js application
# NEXT_PUBLIC_API_URL will be set at runtime, but we can set a default for build
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Copy standalone server files (copy contents, not the directory)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy static files to .next/static (required by standalone server)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy public files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port (informational, Railway sets PORT at runtime)
EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
# Note: PORT env var is set by Railway at runtime, Next.js standalone server.js reads it automatically

# Health check (uses PORT env var with fallback to 3000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD sh -c 'port=${PORT:-3000}; node -e "require(\"http\").get(`http://localhost:${port}`, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"'

# Run Next.js server (Next.js standalone reads process.env.PORT automatically)
CMD ["node", "server.js"]

