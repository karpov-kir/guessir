import { defineConfig } from "vitest/config";

import { projectsOf } from "./vitest.projects.ts";

/** Configures the unit test projects, which the `test:unit` script runs. */
export default defineConfig({ test: { projects: projectsOf(["unit"]) } });
