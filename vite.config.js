import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path is configurable via env so the same build works on:
//   - GitHub Pages (BASE_PATH=/Kajun-chicken-and-seafood/, set in the workflow)
//   - Vercel / custom domain (no env, defaults to '/')
//
// VITE_* env vars are automatically exposed to the client bundle.
// Put VITE_GROQ_API_KEY=gsk_... in .env locally or in Vercel's project env.

export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
})
