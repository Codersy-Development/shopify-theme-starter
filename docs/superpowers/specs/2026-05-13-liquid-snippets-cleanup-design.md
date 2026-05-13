# Liquid Snippets & Layout Cleanup — Design

**Date:** 2026-05-13
**Sub-project:** 4 of the theme cleanup decomposition
**Status:** Draft (pending user review)

## Context

Sub-project 4 of the theme-starter cleanup decomposition (see [PROGRESS.md](../PROGRESS.md)). Sub-project 3 (Liquid sections) merged earlier today as PR #5 (`772536a`). After sub-project 3, Theme Check reports 39 offenses across 4 files, all in snippets and templates. This sub-project clears everything that lives in snippets and adds a shared pagination snippet, leaving sub-project 5 with only 3 real `templates/gift_card.liquid` findings.

Two carried-over follow-ups from sub-project 3's review:

- Both `sections/main-collection.liquid` and `sections/main-search.liquid` now have working `{% paginate %}` blocks but their pagination markup is duplicated.
- `main-collection.liquid` reads its per-page setting through `assign per_page = section.settings.products_per_page | default: 24`; `main-search.liquid` references `section.settings.results_per_page` inline without the fallback. Schema defaults handle it in practice, but the asymmetry is worth normalizing.

## Current State

Per [docs/superpowers/notes/2026-05-09-theme-check-findings.md](../notes/2026-05-09-theme-check-findings.md), after sub-project 3 the snippets-layer findings are:

1. **`UnknownFilter` errors (30 total) on `push`** in `snippets/json-ld.liquid` — used to build social-links and breadcrumb arrays. `push` is a real Shopify Liquid filter (introduced 2023); the bundled Theme Check just doesn't know it.
2. **`UnknownFilter` error (1) on `qr_code`** in `templates/gift_card.liquid` — real Shopify filter for QR generation; same false-positive class as `push`.
3. **`RemoteAsset` warnings (3)** in `snippets/canonicals.liquid` — fires on `<link rel="canonical" href="{{ shop.url }}{{ collection.url }}">` and similar. The rule's intent is third-party CDN URLs; canonical tags are _required_ to be absolute by SEO contract. Misfire.
4. **`RemoteAsset` warning (1)** in `templates/gift_card.liquid` — on `{{ gift_card | qr_code }}`. `qr_code` returns a `data:` URI, not a remote asset. Misfire.
5. **`HardcodedRoutes` warning (1)** in `snippets/predictive-search.liquid:49` — `<form action="/search">`. Last remaining `HardcodedRoutes` warning anywhere in the theme.

Also out of sub-project 3's review:

- `sections/main-collection.liquid` has a ~70-line numbered-pagination nav (lines 324–393).
- `sections/main-search.liquid` has a ~20-line Previous/Next-only nav.
- Per-page reads diverge as noted above.

Baseline: `npm run theme:check` reports 39 offenses across 4 files; exit 1.

## Goals

1. Silence `UnknownFilter` and `RemoteAsset` globally via `.theme-check.yml` with explanatory comments tracing back to this spec.
2. Replace the `HardcodedRoutes` finding in `snippets/predictive-search.liquid` with `{{ routes.search_url }}`.
3. Extract a shared `snippets/pagination.liquid` (numbered pages, uses `paginate.parts`) and call it from both `sections/main-collection.liquid` and `sections/main-search.liquid`. Search picks up numbered pagination — a deliberate UX upgrade.
4. Normalize per-page reads in `main-search.liquid` to match `main-collection.liquid`'s pattern: `assign per_page = section.settings.results_per_page | default: 24`, then `{% paginate … by per_page %}`.

## Non-Goals

