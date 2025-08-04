# Setup Instructions

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- pnpm (recommended) or npm
- PostgreSQL (if running without Docker)
- Redis (if running without Docker)

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/everytriv.git
cd everytriv
```

2. Create environment files:

`.env` for the root directory:
```env
COMPOSE_PROJECT_NAME=everytriv
NODE_ENV=development
```

`client/.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
```

`server/.env`:
```env
# App
PORT=3000
NODE_ENV=development
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=everytriv
DB_SCHEMA=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION=7d

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100

# LLM Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## Installation

### Using Docker (Recommended)

1. Build and start the containers:
```bash
docker-compose up -d --build
```

2. The application will be available at:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000
   - API Docs: http://localhost:3000/api/docs

### Manual Setup

1. Install dependencies:
```bash
# Install root dependencies
pnpm install

# Install client dependencies
cd client
pnpm install

# Install server dependencies
cd ../server
pnpm install
```

2. Start PostgreSQL and Redis:
```bash
# Start PostgreSQL
docker run -d \
  --name everytriv-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=everytriv \
  -p 5432:5432 \
  postgres:14

# Start Redis
docker run -d \
  --name everytriv-redis \
  -p 6379:6379 \
  redis:7
```

3. Run database migrations:
```bash
cd server
pnpm typeorm migration:run
```

4. Start the development servers:
```bash
# Start the backend
cd server
pnpm start:dev

# Start the frontend (in a new terminal)
cd client
pnpm dev
```

## Development

### Available Scripts

Frontend (client directory):
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm test         # Run tests
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
```

Backend (server directory):
```bash
pnpm start:dev    # Start development server
pnpm build        # Build for production
pnpm start:prod   # Start production server
pnpm test         # Run tests
pnpm test:e2e     # Run end-to-end tests
pnpm lint         # Run ESLint
```

### Development Guidelines

1. **Code Style**
   - Use ESLint and Prettier configurations
   - Follow TypeScript best practices
   - Use meaningful variable and function names
   - Add JSDoc comments for public APIs

2. **Git Workflow**
   - Create feature branches from `develop`
   - Use conventional commits
   - Submit pull requests for review
   - Keep commits atomic and focused

3. **Testing**
   - Write unit tests for new features
   - Update tests when modifying existing code
   - Run the full test suite before committing

4. **Documentation**
   - Update API documentation for new endpoints
   - Document complex algorithms and business logic
   - Keep README files up to date

## Deployment

### Production Build

1. Build the applications:
```bash
# Build frontend
cd client
pnpm build

# Build backend
cd ../server
pnpm build
```

2. Start the production server:
```bash
# Using Docker
docker-compose -f docker-compose.prod.yml up -d

# Manual start
cd server
pnpm start:prod
```

### Environment Configuration

Update the environment variables for production:
- Set `NODE_ENV=production`
- Use secure database credentials
- Configure proper JWT secrets
- Set up proper CORS settings
- Enable rate limiting
- Configure logging levels

### Monitoring

1. **Health Checks**
   - `/health` endpoint for basic health check
   - `/metrics` for detailed system metrics

2. **Logging**
   - Configure Winston for production logging
   - Set up log aggregation
   - Monitor error rates and patterns

3. **Performance**
   - Monitor Redis cache hit rates
   - Track database query performance
   - Watch API response times
   - Monitor memory usage

## Troubleshooting

### Common Issues

1. **Database Connection**
   - Check PostgreSQL service is running
   - Verify database credentials
   - Ensure database exists
   - Check network connectivity

2. **Redis Connection**
   - Verify Redis service is running
   - Check Redis password if configured
   - Ensure proper port access

3. **API Errors**
   - Check API logs for details
   - Verify environment variables
   - Check rate limiting settings
   - Validate request payloads

### Debug Mode

Enable debug logging:
```bash
# Server
DEBUG=* pnpm start:dev

# Client
VITE_DEBUG=true pnpm dev
```

### Support

For additional support:
1. Check the issue tracker
2. Review error logs
3. Contact the development team
4. Consult the API documentation