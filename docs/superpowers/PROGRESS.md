# Theme Cleanup — Progress Log

Last updated: 2026-05-11

## The Plan

The user asked for a "full cleanup pass" of this Shopify starter theme. Decomposed into six independently-shippable sub-projects:

| #   | Sub-project                                                       | Status                  | Reference                                                                                            |
| --- | ----------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | **Build & tooling** (Prettier + Theme Check + npm scripts)        | ✅ Merged 2026-05-10    | PR [#1](https://github.com/Codersy-Development/shopify-theme-starter/pull/1), merge commit `54ac8cc` |
| 2   | **JavaScript / web components** (11 files in `/assets/`)          | 🟡 In review (draft PR) | PR [#2](https://github.com/Codersy-Development/shopify-theme-starter/pull/2), awaiting manual smoke  |
| 3   | Liquid sections (23 files)                                        | ⬜ Not started          | —                                                                                                    |
| 4   | Liquid snippets & layout                                          | ⬜ Not started          | —                                                                                                    |
| 5   | Templates & config (`templates/*.json`, `config/settings_*.json`) | ⬜ Not started          | —                                                                                                    |
| 6   | CSS / Tailwind 4 (`src/input.css`)                                | ⬜ Not started          | —                                                                                                    |

## State to know before resuming

- **`npm run lint` exits 1 by design.** The lint script wires `format:check && theme:check`. Theme Check finds 34 errors / 20 warnings across 10 files — real issues that sub-projects 3 and 4 will fix. Lint returns to green when those land.
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

## Captured findings ready to feed sub-projects 3 and 4

`docs/superpowers/notes/2026-05-09-theme-check-findings.md` contains the raw Theme Check output. Top categories:

- **`UnknownFilter` (most volume)** — `push` and `qr_code` filters in `snippets/json-ld.liquid` and `templates/gift_card.liquid`. Likely false positives for the modern `push` filter; revisit when sub-project 4 starts and consider downgrading severity in `.theme-check.yml`.
- **`HardcodedRoutes`** — across `cart-drawer`, `footer`, `header`, `main-404`, `main-cart`, `main-search`, `predictive-search`. Real fixes — sub-project 3.
- **`UndefinedObject`** — `paginate` used outside a `paginate` block in `main-search.liquid`. Real bug — sub-project 3.
- **`RemoteAsset`** — in `canonicals.liquid` and `gift_card.liquid`. Performance — sub-project 4 (snippets) and sub-project 5 (templates).
- **`ImgWidthAndHeight` and `TranslationKeyExists`** — in `gift_card.liquid` (sub-project 5).

The notes file's "Triage Notes" section is intentionally empty — fill it when sub-project 3 starts.

## Suggested next sub-project

**Sub-project 3 (Liquid sections).** Reasons:

- Carries the bulk of real Theme Check fixes (HardcodedRoutes across 7 files, the `paginate` UndefinedObject bug).
- Touches the largest surface area, so finishing it sharpens what sub-projects 4 and 5 need to do.
- Returns `npm run theme:check` to a green-or-near-green baseline.

To start (after sub-project 2 lands): run `superpowers:brainstorming` and reference this progress file. The brainstorming step should produce a sub-project-3-specific spec at `docs/superpowers/specs/YYYY-MM-DD-liquid-sections-cleanup-design.md`.

## Reference artifacts

- Sub-project 1 spec — [docs/superpowers/specs/2026-05-09-build-and-tooling-cleanup-design.md](specs/2026-05-09-build-and-tooling-cleanup-design.md)
- Sub-project 1 plan — [docs/superpowers/plans/2026-05-09-build-and-tooling-cleanup.md](plans/2026-05-09-build-and-tooling-cleanup.md)
- Sub-project 2 spec — [docs/superpowers/specs/2026-05-10-javascript-cleanup-design.md](specs/2026-05-10-javascript-cleanup-design.md)
- Sub-project 2 plan — [docs/superpowers/plans/2026-05-10-javascript-cleanup.md](plans/2026-05-10-javascript-cleanup.md)
- Theme Check findings — [docs/superpowers/notes/2026-05-09-theme-check-findings.md](notes/2026-05-09-theme-check-findings.md)
- Blame-ignore file — [.git-blame-ignore-revs](../../.git-blame-ignore-revs)
