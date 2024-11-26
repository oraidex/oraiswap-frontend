import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import wasm from 'vite-plugin-wasm';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '',
  plugins: [react(), wasm(), viteTsconfigPaths(), svgr(), nodePolyfills({
    globals: {
      Buffer: false,
      global: false,
      process: false
    }
  })],
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
    rollupOptions: {}
  }
});
