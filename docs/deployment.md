# Deployment Guide

## Production Environment Setup

### System Requirements

- 2 CPU cores minimum
- 4GB RAM minimum
- 20GB storage minimum
- Ubuntu 20.04 LTS or newer

### Prerequisites

1. Install Docker and Docker Compose:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. Install Node.js and pnpm:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm
```

### Environment Configuration

1. Create production environment files:

`/etc/everytriv/production.env`:
```env
NODE_ENV=production
TZ=UTC

# App
PORT=3000
API_VERSION=v1
DOMAIN=your-domain.com

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=production_user
DB_PASSWORD=strong_password
DB_DATABASE=everytriv_prod
DB_SCHEMA=public

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=strong_redis_password

# JWT
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION=7d

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100

# LLM Providers
OPENAI_API_KEY=your_production_openai_key
ANTHROPIC_API_KEY=your_production_anthropic_key

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Security
CORS_ORIGIN=https://your-domain.com
COOKIE_SECRET=your_production_cookie_secret
```

2. Configure Nginx:

`/etc/nginx/sites-available/everytriv`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Frontend
    location / {
        root /var/www/everytriv/client;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate limiting
        limit_req zone=api burst=10 nodelay;
        limit_req_status 429;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Deployment Process

### 1. Database Setup

1. Initialize PostgreSQL:
```bash
# Create production database
docker exec -it everytriv-postgres psql -U postgres -c "CREATE DATABASE everytriv_prod;"

# Run migrations
cd server
NODE_ENV=production pnpm typeorm migration:run
```

2. Set up Redis:
```bash
# Configure Redis password
docker exec -it everytriv-redis redis-cli CONFIG SET requirepass "your_redis_password"
```

### 2. Application Deployment

1. Build the applications:
```bash
# Build frontend
cd client
pnpm build

# Build backend
cd ../server
pnpm build
```

2. Deploy using Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. SSL Configuration

1. Install Certbot:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

### 4. Monitoring Setup

1. Install Prometheus and Grafana:
```bash
docker-compose -f monitoring/docker-compose.yml up -d
```

2. Configure monitoring endpoints:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

### 5. Backup Configuration

1. Set up automated backups:
```bash
# Install backup script
sudo cp scripts/backup.sh /etc/cron.daily/everytriv-backup
sudo chmod +x /etc/cron.daily/everytriv-backup

# Configure backup location
echo "BACKUP_PATH=/var/backups/everytriv" | sudo tee -a /etc/environment
```

2. Test backup script:
```bash
sudo /etc/cron.daily/everytriv-backup
```

## Maintenance

### Health Checks

Monitor system health:
```bash
# Check application logs
docker-compose logs -f app

# Check database status
docker exec everytriv-postgres pg_isready

# Check Redis status
docker exec everytriv-redis redis-cli ping
```

### Updates

1. Update application:
```bash
# Pull latest changes
git pull origin main

# Update dependencies
pnpm install

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

2. Update system packages:
```bash
sudo apt-get update
sudo apt-get upgrade
```

### Backup and Restore

1. Manual backup:
```bash
# Database backup
docker exec everytriv-postgres pg_dump -U postgres everytriv_prod > backup.sql

# Redis backup
docker exec everytriv-redis redis-cli SAVE
```

2. Restore from backup:
```bash
# Database restore
cat backup.sql | docker exec -i everytriv-postgres psql -U postgres everytriv_prod

# Redis restore
docker cp dump.rdb everytriv-redis:/data/dump.rdb
docker restart everytriv-redis
```

## Troubleshooting

### Common Issues

1. **Application not starting**
   - Check logs: `docker-compose logs app`
   - Verify environment variables
   - Check disk space: `df -h`
   - Check memory usage: `free -m`

2. **Database connection issues**
   - Check PostgreSQL logs
   - Verify connection string
   - Check network connectivity
   - Verify credentials

3. **Redis connection issues**
   - Check Redis logs
   - Verify password
   - Check memory usage
   - Verify persistence configuration

### Performance Issues

1. **High CPU Usage**
   - Check process stats: `top`
   - Monitor container stats: `docker stats`
   - Review application logs
   - Check for memory leaks

2. **Slow Response Times**
   - Monitor API latency
   - Check database query performance
   - Verify Redis cache hit rates
   - Review network connectivity

### Recovery Procedures

1. **Application Recovery**
```bash
# Stop all containers
docker-compose down

# Clear volumes (if needed)
docker-compose down -v

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

2. **Database Recovery**
```bash
# Stop database
docker-compose stop postgres

# Start in recovery mode
docker-compose run --rm postgres postgres -c "recovery=true"
```

3. **Redis Recovery**
```bash
# Check Redis persistence
docker exec everytriv-redis redis-cli info persistence

# Rebuild Redis data
docker-compose restart redis
```