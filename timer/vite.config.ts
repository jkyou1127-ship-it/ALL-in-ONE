import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// cubing.js ships its own web worker + WASM chunks internally, and Vite/esbuild's
// bundler rewrites those workers' dynamic imports in a way that crashes in
// production builds ("document is not defined" inside the worker - a known
// Vite/esbuild worker-bundling limitation). The fix: don't let Vite touch cubing
// at all. Its dist files are vendored as-is under public/vendor/cubing and
// resolved by the browser's native import map (see index.html) instead of being
// bundled - `external` here just tells Rollup to leave the bare `cubing/...`
// import specifiers in our own compiled output untouched, rather than trying to
// resolve and inline them from node_modules.
const CUBING_EXTERNALS = [/^cubing\//, 'random-uint-below', 'three'];

export default defineConfig({
  base: './', // relative asset paths so the build also works loaded via file:// in Electron
  plugins: [react()],
  optimizeDeps: {
    exclude: ['cubing', 'random-uint-below'],
  },
  build: {
    rollupOptions: {
      external: CUBING_EXTERNALS,
    },
  },
})
