# Theme Cleanup — Progress Log

Last updated: 2026-05-13

## The Plan

The user asked for a "full cleanup pass" of this Shopify starter theme. Decomposed into six independently-shippable sub-projects:

| #   | Sub-project                                                       | Status               | Reference                                                                                            |
| --- | ----------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | **Build & tooling** (Prettier + Theme Check + npm scripts)        | ✅ Merged 2026-05-10 | PR [#1](https://github.com/Codersy-Development/shopify-theme-starter/pull/1), merge commit `54ac8cc` |
| 2   | **JavaScript / web components** (11 files in `/assets/`)          | ✅ Merged 2026-05-11 | PR [#2](https://github.com/Codersy-Development/shopify-theme-starter/pull/2), merge commit `37ed0ce` |
| 3   | **Liquid sections** (6 of 23 files touched)                       | ✅ Merged 2026-05-13 | PR [#5](https://github.com/Codersy-Development/shopify-theme-starter/pull/5), merge commit `772536a` |
| 4   | Liquid snippets & layout                                          | ⬜ Not started       | —                                                                                                    |
| 5   | Templates & config (`templates/*.json`, `config/settings_*.json`) | ⬜ Not started       | —                                                                                                    |
| 6   | CSS / Tailwind 4 (`src/input.css`)                                | ⬜ Not started       | —                                                                                                    |

## Feature work landed alongside cleanup

Both shipped between sub-projects 2 and 3, off `main`, as separate PRs:

- **Free-shipping progress tracker in the cart drawer** — PR [#3](https://github.com/Codersy-Development/shopify-theme-starter/pull/3), merge commit `86b99a2`. Adds `snippets/free-shipping-tracker.liquid` and a `free_shipping_threshold` setting; the cart drawer's existing Section Rendering API refresh handles live updates with no new JavaScript.
- **Sticky add-to-cart bar on mobile product pages** — PR [#4](https://github.com/Codersy-Development/shopify-theme-starter/pull/4), merge commit `4f5e004`. Adds `<sticky-atc>` custom element, an `addToCart()` helper extracted from `product-form` into `assets/cart-add.js`, and reuses the inline form's selected variant.

## State to know before resuming

- **`npm run lint` now exits 1 only due to snippets/templates.** Theme Check baseline: **39 offenses across 4 files** (down from 54 across 10). All remaining offenses are in `snippets/canonicals.liquid`, `snippets/json-ld.liquid`, `snippets/predictive-search.liquid`, and `templates/gift_card.liquid` — explicitly deferred to sub-projects 4 and 5. `npm run format:check` exits 0.
- **`git blame` skips the bulk-format commit (`201e4ef`).** New contributors should run `git config blame.ignoreRevsFile .git-blame-ignore-revs` once locally so blame attributes lines to their original authors.
- **Prettier ignores Shopify-managed JSON:** `locales/`, `templates/*.json`, `config/*.json`. Don't widen `.prettierignore` further without a reason — those exclusions are deliberate.
- **The starter theme is cloned for multiple downstream projects.** Anything added here propagates. Sub-projects 1 and 2 deliberately stayed minimal (no ESLint, no Husky, no JS bundler, no test runner) for that reason.

## What sub-project 2 produced (PR #2)

- Every `/assets/*.js` custom element extends `Component` or the new `Drawer` subclass.
- `assets/drawer.js` (new) — single source of truth for drawer behavior. Both the class form and `Drawer.controllerFor(panel, overlay, host)` delegate to one internal controller.
- `<collection-filters>` split into three focused custom elements: `<collection-filters>` (orchestrator), `<price-range-slider>`, `<grid-switcher>`. `collection-filters.js` went from ~180 lines to ~80.
- `<product-card>` is now a real custom element; the global document-level click listener is gone.
- **Fix:** `predictive-search` now `#escape()`s every interpolated value (was only escaping titles before).
- **Fix:** `<price-range-slider>` dispatches a native `change` event on drag-end, so desktop form auto-submit finally fires.
- **Fix:** `<price-range-slider>` measures drag against the inner slider element, not the outer wrapper (~4px cursor drift gone).
- `product-form` button-restore consolidated into a single `#restoreButton(originalText)` helper.

## What sub-project 3 produced (PR #5)

- Replaced 10 hardcoded URLs (`/`, `/cart`, `/search`, `/collections/all`) across 6 section files with `routes.*` equivalents. Latent bug fix for merchants on Shopify Markets / language-prefixed storefronts.
- **Real bug fix:** `sections/main-search.liquid` paginates correctly now. Previously, the Previous/Next nav referenced `paginate.*` outside a `{% paginate %}` block and was dead code — Theme Check flagged it 5 times and merchants with > 1 page of search results never saw the navigation. Now wrapped in `{% paginate search.results by section.settings.results_per_page %}`.
- New `results_per_page` range setting on the search section (8–48, step 4, default 24), mirroring `main-collection.liquid`'s `products_per_page` schema.

## Captured findings remaining for sub-projects 4 and 5

`docs/superpowers/notes/2026-05-09-theme-check-findings.md` contains the raw Theme Check output. After sub-project 3, the remaining issues are:

- **`UnknownFilter` (high volume)** — `push` and `qr_code` filters in `snippets/json-ld.liquid` and `templates/gift_card.liquid`. Likely false positives for the modern `push` filter; revisit when sub-project 4 starts and consider downgrading severity in `.theme-check.yml`.
- **`HardcodedRoutes`** — only one left, in `snippets/predictive-search.liquid` (`/search`). Sub-project 4.
- **`RemoteAsset`** — in `snippets/canonicals.liquid` and `templates/gift_card.liquid`. Performance — sub-projects 4 and 5.
- **`ImgWidthAndHeight` and `TranslationKeyExists`** — in `templates/gift_card.liquid` (sub-project 5).

## Pending follow-ups within scope

These were flagged during sub-project 3 reviews; address them when the relevant sub-project lands:

- **Pagination snippet extraction.** Both `sections/main-collection.liquid` and `sections/main-search.liquid` now have working `{% paginate %}` blocks. The ~70 lines of pagination markup in `main-collection.liquid` (with numbered pages + current-page highlighting) is more featureful than `main-search.liquid`'s Previous/Next-only nav. Sub-project 4 could extract a shared snippet and decide on a unified UX. Currently the asymmetry is intentional but worth a single-line note in the next PR description.
- **`| default: 24` consistency.** `main-collection.liquid` reads its per-page setting through `assign per_page = section.settings.products_per_page | default: 24`. `main-search.liquid` references `section.settings.results_per_page` inline with no fallback. Schema defaults handle it in practice; normalize when sub-project 4 touches either file.

## Suggested next sub-project

**Sub-project 4 (Liquid snippets & layout).** Reasons:

- Bulk of the remaining Theme Check errors live in snippets (`json-ld.liquid` has most of the `UnknownFilter` volume).
- Pagination snippet extraction (cross-section dedup) is natural to bundle here.
- One last `HardcodedRoutes` warning (`predictive-search.liquid`) finishes that category.
- Returns `npm run theme:check` to near-green; only template-level fixes (sub-project 5) would remain.

To start: run `superpowers:brainstorming` and reference this progress file. The brainstorming step should produce a sub-project-4-specific spec at `docs/superpowers/specs/YYYY-MM-DD-liquid-snippets-cleanup-design.md`.

## Reference artifacts

- Sub-project 1 spec — [docs/superpowers/specs/2026-05-09-build-and-tooling-cleanup-design.md](specs/2026-05-09-build-and-tooling-cleanup-design.md)
- Sub-project 1 plan — [docs/superpowers/plans/2026-05-09-build-and-tooling-cleanup.md](plans/2026-05-09-build-and-tooling-cleanup.md)
- Sub-project 2 spec — [docs/superpowers/specs/2026-05-10-javascript-cleanup-design.md](specs/2026-05-10-javascript-cleanup-design.md)
- Sub-project 2 plan — [docs/superpowers/plans/2026-05-10-javascript-cleanup.md](plans/2026-05-10-javascript-cleanup.md)
- Free-shipping tracker spec — [docs/superpowers/specs/2026-05-11-free-shipping-tracker-design.md](specs/2026-05-11-free-shipping-tracker-design.md)
- Free-shipping tracker plan — [docs/superpowers/plans/2026-05-11-free-shipping-tracker.md](plans/2026-05-11-free-shipping-tracker.md)
- Sticky add-to-cart spec — [docs/superpowers/specs/2026-05-11-sticky-atc-design.md](specs/2026-05-11-sticky-atc-design.md)
- Sticky add-to-cart plan — [docs/superpowers/plans/2026-05-11-sticky-atc.md](plans/2026-05-11-sticky-atc.md)
- Sub-project 3 spec — [docs/superpowers/specs/2026-05-13-liquid-sections-cleanup-design.md](specs/2026-05-13-liquid-sections-cleanup-design.md)
- Sub-project 3 plan — [docs/superpowers/plans/2026-05-13-liquid-sections-cleanup.md](plans/2026-05-13-liquid-sections-cleanup.md)
- Theme Check findings (pre-sub-project 3 baseline) — [docs/superpowers/notes/2026-05-09-theme-check-findings.md](notes/2026-05-09-theme-check-findings.md)
- Blame-ignore file — [.git-blame-ignore-revs](../../.git-blame-ignore-revs)
