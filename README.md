# YUNO / MUSIC & WORKS

A dependency-free bilingual static portfolio for GitHub Pages. Its public-source catalog is rendered from JSON in the browser; no build step is required.

Original works are curated from YUNO's official channels and can be browsed by ensemble or genre, duration, and instrument. `data/works.json` is the single source of truth for both original works and arrangements; edit that file directly when updating the catalog.

Multipart originals use a top-level parent with a non-empty `parts` array. Parent records provide the shared catalog metadata; each part keeps its own legacy `id`/`slug`, bilingual titles, dates, duration, video links, scores, and commentary. The shared detail route is `originals/work/?work=<parent-id>`.

Run `npm test` (Node 18+; no installation required) to validate data shape, real calendar dates, routes, commentary references, query/hash links, CSP and approved external URLs, then run the regression tests. The tests run in one process so they also work where child processes are restricted.

To preview, run `python -m http.server 8765 --bind 127.0.0.1` from the repository root and open `http://127.0.0.1:8765/`. Use HTTP rather than opening HTML files directly, since the browser fetches JSON.

When adding a work, use a unique `id` and `slug`, non-empty Japanese and English titles/instrumentation, actual booleans for `published` and `featured`, and arrays for instruments, tags, scores and other videos. Use `YYYY-MM-DD` dates (or `null` for unknown work publication dates). Keep existing IDs and slugs stable. Multipart parents must retain their parts' IDs/slugs, sum their durations, and use the newest part publication date. Add commentary text in both languages and its source when enabling a commentary link. Work or category counts do not need to be edited in the validator.

Add updates to `data/updates.json` with a real date and non-empty `text_ja` / `text_en`. Updates are displayed by descending date regardless of JSON array order; the home page takes the newest entry. An empty update array is supported. The main original catalog sorts by composition year, then publication date and title. The legacy `originals/list/` route retains its publication-date/title sorting.

Existing `originals/?ensemble=woodwinds` links continue to select only woodwind works; they are not widened to the chamber group. Legacy child slugs redirect to `originals/work/?work=<parent-id>#<child-slug>`. Language switches retain the current query and hash using `lang=ja` / `lang=en`, so storage denial does not prevent language changes. Separate `/en/` pages and contact-input preservation remain later phases of the review plan.

The browser shows loading, empty and retry states for data-backed content. Videos retain an ordinary external link outside the iframe even when the embed cannot play. Initial HTML includes basic navigation and a JavaScript-disabled notice; full static work content is a later phase.

For repeatable local fault checks, run `node tests/serve-browser.mjs` and visit a route under `http://127.0.0.1:8766/__check/404/`, `__check/invalid/`, `__check/network/`, `__check/storage/` or `__check/empty/` (for example `__check/404/originals/?group=solo`). The first JSON request per mode/file fails or returns empty data; retry then serves the real file. Restart the server to reset this state. A browser may transparently retry a dropped network connection; the automated test deterministically covers a rejected fetch. The storage mode makes localStorage access throw in the served script. These checks never edit source JSON. Stop the server with Ctrl+C.

Before publication, run `npm test` and check original/arrangement browsing, multipart links, Japanese/English, video fallback links, and retry behavior in a browser. Fault-injection browser verification for this change was blocked by browser approval; see `docs/website-review-phase1-2026-09-05.md`. The static site's runtime files are the root HTML/favicon, page directories, `assets/` and `data/`. `tests/`, `scripts/`, `docs/`, `.work/` and `outputs/` are not runtime assets; deployment artifact selection/CI is still a later phase. No production deployment or real contact-form submission is part of these local checks.
