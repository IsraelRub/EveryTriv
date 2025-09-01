# הגדרת Docker - EveryTriv

## סקירה כללית

מדריך זה מכסה את הגדרת Docker וסביבת הפיתוח עבור פרויקט EveryTriv, כולל הגדרת שירותים, קונפיגורציה ופריסה.

## דרישות מערכת

- **Docker**: גרסה 20.10 ומעלה
- **Docker Compose**: גרסה 2.0 ומעלה
- **Git**: מערכת בקרת גרסאות
- **Node.js**: גרסה 18 ומעלה (לפיתוח מקומי)

## התקנה ראשונית

### 1. שכפול הפרויקט
```bash
git clone https://github.com/IsraelRub/EveryTriv.git
cd EveryTriv
```

### 2. הגדרת משתני סביבה
```bash
# העתקת קבצי סביבה
cp .env.example .env
cp server/.env.example server/.env

# עריכת קבצי .env עם הערכים הנכונים
```

### 3. הפעלת שירותים
```bash
# הפעלת כל השירותים
docker-compose up -d

# או הפעלה של שירותים ספציפיים
docker-compose up -d postgres redis
```

## קונפיגורציית Docker Compose

### docker-compose.yaml
```yaml
version: '3.8'

services:
  # מסד נתונים PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: everytriv-postgres
    environment:
      POSTGRES_DB: everytriv
      POSTGRES_USER: everytriv_user
      POSTGRES_PASSWORD: EvTr!v_DB_P@ssw0rd_2025_S3cur3!
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - everytriv-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U everytriv_user -d everytriv"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: everytriv-redis
    command: redis-server --appendonly yes --requirepass EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3!
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - everytriv-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend Server
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
      target: development
    container_name: everytriv-server
    environment:
      NODE_ENV: development
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: everytriv
      DATABASE_USERNAME: everytriv_user
      DATABASE_PASSWORD: EvTr!v_DB_P@ssw0rd_2025_S3cur3!
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3!
      JWT_SECRET: your-super-secret-jwt-key-change-in-production
      JWT_EXPIRES_IN: 24h
      PORT: 3001
    volumes:
      - ./server:/app
      - /app/node_modules
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - everytriv-network
    command: pnpm run start:dev

  # Frontend Client
  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      target: development
    container_name: everytriv-client
    environment:
      VITE_API_BASE_URL: http://localhost:3001
      VITE_APP_NAME: EveryTriv
      VITE_APP_VERSION: 2.0.0
    volumes:
      - ./client:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - server
    networks:
      - everytriv-network
    command: pnpm run dev

  # Nginx Reverse Proxy (Production)
  nginx:
    image: nginx:alpine
    container_name: everytriv-nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - client
      - server
    networks:
      - everytriv-network
    profiles:
      - production

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  everytriv-network:
    driver: bridge
```

## Dockerfiles

### Backend Dockerfile
```dockerfile
# Dockerfile for NestJS Backend
FROM node:18-alpine AS base

# התקנת תלויות מערכת
RUN apk add --no-cache libc6-compat

WORKDIR /app

# העתקת קבצי package
COPY package*.json ./
COPY pnpm-lock.yaml ./

# התקנת pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# התקנת תלויות
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY . .
EXPOSE 3001
CMD ["pnpm", "run", "start:dev"]

# Build stage
FROM base AS build
COPY . .
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production
RUN apk add --no-cache libc6-compat

WORKDIR /app

# העתקת קבצי package
COPY package*.json ./
COPY pnpm-lock.yaml ./

# התקנת pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# התקנת תלויות ייצור בלבד
RUN pnpm install --frozen-lockfile --prod

# העתקת קוד מוכן
COPY --from=build /app/dist ./dist

# יצירת משתמש לא-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# שינוי בעלות
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001
CMD ["node", "dist/main"]
```

### Frontend Dockerfile
```dockerfile
# Dockerfile for React Frontend
FROM node:18-alpine AS base

WORKDIR /app

# העתקת קבצי package
COPY package*.json ./
COPY pnpm-lock.yaml ./

# התקנת pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# התקנת תלויות
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "dev"]

# Build stage
FROM base AS build
COPY . .
RUN pnpm run build

# Production stage
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## קונפיגורציית Nginx

### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    upstream client {
        server client:3000;
    }

    upstream server {
        server server:3001;
    }

    # הגדרות כלליות
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # לוגים
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # הגדרות ביצועים
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # הגדרות אבטחה
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend
    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://client;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Backend API
    server {
        listen 80;
        server_name api.localhost;

        location / {
            proxy_pass http://server;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## פקודות שימושיות

### פיתוח
```bash
# הפעלת סביבת פיתוח מלאה
docker-compose up -d

