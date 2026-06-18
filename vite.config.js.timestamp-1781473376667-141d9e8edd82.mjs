// vite.config.js
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///sessions/serene-dazzling-allen/mnt/oro-workspace/oro-landing/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/serene-dazzling-allen/mnt/oro-workspace/oro-landing/node_modules/@vitejs/plugin-react/dist/index.js";
import mdx from "file:///sessions/serene-dazzling-allen/mnt/oro-workspace/oro-landing/node_modules/@mdx-js/rollup/index.js";
var __vite_injected_original_import_meta_url = "file:///sessions/serene-dazzling-allen/mnt/oro-workspace/oro-landing/vite.config.js";
var backendUrl = process.env.VITE_BACKEND_URL || "https://oro-kmuj.onrender.com";
var legalPagePlugin = {
  name: "legal-page-rewrites",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const map = {
        "/terms": "/terms.html",
        "/privacy": "/privacy.html",
        "/cookies": "/cookies.html",
        "/google-play": "/google-play.html"
      };
      if (map[req.url]) req.url = map[req.url];
      next();
    });
  }
};
var vite_config_default = defineConfig({
  plugins: [
    mdx(),
    react(),
    legalPagePlugin
  ],
  resolve: {
    alias: {
      "@newsletter-images": fileURLToPath(new URL("./src/assets/newsletters", __vite_injected_original_import_meta_url))
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    proxy: {
      "/api": backendUrl,
      "/static": backendUrl
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvc2VyZW5lLWRhenpsaW5nLWFsbGVuL21udC9vcm8td29ya3NwYWNlL29yby1sYW5kaW5nXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvc2VyZW5lLWRhenpsaW5nLWFsbGVuL21udC9vcm8td29ya3NwYWNlL29yby1sYW5kaW5nL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9zZXJlbmUtZGF6emxpbmctYWxsZW4vbW50L29yby13b3Jrc3BhY2Uvb3JvLWxhbmRpbmcvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgbWR4IGZyb20gJ0BtZHgtanMvcm9sbHVwJ1xuXG4vLyBCYWNrZW5kIFVSTFxuY29uc3QgYmFja2VuZFVybCA9IHByb2Nlc3MuZW52LlZJVEVfQkFDS0VORF9VUkwgfHwgJ2h0dHBzOi8vb3JvLWttdWoub25yZW5kZXIuY29tJztcblxuLy8gUmV3cml0ZSAvdGVybXMsIC9wcml2YWN5LCAvY29va2llcyB0byB0aGUgc3RhbmRhbG9uZSBIVE1MIGZpbGVzIGluIGRldlxuY29uc3QgbGVnYWxQYWdlUGx1Z2luID0ge1xuICBuYW1lOiAnbGVnYWwtcGFnZS1yZXdyaXRlcycsXG4gIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKChyZXEsIF9yZXMsIG5leHQpID0+IHtcbiAgICAgIGNvbnN0IG1hcCA9IHtcbiAgICAgICAgJy90ZXJtcyc6ICAgJy90ZXJtcy5odG1sJyxcbiAgICAgICAgJy9wcml2YWN5JzogJy9wcml2YWN5Lmh0bWwnLFxuICAgICAgICAnL2Nvb2tpZXMnOiAnL2Nvb2tpZXMuaHRtbCcsXG4gICAgICAgICcvZ29vZ2xlLXBsYXknOiAnL2dvb2dsZS1wbGF5Lmh0bWwnLFxuICAgICAgfVxuICAgICAgaWYgKG1hcFtyZXEudXJsXSkgcmVxLnVybCA9IG1hcFtyZXEudXJsXVxuICAgICAgbmV4dCgpXG4gICAgfSlcbiAgfSxcbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIG1keCgpLFxuICAgIHJlYWN0KCksXG4gICAgbGVnYWxQYWdlUGx1Z2luLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAbmV3c2xldHRlci1pbWFnZXMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL2Fzc2V0cy9uZXdzbGV0dGVycycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IGJhY2tlbmRVcmwsXG4gICAgICAnL3N0YXRpYyc6IGJhY2tlbmRVcmwsXG4gICAgfVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5VyxTQUFTLGVBQWUsV0FBVztBQUM1WSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFDbEIsT0FBTyxTQUFTO0FBSGtOLElBQU0sMkNBQTJDO0FBTW5SLElBQU0sYUFBYSxRQUFRLElBQUksb0JBQW9CO0FBR25ELElBQU0sa0JBQWtCO0FBQUEsRUFDdEIsTUFBTTtBQUFBLEVBQ04sZ0JBQWdCLFFBQVE7QUFDdEIsV0FBTyxZQUFZLElBQUksQ0FBQyxLQUFLLE1BQU0sU0FBUztBQUMxQyxZQUFNLE1BQU07QUFBQSxRQUNWLFVBQVk7QUFBQSxRQUNaLFlBQVk7QUFBQSxRQUNaLFlBQVk7QUFBQSxRQUNaLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQ0EsVUFBSSxJQUFJLElBQUksR0FBRyxFQUFHLEtBQUksTUFBTSxJQUFJLElBQUksR0FBRztBQUN2QyxXQUFLO0FBQUEsSUFDUCxDQUFDO0FBQUEsRUFDSDtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ047QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxzQkFBc0IsY0FBYyxJQUFJLElBQUksNEJBQTRCLHdDQUFlLENBQUM7QUFBQSxJQUMxRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxFQUNmO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
