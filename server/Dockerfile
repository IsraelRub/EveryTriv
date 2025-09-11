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

# Create environment file from build args
ARG NODE_ENV
ARG DATABASE_HOST
ARG DATABASE_PORT
ARG DATABASE_USERNAME
ARG DATABASE_NAME
ARG REDIS_HOST
ARG REDIS_PORT
ARG PORT
ARG LANGUAGE_TOOL_API_KEY

# Create .env file from build arguments
RUN echo "NODE_ENV=${NODE_ENV}" > .env && \
    echo "DATABASE_HOST=${DATABASE_HOST}" >> .env && \
    echo "DATABASE_PORT=${DATABASE_PORT}" >> .env && \
    echo "DATABASE_USERNAME=${DATABASE_USERNAME}" >> .env && \
    echo "DATABASE_NAME=${DATABASE_NAME}" >> .env && \
    echo "DATABASE_SCHEMA=public" >> .env && \
    echo "DATABASE_SSL=false" >> .env && \
    echo "REDIS_HOST=${REDIS_HOST}" >> .env && \
    echo "REDIS_PORT=${REDIS_PORT}" >> .env && \
    echo "REDIS_DB=0" >> .env && \
    echo "JWT_EXPIRES_IN=1d" >> .env && \
    echo "PORT=${PORT}" >> .env && \
    echo "CORS_ORIGIN=http://localhost:3000" >> .env && \
    echo "LOG_LEVEL=info" >> .env && \
    echo "LOG_FILE_PATH=./logs/app.log" >> .env && \
    echo "RATE_LIMIT_WINDOW_MS=900000" >> .env && \
    echo "RATE_LIMIT_MAX_REQUESTS=100" >> .env && \
    echo "MAX_FILE_SIZE=10485760" >> .env && \
    echo "UPLOAD_PATH=./uploads" >> .env && \
    echo "LANGUAGE_TOOL_API_KEY=${LANGUAGE_TOOL_API_KEY}" >> .env && \
    cp .env .env.prod

# Build TypeScript code
RUN pnpm run build

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Start the server in production mode
CMD ["node", "dist/server/src/main.js"]
