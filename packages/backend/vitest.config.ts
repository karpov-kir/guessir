import swcPlugin from 'unplugin-swc';
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'Backend',
    environment: 'jsdom',
  },
  plugins: [swcPlugin.vite()],
});
