# הגדרת מסד נתונים מאוחד - EveryTriv

## סקירה כללית

מדריך מקיף להגדרת מסד נתונים מאוחד עבור EveryTriv, כולל PostgreSQL ו-Redis, עם הוראות התקנה, קונפיגורציה וניהול. מדריך זה מכסה גם חיבורים, פתרון בעיות וניטור ביצועים.

## דרישות מערכת

- **PostgreSQL**: גרסה 15 ומעלה
- **Redis**: גרסה 7 ומעלה
- **Docker**: (אופציונלי) לפריסה
- **Node.js**: גרסה 18 ומעלה

## הגדרת PostgreSQL

### התקנה עם Docker
```bash
# הפעלת PostgreSQL עם Docker
docker run -d \
  --name everytriv-postgres \
  -e POSTGRES_DB=everytriv \
  -e POSTGRES_USER=everytriv_user \
  -e POSTGRES_PASSWORD=EvTr!v_DB_P@ssw0rd_2025_S3cur3! \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine
```

### התקנה מקומית
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS עם Homebrew
brew install postgresql
brew services start postgresql

# Windows
# הורד והתקן מ-https://www.postgresql.org/download/windows/
```

### הגדרת מסד נתונים
```sql
-- התחברות ל-PostgreSQL
psql -U postgres

-- יצירת משתמש
CREATE USER everytriv_user WITH PASSWORD 'EvTr!v_DB_P@ssw0rd_2025_S3cur3!';

-- יצירת מסד נתונים
CREATE DATABASE everytriv OWNER everytriv_user;

-- הרשאות
GRANT ALL PRIVILEGES ON DATABASE everytriv TO everytriv_user;
GRANT ALL ON SCHEMA public TO everytriv_user;

-- יצירת הרחבות נדרשות
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

## הגדרת Redis

### התקנה עם Docker
```bash
# הפעלת Redis עם Docker
docker run -d \
  --name everytriv-redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine redis-server --appendonly yes --requirepass EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3!
```

### התקנה מקומית
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# macOS עם Homebrew
brew install redis
brew services start redis

# Windows
# הורד והתקן מ-https://redis.io/download
```

### הגדרת Redis
```bash
# התחברות ל-Redis
redis-cli

# הגדרת סיסמה
CONFIG SET requirepass "EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3!"

# בדיקת חיבור
AUTH EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3!
PING
```

## סוגי חיבורים

### 1. חיבור ישיר (Direct Connection)
```typescript
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'everytriv_user',
  password: 'EvTr!v_DB_P@ssw0rd_2025_S3cur3!',
  database: 'everytriv',
  synchronize: false,
  logging: true,
});
```

### 2. חיבור עם Connection Pool
```typescript
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'everytriv_user',
  password: 'EvTr!v_DB_P@ssw0rd_2025_S3cur3!',
  database: 'everytriv',
  extra: {
    max: 20, // מספר חיבורים מקסימלי
    min: 5,  // מספר חיבורים מינימלי
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
});
```

### 3. חיבור עם SSL (ייצור)
```typescript
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'your-production-host',
  port: 5432,
  username: 'everytriv_user',
  password: 'EvTr!v_DB_P@ssw0rd_2025_S3cur3!',
  database: 'everytriv',
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync('/path/to/ca-certificate.crt'),
    key: fs.readFileSync('/path/to/client-key.pem'),
    cert: fs.readFileSync('/path/to/client-certificate.pem'),
  },
});
```

## קונפיגורציית TypeORM

### data-source.ts
```typescript
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export const createDataSource = (configService: ConfigService): DataSource => {
  return new DataSource({
    type: 'postgres',
    host: configService.get('DATABASE_HOST'),
    port: configService.get('DATABASE_PORT'),
    username: configService.get('DATABASE_USERNAME'),
    password: configService.get('DATABASE_PASSWORD'),
    database: configService.get('DATABASE_NAME'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false, // false בייצור
    logging: configService.get('NODE_ENV') === 'development',
    ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
    extra: {
      max: 20, // מספר חיבורים מקסימלי
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    },
  });
};
```

### database.config.ts
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'everytriv_user',
  password: process.env.DATABASE_PASSWORD || 'EvTr!v_DB_P@ssw0rd_2025_S3cur3!',
  database: process.env.DATABASE_NAME || 'everytriv',
  schema: process.env.DATABASE_SCHEMA || 'public',
  ssl: process.env.DATABASE_SSL === 'true',
}));
```

## ישויות מסד הנתונים

### UserEntity
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { GameHistoryEntity } from './game-history.entity';
import { PaymentHistoryEntity } from './payment-history.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column({ default: 0 })
  points: number;

  @Column({ default: 0 })
  gamesPlayed: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageScore: number;

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    theme: 'light' | 'dark';
    soundEnabled: boolean;
    musicEnabled: boolean;
    notifications: boolean;
  };

  @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => GameHistoryEntity, game => game.user)
  gameHistory: GameHistoryEntity[];

  @OneToMany(() => PaymentHistoryEntity, payment => payment.user)
  paymentHistory: PaymentHistoryEntity[];
}
```

### TriviaEntity
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('trivia_questions')
@Index(['topic', 'difficulty'])
@Index(['createdAt'])
export class TriviaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  topic: string;

  @Column()
  difficulty: string;

  @Column('text')
  question: string;

  @Column('jsonb')
  answers: Array<{
    text: string;
    isCorrect: boolean;
  }>;

  @Column()
  correctAnswerIndex: number;

  @Column('text', { nullable: true })
  explanation: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    actualDifficulty?: string;
    questionCount?: number;
    customDifficultyMultiplier?: number;
    aiProvider?: string;
    generationTime?: number;
  };

  @Column({ default: 0 })
  timesAsked: number;

  @Column({ default: 0 })
  correctAnswers: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @Column({ default: 'he' })
  language: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

### GameHistoryEntity
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('game_history')
@Index(['userId', 'createdAt'])
@Index(['topic', 'difficulty'])
export class GameHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, user => user.gameHistory)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  score: number;

  @Column()
  totalQuestions: number;

  @Column()
  correctAnswers: number;

  @Column()
  topic: string;

  @Column()
  difficulty: string;

  @Column()
  gameMode: string;

  @Column()
  timeSpent: number;

  @Column({ default: 0 })
  creditsUsed: number;

  @Column({ type: 'jsonb', nullable: true })
  questions: Array<{
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
  }>;

  @CreateDateColumn()
  createdAt: Date;
}
```

