import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
<<<<<<< HEAD
  server: {
    port: 5179,
    strictPort: true,
  },
=======
>>>>>>> 537c157641f471374d6fe48b5a726ab2c34e631d
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
