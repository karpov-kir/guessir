import { defineConfig } from "vitest/config";

import { projectsOf } from "./vitest.projects.ts";

/** Configures the infra test projects, which the `test:infra` script runs. */
export default defineConfig({ test: { projects: projectsOf(["infra"]) } });
