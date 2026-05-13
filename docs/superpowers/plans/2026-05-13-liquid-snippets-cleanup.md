# Liquid Snippets Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Silence the two Theme Check false-positive rule families (`UnknownFilter`, `RemoteAsset`) firing on legitimate modern Liquid patterns; fix the last real `HardcodedRoutes` warning in `snippets/predictive-search.liquid`; extract a shared `snippets/pagination.liquid` consumed by both `sections/main-collection.liquid` and `sections/main-search.liquid`.

**Architecture:** Five files change (one new, four modified). Two Theme Check rule overrides in `.theme-check.yml` (with explanatory comments). A new `snippets/pagination.liquid` (~60 lines, uses `paginate.parts`, self-gates on `paginate.pages > 1`). Both consuming sections render the snippet; `main-search.liquid` also normalizes its per-page read to mirror `main-collection.liquid`'s pattern.

**Tech Stack:** Shopify Liquid, Shopify Theme Check (bundled with `shopify` CLI 3.90.1), Prettier with `@shopify/prettier-plugin-liquid`. No JavaScript, CSS, or test infrastructure changes.

**Spec:** [docs/superpowers/specs/2026-05-13-liquid-snippets-cleanup-design.md](../specs/2026-05-13-liquid-snippets-cleanup-design.md)

**Branch:** `feature/liquid-snippets-cleanup` already exists off `main` (`fe2a24f`) with the spec committed (`42744fb`). Continue working on this branch.

**Baseline Theme Check state (capture before any change):**

```
39 offenses across 4 files
34 errors, 5 warnings
exit 1
```

**Target after this plan:**

```
3 offenses across 1 file
3 errors, 0 warnings
exit 1
```

Remaining 3 offenses are all in `templates/gift_card.liquid` (2 `ImgWidthAndHeight` errors + 1 `TranslationKeyExists` error). These belong to sub-project 5. After Task 1 the offense count is already at the final target — Tasks 2–4 are pure refactors that don't change Theme Check output.

---

## Task 1: `.theme-check.yml` rule overrides + `snippets/predictive-search.liquid` route fix

These two changes are bundled because both silence/fix Theme Check findings and are independent of the pagination refactor. After this task Theme Check should already report the final target (3 offenses across 1 file).

**Files:**

- Modify: `.theme-check.yml`
- Modify: `snippets/predictive-search.liquid` (1 substitution at line 49)

- [ ] **Step 1.1: Rewrite `.theme-check.yml` to add rule overrides**

`old_string`:

```yaml
# Shopify Theme Check configuration.
# https://shopify.dev/docs/themes/tools/theme-check/configuration

root: .

ignore:
  - node_modules/
  - .shopify/
  - src/
  - docs/
```

`new_string`:

```yaml
# Shopify Theme Check configuration.
# https://shopify.dev/docs/themes/tools/theme-check/configuration

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

- [ ] **Step 1.2: Substitute `/search` → `routes.search_url` in `snippets/predictive-search.liquid`**

`old_string`:

```liquid
    <form action="/search" method="get" role="search" class="border-b border-gray-100">
```

`new_string`:

```liquid
    <form action="{{ routes.search_url }}" method="get" role="search" class="border-b border-gray-100">
```

(Anchor: this is the only `action="/search"` occurrence in `predictive-search.liquid` — uniquely identifiable.)

- [ ] **Step 1.3: Run Prettier on the changed files**

Run:

```bash
npx prettier --write .theme-check.yml snippets/predictive-search.liquid
```

Expected: both files printed with elapsed time. Prettier may slightly reformat the YAML or expand the `<form>` tag onto multiple lines — accept the output.

- [ ] **Step 1.4: Verify format and Theme Check progress**

Run:

```bash
npm run format:check
```

Expected: exit 0.

Run:

```bash
npm run theme:check
```

Expected: exit 1 (3 errors remain in `templates/gift_card.liquid`). Offense count should now read **3 offenses across 1 file** — exit summary line:

```
55 files inspected with 3 total offenses found across 1 file.
3 errors.
0 warnings.
```

The only file appearing in the report should be `templates/gift_card.liquid` with two `ImgWidthAndHeight` errors and one `TranslationKeyExists` error. If anything else appears (especially `snippets/json-ld.liquid`, `snippets/canonicals.liquid`, or `snippets/predictive-search.liquid`), stop and report — the rule overrides didn't take effect or the substitution didn't apply correctly.

- [ ] **Step 1.5: Commit**

```bash
git add .theme-check.yml snippets/predictive-search.liquid
git commit -m "$(cat <<'EOF'
fix: silence Theme Check false positives + use routes.search_url in predictive-search

