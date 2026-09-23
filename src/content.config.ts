import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

/**
 * One entry per module. The schema is strict on purpose: a module missing its
 * manual page fails `astro build` rather than rendering wrong in production.
 *
 * That build-time check is most of the reason the content lives in the repo
 * rather than a database — and it is what lets the nav, the home page index
 * and the module pages all be generated from one source without drifting.
 */
const modules = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/modules' }),
  schema: z.object({
    /** Display name, exactly as the game calls it. */
    title: z.string(),
    /** Page in the official manual v1. Linked from the module header. */
    manualPage: z.number().int().positive(),
    /** Nav and index order. Follows the manual's own order by default. */
    order: z.number().int(),
    /** Whether this page has a Practice tab. The drill itself is wired up in
     *  components/Practice.astro. */
    hasDrill: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
})

export const collections = { modules }
