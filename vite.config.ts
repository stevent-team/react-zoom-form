import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...mode !== 'examples' ? [dts({ insertTypesEntry: true, include: 'lib/**' })] : [],
  ],
  resolve: {
    alias: {
      '@stevent-team/react-zoom-form': resolve(__dirname, 'lib/index.ts')
    }
  },
  build: {
    ...mode !== 'examples' && {
      lib: {
        entry: resolve(__dirname, 'lib/index.ts'),
        name: 'react-zoom-form',
        fileName: 'react-zoom-form',
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime', 'zod'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'react/jsx-runtime',
            zod: 'z',
          }
        }
      },
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './examples/setupTests.ts',
  }
}))
