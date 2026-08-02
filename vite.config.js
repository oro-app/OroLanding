import { fileURLToPath, URL } from 'node:url'
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
        '/google-play': '/google-play.html',
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
  resolve: {
    alias: {
      '@newsletter-images': fileURLToPath(new URL('./src/assets/newsletters', import.meta.url)),
      // @oro/ui is React Native; react-native-web provides the DOM renderer.
      'react-native': 'react-native-web',
    },
    dedupe: ['react', 'react-dom', 'react-native-web'],
  },
  define: {
    // react-native-web reads the RN __DEV__ global.
    __DEV__: JSON.stringify(false),
  },
  optimizeDeps: {
    include: ['react-native-web', '@oro/ui'],
  },
  ssr: {
    // The SSR/SEO prerender must bundle these (they ship untranspiled ESM and
    // must resolve the react-native alias + browser condition).
    // react-native-web's CJS deps must be bundled as well, or the ESM SSR
    // bundle hits default-import interop errors (createPrefixer et al.).
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
      // The prerender renders DOM markup — use the same web build of @oro/ui
      // (dist/web via the `browser` condition), never the native entry.
      conditions: ['browser', 'module', 'import', 'default'],
      externalConditions: ['browser', 'module', 'import', 'default'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
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