Two .theme-check.yml rule overrides:

1. UnknownFilter: disabled globally. The bundled Theme Check doesn't
   recognize `push` (json-ld.liquid social-links + breadcrumb array
   building) or `qr_code` (templates/gift_card.liquid). Both are real
   Shopify Liquid filters; the bundled checker just lags Shopify's
   filter list. Disable globally rather than play whack-a-mole.

2. RemoteAsset: disabled globally. Misfires on canonical URLs
   (`<link rel="canonical" href="{{ shop.url }}…">` in
   snippets/canonicals.liquid) and on `data:` URIs from `qr_code`
   (templates/gift_card.liquid). The rule's intent is third-party CDN
   assets; this theme uses Shopify's CDN exclusively.

Plus the last HardcodedRoutes warning in the theme:
predictive-search.liquid form action → routes.search_url.

Theme Check baseline now 3 offenses across 1 file (templates/gift_card.liquid,
sub-project 5 territory), down from 39 across 4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: one commit, 2 files changed.

---

## Task 2: Create `snippets/pagination.liquid`

Pure addition. The snippet isn't consumed by anything yet — Tasks 3 and 4 wire up the consumers.

**Files:**

- Create: `snippets/pagination.liquid`

- [ ] **Step 2.1: Create the file**

Write the following to `snippets/pagination.liquid`:

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

- [ ] **Step 2.2: Run Prettier on the new file**

```bash
npx prettier --write snippets/pagination.liquid
```

Expected: file printed with elapsed time. Prettier may slightly reformat indentation; accept the output.

- [ ] **Step 2.3: Verify**

```bash
npm run format:check
```

Expected: exit 0.

```bash
npm run theme:check
```

Expected: exit 1, **3 offenses across 1 file** (unchanged — the new snippet is not yet referenced by any consumer, but a standalone pagination snippet is valid Liquid in isolation). If Theme Check reports new offenses on `snippets/pagination.liquid`, stop and investigate.

- [ ] **Step 2.4: Commit**

```bash
git add snippets/pagination.liquid
git commit -m "$(cat <<'EOF'
feat: shared snippets/pagination.liquid

Numbered-pages pagination nav using `paginate.parts` (modern Shopify
API). Self-gates on `paginate.pages > 1`. Three render branches per part:

  - `part.is_link == true` → linked page number.
  - `part.title == paginate.current_page` → current-page highlight span.
  - Otherwise → ellipsis span (Shopify-generated truncation marker).

Tailwind classes match `main-collection.liquid`'s current inline nav
exactly, so collection-page pagination is pixel-identical after the
section refactor (Task 3 of this plan). Search-page pagination becomes
numbered (upgrade from Previous/Next only) when the search section is
refactored in Task 4.

Not consumed by any section yet — wire-up happens in Tasks 3 and 4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: one commit, 1 file added.

---

## Task 3: Refactor `sections/main-collection.liquid` to render the snippet

Replace ~70 lines of inline pagination markup with a single render call. Drops the dead `current_tags` URL-construction branch (lines 357–365 of today's file) — `paginate.parts` URLs already include filter/tag/sort params correctly.

**Files:**

- Modify: `sections/main-collection.liquid` (replace lines 323–393)

- [ ] **Step 3.1: Replace the inline pagination markup with a render call**

`old_string`:

```liquid
<!-- Pagination — all pages shown -->
{% if paginate.pages > 1 %}
  <nav
    class="flex justify-center items-center flex-wrap gap-1 mt-12"
    aria-label="Pagination"
  >
    {% if paginate.previous %}
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
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </a>
    {% endif %}

    {% for i in (1..paginate.pages) %}
      {% if i == paginate.current_page %}
        <span
          class="w-10 h-10 flex items-center justify-center bg-gray-900 text-white rounded-lg text-sm"
          aria-current="page"
        >
          {{- i -}}
        </span>
      {% else %}
        {%- assign page_url = paginate.collection_url | append: '?page=' | append: i -%}
        {%- if current_tags -%}
          {%- assign page_url = paginate.collection_url
            | append: '/'
            | append: current_tags
            | join: '+'
            | append: '?page='
            | append: i
          -%}
        {%- endif -%}
        <a
          href="{{ page_url }}"
          class="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 no-underline text-gray-700 text-sm"
        >
          {{- i -}}
        </a>
      {% endif %}
    {% endfor %}

    {% if paginate.next %}
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
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </a>
    {% endif %}
  </nav>
{% endif %}
```

`new_string`:

```liquid
{% render 'pagination', paginate: paginate %}
```

(The surrounding `{% if paginate.pages > 1 %}` guard goes away — the snippet self-gates.)

- [ ] **Step 3.2: Run Prettier on the file**

```bash
npx prettier --write sections/main-collection.liquid
```

Expected: file printed with elapsed time.

- [ ] **Step 3.3: Verify**

```bash
npm run format:check
```

Expected: exit 0.

```bash
npm run theme:check
```

Expected: exit 1, **3 offenses across 1 file** (unchanged — `templates/gift_card.liquid` only). `sections/main-collection.liquid` should not appear in the output.

- [ ] **Step 3.4: Commit**

```bash
git add sections/main-collection.liquid
git commit -m "$(cat <<'EOF'
refactor: main-collection renders shared pagination snippet

