# Keep Talking Handbook

Live at **[keeptalkinghandbook.com](https://keeptalkinghandbook.com)**.

A study guide for memorizing the bomb defusal manual from
[*Keep Talking and Nobody Explodes*](https://keeptalkinggame.com/): one page per
module with the mnemonics and chunking that worked for me, plus interactive
drills to practice against.

## Stack

Astro 5 (static output) · MDX content collections · React 19 islands ·
Tailwind v4 · TypeScript · Vitest.

Pages with no drill on them ship **zero** framework JavaScript; a drill loads
React only when it scrolls into view.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm test         # the rules layer
npm run build    # astro check + build
```

See [AGENTS.md](./AGENTS.md) for conventions, the branch/deploy model, and how
to verify a rule change against the official manual.
