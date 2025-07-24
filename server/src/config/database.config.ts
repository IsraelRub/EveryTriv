import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { TriviaEntity } from "../shared/entities/trivia.entity";
import { UserEntity } from "../shared/entities/user.entity";

export const databaseConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "everytriv",
  entities: [TriviaEntity, UserEntity],
  synchronize: process.env.NODE_ENV !== "prod",
};
