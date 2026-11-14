import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { Logger } from "@nestjs/common";
import { DataSource, DataSourceOptions } from "typeorm";
import { MigrationFn as UmzugMigrationFn, Umzug } from "umzug";

import { TextRow } from "./TextRow.js";
import { ParameterFreeLogger } from "./ParameterFreeLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type Query = <T = unknown>(sql: string, parameters?: unknown[]) => Promise<T>;

interface MigrationContext {
  query: Query;
  /** Runs `work` in one transaction, which rolls back if `work` throws. */
  transaction: (work: (query: Query) => Promise<void>) => Promise<void>;
}

export type MigrationFn = UmzugMigrationFn<MigrationContext>;

interface MigrationLog {
  name: string;
}

const migrationTable = "migrations";

const entities = [TextRow];

/**
 * Names the database to connect to. The password always comes from a file: a Docker secret on the
 * server and `env/database-password.development` locally.
 */
export type DbSettings = {
  host: string;
  port: number;
  username: string;
  passwordFile: string;
  database: string;
};

const readPassword = (passwordFile: string): string => {
  try {
    return readFileSync(passwordFile, "utf8").trimEnd();
  } catch (error) {
    throw new Error(`Failed to read the database password file (${passwordFile})`, {
      cause: error,
    });
  }
};

const connectionOptions = ({ host, port, username, passwordFile, database }: DbSettings) => ({
  type: "postgres" as const,
  host,
  port,
  username,
  password: readPassword(passwordFile),
  database,
});

/** Returns TypeORM's options for the database `settings` names, reading its password file. */
export const getTypeOrmConfig = (settings: DbSettings): DataSourceOptions => ({
  ...connectionOptions(settings),
  // Umzug migrations in `applyDbMigrations` own the schema, so TypeORM must not.
  synchronize: false,
  logger: new ParameterFreeLogger(),
  entities,
  subscribers: [],
  migrations: [],
});

/** Asks the database whether it answers, over a connection pool of its own. */
export type DbPing = {
  /** Resolves once the database answers a query, and rejects when it does not. */
  ping: () => Promise<void>;
  /** Closes the ping's connection pool. */
  close: () => Promise<void>;
};

/**
 * Returns a ping that runs over a pool of its own with one connection. The server exits when pings
 * fail. In the request pool, a flood of requests would hold pings back and make a healthy server
 * exit. The timeouts end a dial to a database host that is gone and a query on a dropped
 * connection.
 */
export const newDbPing = (settings: DbSettings): DbPing => {
  const dataSource = new DataSource({
    ...connectionOptions(settings),
    connectTimeoutMS: 2_000,
    extra: { max: 1, query_timeout: 2_000 },
  });

  return {
    ping: async () => {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      await dataSource.query("SELECT 1");
    },
    close: async () => {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    },
  };
};

/** Connects to the database with the TypeORM settings the server queries through. */
export async function openPostgres(settings: DbSettings): Promise<DataSource> {
  return new DataSource(getTypeOrmConfig(settings)).initialize();
}

const logger = new Logger("postgres");

/** Applies the migrations the database has not run yet, through `dataSource`. */
export async function applyDbMigrations(dataSource: DataSource) {
  const context: MigrationContext = {
    query: (sql, parameters) => dataSource.query(sql, parameters),
    transaction: (work) =>
      dataSource.transaction((manager) =>
        work((sql, parameters) => manager.query(sql, parameters)),
      ),
  };
  const migrator = new Umzug({
    migrations: {
      glob: ["migrations/*.{js,ts}", { cwd: __dirname }],
    },
    context,
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
