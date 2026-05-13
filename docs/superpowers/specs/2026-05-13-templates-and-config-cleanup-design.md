# Templates & Config Cleanup — Design

**Date:** 2026-05-13
**Sub-project:** 5 of the theme cleanup decomposition
**Status:** Draft (pending user review)

## Context

Sub-project 5 of the theme-starter cleanup decomposition (see [PROGRESS.md](../PROGRESS.md)). Sub-project 4 merged earlier today as PR #6 (`38df66f`). After sub-project 4, Theme Check reports **3 offenses across 1 file** — all in `templates/gift_card.liquid`. This sub-project clears them, returning `npm run theme:check` (and therefore `npm run lint`) to **exit 0** for the first time since sub-project 1 was merged and the baseline captured.

The "Templates & config" framing might suggest broader work (settings-schema audit, locales sweep for hardcoded strings, template restructuring), but inspection found no quick wins:

- Every setting in `config/settings_schema.json` is currently referenced somewhere in the theme.
- A locales sweep for hardcoded English strings would be a real project but it's separate from clearing Theme Check; deferred.
- `templates/gift_card.liquid` is the only `.liquid` file in `templates/` (all others are `.json`) and the only one with findings.

So this sub-project is tight: 2 files, 3 fixes.

## Current State

Per [docs/superpowers/notes/2026-05-09-theme-check-findings.md](../notes/2026-05-09-theme-check-findings.md), the 3 remaining offenses in `templates/gift_card.liquid` are:

1. **Lines 22–26: `ImgWidthAndHeight` (error)** — `<img src="{{ gift_card | qr_code }}">` missing `width` and `height` attributes. The image is sized via `class="mx-auto mb-6 w-40 h-40"` (visually 160×160px) but the HTML attributes are absent, so the browser can't reserve layout space until the image data URI is parsed.
2. **Line 59: `ImgWidthAndHeight` (error)** — inside the `<a href="{{ gift_card.pass_url }}">` block (lines 54–61), the `<img>` for the Apple Wallet badge has `width="120"` but missing `height`.
3. **Line 7: `TranslationKeyExists` (error)** — `{{ 'gift_cards.issued.title' | t }}` references a translation key that doesn't exist in `locales/en.default.json`. (The file has no `gift_cards` namespace at all.)

Baseline: `npm run theme:check` reports 3 offenses across 1 file; exit 1.

## Goals

1. Add a `gift_cards.issued.title` key to `locales/en.default.json` with value `"Gift card"`.
2. Add `width="160" height="160"` to the QR code `<img>` tag, matching its `w-40 h-40` Tailwind class.
3. Add `height="44"` to the Apple Wallet badge `<img>` tag (it already has `width="120"`).
4. Confirm `npm run theme:check` exits 0 — the milestone.

## Non-Goals

- **`config/settings_schema.json` audit / cleanup.** No unused or stale settings spotted. Pre-existing settings include intentional starter-template placeholders (`theme_author: "Codersy"`, `theme_documentation_url: "https://codersy.com"`) that merchants customize on fork.
- **Locales expansion.** Hardcoded English in templates/sections/snippets (e.g., "Your cart is empty", "Continue shopping", "Here's your gift card!") could be migrated to translation keys to enable multi-locale stores, but that's a separate undertaking and not in scope.
- **Touching other `.json` templates** (`product.json`, `collection.json`, etc.). No findings; no work.
- **Layout files** (`layout/theme.liquid`, `layout/password.liquid`). No findings.
- **Hardcoded `<title>` body text.** The friendly inline copy "Here's your gift card!" (line 19) stays hardcoded — it's body content, not a page title, and outside the locales scope of this sub-project.
- **CLS measurement.** Lighthouse / Core Web Vitals testing is out of scope — Theme Check rule satisfaction is the proxy.

## Architecture

Two files change. Three discrete attribute / key additions. No new files, no refactors.

### Files touched

| File                         | Change                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `locales/en.default.json`    | Add `gift_cards.issued.title: "Gift card"` namespace                                               |
| `templates/gift_card.liquid` | Add `width="160" height="160"` to QR code `<img>`; add `height="44"` to Apple Wallet badge `<img>` |

### `locales/en.default.json` change

The current file has four top-level namespaces: `general`, `cart`, `breadcrumb`, `newsletter`. Add a fifth `gift_cards` namespace. Placement choice: insert after `general` and before `cart`, keeping the rough convention of page-level keys (`general` has 404 and search; `gift_cards` is also a page-level concern) ahead of component-level keys (`cart`, `breadcrumb`, `newsletter`).

The new namespace:

```json
"gift_cards": {
  "issued": {
    "title": "Gift card"
  }
},
```

Value rationale: `"Gift card"` is the conventional `<title>` text used by Shopify's reference theme (Dawn). The template's body greeting on line 19 ("Here's your gift card!") stays hardcoded — it's body copy, not a title.

### `templates/gift_card.liquid` changes

**QR code `<img>` (current lines 22–26):**

Before:

