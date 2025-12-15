import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Use relative paths for Electron compatibility
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - split large dependencies
          'vendor-react': ['react', 'react-dom'],
          'vendor-x6': ['@antv/x6'],
          'vendor-x6-plugins': [
            '@antv/x6-plugin-history',
            '@antv/x6-plugin-selection',
            '@antv/x6-plugin-snapline',
            '@antv/x6-plugin-keyboard',
            '@antv/x6-plugin-export',
            '@antv/x6-plugin-dnd',
            '@antv/x6-plugin-minimap',
            '@antv/x6-plugin-clipboard',
          ],
          'vendor-utils': ['file-saver', 'jszip', 'lucide-react'],
          'vendor-pdf': ['jspdf'],
        },
      },
    },
  },
})
