import { execFileSync } from "node:child_process";

import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";

import { DbSettings } from "../../src/infra/db/exports.js";

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

/**
 * Starts an empty Postgres in Docker and returns it with the settings the backend connects with.
 * Locally it needs a running colima; in CI, the runner's Docker.
 */
export async function startPostgres(): Promise<{
  container: StartedPostgreSqlContainer;
  settings: DbSettings;
}> {
  setUpDocker();

  const container = await new PostgreSqlContainer(image).start();

  return {
    container,
    settings: {
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
    },
  };
}
