# Theme Cleanup — Progress Log

Last updated: 2026-05-15
**Status: COMPLETE — all 6 sub-projects merged.**

## The Plan

The user asked for a "full cleanup pass" of this Shopify starter theme. Decomposed into six independently-shippable sub-projects:

| #   | Sub-project                                                | Status               | Reference                                                                                            |
| --- | ---------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | **Build & tooling** (Prettier + Theme Check + npm scripts) | ✅ Merged 2026-05-10 | PR [#1](https://github.com/Codersy-Development/shopify-theme-starter/pull/1), merge commit `54ac8cc` |
| 2   | **JavaScript / web components** (11 files in `/assets/`)   | ✅ Merged 2026-05-11 | PR [#2](https://github.com/Codersy-Development/shopify-theme-starter/pull/2), merge commit `37ed0ce` |
| 3   | **Liquid sections** (6 of 23 files touched)                | ✅ Merged 2026-05-13 | PR [#5](https://github.com/Codersy-Development/shopify-theme-starter/pull/5), merge commit `772536a` |
| 4   | **Liquid snippets & layout** (5 files touched)             | ✅ Merged 2026-05-13 | PR [#6](https://github.com/Codersy-Development/shopify-theme-starter/pull/6), merge commit `38df66f` |
| 5   | **Templates & config** (2 files touched)                   | ✅ Merged 2026-05-14 | PR [#7](https://github.com/Codersy-Development/shopify-theme-starter/pull/7), merge commit `a7fc069` |
| 6   | **CSS / Tailwind 4** (3 files touched)                     | ✅ Merged 2026-05-15 | PR [#8](https://github.com/Codersy-Development/shopify-theme-starter/pull/8), merge commit `c6f27be` |

## Feature work landed alongside cleanup

Both shipped between sub-projects 2 and 3, off `main`, as separate PRs:

- **Free-shipping progress tracker in the cart drawer** — PR [#3](https://github.com/Codersy-Development/shopify-theme-starter/pull/3), merge commit `86b99a2`. Adds `snippets/free-shipping-tracker.liquid` and a `free_shipping_threshold` setting; the cart drawer's existing Section Rendering API refresh handles live updates with no new JavaScript.
- **Sticky add-to-cart bar on mobile product pages** — PR [#4](https://github.com/Codersy-Development/shopify-theme-starter/pull/4), merge commit `4f5e004`. Adds `<sticky-atc>` custom element, an `addToCart()` helper extracted from `product-form` into `assets/cart-add.js`, and reuses the inline form's selected variant.

## State to know before resuming

- **`npm run lint` exits 0.** Theme Check is fully green: 57 files inspected, 0 offenses. First time since sub-project 1 merged and the baseline was captured. The lint script (`format:check && theme:check`) is now safe to wire into a CI gate without immediate noise.
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

## What sub-project 5 produced (PR #7)

- `locales/en.default.json` — added a new `gift_cards` namespace with `issued.title: "Gift card"`. Resolves the `TranslationKeyExists` finding on `{{ 'gift_cards.issued.title' | t }}` in the gift card template's `<title>`.
- `templates/gift_card.liquid` — added `width="160" height="160"` to the QR code `<img>` (matches its `w-40 h-40` Tailwind class derivation: 10rem × 16px = 160px square) and `height="44"` to the Apple Wallet badge `<img>` (matches Apple's documented Add-to-Wallet badge aspect ratio at `width="120"`).
- Total diff: 8 lines across 2 files.

## What sub-project 6 produced (PR #8)

- `src/input.css` — removed the dead `a { @apply text-blue-600 hover:text-blue-800 transition-colors; }` rule from the `@layer base` block. The theme is gray-on-white; 44 anchors override the rule with `no-underline` + explicit `text-gray-*` classes, and the remaining 11 inherit a darker color cascade. The rule fired somewhere only theoretically. `@layer base` shrinks from 3 sub-rules to 2.
- `config/settings_schema.json` — removed the entire `"Colors"` settings group (containing `color_primary` and `color_secondary`). Zero code anywhere in the theme referenced either setting; the theme customizer's color pickers did nothing.
- `config/settings_data.json` — removed the corresponding persisted `color_primary` / `color_secondary` keys from `current`. Remaining keys: `cart_type`, `logo_max_width`.
- Total diff: 23 line deletions across 3 files.

## Decomposition complete

The 6-sub-project cleanup the user asked for is done. Theme starter is at a known-clean baseline:

- `npm run lint` exits 0 stably (format:check + theme:check both green).
- Theme Check: 0 offenses across 57 files.
- All hardcoded routes replaced with `routes.*` object equivalents.
- Pagination is a shared snippet; search results have numbered pagination.
- Free-shipping progress tracker and sticky mobile ATC ship as features.
- No dead settings, no dead CSS rules.

## Possible follow-up work (out of the original decomposition)

- **Wire `npm run lint` into a CI gate.** Now that lint is stably green, a GitHub Actions workflow on `pull_request` events can fail builds on regressions. Husky pre-commit hook is an alternative but only runs on the committer's machine.
- **Color customization story.** Currently the theme has hardcoded `#111827` / `#fff` / `#e5e7eb` etc. throughout `src/input.css` and templates. A real story would: add CSS variables in `layout/theme.liquid` (like `--page-width` is wired), refactor `src/input.css` to consume them, re-introduce schema settings that point to the variables.
- **Pagination snippet UX polish.** Per sub-project 4 follow-up notes: the chevron Prev/Next buttons (`px-3 py-2`) are ~4px shorter than the page-number buttons (`w-10 h-10`). Worth a single-line class harmonization the next time `snippets/pagination.liquid` is touched.
- **Locales sweep.** Hardcoded English in templates/sections/snippets ("Your cart is empty", "Continue shopping", "Here's your gift card!", etc.) could be migrated to translation keys to enable multi-locale stores. Separate, larger project.
- **`config/settings_schema.json` audit.** Could verify every declared setting is consumed in code (already partially done for `color_primary`/`color_secondary`) or add `info` strings to settings that lack them.

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
- Sub-project 5 spec — [docs/superpowers/specs/2026-05-13-templates-and-config-cleanup-design.md](specs/2026-05-13-templates-and-config-cleanup-design.md)
- Sub-project 5 plan — [docs/superpowers/plans/2026-05-13-templates-and-config-cleanup.md](plans/2026-05-13-templates-and-config-cleanup.md)
- Sub-project 6 spec — [docs/superpowers/specs/2026-05-14-css-tailwind-cleanup-design.md](specs/2026-05-14-css-tailwind-cleanup-design.md)
- Sub-project 6 plan — [docs/superpowers/plans/2026-05-14-css-tailwind-cleanup.md](plans/2026-05-14-css-tailwind-cleanup.md)
- Theme Check findings (pre-sub-project 3 baseline) — [docs/superpowers/notes/2026-05-09-theme-check-findings.md](notes/2026-05-09-theme-check-findings.md)
- Blame-ignore file — [.git-blame-ignore-revs](../../.git-blame-ignore-revs)
