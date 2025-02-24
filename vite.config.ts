import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

// Custom resolver plugin
const customResolver = () => ({
  name: 'custom-resolver',
  resolveId(source, importer) {
    if (importer && source.startsWith('./') && !source.endsWith('.tsx')) {
      const absolutePath = path.resolve(path.dirname(importer), source);
      const tsxPath = absolutePath + '.tsx';
      try {
        if (require('fs').existsSync(tsxPath)) {
          return tsxPath;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    customResolver(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
