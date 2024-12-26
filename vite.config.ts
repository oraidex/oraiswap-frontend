import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import wasm from 'vite-plugin-wasm';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  base: '',
  plugins: [react(), wasm(), viteTsconfigPaths(), svgr(), nodePolyfills()],
  server: {
    open: true,
    port: 3000
  },
  define: {
    global: 'globalThis'
  },
  test: {
    server: {
      deps: {
        inline: ['@cosmjs/tendermint-rpc']
      }
    },
    globals: true,
    setupFiles: './setupTest.ts',
    environment: 'jsdom',
    exclude: []
  },
  resolve: {
    alias: {
      '@visx/shape/lib/util/accessors': path.resolve(__dirname, 'node_modules/@visx/shape/esm/util/accessors'),
      '@visx/shape/lib/util/getBandwidth': path.resolve(__dirname, 'node_modules/@visx/shape/esm/util/getBandwidth')
    }
  },
  build: {
    commonjsOptions: { transformMixedEsModules: true },
    outDir: path.resolve(__dirname, 'build'),
    rollupOptions: {},
    target: 'esnext',
    sourcemap: true // Enable source maps
  },
  optimizeDeps: {
    exclude: ['node_modules/.cache']
  }
});
