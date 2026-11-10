import swcPlugin from "unplugin-swc";
import { defineProject } from "vitest/config";

export default defineProject({
  // Vitest resolves the shared imports to their sources via the tsconfig paths. The tests then run
  // without a prior build of the shared package.
  resolve: { tsconfigPaths: true },
  plugins: [swcPlugin.vite()],
});