# צפייה בלוגים
docker-compose logs -f

# צפייה בלוגים של שירות ספציפי
docker-compose logs -f server

# עצירת שירותים
docker-compose down

# בנייה מחדש של שירות
docker-compose build server

# הפעלה מחדש של שירות
docker-compose restart server
```

### ייצור
```bash
# הפעלת סביבת ייצור
docker-compose --profile production up -d

# בנייה לייצור
docker-compose --profile production build

# גיבוי מסד נתונים
docker exec everytriv-postgres pg_dump -U everytriv_user everytriv > backup.sql

# שחזור מסד נתונים
docker exec -i everytriv-postgres psql -U everytriv_user everytriv < backup.sql
```

### תחזוקה
```bash
# ניקוי תמונות לא בשימוש
docker image prune -f

# ניקוי containers לא פעילים
docker container prune -f

# ניקוי volumes לא בשימוש
docker volume prune -f

# ניקוי מלא
docker system prune -a -f

# בדיקת שימוש במשאבים
docker stats
```

## משתני סביבה

### .env (Root)
```env
# Environment
NODE_ENV=development

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=everytriv
DATABASE_USERNAME=everytriv_user
DATABASE_PASSWORD=EvTr!v_DB_P@ssw0rd_2025_S3cur3!

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3!

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# AI Providers
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
MISTRAL_API_KEY=your-mistral-api-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# App Configuration
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Troubleshooting

### בעיות נפוצות

#### 1. מסד נתונים לא מתחבר
```bash
# בדיקת סטטוס PostgreSQL
docker-compose ps postgres

# בדיקת לוגים
docker-compose logs postgres

# התחברות למסד נתונים
docker exec -it everytriv-postgres psql -U everytriv_user -d everytriv
```

#### 2. Redis לא מתחבר
```bash
# בדיקת סטטוס Redis
docker-compose ps redis

# בדיקת לוגים
docker-compose logs redis

# התחברות ל-Redis
docker exec -it everytriv-redis redis-cli -a EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3!
```

#### 3. שרת לא עולה
```bash
# בדיקת לוגים
docker-compose logs server

# בדיקת תלויות
docker-compose ps

# הפעלה מחדש
docker-compose restart server
```

#### 4. בעיות נפח
```bash
# בדיקת נפחים
docker volume ls

# מחיקת נפח
docker volume rm everytriv_postgres_data

# יצירת נפח מחדש
docker-compose up -d postgres
```

### כלי אבחון

#### Health Checks
```bash
# בדיקת בריאות שירותים
curl http://localhost:3001/health

# בדיקת מסד נתונים
docker exec everytriv-postgres pg_isready -U everytriv_user

# בדיקת Redis
docker exec everytriv-redis redis-cli ping
```

#### Monitoring
```bash
# צפייה במשאבים
docker stats

# צפייה בתהליכים
docker top everytriv-server

# בדיקת נטוורק
docker network inspect everytriv_everytriv-network
```

## פריסה לייצור

### Production Docker Compose
```yaml
# docker-compose.prod.yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: everytriv_prod
      POSTGRES_USER: everytriv_prod_user
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    networks:
      - everytriv-prod-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_prod_data:/data
    networks:
      - everytriv-prod-network
    restart: unless-stopped

  server:
    build:
      context: ./server
      target: production
    environment:
      NODE_ENV: production
      DATABASE_HOST: postgres
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    networks:
      - everytriv-prod-network
    restart: unless-stopped
    depends_on:
      - postgres
      - redis

  client:
    build:
      context: ./client
      target: production
    networks:
      - everytriv-prod-network
    restart: unless-stopped
    depends_on:
      - server

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    networks:
      - everytriv-prod-network
    restart: unless-stopped
    depends_on:
      - client
      - server

volumes:
  postgres_prod_data:
  redis_prod_data:

networks:
  everytriv-prod-network:
    driver: bridge
```

### פריסה
```bash
# בנייה לייצור
docker-compose -f docker-compose.prod.yaml build

# הפעלה לייצור
docker-compose -f docker-compose.prod.yaml up -d

# עדכון
docker-compose -f docker-compose.prod.yaml pull
docker-compose -f docker-compose.prod.yaml up -d
```
 
