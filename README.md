# YUNO / MUSIC & WORKS

A dependency-free bilingual static portfolio for GitHub Pages. Its public-source catalog is rendered from JSON in the browser; no build step is required.

Original works are curated from YUNO's official channels and can be browsed by ensemble or genre, duration, and instrument. `data/works.json` is the single source of truth for both original works and arrangements; edit that file directly when updating the catalog.

Multipart originals use a top-level parent with a non-empty `parts` array. Parent records provide the shared catalog metadata; each part keeps its own legacy `id`/`slug`, bilingual titles, dates, duration, video links, scores, and commentary. The shared detail route is `originals/work/?work=<parent-id>`.

Run `npm test` (Node 18+; no installation required) to validate data shape, dates, routes, commentary references and local links.
