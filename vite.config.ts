import { defineConfig } from "vite";
import react from '@vitejs/plugin-react-swc'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    TanStackRouterVite(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      minify: true,
      includeAssets: [
        'favicon.ico',
      ],
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
      },
      manifest: {
        name: 'Games of the Generals',
        short_name: 'GoG',
        description: 'Battle of wits. Play Games of the Generals online.',
        theme_color: '#0f172a',
        background_color: '#0b1020',
        display: 'standalone',
        lang: 'en',
        categories: ['games', 'board', 'strategy'],
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          { src: '/screenshots/wide-1200x630.png', sizes: '1200x630', type: 'image/png', form_factor: 'wide' },
          { src: '/screenshots/mobile-1080x1920.png', sizes: '1080x1920', type: 'image/png' }
        ],
        shortcuts: [
          { name: 'Lobbies', url: '/?from=shortcut', description: 'Open lobbies', icons: [{ src: '/icons/shortcut-lobbies-96.png', sizes: '96x96', type: 'image/png' }] },
          { name: 'Match History', url: '/match-history', description: 'Recent games', icons: [{ src: '/icons/shortcut-history-96.png', sizes: '96x96', type: 'image/png' }] }
        ]
      },
      workbox: undefined,
      devOptions: { enabled: true }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
