// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import node from '@astrojs/node'
import tailwindcss from '@tailwindcss/vite'

// SITE is the canonical origin this build is for — it ends up in
// <link rel=canonical>, the OpenGraph tags and the sitemap. The preview deploy
// at keeptalkinghandbook.local.rcpooley.dev must NOT advertise itself as the
// real site, or a shared preview link would point at production.
const site = process.env.SITE ?? 'https://keeptalkinghandbook.com'

export default defineConfig({
  site,

  // Static. Every page here is a study page that is the same for everyone, and
  // there is no server state anywhere in this site by design. The node adapter
  // is present only so a future on-demand route could opt out with
  // `export const prerender = false` without re-plumbing the deployment.
  output: 'static',
  adapter: node({ mode: 'standalone' }),

  integrations: [mdx(), react(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
})
