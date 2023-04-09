import { dirname } from 'path';
import { getConnection } from 'typeorm';
import { Umzug } from 'umzug';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MigrationContext {
  query: <T = unknown>(sql: string, parameters?: unknown[]) => Promise<T>;
}

interface MigrationLog {
  name: string;
}

const migrationTable = 'migrations';

const getContext = (): MigrationContext => {
  return {
    query: (sql: string, parameters?: unknown[]) => getConnection().manager.query(sql, parameters),
  };
};

const migrator = new Umzug({
  migrations: {
    glob: ['migrations/*.ts', { cwd: __dirname }],
  },
  context: getContext(),
  storage: {
    async executed({ context: client }) {
      await client.query(`create table if not exists ${migrationTable}(name text)`);
      const resuls = await client.query<MigrationLog[]>(`select name from ${migrationTable}`);

      return resuls.map((result) => result.name);
    },

    async logMigration({ name, context: client }) {
      await client.query(`insert into ${migrationTable}(name) values ($1)`, [name]);
    },

    async unlogMigration({ name, context: client }) {
      await client.query(`delete from ${migrationTable} where name = $1`, [name]);
    },
  },
  logger: console,
});

export type Migration = typeof migrator._types.migration;

export async function applyDbMigrations() {
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
