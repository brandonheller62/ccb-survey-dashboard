import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Dev-only plugin: serve the same /api/responses endpoint the Vercel function
 * exposes in production, so `npm run dev` exercises the real Google Sheets path
 * (or the sample fallback) without needing `vercel dev`.
 */
function sheetsApiDev() {
  return {
    name: 'ccb-sheets-api-dev',
    apply: 'serve',
    config(_, { mode }) {
      // Make GOOGLE_* secrets from .env.local visible to the server middleware.
      Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
    },
    configureServer(server) {
      server.middlewares.use('/api/responses', async (_req, res) => {
        try {
          const { fetchResponses } = await server.ssrLoadModule('/server/sheets.js')
          const data = await fetchResponses()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: e?.message || 'Failed to load survey data.' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), sheetsApiDev()],
})
