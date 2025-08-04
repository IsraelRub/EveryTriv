import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { TriviaEntity } from "../shared/entities/trivia.entity";
import { UserEntity } from "../shared/entities/user.entity";

export class AppConfig {
  static readonly port = 3000;

  // container apps prefix as in production
  static readonly apiUrl = {
    users: "users",
    files: "files",
  };

  static readonly typeOrmConfig: TypeOrmModuleOptions = {
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || "postgres",
    database: process.env.DB_NAME || "everytriv_db",
    entities: [TriviaEntity, UserEntity],
    autoLoadEntities: true,
    synchronize: false,
    logging: true,
    ssl: process.env.NODE_ENV === 'production',
    extra: {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  };
}