- **Templates.** `templates/gift_card.liquid`'s real findings (2 `ImgWidthAndHeight` errors + 1 `TranslationKeyExists` error) — sub-project 5. The `UnknownFilter`/`RemoteAsset` findings in that file are silenced as a side effect of the global rule disables, but the real errors stay for sub-project 5.
- **Layout.** Neither `layout/theme.liquid` nor `layout/password.liquid` has Theme Check findings. Not touched.
- **Other snippets.** `breadcrumbs.liquid`, `header-drawer.liquid`, `image.liquid`, `meta-tags.liquid`, `product-card.liquid`, `robots.liquid`, `scripts.liquid`, `social-icons.liquid`, `free-shipping-tracker.liquid` have no Theme Check findings. Not touched.
- **Refactoring `json-ld.liquid` to avoid `push`.** The `push` pattern is canonical Shopify Liquid; the alternative (re-`assign` + `concat` plumbing) is uglier and the broader `UnknownFilter` issue would still fire on every new filter the bundled checker lags on.
- **Per-rule per-filter overrides.** Theme Check does not support per-filter exceptions for `UnknownFilter`. Global disable is the only available knob.
- **Pagination style parameter.** The snippet is unconditionally numbered. No `style: 'simple'` flag — YAGNI. Both consumers agreed on numbered pages.

## Architecture

Five files change (one new, four modified). Two new behaviors (rule overrides, shared snippet); two refactors (sections render the snippet); one bug fix (predictive-search route).

### Files touched

| File                                | Change                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `.theme-check.yml`                  | Disable `UnknownFilter` and `RemoteAsset` with explanatory comments                                                  |
| `snippets/predictive-search.liquid` | `<form action="/search" …>` → `<form action="{{ routes.search_url }}" …>` (line 49)                                  |
| `snippets/pagination.liquid` (NEW)  | Numbered-pages pagination nav using `paginate.parts`. Self-gates on `paginate.pages > 1`.                            |
| `sections/main-collection.liquid`   | Replace inline 70-line pagination markup (lines 324–393) with `{% render 'pagination' %}`                            |
| `sections/main-search.liquid`       | Read per-page via `assign per_page = section.settings.results_per_page` with a fallback of 24; render shared snippet |

### `.theme-check.yml` overrides

The current file is bare ignore-paths-only:

```yaml
root: .

ignore:
  - node_modules/
  - .shopify/
  - src/
  - docs/
```

Becomes (appending rule overrides at the end):

```yaml
root: .

ignore:
  - node_modules/
  - .shopify/
  - src/
  - docs/

# Rule overrides — see docs/superpowers/specs/2026-05-13-liquid-snippets-cleanup-design.md
# for the audit that produced these decisions.

UnknownFilter:
  # Bundled Theme Check doesn't recognize `push` (used in snippets/json-ld.liquid
  # to build social-links and breadcrumb arrays) or `qr_code` (used in
  # templates/gift_card.liquid). Both are real Shopify Liquid filters; the
  # bundled checker just lags on Shopify's filter list. Disabled globally
  # rather than play whack-a-mole on every new filter Shopify ships.
  enabled: false

RemoteAsset:
  # Misfires on canonical-URL `<link rel="canonical" href="{{ shop.url }}…">`
  # (snippets/canonicals.liquid) and on `{{ gift_card | qr_code }}` data URIs
  # (templates/gift_card.liquid). The rule's intent is third-party CDN assets;
  # this theme uses Shopify's CDN exclusively via asset_url filters.
  enabled: false
```

Trade-off: re-enabling either rule would catch real issues if future code introduces genuinely-unknown filters or actual third-party CDN URLs. A future maintainer auditing the config can trace decisions back to this spec via the comments and re-enable per-file via `ignored_paths` if needed.

### `snippets/pagination.liquid` (new)

**Contract:** renders nothing unless `paginate.pages > 1`. When it does render, produces `Previous` (icon) · numbered page list (with current-page highlight and Shopify-generated `…` truncation) · `Next` (icon).

**Consumer expectations:** both consuming sections call it identically inside a `{% paginate … %}` block:

```liquid
{% render 'pagination', paginate: paginate %}
```

Passing `paginate` explicitly makes the dependency visible at the call site. The snippet takes no other arguments.

**Key technical decisions:**

- Uses Shopify's `paginate.parts` array (modern API). Each entry has `title`, `url`, and `is_link` fields. Linked pages have `is_link = true`; the current page and ellipses have `is_link = false`. Discriminator: `part.title == paginate.current_page` separates current-page highlight from ellipsis entries.
- Drops the dead `current_tags` URL-construction branch that currently lives in `main-collection.liquid` (lines 357–365). `paginate.parts` URLs already include filter/tag/sort/search params correctly; the hand-rolled construction was both unnecessary and outdated (it dates from before Shopify Search & Discovery filters shipped).
- Tailwind classes preserved verbatim from `main-collection.liquid`'s current nav so the collection-page styling stays pixel-identical. Search inherits this styling — visual change there is the deliberate UX upgrade.

