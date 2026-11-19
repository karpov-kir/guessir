import { defineConfig } from "vitest/config";

import { projectsOf } from "./vitest.projects.ts";

/** Configures the integration test projects, which the `test:integration` script runs. */
export default defineConfig({ test: { projects: projectsOf(["integ"]) } });
