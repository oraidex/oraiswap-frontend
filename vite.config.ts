import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import wasm from 'vite-plugin-wasm';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  base: '',
  plugins: [
    react(),
    wasm(),
    viteTsconfigPaths(),
    svgr(),
    nodePolyfills(),
    ...(import.meta.env.VITE_APP_SENTRY_ENVIRONMENT === 'production'
      ? [
          sentryVitePlugin({
            org: 'oraichain',
            project: 'oraidex'
          })
        ]
      : [])
  ],
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
    sourcemap: true,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    target: 'esnext'
  },
  optimizeDeps: {
    exclude: ['node_modules/.cache']
  }
});
