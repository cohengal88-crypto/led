import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const root = import.meta.dirname;
const page = name => resolve(root, name);

// <!-- @include nav.html --> → contents of src/partials/nav.html (shared header/footer for every page)
function htmlIncludes() {
  const partials = resolve(root, 'src/partials');
  return {
    name: 'html-includes',
    transformIndexHtml: {
      order: 'pre',
      handler: html => html.replace(/<!--\s*@include\s+([\w.-]+)\s*-->/g, (_, f) => readFileSync(resolve(partials, f), 'utf8')),
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(partials)) server.ws.send({ type: 'full-reload' });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [htmlIncludes()],
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
        product: page('product.html'),
        quote: page('quote.html'),
      },
    },
  },
});
