/* v8 ignore start */

import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TextsController } from './controllers/TextController';
import { applyDbMigrations, getTypeOrmConfig } from './dbUtils';
import { TextEntity } from './entities/TextEntity';

@Module({
  imports: [TypeOrmModule.forRoot(getTypeOrmConfig()), TypeOrmModule.forFeature([TextEntity])],
  controllers: [TextsController],
  providers: [],
})
export class MainModule implements OnApplicationBootstrap {
  private static readonly logger = new Logger(MainModule.name);

  async onApplicationBootstrap() {
    MainModule.logger.log('Applying DB migrations');
    await applyDbMigrations();
  }
}

/* v8 ignore stop */
