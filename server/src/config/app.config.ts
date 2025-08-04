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
    type: "mariadb",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3307,
    username: process.env.DB_USER || "ezuser",
    password: process.env.DB_PASS || "ezpass",
    database: process.env.DB_NAME || "everytriv_db",
    entities: [TriviaEntity, UserEntity],
    autoLoadEntities: true,
    charset: "utf8mb4",
    synchronize: false,
    logging: true,
  };
}
