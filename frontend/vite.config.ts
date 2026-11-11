import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, transformWithEsbuild, type Plugin } from 'vite'

function serviceWorkerPlugin(): Plugin {
  const sourcePath = resolve('public/service-worker.ts')

  return {
    name: 'gymbros-service-worker',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.url !== '/service-worker.js') {
          next()
          return
        }

        const source = readFileSync(sourcePath, 'utf8')
        const transformed = await transformWithEsbuild(source, sourcePath, { loader: 'ts', target: 'es2022' })
        response.setHeader('Content-Type', 'application/javascript')
        response.end(transformed.code)
      })
    },
    async generateBundle() {
      const source = readFileSync(sourcePath, 'utf8')
      const transformed = await transformWithEsbuild(source, sourcePath, { loader: 'ts', target: 'es2022' })
      this.emitFile({ type: 'asset', fileName: 'service-worker.js', source: transformed.code })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [serviceWorkerPlugin(), react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
