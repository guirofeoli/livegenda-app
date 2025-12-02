import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { apiServerPlugin } from './vite-api-plugin.js'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), apiServerPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
}) 