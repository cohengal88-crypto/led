import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const page = name => resolve(import.meta.dirname, name);

export default defineConfig({
  base: './',
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
