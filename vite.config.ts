import { defineConfig } from "vite";
import react from '@vitejs/plugin-react-swc'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import path from "path";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    TanStackRouterVite(),
    // Bundle analyzer - run with ANALYZE=true bun run build
    ...(process.env.ANALYZE ? [visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap' // 'sunburst' | 'treemap' | 'network'
    })] : []),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      minify: true,
      includeAssets: [
        'favicon.ico',
        'icons/icon-144.svg',
        'icons/icon-192.png',
        'icons/icon-192.svg',
        'icons/icon-512.png',
        'icons/icon-512.svg',
        'icons/icon-maskable-512.png',
        'icons/icon-maskable-512.svg',
        'icons/shortcut-history-96.png',
        'icons/shortcut-history-96.svg',
        'icons/shortcut-lobbies-96.png',
        'icons/shortcut-lobbies-96.svg',
      ],
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
      },
      manifest: {
        id: 'games-of-the-generals',
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
      devOptions: { enabled: false }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize for production performance
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false, // Disable sourcemaps in production for better performance
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('react') && !id.includes('node_modules')) {
            return 'react-vendor';
          }
          // Router and state management
          if (id.includes('@tanstack/react-router') || id.includes('@tanstack/router')) {
            return 'router';
          }
          // Query libraries
          if (id.includes('@tanstack/react-query') || id.includes('@convex-dev/react-query')) {
            return 'query';
          }
          // Convex backend
          if (id.includes('convex') && !id.includes('@convex-dev/react-query')) {
            return 'convex';
          }
          // UI components (Radix UI)
          if (id.includes('@radix-ui')) {
            return 'ui-components';
          }
          // Animation and graphics
          if (id.includes('framer-motion')) {
            return 'animations';
          }
          // FormKit auto-animate
          if (id.includes('@formkit/auto-animate')) {
            return 'formkit-animate';
          }
          // Heavy libraries that should be dynamically imported
          if (id.includes('jimp') || id.includes('node_modules/jimp')) {
            return 'image-processing';
          }
          // Utilities and smaller deps
          if (id.includes('clsx') || id.includes('class-variance-authority') ||
              id.includes('tailwind-merge') || id.includes('cmdk') ||
              id.includes('sonner') || id.includes('use-debounce')) {
            return 'utils';
          }
          // Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // Email and other features
          if (id.includes('@react-email') || id.includes('resend')) {
            return 'email';
          }
          // Default chunk for other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        // Optimize entry file names
        entryFileNames: 'assets/[name]-[hash].js',
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Optimize CSS
    cssCodeSplit: true,
    // Target modern browsers for better optimization
    target: 'esnext'
  },
}));
