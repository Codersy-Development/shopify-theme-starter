# CSS / Tailwind 4 Cleanup — Design

**Date:** 2026-05-14
**Sub-project:** 6 of the theme cleanup decomposition (final)
**Status:** Draft (pending user review)

## Context

Sub-project 6 of the theme-starter cleanup decomposition (see [PROGRESS.md](../PROGRESS.md)). Sub-project 5 merged earlier today as PR #7 (`a7fc069`). `npm run lint` is fully green (`format:check` + `theme:check` both exit 0). This sub-project closes out the 6-sub-project decomposition.

A 318-line audit of `src/input.css`, plus a sweep of `config/settings_schema.json`, `config/settings_data.json`, and all consumers in `sections/ snippets/ layout/ assets/`, found exactly two pieces of dead code worth removing in a tight-scope pass:

1. A dead `@layer base a { @apply text-blue-600 hover:text-blue-800 transition-colors; }` rule that no one wants and every actual anchor overrides.
2. Two unconsumed color settings (`color_primary`, `color_secondary`) declared in the schema but referenced by zero code anywhere in the theme.

Other audit observations (hardcoded grays/blacks that could be tokens, animation-curve repetition, state-class convention inconsistencies, `var(--page-width, 1200px)` redundant fallback) were deliberately deferred to keep this sub-project tight. None of them are bugs; the hardcoded grays look identical to Tailwind's `gray-300/gray-900` defaults, and the theme has no working color-customization story today.

## Current State

**`src/input.css` lines 19–36:**

```css
@layer base {
  body {
    @apply font-sans text-gray-900 antialiased;
  }

  a {
    @apply text-blue-600 hover:text-blue-800 transition-colors;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply font-bold leading-tight;
  }
}
```

The `a` rule applies `text-blue-600 hover:text-blue-800` to all anchors. But the theme is gray-on-white: 44 anchors use `no-underline` plus explicit `text-gray-*` colors; the remaining 11 anchors with no explicit `text-*` class all live inside containers whose color cascades override the blue. The rule fires somewhere only theoretically.

**`config/settings_schema.json` lines 73–89:**

The `"Colors"` settings group declares two `color` inputs (`color_primary` default `#111827`, `color_secondary` default `#2563eb`).

A grep of `sections/ snippets/ layout/ assets/ src/` for `settings.color_primary`, `settings.color_secondary`, `color_primary`, or `color_secondary` returns zero hits. Theme code never reads either setting. The hardcoded `#111827`, `#fff`, `#e5e7eb`, `#d1d5db` and `#2563eb` in `src/input.css` and various templates do not go through this setting.

**`config/settings_data.json` lines 2–6:**

```json
{
  "current": {
    "color_primary": "#111827",
    "color_secondary": "#2563eb",
    "cart_type": "drawer",
    "logo_max_width": 120
  }
}
```

The persisted values for the two dead settings.

Baseline: `npm run lint` exits 0. Theme Check 0 offenses.

## Goals

1. Remove the dead `a { @apply text-blue-600 hover:text-blue-800 transition-colors; }` rule from `src/input.css`'s `@layer base` block.
2. Remove the entire `"Colors"` settings group (containing `color_primary` and `color_secondary`) from `config/settings_schema.json`.
3. Remove the `color_primary` and `color_secondary` keys from `config/settings_data.json`'s `current` object.

## Non-Goals

- **Wiring color tokens through to CSS variables.** Doing this properly (add `--color-primary` / `--color-secondary` to `layout/theme.liquid`, refactor `src/input.css` to use them, audit hardcoded color usage in templates) would be its own sub-project. The setting wasn't being used; we're not adding a feature.
- **General CSS audit.** `var(--page-width, 1200px)` fallback redundancy on line 151; animation-curve repetition; state-class convention drift (`is-open` vs `is-active`). All cosmetic; deferred.
- **Wiring `npm run lint` into a CI gate.** Separate task; out of scope.
- **Other Shopify-managed JSON files** (`templates/*.json`, `locales/`). No findings; no work.

## Architecture

Three files change. All deletions, no additions.

### Files touched

