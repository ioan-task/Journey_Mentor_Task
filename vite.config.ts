/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// In development the Vite dev server acts as the CORS proxy: Duffel blocks
// browser requests, so the app calls the relative /api/duffel/* paths and the
// proxy below forwards them to api.duffel.com, injecting the token server-side.
// The token is intentionally read WITHOUT the VITE_ prefix so Vite can never
// inline it into client code. In production the same paths are served by the
// Vercel function in api/duffel/[...path].ts.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (mode === 'development' && !env.DUFFEL_ACCESS_TOKEN) {
    console.warn(
      '[flight-search] DUFFEL_ACCESS_TOKEN is not set — copy .env.example to .env ' +
        'and add your token, otherwise /api/duffel requests will fail with 401.',
    )
  }
  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api/duffel': {
          target: 'https://api.duffel.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/duffel/, ''),
          headers: {
            Authorization: `Bearer ${env.DUFFEL_ACCESS_TOKEN}`,
            'Duffel-Version': 'v2',
            Accept: 'application/json',
          },
        },
      },
    },
    test: {
      environment: 'node',
      include: ['tests/**/*.spec.ts'],
    },
  }
})
