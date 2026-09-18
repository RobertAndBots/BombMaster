import { defineConfig } from 'vitest/config'

// The rules layer is plain TypeScript with no DOM and no React, which is the
// whole point of extracting it — these tests run in milliseconds with no
// environment to set up. If a test here ever needs jsdom, something has leaked
// out of a component and into `lib/rules/`.
export default defineConfig({
  test: {
    globals: true,
    include: ['src/lib/**/*.test.ts'],
  },
})
