# פריסה - EveryTriv

מדריך מקיף לפריסת EveryTriv לסביבת ייצור, כולל הגדרת שרת, Docker, CI/CD pipeline, ניהול נתונים וניטור.

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

## פריסה עם Docker

### קונפיגורציית Docker Compose

הפרויקט כולל קובץ `docker-compose.yaml` להפעלת כל השירותים:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: everytriv-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: everytriv
      POSTGRES_USER: everytriv_user
      POSTGRES_PASSWORD: test123
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - everytriv-network

  redis:
    image: redis:7-alpine
    container_name: everytriv-redis
    restart: unless-stopped
    command: redis-server --requirepass R3d!s_Pr0d_P@ssw0rd_2025_S3cur3!
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    networks:
      - everytriv-network

  server:
    build:
      context: ../..
      dockerfile: server/Dockerfile
    container_name: everytriv-server
    restart: unless-stopped
    environment:
      - NODE_ENV=prod
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_USERNAME=everytriv_user
      - DATABASE_NAME=everytriv
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    ports:
      - '3002:3002'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - everytriv-network

  client:
    build:
      context: ../..
      dockerfile: client/Dockerfile
    container_name: everytriv-client
    restart: unless-stopped
    ports:
      - '3000:3000'
    depends_on:
      - server
    networks:
      - everytriv-network
```

### פריסה

```bash
# בנייה והפעלה
docker-compose up -d

# צפייה בלוגים
docker-compose logs -f

# עצירה
docker-compose down

# עצירה עם מחיקת volumes
docker-compose down -v
```

## משתני סביבה לייצור

### Backend (.env)
```env
# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=everytriv_prod
DATABASE_USERNAME=everytriv_prod_user
DATABASE_PASSWORD=strong-production-password
DATABASE_SSL=true

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=strong-redis-password

# JWT
JWT_SECRET=strong-jwt-secret-key
JWT_EXPIRES_IN=24h

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-key
MISTRAL_API_KEY=your-mistral-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# CORS
CORS_ORIGIN=https://your-domain.com

# Port
PORT=3002
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://api.your-domain.com
VITE_APP_NAME=EveryTriv
```

## הגדרת Nginx

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
        proxy_set_header X-Forwarded-For $proxy_add_x;
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
        proxy_set_header X-Forwarded-For $proxy_add_x;
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

## CI/CD Pipeline

### GitHub Actions

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
        pnpm test:all
        
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
          docker-compose down
          docker-compose build
          docker-compose up -d
          docker system prune -f
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
docker exec everytriv-postgres pg_dump -U everytriv_user everytriv | gzip > $BACKUP_DIR/postgres_backup_$DATE.sql.gz

# גיבוי Redis
docker exec everytriv-redis redis-cli -a R3d!s_Pr0d_P@ssw0rd_2025_S3cur3! BGSAVE
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
docker-compose stop server

# שחזור PostgreSQL
gunzip -c $BACKUP_FILE | docker exec -i everytriv-postgres psql -U everytriv_user -d everytriv

# הפעלה מחדש של שירותים
docker-compose start server

echo "Restore completed successfully!"
```

## Monitoring ו-Logging

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

# בדיקת שירותים
services=("client" "server" "postgres" "redis")

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
if ! docker exec everytriv-postgres pg_isready -U everytriv_user -d everytriv > /dev/null 2>&1; then
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
        docker-compose restart nginx
    endscript
}
```

## אבטחה

### Firewall Rules

```bash
# הגדרת כללי Firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
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
docker-compose logs [service-name]

# בדיקת סטטוס
docker-compose ps

# הפעלה מחדש
docker-compose restart [service-name]
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
docker exec -it everytriv-postgres psql -U everytriv_user -d everytriv

# בדיקת חיבורים
docker exec everytriv-postgres pg_isready -U everytriv_user

# בדיקת זיכרון
docker exec everytriv-postgres psql -U everytriv_user -d everytriv -c "SELECT * FROM pg_stat_activity;"
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
docker-compose logs -f

# בדיקת health endpoints
curl https://your-domain.com/health
curl https://your-domain.com/api/health
```

## הפניות

- [ארכיטקטורה כללית](./ARCHITECTURE.md)
- [מדריך פיתוח](./DEVELOPMENT.md)
- [דיאגרמות](./DIAGRAMS.md)
