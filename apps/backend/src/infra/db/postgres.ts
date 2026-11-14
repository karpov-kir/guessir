import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Logger } from "@nestjs/common";
import { DataSource, DataSourceOptions } from "typeorm";
import { MigrationFn as UmzugMigrationFn, Umzug } from "umzug";
import { z } from "zod";

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

/**
 * Tells older code whether it still runs on the database after a migration. An expand migration
 * only adds a table, a column or an index, or changes rows the older code reads the same way, so
 * the older code does not notice it. A contract migration drops, renames or changes the type of
 * something the older code reads.
 */
export type MigrationKind = "expand" | "contract";

/** Means a migration file: the kind it declares and the change it makes. */
const migrationModuleSchema = z.object({
  kind: z.enum(["expand", "contract"]),
  up: z.custom<MigrationFn>((up) => typeof up === "function", { error: "must be a function" }),
});

interface MigrationLog {
  name: string;
  /** The migration's kind, or null in a row that code before the kinds wrote. */
  kind: MigrationKind | null;
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

const migrationsDir = join(__dirname, "migrations");

// The migrator logs a migration as its file name, .ts when the tests run the sources and .js in the
// image, so names compare without the extension
const withoutExtension = (name: string) => name.replace(/\.(ts|js)$/, "");

/** Returns the names of the migration files beside this file, the same files the migrator's glob takes. */
const migrationFileNames = () =>
  readdirSync(migrationsDir).filter((name) => /\.(js|ts)$/.test(name));

/** Loads the migration file at `path`, and throws when it declares no kind or no `up`. */
export async function loadMigration(path: string) {
  const parsed = migrationModuleSchema.safeParse(await import(pathToFileURL(path).href));

  if (!parsed.success) {
    throw new Error(`The migration ${path} is invalid:\n${z.prettifyError(parsed.error)}`);
  }

  return parsed.data;
}

/** Loads every migration file beside this file, and throws on the first that is invalid. */
export async function loadMigrations() {
  return Promise.all(
    migrationFileNames().map(async (name) => ({
      name: withoutExtension(name),
      ...(await loadMigration(join(migrationsDir, name))),
    })),
  );
}

/** Returns the migrator of the database behind `dataSource`, over the migration files beside this file. */
function newMigrator(dataSource: DataSource) {
  // Each migration declares its kind in its file. The migrator writes it beside the migration's
  // name, so older code can read it from the database.
  const kinds = new Map<string, MigrationKind>();
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
      resolve: ({ name, path }) => ({
        name,
        async up(params) {
          const migration = await loadMigration(path ?? join(migrationsDir, name));

          kinds.set(name, migration.kind);
          await migration.up(params);
        },
      }),
    },
    context,
    storage: {
      async executed({ context: client }) {
        await client.query(`create table if not exists ${migrationTable}(name text)`);
        // Code before the kinds made the table without the column
        await client.query(`alter table ${migrationTable} add column if not exists kind text`);
        const results = await client.query<MigrationLog[]>(`select name from ${migrationTable}`);

        return results.map((result) => result.name);
      },

      async logMigration({ name, context: client }) {
        await client.query(`insert into ${migrationTable}(name, kind) values ($1, $2)`, [
          name,
          kinds.get(name),
        ]);
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

/**
 * Returns the migrations beside this file that the database lacks, and the ones it holds that this
 * code does not know, split by the kind the database records. A row without a kind counts as a
 * contract, the kind older code cannot run past.
 */
async function compareMigrations(dataSource: DataSource) {
  const known = migrationFileNames().map(withoutExtension);
  const [{ hasTable, hasKind }] = await dataSource.query<{ hasTable: boolean; hasKind: boolean }[]>(
    `SELECT to_regclass('${migrationTable}') IS NOT NULL AS "hasTable",
       EXISTS (SELECT FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = '${migrationTable}'
           AND column_name = 'kind') AS "hasKind"`,
  );
  // Code before the kinds made the table without the column
  const executed = hasTable
    ? (
        await dataSource.query<MigrationLog[]>(
          `SELECT name, ${hasKind ? "kind" : "NULL AS kind"} FROM ${migrationTable}`,
        )
      ).map(({ name, kind }) => ({ name: withoutExtension(name), kind }))
    : [];
  const unknown = executed.filter(({ name }) => !known.includes(name));

  return {
    missing: known.filter((name) => !executed.some((row) => row.name === name)),
    unknownExpand: unknown.filter(({ kind }) => kind === "expand").map(({ name }) => name),
    unknownContract: unknown.filter(({ kind }) => kind !== "expand").map(({ name }) => name),
  };
}

const newerContractError = (names: string[]) =>
  new Error(
    `The database holds the contract migrations ${names.join(", ")}, which this code does not ` +
      "know: newer code migrated it in a way this code cannot run on",
  );

const warnOfNewerExpand = (names: string[]) => {
  if (names.length > 0) {
    logger.warn(
      `The database holds the expand migrations ${names.join(", ")}, which this code does not ` +
        "know: newer code migrated it, and this code runs on, as an expand leaves it working",
    );
  }
};

/**
 * Applies the migrations the database has not run yet, through `dataSource`. Two runs on one
 * database wait for each other on an advisory lock. Throws, before it writes, on a database that
 * holds a contract migration this code does not know, so a deploy of older code stops before the
 * server rolls. An expand migration it does not know only takes a warning.
 */
export async function applyDbMigrations(dataSource: DataSource) {
  const lock = dataSource.createQueryRunner();
  let isLocked = false;

  await lock.connect();

  try {
    await lock.query(`SELECT pg_advisory_lock(hashtext('${migrationTable}'))`);
    isLocked = true;

    const { unknownExpand, unknownContract } = await compareMigrations(dataSource);

    if (unknownContract.length > 0) {
      throw newerContractError(unknownContract);
    }

    warnOfNewerExpand(unknownExpand);
    await newMigrator(dataSource).up();
  } finally {
    try {
      if (isLocked) {
        await lock.query(`SELECT pg_advisory_unlock(hashtext('${migrationTable}'))`);
      }
    } finally {
      await lock.release();
    }
  }
}

/**
 * Throws unless the database has run every migration beside this file, and writes nothing. A
 * database short of a migration needs the migrate step first. One that holds a contract migration
 * this code does not know was changed in a way this code cannot run on. An expand migration it does
 * not know only takes a warning.
 */
export async function checkDbMigrated(dataSource: DataSource) {
  const { missing, unknownExpand, unknownContract } = await compareMigrations(dataSource);

  if (missing.length > 0) {
    throw new Error(
      `The database lacks the migrations ${missing.join(", ")}: run the migrate step first`,
    );
  }

  if (unknownContract.length > 0) {
    throw newerContractError(unknownContract);
  }

  warnOfNewerExpand(unknownExpand);
}
