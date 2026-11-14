import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { MigrationFn as UmzugMigrationFn } from "umzug";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type Query = <T = unknown>(sql: string, parameters?: unknown[]) => Promise<T>;

/** Holds what a migration reaches the database through. */
export interface MigrationContext {
  query: Query;
  /** Runs `work` in one transaction, which rolls back if `work` throws. */
  transaction: (work: (query: Query) => Promise<void>) => Promise<void>;
}

export type MigrationFn = UmzugMigrationFn<MigrationContext>;

/**
 * Tells whether the code before a migration still runs on the database after it. An expand leaves
 * it running: it adds a table, a column or an index, or moves or cleans data that the earlier code
 * reads as before. A contract does not: it drops, renames or changes the type of anything the
 * earlier code reads or writes.
 */
export enum MigrationKind {
  Expand = "expand",
  Contract = "contract",
}

/** Means a migration file: the kind it declares and the change it makes. */
const migrationModuleSchema = z.object({
  kind: z.enum(MigrationKind),
  up: z.custom<MigrationFn>((up) => typeof up === "function", { error: "must be a function" }),
});

/** The folder of the migration files, one ordered sequence for the database. */
export const migrationsDir = join(__dirname, "migrations");

// The file extension: .ts where the tests run the sources and .js in the image
const extension = /\.(ts|js)$/;

/**
 * Returns a migration's name without its file's extension. The migrator records the file name, so
 * names compare without the extension.
 */
export const withoutExtension = (fileName: string) => fileName.replace(extension, "");

/** Returns the file names of the migrations, in the order they run. */
export const migrationFileNames = () =>
  readdirSync(migrationsDir)
    .filter((fileName) => extension.test(fileName))
    .toSorted();

/** Loads the migration file at `path`, and throws when it declares no valid kind or no `up`. */
export async function loadMigration(path: string) {
  const parsed = migrationModuleSchema.safeParse(await import(pathToFileURL(path).href));

  if (!parsed.success) {
    throw new Error(`The migration ${path} is invalid:\n${z.prettifyError(parsed.error)}`);
  }

  return parsed.data;
}
