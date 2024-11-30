import { fileURLToPath } from 'url'

import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'
import fixReactVirtualized from 'esbuild-plugin-react-virtualized'

export default defineConfig({
  base: '/',
  server: {
    port: 3001,
    proxy: {
      '/graphql': {
        target: 'https://localhost:8070/graphql',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        fixReactVirtualized,
      ],
    }
  },
  plugins: [
    react(),
    svgr(),
  ],
  resolve: {
    alias: {
      'src': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
