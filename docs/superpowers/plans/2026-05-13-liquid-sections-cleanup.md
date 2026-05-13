# Liquid Sections Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the 10 `HardcodedRoutes` warnings and the 5 `UndefinedObject` warnings (on `paginate`) that Theme Check reports in `sections/`. Add a `results_per_page` section setting to `main-search.liquid`.

**Architecture:** Six Liquid section files change. Five files get mechanical 1:1 string substitutions (`/`, `/cart`, `/search`, `/collections/all` → `routes` object equivalents). The sixth file, `sections/main-search.liquid`, gets one route substitution plus a `{% paginate %}` wrapper around its results loop plus a new `results_per_page` schema setting (mirroring `main-collection.liquid`'s `products_per_page`).

**Tech Stack:** Shopify Liquid, Shopify Theme Check, Prettier. No JavaScript or CSS changes.

**Spec:** [docs/superpowers/specs/2026-05-13-liquid-sections-cleanup-design.md](../specs/2026-05-13-liquid-sections-cleanup-design.md)

**Branch:** `feature/liquid-sections-cleanup` already exists off `main` with the spec committed (`716edae`). Continue working on this branch.

**Baseline Theme Check state (capture before any change):**

```
54 offenses across 10 files
34 errors, 20 warnings
exit 1
```

**Target after this plan:**

```
39 offenses across 4 files
34 errors, 5 warnings
exit 1
```

(All 6 touched section files clear entirely; remaining files are `snippets/canonicals.liquid`, `snippets/json-ld.liquid`, `snippets/predictive-search.liquid`, `templates/gift_card.liquid`.)

---

## Task 1: HardcodedRoutes substitutions in 5 section files

Swap all hardcoded routes in `sections/cart-drawer.liquid`, `sections/footer.liquid`, `sections/header.liquid`, `sections/main-404.liquid`, and `sections/main-cart.liquid` to use the `routes` object. `sections/main-search.liquid` is handled in Task 2 (along with its paginate fix) so all its changes ship together.

**Files:**

- Modify: `sections/cart-drawer.liquid` (2 substitutions)
- Modify: `sections/footer.liquid` (1 substitution)
- Modify: `sections/header.liquid` (3 substitutions)
- Modify: `sections/main-404.liquid` (1 substitution)
- Modify: `sections/main-cart.liquid` (2 substitutions)

**Substitution details** — each `old_string` below is uniquely anchored in its file; use the `Edit` tool with these exact strings.

- [ ] **Step 1.1: `sections/cart-drawer.liquid` — empty-state Continue shopping link**

`old_string`:

```liquid
          <a href="/collections/all" class="text-sm font-medium text-gray-900 underline" data-close>
```

`new_string`:

```liquid
          <a href="{{ routes.all_products_collection_url }}" class="text-sm font-medium text-gray-900 underline" data-close>
```

- [ ] **Step 1.2: `sections/cart-drawer.liquid` — View cart link in footer**

`old_string`:

<!-- prettier-ignore -->
```liquid
        <a
          href="/cart"
          class="block w-full text-center text-sm text-gray-600 mt-2 hover:text-gray-900 no-underline"
        >
          View cart
        </a>
```

`new_string`:

<!-- prettier-ignore -->
```liquid
        <a
          href="{{ routes.cart_url }}"
          class="block w-full text-center text-sm text-gray-600 mt-2 hover:text-gray-900 no-underline"
        >
          View cart
        </a>
```

- [ ] **Step 1.3: `sections/footer.liquid` — shop-name link**

`old_string`:

```liquid
        <a href="/" class="inline-block mb-4 no-underline" title="{{ shop.name }}">
```

`new_string`:

```liquid
        <a href="{{ routes.root_url }}" class="inline-block mb-4 no-underline" title="{{ shop.name }}">
```

- [ ] **Step 1.4: `sections/header.liquid` — logo link**

`old_string`:

```liquid
        <a
          href="/"
          class="text-xl font-bold text-gray-900 no-underline shrink-0"
          title="{{ shop.name }}"
        >
```

`new_string`:

```liquid
        <a
          href="{{ routes.root_url }}"
          class="text-xl font-bold text-gray-900 no-underline shrink-0"
          title="{{ shop.name }}"
        >
```

- [ ] **Step 1.5: `sections/header.liquid` — mobile search icon link**

`old_string`:

```liquid
          <a
            href="/search"
            class="text-gray-700 hover:text-gray-900 no-underline"
            aria-label="Search"
          >
```

`new_string`:

```liquid
          <a
            href="{{ routes.search_url }}"
            class="text-gray-700 hover:text-gray-900 no-underline"
            aria-label="Search"
          >
```

- [ ] **Step 1.6: `sections/header.liquid` — cart icon link**

`old_string`:

```liquid
            <a
              href="/cart"
              class="text-gray-700 hover:text-gray-900 no-underline relative"
              aria-label="Cart, {{ cart.item_count }} {{ cart.item_count | pluralize: 'item', 'items' }}"
            >
```

`new_string`:

```liquid
            <a
              href="{{ routes.cart_url }}"
              class="text-gray-700 hover:text-gray-900 no-underline relative"
              aria-label="Cart, {{ cart.item_count }} {{ cart.item_count | pluralize: 'item', 'items' }}"
            >
```

- [ ] **Step 1.7: `sections/main-404.liquid` — Go home button**

`old_string`:

```liquid
    <a
      href="/"
      class="inline-block bg-gray-900 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors no-underline"
    >
```

`new_string`:

```liquid
    <a
      href="{{ routes.root_url }}"
      class="inline-block bg-gray-900 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors no-underline"
    >
```

- [ ] **Step 1.8: `sections/main-cart.liquid` — line-item update form**

`old_string`:

```liquid
      <form action="/cart" method="post">
```

`new_string`:

```liquid
      <form action="{{ routes.cart_url }}" method="post">
```

- [ ] **Step 1.9: `sections/main-cart.liquid` — empty-state Continue shopping link**

`old_string`:

<!-- prettier-ignore -->
```liquid
        <a
          href="/collections/all"
          class="inline-block bg-gray-900 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors no-underline"
        >
          Continue shopping
        </a>
```

`new_string`:

<!-- prettier-ignore -->
```liquid
        <a
          href="{{ routes.all_products_collection_url }}"
          class="inline-block bg-gray-900 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors no-underline"
        >
          Continue shopping
        </a>
```

- [ ] **Step 1.10: Run Prettier on the changed files**

Run:

```bash
npx prettier --write sections/cart-drawer.liquid sections/footer.liquid sections/header.liquid sections/main-404.liquid sections/main-cart.liquid
```

Expected: each file printed with elapsed time. No "unchanged" warnings; Prettier may reformat surrounding whitespace it considers off. That's expected.

- [ ] **Step 1.11: Verify format and Theme Check progress**

Run:

```bash
npm run format:check
```

Expected: exit 0.

Run:

```bash
npm run theme:check
```

Expected: exit 1 (UnknownFilter errors in snippets/templates remain). Offense count drops from 54 → 45 (−9 HardcodedRoutes in these 5 files; `main-search.liquid` still has 1 HardcodedRoutes + 5 UndefinedObject = 6 offenses).

Sanity check — none of `sections/cart-drawer.liquid`, `sections/footer.liquid`, `sections/header.liquid`, `sections/main-404.liquid`, `sections/main-cart.liquid` should appear in the output. If any do, re-read that file and check whether the substitution applied correctly.

- [ ] **Step 1.12: Commit**

```bash
git add sections/cart-drawer.liquid sections/footer.liquid sections/header.liquid sections/main-404.liquid sections/main-cart.liquid
git commit -m "$(cat <<'EOF'
fix: use routes object instead of hardcoded URLs in sections

Removes 9 HardcodedRoutes warnings across 5 section files. The `routes`
object emits market-/locale-prefixed URLs on stores that use Markets or
language prefixes; the hardcoded `/`, `/cart`, `/search`,
`/collections/all` values silently broke for those merchants.

`main-search.liquid` is handled separately in the next commit (combined
with its paginate fix).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: one commit, 5 files changed.

---

## Task 2: main-search.liquid — paginate wrapper, route fix, schema setting

`sections/main-search.liquid` needs three changes. Doing them in one commit keeps the file's history clean.

**Files:**

- Modify: `sections/main-search.liquid` (3 changes: route, paginate wrapper, schema)

**Current file state** (relevant fragments):

```liquid
    <form action="/search" method="get" role="search" aria-label="Product search" class="mb-8">
```

```liquid
{% if search.performed %}
  {% if search.results_count > 0 %}
    <p class="text-sm text-gray-500 mb-6">
      {{ search.results_count }} result{% if search.results_count != 1 %}s{% endif %} for &ldquo;
      {{- search.terms -}}
      &rdquo;
    </p>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {% for item in search.results %}
        {% if item.object_type == 'product' %}
          {% render 'product-card', product: item %}
        {% else %}
          <a href="{{ item.url }}" class="no-underline">
            <h3 class="text-sm font-medium text-gray-900">{{ item.title }}</h3>
            {% if item.content != blank %}
              <p class="text-sm text-gray-500 mt-1 line-clamp-2">
                {{ item.content | strip_html | truncate: 120 }}
              </p>
            {% endif %}
          </a>
        {% endif %}
      {% endfor %}
    </div>

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
  {% else %}
    <p class="text-gray-500">
      No results found for &ldquo;{{ search.terms }}&rdquo;. Please try another search.
    </p>
  {% endif %}
{% endif %}
```

Current schema:

```liquid
{% schema %}
{
  "name": "Search",
  "tag": "section"
}
{% endschema %}
```

- [ ] **Step 2.1: Substitute the form `action` URL**

`old_string`:

```liquid
    <form action="/search" method="get" role="search" aria-label="Product search" class="mb-8">
```

`new_string`:

```liquid
    <form action="{{ routes.search_url }}" method="get" role="search" aria-label="Product search" class="mb-8">
```

- [ ] **Step 2.2: Wrap the results loop in `{% paginate %}`**

This is the core bug fix. The `{% paginate %}` wrapper goes inside the `{% if search.results_count > 0 %}` branch (the empty/un-performed branches don't need the wrapper).

`old_string`:

```liquid
      {% if search.results_count > 0 %}
        <p class="text-sm text-gray-500 mb-6">
          {{ search.results_count }} result{% if search.results_count != 1 %}s{% endif %} for
          &ldquo;{{ search.terms }}&rdquo;
        </p>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {% for item in search.results %}
            {% if item.object_type == 'product' %}
              {% render 'product-card', product: item %}
            {% else %}
              <a href="{{ item.url }}" class="no-underline">
                <h3 class="text-sm font-medium text-gray-900">{{ item.title }}</h3>
                {% if item.content != blank %}
                  <p class="text-sm text-gray-500 mt-1 line-clamp-2">
                    {{ item.content | strip_html | truncate: 120 }}
                  </p>
                {% endif %}
              </a>
            {% endif %}
          {% endfor %}
        </div>

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
      {% else %}
```

`new_string`:

```liquid
      {% if search.results_count > 0 %}
        {% paginate search.results by section.settings.results_per_page %}
          <p class="text-sm text-gray-500 mb-6">
            {{ search.results_count }} result{% if search.results_count != 1 %}s{% endif %} for
            &ldquo;{{ search.terms }}&rdquo;
          </p>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {% for item in search.results %}
              {% if item.object_type == 'product' %}
                {% render 'product-card', product: item %}
              {% else %}
                <a href="{{ item.url }}" class="no-underline">
                  <h3 class="text-sm font-medium text-gray-900">{{ item.title }}</h3>
                  {% if item.content != blank %}
                    <p class="text-sm text-gray-500 mt-1 line-clamp-2">
                      {{ item.content | strip_html | truncate: 120 }}
                    </p>
                  {% endif %}
                </a>
              {% endif %}
            {% endfor %}
          </div>

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
        {% endpaginate %}
      {% else %}
```

Notes:

- The entire inner block is indented by 2 spaces to sit inside the new `{% paginate %}`/`{% endpaginate %}` pair.
- `{% paginate %}` requires a paginatable resource — `search.results` qualifies. The `by` argument reads from the new schema setting added in Step 2.3.
- The Previous/Next nav itself is unchanged; only its surrounding wrapper changes.

- [ ] **Step 2.3: Add `results_per_page` schema setting**

`old_string`:

```liquid
{% schema %}
{
  "name": "Search",
  "tag": "section"
}
{% endschema %}
```

`new_string`:

```liquid
{% schema %}
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
{% endschema %}
```

(Mirrors `sections/main-collection.liquid`'s `products_per_page` exactly: same `min`, `max`, `step`, `default`.)

- [ ] **Step 2.4: Run Prettier on the file**

Run:

```bash
npx prettier --write sections/main-search.liquid
```

Expected: file printed with elapsed time. Prettier may re-indent the paginate wrapper — that's fine, just accept its output.

- [ ] **Step 2.5: Verify the file still parses and Theme Check is clean for this file**

Run:

```bash
npm run format:check
```

Expected: exit 0.

Run:

```bash
npm run theme:check
```

Expected: exit 1 (UnknownFilter errors in snippets/templates remain). Offense count drops from 45 → 39 (−1 HardcodedRoutes + −5 UndefinedObject on `paginate`). `sections/main-search.liquid` should no longer appear in the output. If it does, re-read the file and verify the `{% paginate %}` wrapper is correctly placed and the `action` URL was swapped.

Final offense state: **39 offenses across 4 files** — `snippets/canonicals.liquid`, `snippets/json-ld.liquid`, `snippets/predictive-search.liquid`, `templates/gift_card.liquid`. Exit code still 1.

- [ ] **Step 2.6: Commit**

```bash
git add sections/main-search.liquid
git commit -m "$(cat <<'EOF'
fix: paginate search results + use routes.search_url in main-search

Three changes in one file:

1. Wrap `{% for item in search.results %}` in `{% paginate search.results
   by section.settings.results_per_page %}`. The Previous/Next nav at the
   bottom of the file referenced `paginate.*` outside a paginate block,
   which is undefined — Theme Check flagged it five times and Previous/Next
   never rendered, even on > 1-page result sets. The nav is now live.
2. Add `results_per_page` range setting (8–48, step 4, default 24) to the
   section schema, mirroring `main-collection.liquid`'s `products_per_page`.
3. Swap the form `action="/search"` for `{{ routes.search_url }}` —
   completes the HardcodedRoutes sweep for sections/.

Theme Check now reports 39 offenses across 4 files (snippets + templates
remaining); was 54 across 10 before sub-project 3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: one commit, 1 file changed.

---

## Task 3: Push branch and open draft PR

- [ ] **Step 3.1: Verify branch state before pushing**

Run:

```bash
git status
git log --oneline main..HEAD
```

Expected status: clean working tree, branch `feature/liquid-sections-cleanup`. Expected log: 3 commits ahead of main —

```
<hash> fix: paginate search results + use routes.search_url in main-search
<hash> fix: use routes object instead of hardcoded URLs in sections
716edae docs: add Liquid sections cleanup spec
```

If the log shows extra commits, stop and investigate before pushing.

- [ ] **Step 3.2: Push the branch with upstream tracking**

Run:

```bash
git push -u origin feature/liquid-sections-cleanup
```

Expected: branch pushed, tracking set.

- [ ] **Step 3.3: Open a draft PR against main**

Run:

```bash
gh pr create --draft --base main --title "fix: routes object + paginate search results in sections" --body "$(cat <<'EOF'
## Summary

Sub-project 3 of the theme cleanup decomposition. Cleans up the `sections/` layer of Theme Check findings.

- Replaces 10 hardcoded URLs (`/`, `/cart`, `/search`, `/collections/all`) across 6 section files with their `routes` object equivalents. Latent bug fix for merchants on Markets / language-prefixed storefronts.
- Wraps `sections/main-search.liquid`'s results loop in `{% paginate search.results by section.settings.results_per_page %}`. The Previous/Next nav was dead code (referenced `paginate.*` outside a paginate block); now it renders correctly on multi-page result sets.
- Adds a `results_per_page` range setting (8–48, step 4, default 24) to the search section, mirroring `main-collection.liquid`'s `products_per_page`.

No JavaScript or CSS changes. Theme Check baseline drops from 54 offenses across 10 files to 39 across 4 (remaining: `snippets/canonicals.liquid`, `snippets/json-ld.liquid`, `snippets/predictive-search.liquid`, `templates/gift_card.liquid` — sub-projects 4 & 5).

Spec: [docs/superpowers/specs/2026-05-13-liquid-sections-cleanup-design.md](../blob/feature/liquid-sections-cleanup/docs/superpowers/specs/2026-05-13-liquid-sections-cleanup-design.md)
Plan: [docs/superpowers/plans/2026-05-13-liquid-sections-cleanup.md](../blob/feature/liquid-sections-cleanup/docs/superpowers/plans/2026-05-13-liquid-sections-cleanup.md)

## Test plan

- [ ] **Home** — header logo and cart icon both resolve; console clean.
- [ ] **Cart drawer** — open from the header. Empty-state "Continue shopping" link → `/collections/all`. Populated footer "View cart" → `/cart`.
- [ ] **Cart page** (`/cart`) — the line-item update form still submits and updates totals (this exercises the `<form action="{{ routes.cart_url }}">` change). Empty-state "Continue shopping" link → `/collections/all`.
- [ ] **404 page** (visit a bogus URL) — "Go home" button → `/`.
- [ ] **Search page** (`/search?q=…`)
  - [ ] Form submit reloads with results — `action="{{ routes.search_url }}"` resolves.
  - [ ] With ≥ 25 results (default `results_per_page` = 24), the Previous/Next nav now renders. Clicking Next navigates to page 2.
  - [ ] Theme customizer shows the new "Results per page" slider on the search section.
- [ ] **Footer** — shop-name link → `/`.
- [ ] **Header on every page** — logo, mobile search icon, and cart icon all resolve.
- [ ] **No-regression** — browser console clean on home, product, collection, cart, search, 404. `npm run format:check` exits 0. `npm run theme:check` offense count is 39 across 4 files; exit still 1.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: a draft PR URL is printed. Save it for the summary.

- [ ] **Step 3.4: Confirm PR URL and CI checks (if any)**

Run:

```bash
gh pr view --json url,isDraft,number
```

Expected: `isDraft: true`, a PR number, and a URL pointing at github.com.

---

## Self-Review

**Spec coverage:**

- [10 HardcodedRoutes warnings → routes object] — Task 1 covers 9 (cart-drawer ×2, footer, header ×3, main-404, main-cart ×2). Task 2 covers the 10th (main-search). ✓
- [5 UndefinedObject warnings on `paginate`] — Task 2 Step 2.2 wraps the loop in `{% paginate %}`. ✓
- [`results_per_page` schema setting] — Task 2 Step 2.3 adds it. ✓
- [Verification: format:check + theme:check + offense count] — Steps 1.11, 2.5, and the PR test plan all cover it. ✓
- [Single PR off main] — Task 3 opens one draft PR. ✓

**Placeholder scan:** No TBDs, no "implement later", no "similar to Task N". Every Edit step includes the full `old_string` and `new_string`. ✓

**Type consistency:** The schema's `results_per_page` setting id is referenced exactly once in code (`section.settings.results_per_page` in Step 2.2's `{% paginate %}`) — IDs match. ✓
