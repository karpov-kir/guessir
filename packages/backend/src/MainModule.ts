import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TextsController } from './controllers/TextsController';
import { applyDbMigrations, getTypeOrmConfig, isDbEnabled } from './dbUtils';
import { TextEntity } from './entities/TextEntity';

@Module({
  imports: [getTypeOrmModule(), TypeOrmModule.forFeature([TextEntity])],
  controllers: [TextsController],
  providers: [],
})
export class MainModule implements OnApplicationBootstrap {
  private static logger = new Logger(MainModule.name);

  async onApplicationBootstrap() {
    if (isDbEnabled()) {
      MainModule.logger.log('Applying DB migrations');
      await applyDbMigrations();
    }
  }
}

function getTypeOrmModule() {
  const config = getTypeOrmConfig();
  const { entities } = config;

  if (isDbEnabled()) {
    return TypeOrmModule.forRoot(config);
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
