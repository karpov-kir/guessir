import { Logger } from '@nestjs/common';
import { dirname } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { MigrationFn as UmzugMigrationFn, Umzug } from 'umzug';
import { fileURLToPath } from 'url';

import { TextEntity } from './entities/TextEntity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MigrationContext {
  query: <T = unknown>(sql: string, parameters?: unknown[]) => Promise<T>;
}

export type MigrationFn = UmzugMigrationFn<MigrationContext>;

interface MigrationLog {
  name: string;
}

const migrationTable = 'migrations';

const entities = [TextEntity];

export const getTypeOrmConfig = (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PW,
  database: process.env.DB_NAME,
  // Handled manually using Umzug
  synchronize: false,
  logging: true,
  entities,
  subscribers: [],
  migrations: [],
});

const getContext = async (): Promise<MigrationContext> => {
  const dataSource = new DataSource(getTypeOrmConfig());

  const connection = await dataSource.initialize();

  return {
    query: (sql: string, parameters?: unknown[]) => connection.manager.query(sql, parameters),
  };
};

const logger = new Logger('dbUtils');

export async function applyDbMigrations() {
  const migrator = new Umzug({
    migrations: {
      glob: ['migrations/*.{js,ts}', { cwd: __dirname }],
    },
    context: await getContext(),
    storage: {
      async executed({ context: client }) {
        await client.query(`create table if not exists ${migrationTable}(name text)`);
        const results = await client.query<MigrationLog[]>(`select name from ${migrationTable}`);

        return results.map((result) => result.name);
      },

      async logMigration({ name, context: client }) {
        await client.query(`insert into ${migrationTable}(name) values ($1)`, [name]);
      },

      async unlogMigration({ name, context: client }) {
        await client.query(`delete from ${migrationTable} where name = $1`, [name]);
      },
    },
    logger: {
      info: (message) => logger.log(message),
      warn: (message) => logger.warn(message),
      error: (message) => logger.error(message),
      debug: (message) => logger.debug(message),
    },
  });

  await migrator.up();
}

export const isDbEnabled = () => {
  if (process.env.DB === 'true') {
    ['DB_USER', 'DB_PW', 'DB_NAME', 'DB_HOST'].forEach((envName) => {
      if (!process.env[envName]) {
        throw new Error(`${envName} must be provided when DB is enabled`);
      }
    });

    return true;
  }

  return false;
};
