import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
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

/** Returns the migrator of the database behind `dataSource`, over the migration files beside this file. */
function newMigrator(dataSource: DataSource) {
  const context: MigrationContext = {
    query: (sql, parameters) => dataSource.query(sql, parameters),
    transaction: (work) =>
      dataSource.transaction((manager) =>
        work((sql, parameters) => manager.query(sql, parameters)),
      ),
  };

  return new Umzug({
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
}

// The migrator logs a migration as its file name, .ts when the tests run the sources and .js in the
// image, so names compare without the extension
const withoutExtension = (name: string) => name.replace(/\.(ts|js)$/, "");

/**
 * Applies the migrations the database has not run yet, through `dataSource`. Two runs on one
 * database wait for each other on an advisory lock.
 */
export async function applyDbMigrations(dataSource: DataSource) {
  const lock = dataSource.createQueryRunner();

  await lock.connect();

  try {
    await lock.query(`SELECT pg_advisory_lock(hashtext('${migrationTable}'))`);
    await newMigrator(dataSource).up();
  } finally {
    await lock.query(`SELECT pg_advisory_unlock(hashtext('${migrationTable}'))`);
    await lock.release();
  }
}

/**
 * Throws unless the database has run exactly the migrations beside this file, and writes nothing.
 * A database short of a migration needs the migrate step first. One that holds a migration this
 * code does not know was migrated by newer code.
 */
export async function checkDbMigrated(dataSource: DataSource) {
  // The same files the migrator's glob takes
  const known = readdirSync(join(__dirname, "migrations"))
    .filter((name) => /\.(js|ts)$/.test(name))
    .map(withoutExtension);
  const [{ hasTable }] = await dataSource.query<{ hasTable: boolean }[]>(
    `SELECT to_regclass('${migrationTable}') IS NOT NULL AS "hasTable"`,
  );
  const executed = hasTable
    ? (await dataSource.query<MigrationLog[]>(`SELECT name FROM ${migrationTable}`)).map(
        ({ name }) => withoutExtension(name),
      )
    : [];
  const missing = known.filter((name) => !executed.includes(name));
  const unknown = executed.filter((name) => !known.includes(name));

  if (missing.length > 0) {
    throw new Error(
      `The database lacks the migrations ${missing.join(", ")}: run the migrate step first`,
    );
  }

  if (unknown.length > 0) {
    throw new Error(
      `The database holds the migrations ${unknown.join(", ")}, which this code does not know: ` +
        "newer code migrated it",
    );
  }
}
