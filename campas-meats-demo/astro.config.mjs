// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  // Demo only: not deployed publicly. Every page also carries <meta name="robots" content="noindex">.
  site: 'https://example.invalid',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