**Full snippet body:**

```liquid
{% comment %}
  Numbered pagination nav.

  Render inside a `{% paginate %}` block:
    {% render 'pagination', paginate: paginate %}

  Renders nothing when `paginate.pages <= 1`. Uses `paginate.parts`, which
  Shopify generates with the correct URLs (filters/tags/search-query preserved)
  and ellipsis entries for long ranges.
{% endcomment %}

{%- if paginate.pages > 1 -%}
  <nav
    class="flex justify-center items-center flex-wrap gap-1 mt-12"
    aria-label="Pagination"
  >
    {%- if paginate.previous -%}
      <a
        href="{{ paginate.previous.url }}"
        class="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 no-underline text-gray-700 text-sm"
        aria-label="Previous page"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </a>
    {%- endif -%}

    {%- for part in paginate.parts -%}
      {%- if part.is_link -%}
        <a
          href="{{ part.url }}"
          class="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 no-underline text-gray-700 text-sm"
        >
          {{- part.title -}}
        </a>
      {%- elsif part.title == paginate.current_page -%}
        <span
          class="w-10 h-10 flex items-center justify-center bg-gray-900 text-white rounded-lg text-sm"
          aria-current="page"
        >
          {{- part.title -}}
        </span>
      {%- else -%}
        <span
          class="w-10 h-10 flex items-center justify-center text-gray-400 text-sm"
          aria-hidden="true"
        >
          {{- part.title -}}
        </span>
      {%- endif -%}
    {%- endfor -%}

    {%- if paginate.next -%}
      <a
        href="{{ paginate.next.url }}"
        class="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 no-underline text-gray-700 text-sm"
        aria-label="Next page"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </a>
    {%- endif -%}
  </nav>
{%- endif -%}
```

### `sections/main-collection.liquid` change

Replace the existing pagination nav (everything between `{% if paginate.pages > 1 %}` at line 324 and `{% endif %}` at line 393) with:

```liquid
{% render 'pagination', paginate: paginate %}
```

The `{% if paginate.pages > 1 %}` guard goes away — the snippet self-gates. The dead `current_tags` branch goes with it.

### `sections/main-search.liquid` changes

Two adjustments:

1. Replace the existing structure at the top of the section body. Currently the file starts:

   ```liquid
   <section class="py-12">
     <div class="page-width">
       <h1 class="text-3xl font-bold mb-8">Search</h1>
   ```

   Add a `liquid` block before the section opens:

   ```liquid
   {%- liquid
     assign per_page = section.settings.results_per_page | default: 24
   -%}

   <section class="py-12">
   ```

   Update the paginate tag:

   ```liquid
   {% paginate search.results by per_page %}
   ```

   (was `{% paginate search.results by section.settings.results_per_page %}`).

2. Replace the existing Previous/Next nav (the 20-line `<nav>` inside `{% if paginate.pages > 1 %}`) with:

   ```liquid
   {% render 'pagination', paginate: paginate %}
   ```

   Drop the surrounding `{% if paginate.pages > 1 %}` — the snippet self-gates.

### `snippets/predictive-search.liquid` change

```liquid
<form action="/search" method="get" role="search" class="border-b border-gray-100">
```

becomes

```liquid
<form action="{{ routes.search_url }}" method="get" role="search" class="border-b border-gray-100">
```

Last `HardcodedRoutes` warning in the theme.

## Risks

- **`paginate.parts` is the modern API but the rendered HTML differs slightly from the hand-rolled `(1..paginate.pages)` loop.** Specifically, `paginate.parts` truncates long page lists with `…` entries; the current `main-collection.liquid` renders every single page number. For a collection with 50 pages, today's UI prints 50 buttons; after this change it'll print a more compact view. _Mitigation:_ this is a UX improvement, not a regression, and matches what every major Shopify theme does. Documented in the manual smoke checklist so it gets eyes during review.
- **Dropping the `current_tags` URL hack.** If a merchant uses the old `/collections/<handle>/tag1+tag2` URL pattern _and_ has multi-page tag-filtered results, the old code constructed the page-N URL by hand. `paginate.parts` URLs are produced by Shopify's pagination engine, which preserves tag-filter URL patterns correctly. _Mitigation:_ the manual smoke checklist explicitly tests this case.
- **Global rule disables.** If future commits introduce real `UnknownFilter` or `RemoteAsset` issues, Theme Check won't flag them. _Mitigation:_ explanatory comments in `.theme-check.yml` make the decision auditable; a follow-up commit can re-enable per-file via `ignored_paths`.
- **No risk to `json-ld.liquid` runtime behavior.** Only Theme Check noise is silenced; the file itself doesn't change.

