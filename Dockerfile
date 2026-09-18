# syntax=docker/dockerfile:1

# ---- build ------------------------------------------------------------------
# SITE and SHOW_DRAFTS are BUILD args, not runtime env, and that is deliberate:
# the output is static, so canonical URLs, OpenGraph tags and the sitemap are
# all baked in here. A runtime variable would arrive far too late to change any
# of them — which is exactly how a preview deploy ends up telling Google it is
# the production site.
FROM node:22-alpine AS build
WORKDIR /app

ARG SITE=https://keeptalkinghandbook.com
ARG SHOW_DRAFTS=0
ENV SITE=$SITE
ENV SHOW_DRAFTS=$SHOW_DRAFTS

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The rules layer is the site's correctness surface — a wrong lookup table
# teaches someone the wrong answer — so the tests gate the image, not just CI.
RUN npm test

# `npm run build` runs `astro check` first, so a type error or a content entry
# that violates its schema fails the deploy here rather than rendering wrong.
RUN npm run build

# ---- run --------------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8031

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 8031
CMD ["node", "./dist/server/entry.mjs"]