Replaces ~70 lines of inline pagination markup with a single
`{% render 'pagination', paginate: paginate %}` call. Drops the
dead `current_tags` URL-construction branch (paginate.parts URLs
already include filter/tag/sort params correctly — the hand-rolled
construction dates from before Shopify Search & Discovery shipped).

Short page lists stay pixel-identical. Long page lists now use
`…` truncation from `paginate.parts` instead of rendering every
page number — UX improvement, not a regression.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: one commit, 1 file changed.

---

## Task 4: Refactor `sections/main-search.liquid` to render the snippet + normalize per-page read

Two changes in one commit:

1. Add a `{%- liquid -%}` block at the top of the file to read `section.settings.results_per_page` through a variable with `| default: 24`, mirroring how `main-collection.liquid` reads `products_per_page`.
2. Replace the existing Previous/Next-only nav with `{% render 'pagination', paginate: paginate %}`. Search picks up numbered pagination — the deliberate UX upgrade.

**Files:**

- Modify: `sections/main-search.liquid` (two distinct changes)

- [ ] **Step 4.1: Add the top-of-file `liquid` block and update the paginate tag**

This change touches two non-adjacent locations. Do them as a single multi-line `old_string` so the changes are atomic. The `old_string` captures the file from line 1 through the `{% paginate %}` tag on line 34, and the `new_string` rewrites it with the new `liquid` block prepended and the paginate tag using `per_page`.

`old_string`:

```liquid
<section class="py-12">
  <div class="page-width">
    <h1 class="text-3xl font-bold mb-8">Search</h1>

    <form
      action="{{ routes.search_url }}"
      method="get"
      role="search"
      aria-label="Product search"
      class="mb-8"
    >
      <div class="flex gap-2">
        <label for="search-input" class="visually-hidden">Search</label>
        <input
          type="search"
          id="search-input"
          name="q"
          value="{{ search.terms | escape }}"
          placeholder="Search our store..."
          autocomplete="off"
          class="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        >
        <button
          type="submit"
          class="bg-gray-900 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Search
        </button>
      </div>
    </form>

    {% if search.performed %}
      {% if search.results_count > 0 %}
        {% paginate search.results by section.settings.results_per_page %}
```

`new_string`:

```liquid
{%- liquid
  assign per_page = section.settings.results_per_page | default: 24
-%}

<section class="py-12">
  <div class="page-width">
    <h1 class="text-3xl font-bold mb-8">Search</h1>

    <form
      action="{{ routes.search_url }}"
      method="get"
      role="search"
      aria-label="Product search"
      class="mb-8"
    >
      <div class="flex gap-2">
        <label for="search-input" class="visually-hidden">Search</label>
        <input
          type="search"
          id="search-input"
          name="q"
          value="{{ search.terms | escape }}"
          placeholder="Search our store..."
          autocomplete="off"
          class="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        >
        <button
          type="submit"
          class="bg-gray-900 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Search
        </button>
      </div>
    </form>

    {% if search.performed %}
      {% if search.results_count > 0 %}
        {% paginate search.results by per_page %}
```

- [ ] **Step 4.2: Replace the Previous/Next-only nav with a render call**

`old_string`:

