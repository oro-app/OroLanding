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
    // scripts/generate-seo.mjs prerenders each route's markup from one template
    // that only carries the entry bundle's links, so a per-route CSS chunk
    // would have no <link> and the route would paint unstyled until its lazy
    // chunk loaded. One stylesheet keeps every prerendered route styled at
    // first paint; the whole site's CSS is small enough that the extra bytes
    // cost less than the reflow did.
    cssCodeSplit: false,
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
