/* v8 ignore start */

import { Logger, Module, OnApplicationBootstrap } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { TextsController } from "./controllers/TextController.js";
import { applyDbMigrations, getTypeOrmConfig } from "./dbUtils.js";
import { TextEntity } from "./entities/TextEntity.js";

@Module({
  imports: [TypeOrmModule.forRoot(getTypeOrmConfig()), TypeOrmModule.forFeature([TextEntity])],
  controllers: [TextsController],
  providers: [],
})
export class MainModule implements OnApplicationBootstrap {
  private static readonly logger = new Logger(MainModule.name);

  async onApplicationBootstrap() {
    MainModule.logger.log("Applying DB migrations");
    await applyDbMigrations();
  }
}

/* v8 ignore stop */