```liquid
{% if paginate.pages > 1 %}
  <nav class="flex justify-center gap-2 mt-12" aria-label="Search results pagination">
    {% if paginate.previous %}
      <a
        href="{{ paginate.previous.url }}"
        class="px-4 py-2 border rounded-lg hover:bg-gray-50 no-underline text-gray-700"
        >Previous</a
      >
    {% endif %}
    {% if paginate.next %}
      <a
        href="{{ paginate.next.url }}"
        class="px-4 py-2 border rounded-lg hover:bg-gray-50 no-underline text-gray-700"
        >Next</a
      >
    {% endif %}
  </nav>
{% endif %}
```

`new_string`:

```liquid
{% render 'pagination', paginate: paginate %}
```

(The `{% if paginate.pages > 1 %}` guard is dropped — the snippet self-gates.)

- [ ] **Step 4.3: Run Prettier on the file**

```bash
npx prettier --write sections/main-search.liquid
```

Expected: file printed with elapsed time.

- [ ] **Step 4.4: Verify**

```bash
npm run format:check
```

Expected: exit 0.

```bash
npm run theme:check
```

Expected: exit 1, **3 offenses across 1 file** (still only `templates/gift_card.liquid`). `sections/main-search.liquid` should not appear.

Self-check — grep the modified file:

```bash
grep -c 'per_page' sections/main-search.liquid
grep -c "render 'pagination'" sections/main-search.liquid
grep -c "aria-label=\"Search results pagination\"" sections/main-search.liquid
```

Expected counts: 2 (one in the `assign`, one in the `{% paginate %}` tag), 1 (the new render call), 0 (the old nav is gone).

- [ ] **Step 4.5: Commit**

```bash
git add sections/main-search.liquid
git commit -m "$(cat <<'EOF'
refactor: main-search renders shared pagination snippet + normalizes per-page read

Two changes:

1. Per-page read now goes through `assign per_page =
   section.settings.results_per_page | default: 24` at the top of the
   section, then `{% paginate search.results by per_page %}`. Mirrors
   main-collection.liquid's pattern. Schema's `default: 24` already
   handles the fallback in practice; this just normalizes the read site.

2. The Previous/Next-only nav is replaced by `{% render 'pagination',
   paginate: paginate %}`. Search results now show numbered pagination
   identical to the collection page — a deliberate UX upgrade.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: one commit, 1 file changed.

---

## Task 5: Push branch and open draft PR

- [ ] **Step 5.1: Verify branch state before pushing**

```bash
git status
git log --oneline main..HEAD
```

Expected status: clean working tree, branch `feature/liquid-snippets-cleanup`. Expected log: 5 commits ahead of `main`:

```
<hash> refactor: main-search renders shared pagination snippet + normalizes per-page read
<hash> refactor: main-collection renders shared pagination snippet
<hash> feat: shared snippets/pagination.liquid
<hash> fix: silence Theme Check false positives + use routes.search_url in predictive-search
42744fb docs: add Liquid snippets cleanup spec
```

If the log shows different commits, stop and investigate.

- [ ] **Step 5.2: Push branch with upstream tracking**

```bash
git push -u origin feature/liquid-snippets-cleanup
```

- [ ] **Step 5.3: Open a draft PR against main**

```bash
gh pr create --draft --base main --title "fix: silence Theme Check false positives + shared pagination snippet" --body "$(cat <<'EOF'
## Summary

Sub-project 4 of the theme cleanup decomposition. Clears the snippets layer of Theme Check findings and extracts a shared pagination snippet that both `main-collection.liquid` and `main-search.liquid` consume.