## Testing & Verification

No new test infrastructure. Same flow as sub-projects 2 and 3.

**Automated**

- `npm run format:check` → exit 0.
- `npm run theme:check` → **3 offenses across 1 file** (down from 39 across 4). The only remaining file is `templates/gift_card.liquid` with 2 `ImgWidthAndHeight` errors and 1 `TranslationKeyExists` error. Exit code still 1 — these are sub-project 5 territory.

**Manual smoke**

1. **Collection page (largest behavior surface):**
   - Visit `/collections/all` (or any collection with > `products_per_page` items). Numbered pagination renders. Visually compare against a screenshot before the change — should be pixel-identical.
   - Apply one or more filters and navigate to page 2. URL preserves filter params; results respect filters.
   - Change sort order and navigate to page 2. URL preserves `sort_by`; results respect sort.
   - Set a price range, navigate to page 2. Same — preserved.
   - If the store uses tag-based URLs (`/collections/<handle>/tag1+tag2`), navigate to page 2. URL preserves tags.

2. **Search page (new UX):**
   - Submit `/search?q=<term>` with ≥ 25 matching results.
   - Numbered pagination renders (was Previous/Next only).
   - `?q=…` persists through page navigation.
   - For long result sets, `…` truncation looks reasonable (middle pages collapsed).

3. **Predictive search submit:**
   - With `settings.predictive_search_enabled` on, type in the search dropdown and press Enter.
   - Form submits to `/search?q=…`. On a Markets/multi-locale store, the URL is locale-prefixed correctly.

4. **`json-ld.liquid` runtime sanity:**
   - View page source on home, a product, a collection, an article, and a page.
   - Each should contain at least one well-formed `<script type="application/ld+json">` block.
   - Confirms `push` is still doing its array-building work — we only silenced Theme Check noise, not the runtime usage.

5. **No-regression spot check:**
   - Browser console clean on home, product, collection, cart, search, 404, blog, article.
   - `npm run format:check` exits 0.
   - `npm run theme:check` reports 3 offenses across 1 file; exit 1.

## Acceptance Criteria

- `.theme-check.yml` has `UnknownFilter: enabled: false` and `RemoteAsset: enabled: false`, both with explanatory comments pointing back to this spec.
- `snippets/predictive-search.liquid:49` uses `{{ routes.search_url }}`.
- `snippets/pagination.liquid` exists, uses `paginate.parts`, self-gates on `paginate.pages > 1`.
- `sections/main-collection.liquid` has no inline pagination markup; renders the shared snippet.
- `sections/main-search.liquid` reads per-page through `assign per_page = section.settings.results_per_page | default: 24`; renders the shared snippet (no inline nav).
- Collection page pagination is pixel-identical to before for short page-lists; uses `…` truncation for long page-lists (acceptable UX improvement).
- Search page pagination is numbered (UX upgrade) and preserves the `q=` query string across pages.
- `npm run format:check` exits 0.
- `npm run theme:check` reports 3 offenses across 1 file (`templates/gift_card.liquid`); exit still 1.
- One PR off `main`.

## Follow-Up Work (Not This Spec)

- Sub-project 5 — Templates & config: `templates/gift_card.liquid` `ImgWidthAndHeight` and `TranslationKeyExists` real errors.
- Sub-project 6 — CSS / Tailwind 4: any remaining `src/input.css` cleanup.
- Consider re-enabling `UnknownFilter` and `RemoteAsset` per-file (via `ignored_paths`) if the theme ever adds genuinely risky surfaces (third-party fonts, custom filter integrations). Tracked via the comments left in `.theme-check.yml`.
- If `paginate.parts`'s default truncation looks too aggressive in production, the snippet can grow a custom truncation algorithm later. Wait for the first real complaint.
