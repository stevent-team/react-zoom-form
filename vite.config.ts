import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({ insertTypesEntry: true, include: 'lib/**' }),
  ],
  resolve: {
    alias: {
      '@stevent-team/react-zoom-form': resolve(__dirname, 'lib/index.ts')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
      name: 'react-zoom-form',
      fileName: 'react-zoom-form',
    },
    rollupOptions: {
      external: ['react', 'zod'],
      output: {
        globals: {
          react: 'React',
          zod: 'zod',
        }
      }
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
  }
})