- **`.theme-check.yml`** — disable `UnknownFilter` (`push` in `json-ld.liquid`, `qr_code` in `gift_card.liquid` — both real Shopify filters the bundled checker doesn't know) and `RemoteAsset` (misfires on canonical URLs in `canonicals.liquid` and on `data:` URIs from `qr_code`). Both overrides are commented with rationale pointing back to the spec.
- **`snippets/predictive-search.liquid`** — last `HardcodedRoutes` warning in the theme: `/search` → `{{ routes.search_url }}`.
- **`snippets/pagination.liquid` (new)** — numbered pagination using `paginate.parts`. Self-gates on `paginate.pages > 1`. ~60 lines.
- **`sections/main-collection.liquid`** — drops 70 lines of inline pagination markup (including the dead `current_tags` URL-construction branch) in favor of `{% render 'pagination' %}`.
- **`sections/main-search.liquid`** — same render call; also normalizes the per-page read to mirror `main-collection.liquid`'s `assign per_page = … | default: 24` pattern. Search results now show numbered pagination instead of Previous/Next-only — a deliberate UX upgrade.

Theme Check baseline drops from 39 across 4 files to **3 across 1 file** (`templates/gift_card.liquid` — sub-project 5 territory). Exit still 1 because 3 real errors remain there (2 `ImgWidthAndHeight` + 1 `TranslationKeyExists`).

Spec: [docs/superpowers/specs/2026-05-13-liquid-snippets-cleanup-design.md](../blob/feature/liquid-snippets-cleanup/docs/superpowers/specs/2026-05-13-liquid-snippets-cleanup-design.md)
Plan: [docs/superpowers/plans/2026-05-13-liquid-snippets-cleanup.md](../blob/feature/liquid-snippets-cleanup/docs/superpowers/plans/2026-05-13-liquid-snippets-cleanup.md)

## Test plan

- [ ] **Collection page (largest behavior surface).** Visit a collection with > `products_per_page` items.
  - [ ] Numbered pagination renders. Short page lists look pixel-identical to before.
  - [ ] Long page lists show `…` truncation (improvement from the old "show every page number" behavior).
  - [ ] Apply one or more filters and navigate to page 2 — URL preserves filter params.
  - [ ] Change sort order and navigate to page 2 — URL preserves `sort_by`.
  - [ ] Set a price range and navigate to page 2 — preserved.
  - [ ] If the store uses tag URLs (`/collections/<handle>/tag1+tag2`), navigate to page 2 — tags preserved.
- [ ] **Search page (new UX).** Submit `/search?q=…` with ≥ 25 matching results.
  - [ ] Numbered pagination renders (was Previous/Next only).
  - [ ] `q=` query persists when clicking page 2.
  - [ ] `…` truncation looks reasonable on long result sets.
- [ ] **Predictive search submit.** With `settings.predictive_search_enabled` on, type in the dropdown and press Enter. Form submits to `/search?q=…`; on a Markets/multi-locale store the URL is locale-prefixed correctly.
- [ ] **`json-ld.liquid` runtime sanity.** View page source on home / product / collection / article / page. Each contains at least one well-formed `<script type="application/ld+json">` block. (Confirms `push` is still doing its work; we only silenced the Theme Check noise.)
- [ ] **No-regression.** Browser console clean on home, product, collection, cart, search, 404, blog, article. `npm run format:check` exits 0. `npm run theme:check` reports 3 across 1 file (`templates/gift_card.liquid`); exit 1.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: a draft PR URL is printed.

- [ ] **Step 5.4: Confirm PR state**

```bash
gh pr view --json url,isDraft,number,baseRefName --jq .
```

Expected: `isDraft: true`, a PR number, `baseRefName: main`, and a github.com URL.

---

## Self-Review

**Spec coverage:**

- [`.theme-check.yml` overrides for `UnknownFilter` and `RemoteAsset` with commented rationale] — Task 1 Step 1.1. ✓
- [Predictive-search route fix] — Task 1 Step 1.2. ✓
- [`snippets/pagination.liquid` exists with `paginate.parts` and self-gating] — Task 2 Step 2.1. ✓
- [`main-collection.liquid` renders the snippet, drops inline markup including `current_tags` branch] — Task 3 Step 3.1. ✓
- [`main-search.liquid` renders the snippet and reads per-page through `assign … | default: 24`] — Task 4 Steps 4.1 + 4.2. ✓
- [Verification: format:check + theme:check + offense count of 3 across 1] — Steps 1.4, 2.3, 3.3, 4.4 all check; PR test plan covers manual smoke. ✓
- [Single PR off main] — Task 5. ✓

**Placeholder scan:** No TBDs, no "implement later", no "similar to Task N". Every Edit step includes the full `old_string` and `new_string`. The pagination snippet body is pasted in full (not referenced as "see spec"). Commands include expected output.

**Type consistency:**

- Snippet name: `pagination` in Step 2.1 file path matches `{% render 'pagination', paginate: paginate %}` in Steps 3.1 and 4.2. ✓
- Argument name `paginate` is passed identically in both render call sites. ✓
- `per_page` variable defined in Task 4 Step 4.1 is referenced in the same step's paginate tag. ✓
- Setting id `results_per_page` matches the schema declared in `main-search.liquid` (already present from sub-project 3, unchanged here). ✓
