/* v8 ignore start */

import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TextsController } from './controllers/TextController';
import { isDbEnabled } from './dbEnv';
import { applyDbMigrations, entities, getTypeOrmConfig } from './dbUtils';
import { TextEntity } from './entities/TextEntity';

@Module({
  imports: [getTypeOrmModule(), TypeOrmModule.forFeature([TextEntity])],
  controllers: [TextsController],
  providers: [],
})
export class MainModule implements OnApplicationBootstrap {
  private static readonly logger = new Logger(MainModule.name);

  async onApplicationBootstrap() {
    if (isDbEnabled()) {
      MainModule.logger.log('Applying DB migrations');
      await applyDbMigrations();
    }
  }
}

function getTypeOrmModule() {
  if (isDbEnabled()) {
    return TypeOrmModule.forRoot(getTypeOrmConfig());
  }

  return TypeOrmModule.forRoot({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    logging: true,
    entities,
    subscribers: [],
    migrations: [],
  });
}

/* v8 ignore stop */
