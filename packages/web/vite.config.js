import fs from 'fs';
import svgInlineLoader from 'svg-inline-loader';
import { defineConfig } from 'vite';

//TODO: remove this once https://github.com/vitejs/vite/pull/2909 gets merged
export const svg = () => {
  return {
    name: 'vite-svg-patch-plugin',
    transform: function (code, id) {
      if (id.endsWith('.svg')) {
        const extractedSvg = fs.readFileSync(id, 'utf8');
        return `export default '${svgInlineLoader.getExtractedSVG(extractedSvg)}'`;
      }
      return code;
    },
  };
};

export default defineConfig({
  envPrefix: 'GUESSIR_',
  plugins: [svg()],
});
