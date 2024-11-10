import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'Web',
    environment: 'jsdom',
  },
});
