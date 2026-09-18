import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

/**
 * One entry per module. The schema is strict on purpose: a module missing its
 * manual page, or claiming a difficulty that is not one of the three, fails
 * `astro build` rather than rendering wrong in production.
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
    /** One line. It is the card subtitle and the OpenGraph description. */
    summary: z.string().max(200),
    /** Page in the official manual v1. Linked from the module header. */
    manualPage: z.number().int().positive(),
    /** How hard this one is to MEMORIZE — see DIFFICULTY in consts.ts. */
    difficulty: z.enum(['easy', 'medium', 'hard']),
    /** Nav and index order. Follows the manual's own order by default. */
    order: z.number().int(),
    /** Whether this page has a practice drill, for the index badge. */
    hasDrill: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
})

export const collections = { modules }
