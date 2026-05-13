# Theme Cleanup — Progress Log

Last updated: 2026-05-13

## The Plan

The user asked for a "full cleanup pass" of this Shopify starter theme. Decomposed into six independently-shippable sub-projects:

| #   | Sub-project                                                       | Status               | Reference                                                                                            |
| --- | ----------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | **Build & tooling** (Prettier + Theme Check + npm scripts)        | ✅ Merged 2026-05-10 | PR [#1](https://github.com/Codersy-Development/shopify-theme-starter/pull/1), merge commit `54ac8cc` |
| 2   | **JavaScript / web components** (11 files in `/assets/`)          | ✅ Merged 2026-05-11 | PR [#2](https://github.com/Codersy-Development/shopify-theme-starter/pull/2), merge commit `37ed0ce` |
| 3   | **Liquid sections** (6 of 23 files touched)                       | ✅ Merged 2026-05-13 | PR [#5](https://github.com/Codersy-Development/shopify-theme-starter/pull/5), merge commit `772536a` |
| 4   | **Liquid snippets & layout** (5 files touched)                    | ✅ Merged 2026-05-13 | PR [#6](https://github.com/Codersy-Development/shopify-theme-starter/pull/6), merge commit `38df66f` |
| 5   | Templates & config (`templates/*.json`, `config/settings_*.json`) | ⬜ Not started       | —                                                                                                    |
| 6   | CSS / Tailwind 4 (`src/input.css`)                                | ⬜ Not started       | —                                                                                                    |

## Feature work landed alongside cleanup

Both shipped between sub-projects 2 and 3, off `main`, as separate PRs:

- **Free-shipping progress tracker in the cart drawer** — PR [#3](https://github.com/Codersy-Development/shopify-theme-starter/pull/3), merge commit `86b99a2`. Adds `snippets/free-shipping-tracker.liquid` and a `free_shipping_threshold` setting; the cart drawer's existing Section Rendering API refresh handles live updates with no new JavaScript.
- **Sticky add-to-cart bar on mobile product pages** — PR [#4](https://github.com/Codersy-Development/shopify-theme-starter/pull/4), merge commit `4f5e004`. Adds `<sticky-atc>` custom element, an `addToCart()` helper extracted from `product-form` into `assets/cart-add.js`, and reuses the inline form's selected variant.

## State to know before resuming

- **`npm run lint` exits 1 only due to `templates/gift_card.liquid`.** Theme Check baseline: **3 offenses across 1 file** (down from 54 across 10). The remaining errors are 2 `ImgWidthAndHeight` + 1 `TranslationKeyExists` in `gift_card.liquid` — sub-project 5 will clear them. `npm run format:check` exits 0.
- **`.theme-check.yml` disables `UnknownFilter` and `RemoteAsset` globally** (commented with rationale, pointing back to sub-project 4's spec). The `push` and `qr_code` filters and the canonical-URL pattern are all real / intentional but the bundled Theme Check misfires on them. If a future change introduces a genuinely-unknown filter or a third-party CDN URL, the rule can be re-enabled per-file via `ignored_paths`.
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

## What sub-project 4 produced (PR #6)

- `.theme-check.yml` disables `UnknownFilter` and `RemoteAsset` globally. Both rules were misfiring on legitimate modern Liquid patterns (`push` and `qr_code` filters; canonical URLs and data-URI QR codes). Comments in the file explain the audit and point back to the spec.
- `snippets/predictive-search.liquid` — last `HardcodedRoutes` warning in the theme: `/search` → `{{ routes.search_url }}`.
- New `snippets/pagination.liquid` — numbered-pages pagination using Shopify's `paginate.parts` API (auto-truncates long page lists with `…` entries; URLs include filter/tag/sort/query params). Self-gates on `paginate.pages > 1`.
- Bug-fix-in-flight: code review caught that `part.title == paginate.current_page` was a string-vs-integer comparison (Liquid's `==` doesn't coerce types), which would have suppressed the active-page highlight. Fixed by `assign current_page_str = paginate.current_page | append: ''` before the loop.
- `sections/main-collection.liquid` — dropped 70 lines of inline pagination markup (including a dead `current_tags` URL-construction branch) in favor of `{% render 'pagination', paginate: paginate %}`. Short page lists pixel-identical to before; long page lists now use ellipsis truncation.
- `sections/main-search.liquid` — renders the same snippet; normalizes the per-page read with `assign per_page = section.settings.results_per_page | default: 24` to mirror `main-collection.liquid`'s pattern. Search results now show numbered pagination (was Previous/Next-only) — a deliberate UX upgrade.

## Captured findings remaining for sub-project 5

`docs/superpowers/notes/2026-05-09-theme-check-findings.md` contains the raw Theme Check output. After sub-project 4, the remaining issues are:

- **`ImgWidthAndHeight`** (2 errors) in `templates/gift_card.liquid` — `<img>` tags missing `width`/`height` attributes. Performance/CLS impact.
- **`TranslationKeyExists`** (1 error) in `templates/gift_card.liquid` — references `gift_cards.issued.title` which has no entry in `locales/en.default.json`. Either add the key or use a hardcoded string.

That's the full remaining surface area — 3 offenses, 1 file. Sub-project 5 returns `npm run theme:check` to **exit 0** for the first time since sub-project 1 was merged.

## Suggested next sub-project

**Sub-project 5 (Templates & config).** Reasons:

- Cleans the last 3 Theme Check offenses; returns lint to green.
- Smallest remaining sub-project — one file, three discrete fixes.
- Includes adding the missing `gift_cards.issued.title` translation key to `locales/en.default.json` (so this also touches the config layer the sub-project covers).

To start: run `superpowers:brainstorming` and reference this progress file. The brainstorming step should produce a sub-project-5-specific spec at `docs/superpowers/specs/YYYY-MM-DD-templates-and-config-cleanup-design.md`.

Sub-project 6 (CSS / Tailwind 4) remains after that — likely the smallest of all six since `src/input.css` is mostly token wiring.

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
- Sub-project 4 spec — [docs/superpowers/specs/2026-05-13-liquid-snippets-cleanup-design.md](specs/2026-05-13-liquid-snippets-cleanup-design.md)
- Sub-project 4 plan — [docs/superpowers/plans/2026-05-13-liquid-snippets-cleanup.md](plans/2026-05-13-liquid-snippets-cleanup.md)
- Theme Check findings (pre-sub-project 3 baseline) — [docs/superpowers/notes/2026-05-09-theme-check-findings.md](notes/2026-05-09-theme-check-findings.md)
- Blame-ignore file — [.git-blame-ignore-revs](../../.git-blame-ignore-revs)
