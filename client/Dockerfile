# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dependencies first (for better caching)
COPY package*.json ./
RUN pnpm install

# Copy source code
COPY . .

# Build for production
RUN pnpm build

# Expose port
EXPOSE 5173

# Start the development server
CMD ["pnpm", "dev", "--host"]