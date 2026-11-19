import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";

import type { DbSettings } from "../../src/infra/db/exports.js";

// The same Postgres major as the server's stack
const image = "postgres:18";

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

/**
 * Runs the one Postgres in Docker that every infra test of a run shares. A test file makes a
 * database of its own on it, for each case or for the whole file. Locally it needs a running colima;
 * in CI, the runner's Docker.
 */
export class InfraTestsSetup {
  private container: StartedPostgreSqlContainer | undefined;
  private passwordDir: string | undefined;

  /** Starts Postgres and returns the settings of its superuser, with the password in a file. */
  async start(): Promise<DbSettings> {
    setUpDocker();
    this.container = await new PostgreSqlContainer(image).start();
    this.passwordDir = mkdtempSync(join(tmpdir(), "guessir-postgres-"));

    const passwordFile = join(this.passwordDir, "password");

    writeFileSync(passwordFile, this.container.getPassword());

    return {
      host: this.container.getHost(),
      port: this.container.getPort(),
      username: this.container.getUsername(),
      passwordFile,
      database: this.container.getDatabase(),
    };
  }

  /** Stops Postgres and removes the password file. */
  async stop(): Promise<void> {
    await this.container?.stop();

    if (this.passwordDir) {
      rmSync(this.passwordDir, { recursive: true, force: true });
    }
  }
}
