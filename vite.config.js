import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const page = name => resolve(import.meta.dirname, name);

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    open: '/',            // opens the site in the default browser when the dev server starts
    watch: {
      // project lives in OneDrive: polling makes sure every saved file is picked up for live reload
      usePolling: true,
      interval: 300,
    },
  },
  build: {
    rollupOptions: {
      input: {
        home: page('index.html'),
        catalog: page('catalog.html'),
        quote: page('quote.html'),
      },
    },
  },
});
