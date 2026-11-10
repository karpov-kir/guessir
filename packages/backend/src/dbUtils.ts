/*
 * v8 ignore start
 */

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { Logger } from "@nestjs/common";
import { DataSource, DataSourceOptions } from "typeorm";
import { MigrationFn as UmzugMigrationFn, Umzug } from "umzug";

import { getDbSettings } from "./dbEnv.js";
import { TextEntity } from "./entities/TextEntity.js";
import { ParameterFreeLogger } from "./ParameterFreeLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MigrationContext {
  query: <T = unknown>(sql: string, parameters?: unknown[]) => Promise<T>;
}

export type MigrationFn = UmzugMigrationFn<MigrationContext>;

interface MigrationLog {
  name: string;
}

const migrationTable = "migrations";

const entities = [TextEntity];

export const getTypeOrmConfig = (): DataSourceOptions => ({
  type: "postgres",
  ...getDbSettings(),
  // Umzug migrations in `applyDbMigrations` own the schema, so TypeORM must not.
  synchronize: false,
  logger: new ParameterFreeLogger(),
  entities,
  subscribers: [],
  migrations: [],
});

/**
 * Returns a ping that runs over a pool of its own with one connection. The server exits when pings
 * fail. In the request pool, a flood of requests would hold pings back and make a healthy server
 * exit. The timeouts end a dial to a database host that is gone and a query on a dropped
 * connection.
 */
export const createDbPing = () => {
  const dataSource = new DataSource({
    type: "postgres",
    ...getDbSettings(),
    connectTimeoutMS: 2_000,
    extra: { max: 1, query_timeout: 2_000 },
  });

  return async () => {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await dataSource.query("SELECT 1");
  };
};

const getContext = async (): Promise<MigrationContext> => {
  const dataSource = new DataSource(getTypeOrmConfig());

  const connection = await dataSource.initialize();

  return {
    query: (sql: string, parameters?: unknown[]) => connection.manager.query(sql, parameters),
  };
};

const logger = new Logger("dbUtils");

export async function applyDbMigrations() {
  const migrator = new Umzug({
    migrations: {
      glob: ["migrations/*.{js,ts}", { cwd: __dirname }],
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

/*
 * v8 ignore stop
 */
