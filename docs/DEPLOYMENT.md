# פריסה - EveryTriv

## סקירה כללית

מדריך מקיף לפריסת EveryTriv בסביבת ייצור, כולל הגדרת שרת, Docker, CI/CD pipeline, ניהול נתונים וניטור. מדריך זה מכסה גם פריסה לפלטפורמות שונות כמו Vercel, Netlify, Firebase Hosting ועוד.

> **מדריך פיתוח**: למידע על הגדרת סביבת פיתוח וגיידליינים, ראו [מדריך פיתוח מקיף](./DEVELOPMENT.md).

## דרישות מערכת

### שרת ייצור
- **CPU**: 2 cores minimum, 4 cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB minimum SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### שירותים נדרשים
- **Docker**: גרסה 20.10+
- **Docker Compose**: גרסה 2.0+
- **Nginx**: גרסה 1.18+
- **SSL Certificate**: Let's Encrypt או מסחרי

## פריסה לפלטפורמות שונות

### Vercel (מומלץ)

#### דרישות מקדימות
1. **Vercel Account** - הרשמה ב-[vercel.com](https://vercel.com)
2. **GitHub Account** - לפריסות אוטומטיות
3. **Database Provider** - PostgreSQL (Vercel Postgres, Supabase, או חיצוני)
4. **Redis Provider** - שירות Redis חיצוני (Upstash, Redis Cloud, וכו')

#### כלים נדרשים
- **Vercel CLI** - להתקנה: `pnpm add -g vercel`
- **Git** - מערכת בקרת גרסאות
- **Node.js** - גרסה 18 ומעלה

#### הגדרת שירותים

##### 1. מסד נתונים PostgreSQL

###### אפשרות א: Vercel Postgres (מומלץ)
```bash
# התקנת Vercel CLI
pnpm add -g vercel

# יצירת מסד נתונים Vercel Postgres
vercel storage create postgres

# הגדרת משתני סביבה
vercel env add DATABASE_URL
vercel env add DATABASE_HOST
vercel env add DATABASE_USERNAME
vercel env add DATABASE_PASSWORD
vercel env add DATABASE_NAME
```

###### אפשרות ב: Supabase
1. היכנס ל-[supabase.com](https://supabase.com)
2. צור פרויקט חדש
3. קבל פרטי חיבור מ-Settings > Database
4. הגדר משתני סביבה ב-Vercel

###### אפשרות ג: Railway
1. היכנס ל-[railway.app](https://railway.app)
2. צור פרויקט PostgreSQL
3. קבל פרטי חיבור
4. הגדר משתני סביבה ב-Vercel

##### 2. Redis

###### מומלץ: Upstash Redis
1. היכנס ל-[upstash.com](https://upstash.com)
2. צור מסד נתונים Redis
3. קבל פרטי חיבור
4. הגדר משתני סביבה ב-Vercel

###### אפשרויות נוספות
- **Redis Cloud** - [redis.com](https://redis.com)
- **Redis Labs** - [redislabs.com](https://redislabs.com)
- **AWS ElastiCache** - (עבור AWS)

##### 3. Google OAuth

###### הגדרת Google Cloud Console
1. היכנס ל-[Google Cloud Console](https://console.cloud.google.com)
2. צור פרויקט חדש או בחר קיים
3. הפעל Google+ API
4. צור OAuth 2.0 credentials

###### הגדרת URIs מורשים
```
# Redirect URIs
https://your-backend-url.vercel.app/auth/google/callback
https://your-backend-url.vercel.app/api/auth/google/callback

# JavaScript Origins
https://your-frontend-url.vercel.app
https://your-frontend-url.vercel.app/
```

#### משתני סביבה

##### משתנים לשרת (Backend)
```env
# מסד נתונים
DATABASE_HOST=your-database-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-database-username
DATABASE_PASSWORD=your-database-password
DATABASE_NAME=your-database-name
DATABASE_SSL=true
DATABASE_URL=postgresql://username:password@host:port/database

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_URL=redis://:password@host:port

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-url.vercel.app/auth/google/callback

# AI Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-key
MISTRAL_API_KEY=your-mistral-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# CORS
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

##### משתנים ל-Client (Frontend)
```env
VITE_API_BASE_URL=https://your-backend-url.vercel.app
VITE_APP_NAME=EveryTriv
VITE_APP_VERSION=2.0.0
```

#### פריסה

##### פריסה אוטומטית
1. חבר את הפרויקט ל-GitHub
2. היכנס ל-Vercel Dashboard
3. לחץ על "New Project"
4. בחר את הפרויקט מ-GitHub
5. הגדר את משתני הסביבה
6. לחץ על "Deploy"

##### פריסה ידנית
```bash
# התחברות ל-Vercel
vercel login

# פריסת Backend
cd server
vercel --prod

# פריסת Frontend
cd client
vercel --prod
```

#### אופטימיזציות

##### Frontend
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

##### Backend
```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn'],
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true
  }
});
```

#### עלויות

##### Vercel Hobby Plan (חינמי)
- **Bandwidth**: 100GB/חודש
- **Function Execution**: 100GB-hours/חודש
- **Build Minutes**: 6000/חודש
- **Serverless Functions**: 10 seconds timeout

##### Vercel Pro Plan ($20/חודש)
- **Bandwidth**: 1TB/חודש
- **Function Execution**: 1000GB-hours/חודש
- **Build Minutes**: 40000/חודש
- **Serverless Functions**: 60 seconds timeout

### Netlify
- משתמש ב-`netlify.toml` לקונפיגורציית build ו-routing
- תומך ב-form handling ו-serverless functions
- HTTPS אוטומטי ו-CDN

### Firebase Hosting
- משתמש ב-`firebase.json` לקונפיגורציה
- CDN גלובלי עם scaling אוטומטי
- אינטגרציה קלה עם שירותי Firebase אחרים

### Azure Static Web Apps
- משתמש ב-`staticwebapp.config.json` ל-routing
- אימות מובנה ותמיכה ב-API
- CDN גלובלי עם edge locations

### Apache Server
- משתמש ב-`.htaccess` ל-URL rewriting
- תואם לספקי hosting משותפים
- תומך ב-mod_rewrite ל-SPA routing

### Nginx Server
- משתמש ב-`nginx.conf` לקונפיגורציה
- ביצועים גבוהים וצריכת משאבים נמוכה
- יכולות reverse proxy

### IIS Server
- משתמש ב-`web.config` ל-URL rewriting
- אינטגרציה עם Windows Server
- hosting ברמת enterprise

## הגדרת שרת

### התקנת Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# הוספת משתמש ל-docker group
sudo usermod -aG docker $USER

# התקנת Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### הגדרת Firewall
```bash
# התקנת UFW
sudo apt install ufw

# הגדרת כללים
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22

# הפעלת Firewall
sudo ufw enable
```

### הגדרת Nginx
```bash
# התקנת Nginx
sudo apt install nginx

# הגדרת reverse proxy
sudo nano /etc/nginx/sites-available/everytriv
```

### קונפיגורציית Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Compression
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
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health Check
    location /health {
        proxy_pass http://localhost:3002/health;
        access_log off;
    }
}
```

### SSL Certificate עם Let's Encrypt
```bash
# התקנת Certbot
sudo apt install certbot python3-certbot-nginx

# יצירת SSL certificate
sudo certbot --nginx -d your-domain.com

# הגדרת auto-renewal
sudo crontab -e
# הוסף את השורה הבאה:
0 12 * * * /usr/bin/certbot renew --quiet
```

## קונפיגורציית Docker

### docker-compose.prod.yaml
```yaml
version: '3.8'

services:
  # Frontend
  client:
    build:
      context: ./client
      target: production
    container_name: everytriv-client
    restart: unless-stopped
    networks:
      - everytriv-network
    environment:
      - VITE_API_BASE_URL=https://your-domain.com/api

  # Backend
  server:
    build:
      context: ./server
      target: production
    container_name: everytriv-server
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=everytriv_prod
      - DATABASE_USERNAME=${DATABASE_USERNAME}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=24h
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - CORS_ORIGIN=https://your-domain.com
    depends_on:
      - postgres
      - redis
    networks:
      - everytriv-network

  # Database
  postgres:
    image: postgres:15-alpine
    container_name: everytriv-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=everytriv_prod
      - POSTGRES_USER=${DATABASE_USERNAME}
      - POSTGRES_PASSWORD=${DATABASE_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./database/backups:/backups
    networks:
      - everytriv-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USERNAME} -d everytriv_prod"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: everytriv-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_prod_data:/data
    networks:
      - everytriv-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: everytriv-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - client
      - server
    networks:
      - everytriv-network

volumes:
  postgres_prod_data:
    driver: local
  redis_prod_data:
    driver: local

networks:
  everytriv-network:
    driver: bridge

## ביצועים ואופטימיזציה

### Caching
- קבצים סטטיים מוקאשים לשנה
- קבצי HTML מוקאשים בהתאם
- תגובות API מוקאשות בהתבסס על headers

### Compression
- דחיסת Gzip מופעלת
- דחיסת Brotli נתמכת
- גודל bundle מותאם

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
```

### משתני סביבה (.env.prod)
```env
# Database
DATABASE_USERNAME=everytriv_prod_user
DATABASE_PASSWORD=EvTr!v_Pr0d_DB_P@ssw0rd_2025_S3cur3!
DATABASE_NAME=everytriv_prod

# Redis
REDIS_PASSWORD=EvTr!v_Pr0d_R3d!s_P@ssw0rd_2025_S3cur3!

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AI Providers
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
MISTRAL_API_KEY=your-mistral-api-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# App Configuration
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

## CI/CD Pipeline

### GitHub Actions (.github/workflows/deploy.yml)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'
        
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
        
    - name: Install dependencies
      run: |
        pnpm install
        cd client && pnpm install
        cd ../server && pnpm install
        
    - name: Run tests
      run: |
        pnpm test
        cd client && pnpm test
        cd ../server && pnpm test
        
    - name: Build applications
      run: |
        cd client && pnpm run build
        cd ../server && pnpm run build
        
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/everytriv
          git pull origin main
          docker-compose -f docker-compose.prod.yaml down
          docker-compose -f docker-compose.prod.yaml build
          docker-compose -f docker-compose.prod.yaml up -d
          docker system prune -f
```

### Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Stop existing containers
docker-compose -f docker-compose.prod.yaml down

# Build new images
docker-compose -f docker-compose.prod.yaml build

# Start containers
docker-compose -f docker-compose.prod.yaml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yaml exec server pnpm run migration:run

# Clean up unused images
docker system prune -f

# Health check
sleep 10
curl -f https://your-domain.com/health || exit 1

echo "Deployment completed successfully!"
```

## ניהול נתונים

### גיבוי מסד נתונים
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/everytriv/backups"

# יצירת תיקיית גיבוי
mkdir -p $BACKUP_DIR

# גיבוי PostgreSQL
docker exec everytriv-postgres pg_dump -U everytriv_prod_user everytriv_prod | gzip > $BACKUP_DIR/postgres_backup_$DATE.sql.gz

# גיבוי Redis
docker exec everytriv-redis redis-cli -a EvTr!v_Pr0d_R3d!s_P@ssw0rd_2025_S3cur3! BGSAVE
docker cp everytriv-redis:/data/dump.rdb $BACKUP_DIR/redis_backup_$DATE.rdb

# מחיקת גיבויים ישנים (יותר מ-7 ימים)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### שחזור מסד נתונים
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

echo "Restoring from backup: $BACKUP_FILE"

# עצירת שירותים
docker-compose -f docker-compose.prod.yaml stop server

# שחזור PostgreSQL
gunzip -c $BACKUP_FILE | docker exec -i everytriv-postgres psql -U everytriv_prod_user -d everytriv_prod

# הפעלה מחדש של שירותים
docker-compose -f docker-compose.prod.yaml start server

echo "Restore completed successfully!"
```

## Monitoring ו-Logging

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

# בדיקת שירותים
services=("client" "server" "postgres" "redis" "nginx")

for service in "${services[@]}"; do
    if ! docker ps | grep -q "everytriv-$service"; then
        echo "Service $service is down!"
        exit 1
    fi
done

# בדיקת API
if ! curl -f https://your-domain.com/health > /dev/null 2>&1; then
    echo "API health check failed!"
    exit 1
fi

# בדיקת מסד נתונים
if ! docker exec everytriv-postgres pg_isready -U everytriv_prod_user -d everytriv_prod > /dev/null 2>&1; then
    echo "Database health check failed!"
    exit 1
fi

echo "All services are healthy!"
```

### Log Rotation
```bash
# /etc/logrotate.d/everytriv
/opt/everytriv/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/everytriv/docker-compose.prod.yaml restart nginx
    endscript
}
```

## אבטחה

### Firewall Rules
```bash
# הגדרת כללי Firewall נוספים
sudo ufw allow from 10.0.0.0/8 to any port 5432  # Database access
sudo ufw allow from 10.0.0.0/8 to any port 6379  # Redis access
sudo ufw deny 22                                  # Block SSH if using key-based auth
```

### SSL Configuration
```nginx
# /etc/nginx/snippets/ssl.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
```

### Security Headers
```nginx
# /etc/nginx/snippets/security-headers.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## ביצועים

### Nginx Optimization
```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 65535;
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16M;
    
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
}
```

### Database Optimization
```sql
-- הגדרות PostgreSQL לייצור
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- הפעלה מחדש
SELECT pg_reload_conf();
```

## Troubleshooting

### בעיות נפוצות

#### 1. שירות לא עולה
```bash
# בדיקת לוגים
docker-compose -f docker-compose.prod.yaml logs [service-name]

# בדיקת סטטוס
docker-compose -f docker-compose.prod.yaml ps

# הפעלה מחדש
docker-compose -f docker-compose.prod.yaml restart [service-name]
```

#### 2. בעיות SSL
```bash
# בדיקת SSL certificate
sudo certbot certificates

# חידוש certificate
sudo certbot renew

# בדיקת Nginx configuration
sudo nginx -t
```

#### 3. בעיות מסד נתונים
```bash
# התחברות למסד נתונים
docker exec -it everytriv-postgres psql -U everytriv_prod_user -d everytriv_prod

# בדיקת חיבורים
docker exec everytriv-postgres pg_isready -U everytriv_prod_user

# בדיקת זיכרון
docker exec everytriv-postgres psql -U everytriv_prod_user -d everytriv_prod -c "SELECT * FROM pg_stat_activity;"
```

### כלי אבחון

#### System Monitoring
```bash
# בדיקת שימוש במשאבים
docker stats

# בדיקת דיסק
df -h

# בדיקת זיכרון
free -h

# בדיקת CPU
top
```

#### Application Monitoring
```bash
# בדיקת לוגים רציפה
docker-compose -f docker-compose.prod.yaml logs -f

# בדיקת health endpoints
curl https://your-domain.com/health
curl https://your-domain.com/api/health

# בדיקת metrics
curl https://your-domain.com/api/metrics
```
