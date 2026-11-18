import type { TestProject } from "vitest/node";

import type { DbSettings } from "../../src/infra/db/exports.js";
import { InfraTestsSetup } from "./InfraTestsSetup.js";

declare module "vitest" {
  export interface ProvidedContext {
    /** The superuser's settings of the Postgres that the infra tests share. */
    postgres: DbSettings;
  }
}

/**
 * Starts the Postgres that the infra tests share, and returns a teardown that stops it after the
 * run.
 */
export default async function setup(project: TestProject) {
  const infra = new InfraTestsSetup();

  project.provide("postgres", await infra.start());

  return () => infra.stop();
}
