import { defineConfig } from 'vite';
import checkerPlugin from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: 'GUESSIR_',
  plugins: [
    checkerPlugin({
      typescript: {
        buildMode: true,
        tsconfigPath: './tsconfig.build.json',
      },
    }),
  ],
});
