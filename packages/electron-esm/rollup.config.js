import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    input: 'src/main.js',
    output: {
      dir: 'dist',
      format: 'es',
      entryFileNames: 'main.js',
    },
    external: ['electron', 'node:path', 'node:fs'],
  },
  {
    input: 'src/preload.js',
    output: {
      dir: 'dist',
      format: 'cjs',
      entryFileNames: 'preload.cjs',
    },
    external: ['electron'],
  },
];
