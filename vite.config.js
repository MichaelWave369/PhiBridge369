import { defineConfig } from 'vite';

export default defineConfig({
  base: '/PhiBridge369/',
  // Use React's automatic JSX runtime rather than requiring React in every JSX file.
  esbuild: { jsx: 'automatic' },
});
