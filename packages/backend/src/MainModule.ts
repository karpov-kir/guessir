/* v8 ignore start */

import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { TextsController } from './controllers/TextController';
import { applyDbMigrations, getTypeOrmConfig } from './dbUtils';
import { watchDb } from './dbWatch';
import { TextEntity } from './entities/TextEntity';

// The server waits for the database at start, because a deploy of a new postgres:17 patch restarts it, and a new task
// that exits at once pauses the rolling update. Once the database is gone for `lostAfterMs`, the server exits so Swarm
// starts a new task in a new container, which does not rely on old connections or name lookups recovering.
const startupWaitMs = 60_000;
const lostAfterMs = 30_000;
const pingEveryMs = 1_000;

const startupDeadline = Date.now() + startupWaitMs;

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...getTypeOrmConfig(),
      retryAttempts: Infinity,
      retryDelay: pingEveryMs,
      toRetry: () => Date.now() < startupDeadline,
    }),
    TypeOrmModule.forFeature([TextEntity]),
  ],
  controllers: [TextsController],
  providers: [],
})
export class MainModule implements OnApplicationBootstrap {
  private static readonly logger = new Logger(MainModule.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    MainModule.logger.log('Applying DB migrations');
    await applyDbMigrations();
    this.exitWhenDbLost();
  }

  private exitWhenDbLost() {
    void watchDb(() => this.dataSource.query('SELECT 1'), { limitMs: lostAfterMs, intervalMs: pingEveryMs }).then(
      (error) => {
        MainModule.logger.error(`DB has been unreachable for ${lostAfterMs}ms: ${String(error)}`);
        process.exit(1);
      },
    );
  }
}

/* v8 ignore stop */
