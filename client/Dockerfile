# Align Node major with server image (pnpm workspace build)
FROM node:20-alpine AS builder

# Install pnpm (match server / lockfile)
RUN npm install -g pnpm@9

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy all packages
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/

# Copy .npmrc for pnpm configuration
COPY .npmrc ./

# Install all dependencies at workspace level
RUN pnpm install


# Build production client bundle
WORKDIR /app/client
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copy built application from builder stage
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy nginx configuration
COPY client/nginx.conf /etc/nginx/nginx.conf

# Expose port 3000
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]