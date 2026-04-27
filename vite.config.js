import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  publicDir: 'public',
  plugins: [
    solid(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tiles\.maptiler\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 10000,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          }
        ]
      },
      manifest: {
        name: 'TPT Emergency',
        short_name: 'TPT Emergency',
        description: 'Modular Emergency Services System',
        theme_color: '#dc2626',
        background_color: '#111827',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'terser',
    chunkSizeWarningLimit: 1500,
    bundler: 'rollup',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('maplibre-gl')) return 'maplibre-gl'
          if (id.includes('solid-js')) return 'solid-js'
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8383',
      '/socket.io': {
        target: 'ws://localhost:8383',
        ws: true
      }
    }
  }
})