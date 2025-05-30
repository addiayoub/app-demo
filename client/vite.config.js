import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true, // Permet d'exposer sur le réseau
    
  },
  esbuild: {
    jsxInject: `import React from 'react'`,
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: [],
  },
  plugins: [react(),
        tailwindcss(),

  ],
})
