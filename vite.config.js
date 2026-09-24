import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs/promises'
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
        '/app/terms': '/app/terms.html',
        '/app/privacy': '/app/privacy.html',
        '/terms':   '/terms.html',
        '/privacy': '/privacy.html',
        '/cookies': '/cookies.html',
        '/google-play': '/google-play.html',
      }
      const [pathname, query] = req.url.split('?')
      const destination = map[pathname.replace(/\/$/, '')]
      if (destination) req.url = destination + (query ? `?${query}` : '')
      next()
    })
  },
}

// MDX modules contain both article copy and a small exported `meta` object.
// Loading `meta` with an eager glob normally makes Rollup pull every article
// into the shared app chunk. This query exposes only the metadata so article
// bodies remain one lazy chunk per route.
const newsletterMetaPlugin = {
  name: 'newsletter-meta-only',
  // Run after MDX so this final transform replaces the generated article
  // component with a tiny metadata-only module.
  enforce: 'post',
  async transform(_code, id) {
    const [filename, query = ''] = id.split('?')
    if (!filename.endsWith('.mdx') || !query.split('&').includes('newsletter-meta')) return null

    const source = await fs.readFile(filename, 'utf8')
    const match = source.match(/export\s+const\s+meta\s*=\s*(\{[\s\S]*?\n\})\s*;?/)
    if (!match) throw new Error(`Missing newsletter metadata in ${id}`)
    return `export default ${match[1]}`
  },
}

export default defineConfig({
  plugins: [
    newsletterMetaPlugin,
    mdx(),
    react(),
    legalPagePlugin,
  ],
  resolve: {
    alias: {
      '@newsletter-images': fileURLToPath(new URL('./src/assets/newsletters', import.meta.url)),
      // @oro/ui (used only on /get-started: Dropdown + BackButton) is React
      // Native; react-native-web provides the DOM renderer. The route is
      // code-split, so RNW lands only in that chunk.
      'react-native': 'react-native-web',
    },
    dedupe: ['react', 'react-dom', 'react-native-web'],
  },
  define: {
    __DEV__: JSON.stringify(false),
  },
  ssr: {
    noExternal: [
      'react-native-web',
      '@oro/ui',
      /inline-style-prefixer/,
      /css-in-js-utils/,
      /hyphenate-style-name/,
      /^styleq/,
      /^fbjs/,
      /memoize-one/,
      /nullthrows/,
      /postcss-value-parser/,
    ],
    resolve: {
      conditions: ['browser', 'module', 'import', 'default'],
      externalConditions: ['browser', 'module', 'import', 'default'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        legal: fileURLToPath(new URL('./src/legal.css', import.meta.url)),
      },
    },
  },
  server: {
    proxy: {
      '/api': backendUrl,
      '/static': backendUrl,
      // oro-central public onboarding endpoints (BUI-415) — the /get-started
      // signup form posts here; oro-central has no CORS, so dev goes via proxy.
      '/onboarding': backendUrl,
    }
  }
})