## מיגרציות

### יצירת מיגרציה
```bash
# יצירת מיגרציה חדשה
pnpm run migration:generate -- -n CreateInitialTables

# הרצת מיגרציות
pnpm run migration:run

# ביטול מיגרציה אחרונה
pnpm run migration:revert
```

### דוגמה למיגרציה
```typescript
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateInitialTables1690000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // יצירת טבלת משתמשים
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'username',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
          },
          {
            name: 'points',
            type: 'integer',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // יצירת אינדקסים
    await queryRunner.createIndex('users', {
      name: 'IDX_USERS_EMAIL',
      columnNames: ['email'],
    });

    await queryRunner.createIndex('users', {
      name: 'IDX_USERS_USERNAME',
      columnNames: ['username'],
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

## קונפיגורציית Redis

### Redis Service
```typescript
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
```

## גיבוי ושחזור

### גיבוי מסד נתונים
```bash
# גיבוי מלא
pg_dump -U everytriv_user -d everytriv > backup_$(date +%Y%m%d_%H%M%S).sql

# גיבוי עם דחיסה
pg_dump -U everytriv_user -d everytriv | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# גיבוי סכמה בלבד
pg_dump -U everytriv_user -d everytriv --schema-only > schema_backup.sql

# גיבוי נתונים בלבד
pg_dump -U everytriv_user -d everytriv --data-only > data_backup.sql
```

### שחזור מסד נתונים
```bash
# שחזור מגיבוי רגיל
psql -U everytriv_user -d everytriv < backup.sql

# שחזור מגיבוי דחוס
gunzip -c backup.sql.gz | psql -U everytriv_user -d everytriv

# שחזור עם יצירת מסד נתונים
createdb -U everytriv_user everytriv_restored
psql -U everytriv_user -d everytriv_restored < backup.sql
```

### גיבוי Redis
```bash
# גיבוי Redis
docker exec everytriv-redis redis-cli -a EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3! BGSAVE

# העתקת קובץ הגיבוי
docker cp everytriv-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d_%H%M%S).rdb
```

## ביצועים ואופטימיזציה

### אינדקסים מומלצים
```sql
-- אינדקסים למשתמשים
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);

-- אינדקסים לשאלות טריוויה
CREATE INDEX CONCURRENTLY idx_trivia_topic_difficulty ON trivia_questions(topic, difficulty);
CREATE INDEX CONCURRENTLY idx_trivia_created_at ON trivia_questions(created_at);
CREATE INDEX CONCURRENTLY idx_trivia_success_rate ON trivia_questions(success_rate);

