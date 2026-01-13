import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // Ensure relative paths for Electron
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        lyric: path.resolve(__dirname, 'lyric.html'),
      },
    },
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: 'electron/preload.ts',
      },
      renderer: {},
    }),
  ],
})