```liquid
<img
  src="{{ gift_card | qr_code }}"
  alt="Gift card QR code"
  class="mx-auto mb-6 w-40 h-40"
>
```

After:

```liquid
<img
  src="{{ gift_card | qr_code }}"
  alt="Gift card QR code"
  width="160"
  height="160"
  class="mx-auto mb-6 w-40 h-40"
>
```

The class `w-40 h-40` resolves to 10rem × 10rem = 160px × 160px at the default 16px root font size (Tailwind 4 default). The HTML attributes match the rendered visual size, which is what `ImgWidthAndHeight` wants — they establish an intrinsic aspect ratio for browser layout reservation before the data URI is fetched/decoded.

**Apple Wallet badge `<img>` (current lines 56–60):**

Before:

```liquid
<img
  src="{{ 'gift-card/add-to-apple-wallet.svg' | shopify_asset_url }}"
  alt="Add to Apple Wallet"
  width="120"
>
```

After:

```liquid
<img
  src="{{ 'gift-card/add-to-apple-wallet.svg' | shopify_asset_url }}"
  alt="Add to Apple Wallet"
  width="120"
  height="44"
>
```

Apple's modern Add-to-Wallet badge SVG has a roughly 2.7:1 aspect ratio. At `width="120"`, the matching height is `120 / 2.7 ≈ 44`. This is also the value used in Shopify's reference themes and Apple's developer guidance for this widget. The SVG is vector — the attribute values purely reserve layout space; rendering scales correctly.

## Risks

- **Translation key value choice.** "Gift card" vs. "Your gift card" vs. "Your gift card from {{ shop.name }}". Picking "Gift card" matches Dawn and is short enough for a browser tab. _Mitigation:_ trivial to revise later via the locales file; no consumer in code depends on the exact string.
- **Apple Wallet badge aspect ratio approximation.** The SVG renders correctly at any height; the value matters only for the browser's layout-reservation calculation. 44 vs. 45 vs. 50 makes a sub-pixel difference at most. _Mitigation:_ documented choice; trivially adjustable.
- **JSON formatting.** `locales/en.default.json` is excluded from Prettier (see `.prettierignore` — `locales/` is in the ignore list). The insertion must therefore preserve the existing 2-space-indent + plain JSON style by hand. _Mitigation:_ inspect the diff before commit.

## Testing & Verification

No new test infrastructure. Same flow as prior sub-projects.

**Automated**

- `npm run format:check` → exit 0.
- `npm run theme:check` → **exit 0**, "0 total offenses". The milestone.
- `npm run lint` (= format:check + theme:check) → exit 0 — first time since sub-project 1 merged.

**Manual smoke**

The gift card template is reachable at `/account/gift_cards/<code>` after a real card is issued. For local testing, Shopify's `shopify theme dev` exposes a preview at `/gift_cards/preview` (or `/gift_cards/<id>/preview` with a real card). Smoke items:

1. **Preview URL** loads without browser console errors.
2. **`<title>`** in the browser tab reads "Gift card — \<Shop Name\>". (Confirms the translation key resolved.)
3. **QR code image** renders at 160×160px. Inspect: `<img>` has both `width="160"` and `height="160"`.
4. **Apple Wallet badge** renders when `gift_card.pass_url` is present (typically only on iOS user-agent or when previewing the issued-card flow). Inspect: `<img>` has `width="120"` and `height="44"`.
5. **No visible layout shift** while images load (assets are tiny and cached, but verify the placeholder space is reserved).
6. **`npm run format:check`** exits 0.
7. **`npm run theme:check`** exits 0 with "0 total offenses".
8. **`npm run lint`** exits 0.

## Acceptance Criteria

- `locales/en.default.json` has a `gift_cards.issued.title` key with value `"Gift card"`.
- The pre-existing four namespaces (`general`, `cart`, `breadcrumb`, `newsletter`) and their contents are unchanged.
- `templates/gift_card.liquid` QR code `<img>` has `width="160"` and `height="160"`.
- `templates/gift_card.liquid` Apple Wallet badge `<img>` has `width="120"` and `height="44"`.
- All other content in `templates/gift_card.liquid` is unchanged.
- `npm run format:check` exits 0.
- `npm run theme:check` exits **0** with 0 total offenses.
- `npm run lint` exits 0.
- One PR off `main`.

## Follow-Up Work (Not This Spec)

- **Sub-project 6 — CSS / Tailwind 4 cleanup** in `src/input.css`. The last remaining sub-project.
- **Add `npm run lint` to a CI gate.** Now that lint is green, CI can fail on regressions. Implementation: GitHub Actions workflow running on PR; or a Husky pre-commit hook. Either way, separate from this sub-project.
- **Locales sweep.** If multi-locale support ever becomes a real requirement, audit templates/sections/snippets for hardcoded English and migrate to translation keys.
- **`config/settings_schema.json` audit.** Could verify every declared setting is consumed in code (and removed if not), or add `info` strings to settings that lack them. Low-priority hygiene.
