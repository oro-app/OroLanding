import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'

// Backend URL
const backendUrl = process.env.VITE_BACKEND_URL || 'https://oro-kmuj.onrender.com';

// Rewrite /terms, /privacy, /cookies to the standalone HTML files in dev
const legalPagePlugin = {
  name: 'legal-page-rewrites',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const map = {
        '/terms':   '/terms.html',
        '/privacy': '/privacy.html',
        '/cookies': '/cookies.html',
      }
      if (map[req.url]) req.url = map[req.url]
      next()
    })
  },
}

export default defineConfig({
  plugins: [
    mdx(),
    react(),
    legalPagePlugin,
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': backendUrl,
      '/static': backendUrl,
    }
  }
})
