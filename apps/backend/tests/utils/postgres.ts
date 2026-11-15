import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PostgreSqlContainer } from "@testcontainers/postgresql";

import { compose as composeMigrate } from "../../src/entrypoints/migrate/compose.js";
import { DbSettings } from "../../src/infra/db/exports.js";
import { testConfig } from "./testConfig.js";

// The same Postgres major as the server's stack
const image = "postgres:17";

/**
 * Points Testcontainers at the Docker this machine runs. Testcontainers does not read the Docker
 * context, where colima keeps its address; a CI runner sets DOCKER_HOST itself. Ryuk, which removes
 * the container after the run, reaches Docker through the socket inside the colima machine.
 */
function setUpDocker() {
  process.env.DOCKER_HOST ||= execFileSync(
    "docker",
    ["context", "inspect", "--format", "{{.Endpoints.docker.Host}}"],
    { encoding: "utf8" },
  ).trim();
  process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE ||= "/var/run/docker.sock";
}

/** Means a Postgres in Docker that a test connects to. */
export type TestPostgres = {
  /** Names the database, with its password in a file, as the server reads it. */
  settings: DbSettings;
  /** Stops the container and removes the password file. */
  stop(): Promise<void>;
};

/**
 * Starts an empty Postgres in Docker and returns it with the settings the backend connects with.
 * Locally it needs a running colima; in CI, the runner's Docker.
 */
export async function startPostgres(): Promise<TestPostgres> {
  setUpDocker();

  const container = await new PostgreSqlContainer(image).start();
  const passwordDir = mkdtempSync(join(tmpdir(), "guessir-postgres-"));
  const passwordFile = join(passwordDir, "password");

  writeFileSync(passwordFile, container.getPassword());

  return {
    settings: {
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      passwordFile,
      database: container.getDatabase(),
    },
    async stop() {
      await container.stop();
      rmSync(passwordDir, { recursive: true, force: true });
    },
  };
}

/** Starts an empty Postgres in Docker and runs the migrate step on it, as a deploy does. */
export async function startMigratedPostgres(): Promise<TestPostgres> {
  const postgres = await startPostgres();

  await composeMigrate({ config: testConfig(postgres.settings) }).run();

  return postgres;
}
