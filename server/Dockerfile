# Use Node.js LTS version
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache curl

# Install specific pnpm version to match lockfile
RUN npm install -g pnpm@9

# Set working directory
WORKDIR /app

# Configure pnpm for better network reliability
RUN pnpm config set network-timeout 300000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000 && \
    pnpm config set registry https://registry.npmjs.org/

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY .npmrc ./

# Copy all packages
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/

# Install all dependencies at workspace level
RUN pnpm install

# Build shared package first
WORKDIR /app/shared
RUN cd /app/server && pnpm exec tsc --project /app/shared/tsconfig.json

# Switch back to server directory
WORKDIR /app/server

# Ensure no baked env files exist in the image (avoids stale files from cached layers).
RUN rm -f .env .env.prod

#
# NOTE:
# Do not bake a `.env` file into the image.
# Runtime config should come from Docker Compose `env_file` (root `.env`).

# Build TypeScript code
RUN pnpm run build

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3002

# Health check (Compose does not override — single definition here)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3002/api/health/liveness || exit 1

# Start the server in production mode
CMD ["node", "dist/server/src/main.js"]
