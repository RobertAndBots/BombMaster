# Working on this repo

The site at [keeptalkinghandbook.com](https://keeptalkinghandbook.com) — a study
guide for memorizing the *Keep Talking and Nobody Explodes* bomb defusal manual.

## Branches

- `master` → **production**, https://keeptalkinghandbook.com
- `dev` → **preview**, https://keeptalkinghandbook.local.rcpooley.dev (private
  plane, renders drafts)

Pushing to either branch deploys it, via Concord. Do work on `dev`.

## Before you push

```sh
npm test && npm run build
```

`npm run build` runs `astro check` first, so content-schema violations and type
errors both fail there. Both commands also run inside the Docker build, so a
broken table cannot reach a deploy — that is on purpose, see below.

## The one rule that matters

**A wrong lookup table teaches someone the wrong answer.** That is the failure
mode this codebase is organised against, and it is not hypothetical: the
previous version of this site taught an incorrect Simon Says mapping for years.

So:

- **Rules live in `src/lib/rules/` as pure data and pure functions.** No React,
  no DOM, no `Math.random()` — generators take an `Rng` so they are
  reproducible under test. If a test there ever needs jsdom, something has
  leaked out of a component and into the rules.
- **Every rule change needs a test against the manual**, not against the
  previous code. The manual PDF is the source of truth:
  ```sh
  curl -sSL -o /tmp/manual.pdf \
    http://www.bombmanual.com/print/KeepTalkingAndNobodyExplodes-BombDefusalManual-v1.pdf
  pdftotext -layout -f 9 -l 10 /tmp/manual.pdf -    # Who's on First, say
  ```
- **Derive, don't re-transcribe.** Who's on First stores the full 14-word lists
  and *derives* the truncated study lists; Complicated Wires derives its
  grouped-by-instruction lists from the chart. Anywhere the same fact is typed
  twice is somewhere the two can disagree.
- **Study pages render from the same tables the drills solve with**, so the
  prose and the practice cannot drift apart. They did on the old site.

## Conventions

- **Page chrome and static tables are `.astro`; anything interactive is
  `.tsx`.** An `.astro` component ships zero JavaScript, which is why a module
  page with no drill on it loads no framework at all. Check this stays true:
  `grep -o '_astro/[^"]*\.js' dist/client/modules/wire-sequences/index.html`
  should print nothing.
- **Drills are React islands with `client:visible`.** They are below the fold
  and nobody should pay for one while reading.
- **Colours come from CSS variables in `src/styles/global.css`**, never
  hard-coded hex in a component. Dark and light are two sets of values for the
  same variables, and dark is the default.
- **Content is the product.** Prefer improving an `.mdx` file over adding a
  component. The whole reason for this stack is that writing should be cheap.
- **Interactive elements are real `<button>`s.** The old site used clickable
  `<div>`s throughout, which could not be reached from a keyboard — on a site
  whose drills are keyboard-driven.

## Layout

```
src/
  content/modules/*.mdx   the prose — one file per module, with drills embedded
  content.config.ts       the frontmatter schema (strict; violations fail build)
  lib/rules/<module>.ts   pure rules: tables + solve() + generate()
  lib/rules/*.test.ts     vitest, checked against the manual
  components/drills/      React islands, thin UI over lib/rules
  components/study/       static .astro tables, rendered from lib/rules
  components/ui/          shared drill chrome (shell, option bar, useDrill)
```

## Deferred work

Progress tracking, spaced repetition, a timed bomb simulator, the four missing
drills and the missing modules (Passwords, the needy modules, a bomb-basics
page) are all tracked in Backlog, not here:

```sh
quiver backlog ls --project keep-talking-handbook
```
