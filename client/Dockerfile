# Use Node.js 18 Alpine as base image
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy all packages
COPY client/ ./client/
COPY shared/ ./shared/
COPY server/ ./server/

# Copy .npmrc for pnpm configuration
COPY .npmrc ./

# Install all dependencies at workspace level
RUN pnpm install

# Build shared package first
WORKDIR /app/shared
RUN pnpm run build

# Switch back to client directory and build
WORKDIR /app/client
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copy built application from builder stage
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy nginx configuration
COPY client/nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]