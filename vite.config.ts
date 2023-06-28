import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({ insertTypesEntry: true }),
  ],
  resolve: {
    alias: {
      '@stevent-team/fir': resolve(__dirname, '/lib/index.tsx')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/index.tsx'),
      name: 'fir',
      fileName: 'fir',
    },
  }
})
