import swc from 'unplugin-swc';
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'Backend',
    environment: 'jsdom',
  },
  plugins: [swc.vite()],
});
