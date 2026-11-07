import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/pdfjs-dist/')) return 'pdfjs'
          if (id.includes('/node_modules/pdf-lib/') || id.includes('/node_modules/@pdf-lib/'))
            return 'pdf-lib'
          if (id.includes('/node_modules/jspdf/')) return 'jspdf'
        },
      },
    },
  },
})
