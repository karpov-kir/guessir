import { defineProject } from "vitest/config";

export default defineProject({
  // Vitest resolves the game imports to the game sources via the tsconfig paths. The tests then run
  // without a prior build of the game package.
  resolve: { tsconfigPaths: true },
});