-- אינדקסים להיסטוריית משחקים
CREATE INDEX CONCURRENTLY idx_game_history_user_created ON game_history(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_game_history_topic_difficulty ON game_history(topic, difficulty);
CREATE INDEX CONCURRENTLY idx_game_history_score ON game_history(score DESC);
```

### הגדרות PostgreSQL
```sql
-- הגדרות ביצועים
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- הפעלה מחדש
SELECT pg_reload_conf();
```

### הגדרות Redis
```bash
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

## בדיקת חיבור

### Health Check Service
```typescript
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthService {
  constructor(private dataSource: DataSource) {}

  async checkConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  async getConnectionInfo() {
    const isConnected = await this.checkConnection();
    
    return {
      isConnected,
      host: this.dataSource.options.host,
      port: this.dataSource.options.port,
      database: this.dataSource.options.database,
      driver: this.dataSource.options.type,
      timestamp: new Date().toISOString(),
    };
  }

  async getConnectionStats() {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      const result = await queryRunner.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      return result[0];
    } finally {
      await queryRunner.release();
    }
  }
}
```

### Health Check Controller
```typescript
import { Controller, Get } from '@nestjs/common';
import { DatabaseHealthService } from './database-health.service';

@Controller('health')
export class HealthController {
  constructor(private databaseHealthService: DatabaseHealthService) {}

  @Get('database')
  async checkDatabase() {
    const isHealthy = await this.databaseHealthService.checkConnection();
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'database',
    };
  }

  @Get('database/info')
  async getDatabaseInfo() {
    return this.databaseHealthService.getConnectionInfo();
  }

  @Get('database/stats')
  async getDatabaseStats() {
    return this.databaseHealthService.getConnectionStats();
  }
}
```

## פתרון בעיות

### שגיאות נפוצות

#### 1. Connection Refused
```bash
# בדיקת סטטוס PostgreSQL
sudo systemctl status postgresql

# בדיקת פורט
netstat -tulpn | grep :5432

# בדיקת הגדרות pg_hba.conf
sudo cat /etc/postgresql/15/main/pg_hba.conf | grep -v '^#'
```

#### 2. Authentication Failed
```sql
-- בדיקת משתמשים
SELECT usename, usesysid FROM pg_user;

-- יצירת משתמש מחדש
CREATE USER everytriv_user WITH PASSWORD 'EvTr!v_DB_P@ssw0rd_2025_S3cur3!';

-- הרשאות
GRANT ALL PRIVILEGES ON DATABASE everytriv TO everytriv_user;
```

#### 3. Database Does Not Exist
```sql
-- יצירת מסד נתונים
CREATE DATABASE everytriv OWNER everytriv_user;

-- בדיקת מסדי נתונים
\l
```

#### 4. Connection Timeout
```typescript
// הגדלת timeout
const dataSource = new DataSource({
  // ... other options
  extra: {
    connectionTimeoutMillis: 30000, // 30 seconds
    query_timeout: 30000,
    statement_timeout: 30000,
  },
});
```

## Monitoring ו-Logging

### Health Checks
```typescript
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from './redis.service';

@Injectable()
export class HealthService {
  constructor(
    private dataSource: DataSource,
    private redisService: RedisService,
  ) {}

  async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  async checkRedis(): Promise<boolean> {
    try {
      await this.redisService.get('health_check');
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  async getHealthStatus() {
    const dbHealthy = await this.checkDatabase();
    const redisHealthy = await this.checkRedis();

    return {
      status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'up' : 'down',
        redis: redisHealthy ? 'up' : 'down',
      },
    };
  }
}
```

### Metrics
```typescript
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MetricsService {
  constructor(private dataSource: DataSource) {}

  async getDatabaseMetrics() {
    const [
      userCount,
      questionCount,
      gameCount,
    ] = await Promise.all([
      this.dataSource.query('SELECT COUNT(*) FROM users'),
      this.dataSource.query('SELECT COUNT(*) FROM trivia_questions'),
      this.dataSource.query('SELECT COUNT(*) FROM game_history'),
    ]);

    return {
      users: parseInt(userCount[0].count),
      questions: parseInt(questionCount[0].count),
      games: parseInt(gameCount[0].count),
    };
  }

  async getPerformanceMetrics() {
    const result = await this.dataSource.query(`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY n_distinct DESC
    `);

    return result;
  }
}
```

## Troubleshooting

### בעיות נפוצות

#### 1. חיבור למסד נתונים
```bash
# בדיקת חיבור
psql -h localhost -U everytriv_user -d everytriv

# בדיקת סטטוס
sudo systemctl status postgresql

# בדיקת לוגים
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### 2. בעיות Redis
```bash
# בדיקת חיבור
redis-cli -a EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3! ping

# בדיקת זיכרון
redis-cli -a EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3! info memory

# ניקוי מטמון
redis-cli -a EvTr!v_R3d!s_P@ssw0rd_2025_S3cur3! flushall
```

#### 3. בעיות ביצועים
```sql
-- בדיקת שאילתות איטיות
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- בדיקת אינדקסים לא בשימוש
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```
 
