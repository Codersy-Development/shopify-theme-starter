# Liquid Sections Cleanup — Design

**Date:** 2026-05-13
**Sub-project:** 3 of the theme cleanup decomposition
**Status:** Draft (pending user review)

## Context

Sub-project 3 of the original theme-starter cleanup decomposition (see [PROGRESS.md](../PROGRESS.md)). Sub-project 2 (JavaScript / web components) merged as `37ed0ce`. Two feature PRs landed in between — free-shipping tracker (PR #3) and sticky ATC (PR #4) — both currently in draft, awaiting smoke.

This spec is intentionally tight: fix only the Theme Check findings that live in `sections/`. No structural refactors, no snippet extraction, no triage of the `UnknownFilter` errors (those live in snippets and belong to sub-project 4).

## Current State

Per [docs/superpowers/notes/2026-05-09-theme-check-findings.md](../notes/2026-05-09-theme-check-findings.md), `sections/` has two distinct findings:

1. **`HardcodedRoutes`** (10 warnings across 6 files) — `/`, `/cart`, `/search`, `/collections/all` hardcoded in `href`/`action` attributes instead of using the `routes` object. Real fix: the `routes` object emits market-/locale-prefixed URLs correctly; the hardcoded versions silently break on stores with Markets, language prefixes, or custom storefront paths.
2. **`UndefinedObject` (5 warnings) on `paginate`** in `sections/main-search.liquid` — the search results loop iterates `search.results` directly, and the pagination nav (lines 47–67) references `paginate.previous`/`paginate.next`/`paginate.pages` outside a `{% paginate %}` block. The nav is dead code today; users with > 1 page of search results never see Previous/Next.

Baseline: `npm run theme:check` reports 54 offenses across 10 files; exit 1.

## Goals

1. Eliminate all 10 `HardcodedRoutes` warnings in `sections/` by swapping to the `routes` object.
2. Fix the `paginate` `UndefinedObject` bug in `sections/main-search.liquid` so pagination actually renders when search results overflow page 1.
3. Add a `results_per_page` range setting to `main-search.liquid`'s schema (8–48, step 4, default 24), mirroring `main-collection.liquid`'s `products_per_page`.

## Non-Goals

- **Snippets.** `predictive-search.liquid`, `canonicals.liquid`, `json-ld.liquid` — sub-project 4.
- **Templates.** `gift_card.liquid` (`ImgWidthAndHeight`, `TranslationKeyExists`, `qr_code` `UnknownFilter`) — sub-project 5.
- **Pagination snippet extraction.** `main-collection.liquid` has ~70 lines of pagination markup. Leaving it inline. Sub-project 4 can dedup once `main-search.liquid` has a working `{% paginate %}` block to share the snippet with.
- **`UnknownFilter` triage.** The `push` and `qr_code` filter errors live in snippets/templates and may be false positives needing a `.theme-check.yml` severity override. Sub-project 4.
- **Restructuring large sections.** `main-collection.liquid` (421 lines) and `header.liquid` (309 lines) are big but not on fire. No restructuring here.
- **Numbered pagination on search.** `main-search.liquid` only renders Previous/Next. `main-collection.liquid` renders numbered pages. Leaving the asymmetry as-is — a separate UX decision.

## Architecture

Six section files change. All changes are either string replacements (HardcodedRoutes) or local-scoped Liquid restructure (paginate wrapper + schema).

### Files touched

| File                          | Change                                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `sections/cart-drawer.liquid` | `/collections/all` → `{{ routes.all_products_collection_url }}` (line 89); `/cart` → `{{ routes.cart_url }}` (line 111)                      |
| `sections/footer.liquid`      | `/` → `{{ routes.root_url }}` (line 5)                                                                                                       |
| `sections/header.liquid`      | `/` → `{{ routes.root_url }}` (line 8); `/search` → `{{ routes.search_url }}` (line 183); `/cart` → `{{ routes.cart_url }}` (line 227)       |
| `sections/main-404.liquid`    | `/` → `{{ routes.root_url }}` (line 6)                                                                                                       |
| `sections/main-cart.liquid`   | `/cart` → `{{ routes.cart_url }}` in the `<form action>` (line 6); `/collections/all` → `{{ routes.all_products_collection_url }}` (line 71) |
| `sections/main-search.liquid` | `/search` → `{{ routes.search_url }}` (line 5); wrap results loop in `{% paginate %}`; add `results_per_page` schema setting                 |

### `main-search.liquid` — the substantive change

**Before** (lines 26–73, abbreviated):

```liquid
{% if search.performed %}
  {% if search.results_count > 0 %}
    <p>{{ search.results_count }} result…</p>
    <div class="grid …">
      {% for item in search.results -%}
        …
      {%- endfor %}
    </div>
    {% if paginate.pages > 1 %}
      {%- comment -%} ← `paginate` is undefined here — this entire block is dead code {%- endcomment -%}
      <nav>…Previous / Next…</nav>
    {% endif %}
  {% else %}
    <p>No results found …</p>
  {% endif %}
{% endif %}
```

**After**:

```liquid
{% if search.performed %}
  {% if search.results_count > 0 %}
    {% paginate search.results by section.settings.results_per_page %}
      <p>{{ search.results_count }} result…</p>
      <div class="grid …">
        {% for item in search.results -%}
          …
        {%- endfor %}
      </div>
      {% if paginate.pages > 1 %}
        <nav>…Previous / Next…</nav>
      {% endif %}
    {% endpaginate %}
  {% else %}
    <p>No results found …</p>
  {% endif %}
{% endif %}
```

Notes:

- The `{% if search.performed %}` and `{% if search.results_count > 0 %}` guards stay outside the `{% paginate %}` wrapper. `{% paginate %}` requires a paginatable resource; an empty `search.results` is valid (it would paginate to 0 pages and the nav would not render anyway), but keeping the empty/un-performed branches outside the wrapper preserves the existing structure and avoids unnecessary work.
- The Previous/Next-only nav is preserved verbatim; only its surrounding wrapper changes.

### Schema addition

`main-search.liquid`'s `{% schema %}` block today:

```json
{
  "name": "Search",
  "tag": "section"
}
```

Becomes:

```json
{
  "name": "Search",
  "tag": "section",
  "settings": [
    {
      "type": "range",
      "id": "results_per_page",
      "label": "Results per page",
      "min": 8,
      "max": 48,
      "step": 4,
      "default": 24
    }
  ]
}
```

Mirrors `main-collection.liquid`'s `products_per_page` exactly (same range, step, default).

### Routes object — caveat for `<form action>`

`main-cart.liquid:6` is `<form action="/cart" method="post">` — the cart line-item update form. `routes.cart_url` resolves to `/cart` at runtime on a default store, so the substitution is behavior-preserving. On Markets/localized stores it emits the correctly-prefixed URL, which is the latent bug the warning was flagging. The form's `method="post"` and its inputs are untouched.

## Risks

- **`routes` object value drift.** If a future Shopify change altered `routes.cart_url`'s shape, every consumer would need a coordinated update. Mitigation: this is Shopify's official, documented pattern — risk is on Shopify, not us.
- **`{% paginate %}` wrapping an empty `search.results`.** Already guarded by `{% if search.results_count > 0 %}` — paginate never runs when results are empty.
- **Search page customizer change.** The new `results_per_page` setting requires the merchant to publish to take effect. Document in `info` text is unnecessary — the label is self-explanatory and 24 is a sensible default.

## Testing & Verification

No new test infrastructure. Same flow as previous sub-projects.

**Automated**

- `npm run format:check` → exit 0.
- `npm run theme:check` → baseline drops from **54 offenses across 10 files** to **39 offenses across 4 files** (−10 HardcodedRoutes warnings + −5 UndefinedObject warnings; all 6 touched section files clear entirely so file count drops by 6). The remaining 4 files are `snippets/canonicals.liquid`, `snippets/json-ld.liquid`, `snippets/predictive-search.liquid`, `templates/gift_card.liquid`. Exit still 1 — the remaining `UnknownFilter` errors in `snippets/json-ld.liquid` and `templates/gift_card.liquid` belong to sub-projects 4 & 5.

**Manual smoke**

1. **Home** — header logo + cart icon resolve. No broken links, console clean.
2. **Cart drawer** — open from header. Empty-state "Continue shopping" link → `/collections/all`. Populated "View cart" → `/cart`. Free-shipping tracker (from PR #3 once merged) unaffected.
3. **Cart page** (`/cart`) — line-item quantity update form submits and updates totals (`<form action="{{ routes.cart_url }}">`). Empty-state "Continue shopping" link → `/collections/all`.
4. **404** — visit a bogus URL. "Back to home" link → `/`.
5. **Search page** (`/search?q=…`):
   - Form submit reloads with results — `action="{{ routes.search_url }}"` resolves.
   - With ≥ 25 results (default `results_per_page` = 24), Previous/Next nav now renders (was dead code).
   - Theme customizer exposes the new "Results per page" slider on the search section.
6. **Footer** — shop-name link → `/`.
7. **Header** — logo + cart icon on every page; mobile search icon link works.
8. **No-regression** — browser console clean on home, product, collection, cart, search, 404. `npm run format:check` exits 0. `npm run theme:check` exit unchanged (still 1); offense count drops to 39.

## Acceptance Criteria

- All 10 `HardcodedRoutes` warnings in `sections/` are gone.
- All 5 `UndefinedObject` warnings on `paginate` in `main-search.liquid` are gone.
- `main-search.liquid` paginates correctly when results > `results_per_page`.
- New section setting `results_per_page` (range, 8–48, step 4, default 24) appears in the theme customizer on the search section.
- No new Theme Check findings introduced.
- `npm run format:check` passes (exit 0).
- `npm run theme:check` offense count drops to 39 across 4 files; exit still 1.
- One PR off `main`.

## Follow-Up Work (Not This Spec)

- Extract pagination markup into a shared snippet (sub-project 4) once both `main-collection.liquid` and `main-search.liquid` have working `{% paginate %}` blocks.
- Snippets cleanup: `predictive-search.liquid` `/search` hardcoded route, `canonicals.liquid` `RemoteAsset` warnings, `json-ld.liquid` `push`-filter triage in `.theme-check.yml` (sub-project 4).
- Templates cleanup: `gift_card.liquid` img dimensions, missing translation key, `qr_code` filter triage (sub-project 5).
- Restructure large sections if warranted (`main-collection.liquid` at 421 lines; `header.liquid` at 309).