| File                          | Change                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `src/input.css`               | Remove 3-line `a { @apply ... }` rule (plus surrounding blank line) from `@layer base` |
| `config/settings_schema.json` | Remove the `"Colors"` settings group (17-line object including its trailing comma)     |
| `config/settings_data.json`   | Remove the `color_primary` and `color_secondary` keys from `current` object            |

### `src/input.css` change

`@layer base` shrinks from 3 sub-rules to 2:

```css
@layer base {
  body {
    @apply font-sans text-gray-900 antialiased;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply font-bold leading-tight;
  }
}
```

### `config/settings_schema.json` change

The entire `"Colors"` group is deleted. Adjacent groups (the one preceding it ending at line 72, and `"Cart"` starting at line 90 of today's file) become contiguous. The trailing comma on the deleted block goes with the deletion so the JSON remains valid.

### `config/settings_data.json` change

Two keys removed from `current`:

```json
{
  "current": {
    "cart_type": "drawer",
    "logo_max_width": 120
  }
}
```

**Note:** `config/settings_data.json` is in `.prettierignore` (via `config/*.json`); the executor must preserve the existing 2-space indent + plain JSON by hand. Same constraint sub-project 5 handled for `locales/en.default.json`.

`config/settings_schema.json` is also in `.prettierignore` for the same reason — Shopify writes to these files when merchants change settings, so the theme repo treats them as Shopify-managed.

## Risks

- **Visual regression on unstyled anchors.** Theoretically, any `<a>` without an explicit `text-*` class would have inherited `text-blue-600` from the dead rule. Inspection of all 11 such anchors confirmed they sit inside containers with a darker color cascading down (e.g., a `text-gray-900` ancestor) — visually identical before/after. _Mitigation:_ smoke-check home, collection, search, product, footer.
- **Theme customizer state for downstream projects.** Forks of this starter that have saved settings will see the two color values disappear on the next publish — but they're not consumed anywhere, so nothing breaks visually.
- **Settings group ordering.** Removing the Colors group shifts later groups one position up in the theme customizer. Cosmetic only; the starter has not yet shipped to merchants in a way that makes this a stability concern.
- **JSON validity.** Both `config/*.json` files are Prettier-excluded; manual edits risk leaving a trailing comma or unbalanced brace. _Mitigation:_ Task validates with `node -e "JSON.parse(...)"`.

## Testing & Verification

No new test infrastructure.

**Automated**

- `npm run format:check` → exit 0.
- `npm run theme:check` → exit 0, 0 offenses (unchanged).
- `npm run build:css` → exits 0; `assets/application.css` rebuilds without errors.
- `npm run lint` → exit 0 (still).

**Manual smoke**

1. **`shopify theme dev`** — home, collection, search, product, cart, 404 pages. Anchor styling visually identical to before; no rogue blue links.
2. **Theme customizer** — no "Colors" group appears. Remaining settings groups appear in their previous order minus the gap where Colors used to be.
3. **Browser DevTools** — Inspect a couple of anchors on a collection page; confirm they have no inherited blue color from the dead rule.

## Acceptance Criteria

- `src/input.css` has no `a { ... }` rule inside `@layer base`.
- `config/settings_schema.json` has no `color_primary` setting, no `color_secondary` setting, and no `"Colors"` group object.
- `config/settings_data.json`'s `current` object has no `color_primary` or `color_secondary` keys.
- Both JSON files remain valid (parse via `node -e "JSON.parse(...)"`).
- `npm run format:check` exits 0.
- `npm run theme:check` exits 0.
- `npm run build:css` exits 0.
- `npm run lint` exits 0.
- One PR off `main`.
- After merge, the 6-sub-project decomposition described in `docs/superpowers/PROGRESS.md` is complete.

## Follow-Up Work (Not This Spec)

- Wire `npm run lint` into a CI gate (GitHub Actions on PR, or Husky pre-commit hook). Now that lint is green and stable, this is unblocking.
- Optional future sub-projects: theme color customization story (introduce `--color-primary` CSS variable wired through `layout/theme.liquid`, then re-add a `Colors` settings group that actually does something); `var(--page-width, 1200px)` fallback consolidation; state-class convention normalization.
