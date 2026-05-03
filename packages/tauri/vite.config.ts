import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  // Prevent Vite from clearing the terminal
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    // Tauri supports ES2021
    target: ['es2021', 'chrome100', 'safari13'],
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    // Bundle both index.html and splash.html as separate entry points so
    // their `import '@wdio/tauri-plugin'` calls actually resolve at build
    // time. Without this, splash.html ships unbundled and its static
    // imports break in the WebView at runtime — the embedded WebDriver
    // server never finishes initializing and the wdio-tauri-service
    // launcher times out waiting on it.
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        splash: resolve(__dirname, 'splash.html'),
      },
    },
  },
  resolve: {
    preserveSymlinks: false,
  },
});
