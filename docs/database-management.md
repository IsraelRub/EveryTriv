# Database Management Guide

This guide covers different ways to manage and interact with the EveryTriv databases.

## Available Database Clients

### 1. WebDB (Recommended)
Modern, fast, and intuitive web-based database client.

#### Features:
- Modern UI with dark/light themes
- Fast query execution
- Real-time data visualization
- Import/Export capabilities
- Multiple database support
- Query history and bookmarks

#### Installation & Usage:

**Option A: Docker (Recommended)**
```bash
# Local development
docker-compose -f docker-compose.local.yaml up -d webdb

# Production
docker-compose up -d webdb
```
Access: http://127.0.0.1:22071

**Option B: NPM Global Installation**
```bash
# Install globally
npm install -g @webdb/cli

# Or use project script
npm run webdb:install

# Start WebDB
npm run webdb:start        # localhost only
npm run webdb:start:public # accessible from network
npm run db:admin           # shorthand for localhost
```

#### Connection Settings:
- **Host**: `postgres-local` (Docker) or `localhost` (NPM)
- **Port**: `5432`
- **Database**: `everytriv_dev` (local) / `everytriv_production` (prod)
- **Username**: `everytriv_user` (local) / `everytriv_prod` (prod)
- **Password**: See docker-compose files

### 2. pgAdmin (Local Development Only)
Traditional PostgreSQL administration tool.

```bash
docker-compose -f docker-compose.local.yaml up -d pgadmin
```
Access: http://localhost:8080
- Email: admin@everytriv.local
- Password: admin123

### 3. Redis Commander (Local Development Only)
Web-based Redis administration.

```bash
docker-compose -f docker-compose.local.yaml up -d redis-commander
```
Access: http://localhost:8081

## Database Operations

### Backup & Restore

#### PostgreSQL Backup
```bash
# Create backup
docker exec everytriv-postgres-local pg_dump -U everytriv_user everytriv_dev > backup.sql

# Restore from backup
docker exec -i everytriv-postgres-local psql -U everytriv_user everytriv_dev < backup.sql
```

#### Redis Backup
```bash
# Create Redis backup
docker exec everytriv-redis-local redis-cli BGSAVE

# Copy backup file
docker cp everytriv-redis-local:/data/dump.rdb ./redis-backup.rdb
```

### Common Queries

#### User Statistics
```sql
-- Get top users by score
SELECT username, score, "createdAt" 
FROM users 
ORDER BY score DESC 
LIMIT 10;

-- Get user activity summary
SELECT 
    COUNT(*) as total_users,
    AVG(score) as avg_score,
    MAX(score) as max_score
FROM users;
```

#### Trivia Statistics
```sql
-- Get most popular topics
SELECT topic, COUNT(*) as question_count 
FROM trivia_questions 
GROUP BY topic 
ORDER BY question_count DESC;

-- Get difficulty distribution
SELECT difficulty, COUNT(*) as count 
FROM trivia_questions 
GROUP BY difficulty;
```

#### Game History Analysis
```sql
-- Get user performance over time
SELECT 
    DATE(created_at) as game_date,
    AVG(score) as avg_score,
    COUNT(*) as games_played
FROM game_history 
WHERE user_id = 'USER_ID'
GROUP BY DATE(created_at)
ORDER BY game_date DESC;
```

### Migrations

#### Run Migrations
```bash
# Development
cd server
npm run migration:run

# Production
docker exec everytriv-server npm run migration:run
```

#### Create New Migration
```bash
cd server
npm run migration:create -- --name=YourMigrationName
```

#### Revert Migration
```bash
cd server
npm run migration:revert
```

## Performance Monitoring

### Database Performance
```sql
-- Check slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public';
```

### Redis Performance
```bash
# Redis info
docker exec everytriv-redis-local redis-cli INFO

# Monitor Redis commands
docker exec everytriv-redis-local redis-cli MONITOR
```

## Security Considerations

### Production Database Access
- WebDB is bound to localhost only (`127.0.0.1:22071`)
- Use SSH tunneling for remote access
- Change default passwords in production
- Enable SSL/TLS for database connections

### Local Development
- Use strong passwords even in development
- Regularly backup development data
- Don't commit sensitive data to version control

## Troubleshooting

### Common Issues

#### WebDB Can't Connect
1. Check if PostgreSQL is running
2. Verify connection parameters
3. Check Docker network connectivity
4. Review firewall settings

#### pgAdmin Access Issues
1. Clear browser cache
2. Check if container is running
3. Verify port 8080 is not in use

#### Performance Issues
1. Check database connections pool
2. Monitor query performance
3. Review Redis cache hit rates
4. Check disk space and memory usage

### Logs and Debugging
```bash
# PostgreSQL logs
docker logs everytriv-postgres-local

# Redis logs
docker logs everytriv-redis-local

# WebDB logs (if running via Docker)
docker logs everytriv-webdb-local
```

## Best Practices

1. **Regular Backups**: Schedule automated backups
2. **Monitor Performance**: Use WebDB's built-in monitoring
3. **Index Optimization**: Regularly review and optimize indexes
4. **Query Optimization**: Use EXPLAIN ANALYZE for slow queries
5. **Connection Pooling**: Configure appropriate pool sizes
6. **Cache Strategy**: Monitor Redis hit rates and optimize caching

## Resources

- [WebDB Documentation](https://webdb.app/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
