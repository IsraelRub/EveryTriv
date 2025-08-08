import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { TriviaEntity } from "../shared/entities/trivia.entity";
import { UserEntity } from "../shared/entities/user.entity";
import { databaseConfig } from "./database.config";

export class AppConfig {
  static readonly port = parseInt(process.env.PORT || '3001', 10);

  // container apps prefix as in production
  static readonly apiUrl = {
    users: "users",
    files: "files",
  };

  // Use the centralized database configuration
  static readonly typeOrmConfig: TypeOrmModuleOptions = {
    ...databaseConfig,
    entities: [TriviaEntity, UserEntity],
    autoLoadEntities: true,
  };
}
