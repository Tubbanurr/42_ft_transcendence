import "reflect-metadata";
import path from "path";
import fs from "fs";
import { DataSource } from "typeorm";

const DATABASE_PATH = path.resolve(process.cwd(), "data", "transcendence.db");
fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: DATABASE_PATH,
  entities: [path.join(process.cwd(), "src", "entities", "**", "*.ts")],
  migrations: [path.join(process.cwd(), "src", "migrations", "**", "*.ts")],
  synchronize: false,
  migrationsRun: false,
  logging: false,
});

export async function initDatabase() {
  if (!AppDataSource.isInitialized) {
    console.log(":file_cabinet: DB:", DATABASE_PATH);
    await AppDataSource.initialize();
    console.log(":white_check_mark: TypeORM initialized");
    await AppDataSource.runMigrations();
    console.log(":white_check_mark: Migrations executed");
  }
}