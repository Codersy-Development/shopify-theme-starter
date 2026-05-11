# Sticky Add-to-Cart Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mobile-only sticky add-to-cart bar that slides into view when the inline `<product-form>` button leaves the viewport. The bar mirrors the inline form's variant selection and submits through a new shared `assets/cart-add.js` helper that `<product-form>` is also refactored to use.

**Architecture:** Two implementation tasks plus the branch + PR ceremony. Task 1 introduces a shared `addToCart({ id, quantity })` helper and refactors `<product-form>` onto it — pure refactor, theme behaves identically. Task 2 adds the `<sticky-atc>` custom element, wires it into `sections/main-product.liquid`, and registers it via the importmap. An `IntersectionObserver` on the inline submit button toggles a `data-visible` attribute that drives the slide-in via Tailwind 4's attribute-selector variant.

**Tech Stack:** Vanilla JS web components via importmap, Tailwind 4 utility classes (including `data-[visible=true]:translate-y-0` attribute variant and `md:hidden` breakpoint), Shopify Liquid sections + snippets, the existing `Component` base class from `assets/component.js`. No JS bundler. No new tooling.

**Spec:** [docs/superpowers/specs/2026-05-11-sticky-atc-design.md](../specs/2026-05-11-sticky-atc-design.md)

**Verification model (no tests added):**

- After every task: `npm run format:check` must pass.
- `npm run theme:check` must remain exit 1 with the same baseline summary: `55 files inspected with 54 total offenses found across 10 files. 34 errors. 20 warnings.` (File count may move up by 1 per new asset inspected — that's fine; offense count must not change.)
- Manual smoke checklist (11 items from the spec) runs in Task 3 against `shopify theme dev`.

**Branch & commit conventions:**

- Feature branch off `main`: `feature/sticky-atc`.
- Two implementation commits. Final task pushes and opens a draft PR (smoke testing happens against the PR, same flow as PR #3 / sub-project 2).

---

## Task 0: Create feature branch

**Files:** none

- [ ] **Step 1: Verify clean working tree**

Run: `git status --short`
Expected: only the untracked `docs/superpowers/PROGRESS.md` (carried over from earlier sessions). If anything else appears, stop and resolve before continuing.

- [ ] **Step 2: Verify on main and synced with origin**

Run: `git rev-parse --abbrev-ref HEAD && git fetch origin && git rev-list --count HEAD..origin/main`
Expected: branch is `main`, commit count behind origin is `0`. If you're behind, run `git pull --ff-only` before continuing.

- [ ] **Step 3: Create and check out branch**

Run: `git checkout -b feature/sticky-atc`
Expected: `Switched to a new branch 'feature/sticky-atc'`

---

## Task 1: Extract `addToCart()` helper + refactor `<product-form>`

**Goal:** Introduce a shared `assets/cart-add.js` helper and refactor `<product-form>` to use it. Pure extraction — no behavior change. Both files land in one commit so the theme is never in a transient "helper exists but unused" state.

**Files:**

- Create: `assets/cart-add.js`
- Modify: `assets/product-form.js`
- Modify: `snippets/scripts.liquid` (importmap entry only)

### Step 1: Create `assets/cart-add.js`

Create the file with this exact content:

```js
/**
 * Add an item to the cart via Shopify's AJAX API and broadcast the
 * resulting state. Returns the added item object on success.
 *
 * Dispatches on document:
 *  - cart:updated  { detail: { item_count } }   (after /cart.js refetch)
 *  - cart:open                                  (opens the cart drawer)
 *
 * Also writes the screen-reader announcement to #cart-status.
 *
 * Throws on non-OK response from /cart/add.js. Callers handle the
 * error UI (e.g. button "Error — try again" + restore).
 */
export async function addToCart({ id, quantity = 1 }) {
  const formData = new FormData();
  formData.append("id", id);
  formData.append("quantity", String(quantity));

  const response = await fetch("/cart/add.js", { method: "POST", body: formData });
  if (!response.ok) {
    throw new Error(`Add to cart failed: ${response.status}`);
  }
  const addedItem = await response.json();

  const cartResponse = await fetch("/cart.js");
  const cart = await cartResponse.json();

  document.dispatchEvent(
    new CustomEvent("cart:updated", { detail: { item_count: cart.item_count } }),
  );
  document.dispatchEvent(new CustomEvent("cart:open"));

  const status = document.getElementById("cart-status");
  if (status) {
    status.textContent = `Added ${addedItem.product_title} to cart. Cart now has ${cart.item_count} ${cart.item_count === 1 ? "item" : "items"}.`;
  }

  return addedItem;
}
```

### Step 2: Replace `assets/product-form.js`

Replace the entire file with:

```js
/**
 * Hijacks the product form to add items via the Cart AJAX API.
 *
 * Delegates the fetch + cart:updated/cart:open dispatch + screen-reader
 * announcement to the shared addToCart() helper. This class only owns
 * the button-state lifecycle (Adding... → success → restore, or error
 * → restore after 2s).
 */
import { Component } from "@theme/component";
import { addToCart } from "@theme/cart-add";

class ProductForm extends Component {
  static ERROR_RESET_MS = 2000;

  setup() {
    this.form = this.$("form");
    this.submitButton = this.$('[type="submit"]');
    this.form?.addEventListener("submit", (e) => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();

    const originalText = this.submitButton.textContent;
    this.submitButton.disabled = true;
    this.submitButton.setAttribute("aria-busy", "true");
    this.submitButton.textContent = "Adding...";

    try {
      const id = new FormData(this.form).get("id");
      await addToCart({ id, quantity: 1 });
      this.#restoreButton(originalText);
    } catch (error) {
      console.error("Add to cart error:", error);
      this.submitButton.textContent = "Error — try again";
      setTimeout(() => this.#restoreButton(originalText), ProductForm.ERROR_RESET_MS);
    }
  }

  #restoreButton(originalText) {
    this.submitButton.disabled = false;
    this.submitButton.removeAttribute("aria-busy");
    this.submitButton.textContent = originalText;
  }
}

customElements.define("product-form", ProductForm);

export { ProductForm };
```

Compared to the pre-refactor version: removes the inline fetch to `/cart/add.js` + fetch to `/cart.js` + `document.dispatchEvent(...)` calls + the inline `#announce()` helper. All of that moves into `cart-add.js`.

### Step 3: Add `@theme/cart-add` importmap entry in `snippets/scripts.liquid`

Use Edit. Replace this exact `old_string`:

```
      "@theme/drawer": {{ 'drawer.js' | asset_url | json }},
      "@theme/cart-drawer": {{ 'cart-drawer.js' | asset_url | json }},
```

with:

```
      "@theme/drawer": {{ 'drawer.js' | asset_url | json }},
      "@theme/cart-add": {{ 'cart-add.js' | asset_url | json }},
      "@theme/cart-drawer": {{ 'cart-drawer.js' | asset_url | json }},
```

`cart-add.js` does NOT need its own `<script type="module">` tag — it's consumed only via `import` statements from other modules.

### Step 4: Run format check

Run: `npm run format:check`
Expected: PASS (exit 0). `All matched files use Prettier code style!`

If the new `cart-add.js` triggers Prettier reflow, run `npx prettier --write assets/cart-add.js` and re-run `format:check`. Same for `product-form.js`. Reflow is acceptable as long as semantics are unchanged.

### Step 5: Run theme check

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with the baseline summary `55 files inspected with 54 total offenses found across 10 files. 34 errors. 20 warnings.` (Note: file count goes from 55 → 56 because Theme Check inspects the new `cart-add.js`. The OFFENSE count must stay at 54 unchanged.)

### Step 6: Confirm working tree contains only the expected changes

Run: `git status --short`
Expected:

```
?? assets/cart-add.js
?? docs/superpowers/PROGRESS.md
 M assets/product-form.js
 M snippets/scripts.liquid
```

(Order may vary.) `docs/superpowers/PROGRESS.md` is the unrelated untracked file from earlier sessions and must NOT be staged.

### Step 7: Commit

Stage only the three intended files (do NOT use `git add -A` or `git add .`):

```bash
git add assets/cart-add.js assets/product-form.js snippets/scripts.liquid
git commit -m "refactor: extract addToCart() helper, product-form delegates

Moves the /cart/add.js fetch + cart:updated/cart:open dispatch +
#cart-status announcement out of product-form.js into a shared
assets/cart-add.js helper. <product-form> retains only the
button-state lifecycle (Adding... → success → restore, or error
→ restore after 2s).

No behavior change. The helper is needed by the upcoming <sticky-atc>
custom element which can't reuse <product-form>'s submit flow."
```

---

## Task 2: Add `<sticky-atc>` custom element

**Goal:** Land the sticky bar end-to-end in one commit — new JS file, markup in the product section, importmap entry, and gated script tag.

**Files:**

- Create: `assets/sticky-atc.js`
- Modify: `sections/main-product.liquid`
- Modify: `snippets/scripts.liquid` (importmap entry + script tag)

### Step 1: Create `assets/sticky-atc.js`

Create the file with this exact content:

```js
/**
 * Sticky add-to-cart bar for mobile product pages.
 *
 * Slides into view when the inline product form's submit button leaves
 * the viewport; slides out when it returns. The bar's own ATC button
 * reads the current variant from the inline form and adds it via the
 * shared cart-add helper.
 *
 * Mobile-only visibility is handled by Tailwind's md:hidden in the
 * Liquid markup; this JS only drives the slide-in attribute toggle.
 */
import { Component } from "@theme/component";
import { addToCart } from "@theme/cart-add";

class StickyAtc extends Component {
  static ERROR_RESET_MS = 2000;

  setup() {
    this.bar = this.$("[data-bar]");
    this.button = this.$("[data-add-to-cart]");
    this.inlineForm = document.querySelector("product-form form");
    if (!this.bar || !this.button || !this.inlineForm) return;

    const triggerEl = this.inlineForm.querySelector('[type="submit"]');
    if (!triggerEl) return;

    new IntersectionObserver(
      ([entry]) => {
        const visible = !entry.isIntersecting;
        this.bar.dataset.visible = String(visible);
        this.bar.setAttribute("aria-hidden", String(!visible));
      },
      { rootMargin: "0px" },
    ).observe(triggerEl);

    this.button.addEventListener("click", (e) => this.#handleClick(e));
  }

  async #handleClick(e) {
    e.preventDefault();
    const id = new FormData(this.inlineForm).get("id");
    if (!id) return;

    const originalText = this.button.textContent;
    this.button.disabled = true;
    this.button.setAttribute("aria-busy", "true");
    this.button.textContent = "Adding...";

    try {
      await addToCart({ id, quantity: 1 });
      this.#restoreButton(originalText);
    } catch (error) {
      console.error("Sticky add to cart error:", error);
      this.button.textContent = "Error — try again";
      setTimeout(() => this.#restoreButton(originalText), StickyAtc.ERROR_RESET_MS);
    }
  }

  #restoreButton(originalText) {
    this.button.disabled = false;
    this.button.removeAttribute("aria-busy");
    this.button.textContent = originalText;
  }
}

customElements.define("sticky-atc", StickyAtc);

export { StickyAtc };
```

### Step 2: Append `<sticky-atc>` markup to `sections/main-product.liquid`

Use Edit. The current file ends with `</section>` (around line 148) followed by a blank line and then `{% schema %}` (around line 150). Replace this exact `old_string`:

```
</section>

{% schema %}
```

with:

```
</section>

<sticky-atc>
  <div
    data-bar
    data-visible="false"
    class="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white border-t border-gray-200 shadow-lg translate-y-full data-[visible=true]:translate-y-0 transition-transform duration-200 ease-out"
    aria-hidden="true"
  >
    <div class="flex items-center gap-3 px-4 py-3">
      <div class="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
        {%- if product.featured_image -%}
          {% render 'image',
            image: product.featured_image,
            max_width: 80,
            sizes: '40px',
            alt: product.title,
            class: 'w-full h-full object-cover'
          %}
        {%- endif -%}
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">{{ product.title }}</p>
        <p class="text-sm text-gray-600">{{ product.price | money }}</p>
      </div>

      <button
        type="button"
        data-add-to-cart
        class="bg-gray-900 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        {% unless product.available %}
          disabled
        {% endunless %}
      >
        {% if product.available %}
          Add to cart
        {% else %}
          Sold out
        {% endif %}
      </button>
    </div>
  </div>
</sticky-atc>

{% schema %}
```

The `<sticky-atc>` element is appended OUTSIDE the existing `<section>` so it can position-fix to the bottom of the viewport without inheriting the section's layout constraints.

### Step 3: Add `@theme/sticky-atc` importmap entry + script tag in `snippets/scripts.liquid`

Two edits.

**Edit A — importmap entry.** Use Edit. Replace this exact `old_string`:

```
      "@theme/product-gallery": {{ 'product-gallery.js' | asset_url | json }},
```

with:

```
      "@theme/product-gallery": {{ 'product-gallery.js' | asset_url | json }},
      "@theme/sticky-atc": {{ 'sticky-atc.js' | asset_url | json }},
```

**Edit B — script tag.** Use Edit. Replace this exact `old_string`:

```
{% if template contains 'product' %}
  <script type="module" src="{{ 'product-gallery.js' | asset_url }}"></script>
{% endif %}
```

with:

```
{% if template contains 'product' %}
  <script type="module" src="{{ 'product-gallery.js' | asset_url }}"></script>
  <script type="module" src="{{ 'sticky-atc.js' | asset_url }}"></script>
{% endif %}
```

### Step 4: Run format check

Run: `npm run format:check`
Expected: PASS (exit 0).

If Prettier reflows `assets/sticky-atc.js` or `sections/main-product.liquid`, run `npx prettier --write` on the affected file(s) and re-run `format:check`. Reflow is acceptable as long as semantics (variable names, attribute values, template logic) are unchanged.

### Step 5: Run theme check

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with the baseline `54 total offenses` summary unchanged. (File count increases by 1 — the new `sticky-atc.js` is inspected.)

### Step 6: Confirm working tree contains only the expected changes

Run: `git status --short`
Expected:

```
?? assets/sticky-atc.js
?? docs/superpowers/PROGRESS.md
 M sections/main-product.liquid
 M snippets/scripts.liquid
```

`docs/superpowers/PROGRESS.md` must NOT be staged.

### Step 7: Commit

```bash
git add assets/sticky-atc.js sections/main-product.liquid snippets/scripts.liquid
git commit -m "feat: sticky add-to-cart bar on mobile product pages

Adds <sticky-atc>: a mobile-only bar (md:hidden) that slides into view
when the inline product-form ATC scrolls out of the viewport, driven by
an IntersectionObserver on the inline submit button.

Bar shows a 40x40 thumbnail + truncated title + price + ATC button.
Reads the current variant from the inline form's FormData at click time
and submits via the shared addToCart() helper from the previous commit.

Independent button state (Adding... / Error - try again / restore) so
the bar reflects its own request lifecycle, not the inline form's.

z-30 keeps the bar below the cart drawer's overlay (z-40) and panel
(z-50)."
```

---

## Task 3: Smoke + push + open draft PR

**Goal:** Run the manual smoke checklist on `shopify theme dev`, then push and open a draft PR.

**Files:** none (this task is verification + PR).

### Step 1: Start the dev server

Run: `npm run dev`
Expected: Both `watch:css` and `shopify theme dev` start. The CLI prints a preview URL — open it in a browser.

### Step 2: Switch to mobile viewport

In Chrome devtools, enable the Device Toolbar (Cmd+Shift+M / Ctrl+Shift+M) and pick an iPhone-sized viewport (e.g., iPhone 14, 390×844, or any width < 768px).

### Step 3: Smoke — bar hidden at top of product page

Navigate to any product page. Confirm the inline ATC button is visible near the top.

Inspect `[data-bar]` in devtools:

- `data-visible="false"`
- `aria-hidden="true"`
- The bar's transform should be `translate-y-full` (no visible portion at the bottom of the viewport).

### Step 4: Smoke — bar slides up on scroll

Scroll the page down until the inline ATC button leaves the viewport. The sticky bar should slide into view from the bottom with a 200ms transition.

Inspect `[data-bar]` again:

- `data-visible="true"`
- `aria-hidden="false"`

### Step 5: Smoke — bar slides down on scroll-back

Scroll back up until the inline ATC re-enters the viewport. The bar should slide offscreen.

### Step 6: Smoke — add to cart from the bar

With the bar visible, tap "Add to cart" on the bar.

Expected:

- Bar button shows "Adding…" (disabled with `aria-busy="true"`).
- The cart drawer slides open with the new item.
- The cart-icon count bubble increments.
- The screen-reader status (`#cart-status`) announces "Added [Product] to cart. Cart now has N items."
- Bar button restores to "Add to cart".

### Step 7: Smoke — variant respected

On a multi-variant product (find one with `product.variants.size > 1`):

1. Scroll back to top so the inline form is visible.
2. Change the variant on the inline form's `<select name="id">`.
3. Scroll down past the inline ATC so the sticky bar appears.
4. Tap the bar's ATC.
5. Open the cart drawer and confirm the chosen variant was added (not the default).

### Step 8: Smoke — sold-out state

Find a product with `product.available == false` (or temporarily mark a product as sold out in the admin).

Expected:

- The bar's button reads "Sold out" with `disabled` attribute.
- Tapping does nothing.

### Step 9: Smoke — failure path

In devtools Network tab, block requests to `/cart/add.js` (right-click the resource → Block request URL, or use the Network conditions).

Tap the bar's ATC.

Expected:

- Bar button shows "Error — try again".
- After 2 seconds, button restores to "Add to cart".
- No uncaught exception in the console; `console.error("Sticky add to cart error:", ...)` is logged.

Unblock the URL when done.

### Step 10: Smoke — desktop no-show

Resize the viewport to ≥768px (or disable the device toolbar).

Expected:

- The `<sticky-atc>` element is still in the DOM.
- The inner `[data-bar]` has `display: none` from `md:hidden` (inspect computed styles to confirm).
- No portion of the bar is visible regardless of scroll position.

### Step 11: Smoke — cart drawer z-index

Back on mobile viewport, scroll until the bar is visible. Click the cart icon to open the cart drawer.

Expected:

- The cart drawer overlay covers the sticky bar (overlay is `z-40`, bar is `z-30`).
- The cart drawer panel (`z-50`) is on top of everything.
- Closing the drawer reveals the bar still in place (still `data-visible="true"` if the inline ATC is still offscreen).

### Step 12: Smoke — inline ATC regression check

This is the most important regression — `product-form.js` was refactored.

1. Scroll to the top of the product page (so the inline ATC is visible and the sticky bar is hidden).
2. Click the inline "Add to cart" button.

Expected:

- Inline button shows "Adding…" then restores.
- Cart drawer opens with the new item.
- Cart icon count increments.
- Screen-reader announcement fires.

Then test the error path on the inline button:

1. Block `/cart/add.js` in devtools.
2. Click the inline ATC.

Expected:

- Inline button shows "Error — try again".
- After 2s, restores to original text.
- No uncaught exception.

Unblock when done.

### Step 13: Smoke — no-regression spot check

Browse to: home page, collection page, `/cart`, search page. Open the cart drawer on each.

Expected: console clean (no errors, no warnings introduced by this branch). The sticky bar does NOT render on any non-product surface (it's defined in `sections/main-product.liquid` only).

### Step 14: Stop the dev server

`Ctrl-C` the `npm run dev` terminal.

### Step 15: Push the branch

```bash
git push -u origin feature/sticky-atc
```

### Step 16: Open the PR as draft

```bash
gh pr create --draft --title "feat: sticky add-to-cart bar on mobile product pages" --body "$(cat <<'EOF'
## Summary

Adds a mobile-only sticky add-to-cart bar to product pages. Slides into view when the inline \`<product-form>\` ATC scrolls out of the viewport (via \`IntersectionObserver\`), slides out when it returns. Bar shows a 40×40 thumbnail + truncated title + price + ATC button.

Also extracts a shared \`addToCart({ id, quantity })\` helper into \`assets/cart-add.js\` — \`<product-form>\` is refactored to use it too, so the cart-submission flow lives in one place.

Spec: [docs/superpowers/specs/2026-05-11-sticky-atc-design.md](../blob/feature/sticky-atc/docs/superpowers/specs/2026-05-11-sticky-atc-design.md)
Plan: [docs/superpowers/plans/2026-05-11-sticky-atc.md](../blob/feature/sticky-atc/docs/superpowers/plans/2026-05-11-sticky-atc.md)

## Files changed

- \`assets/cart-add.js\` (NEW) — exports \`async function addToCart({ id, quantity })\`. POSTs to /cart/add.js, fetches /cart.js, dispatches \`cart:updated\` + \`cart:open\`, writes #cart-status announcement.
- \`assets/product-form.js\` — refactored to delegate to \`addToCart()\`. No behavior change.
- \`assets/sticky-atc.js\` (NEW) — \`<sticky-atc>\` custom element extending Component. IntersectionObserver on the inline submit button toggles \`data-visible\` on the inner bar.
- \`sections/main-product.liquid\` — renders \`<sticky-atc>\` after the existing \`</section>\`.
- \`snippets/scripts.liquid\` — two importmap entries (\`@theme/cart-add\`, \`@theme/sticky-atc\`) + one gated \`<script type="module">\` for sticky-atc.js inside the existing \`{% if template contains 'product' %}\` block.

## Static checks

- [x] \`npm run format:check\` passes
- [x] \`npm run theme:check\` exit unchanged from baseline (54 total offenses across 10 files)

## Manual smoke checklist (browser, against \`shopify theme dev\`, mobile viewport)

Opened as **draft** because the manual smoke hasn't run yet. Move to ready-for-review after running it.

- [ ] Bar hidden at top of page (\`data-visible="false"\`, \`aria-hidden="true"\`)
- [ ] Bar slides up when inline ATC leaves viewport (200ms transition)
- [ ] Bar slides down when inline ATC re-enters viewport
- [ ] Add to cart from bar → drawer opens, count increments, button restores
- [ ] Multi-variant product: bar adds the variant selected on the inline form
- [ ] Sold-out product: bar button reads "Sold out", \`disabled\`
- [ ] Failure path: bar button shows "Error — try again", restores after 2s
- [ ] Desktop (≥768px): bar hidden via \`md:hidden\`
- [ ] Cart drawer z-index: overlay (z-40) covers the bar (z-30); panel (z-50) on top
- [ ] **Regression: inline ATC still works** (success path + error path after the refactor)
- [ ] No console errors on home, collection, /cart, search

## Behavior changes

None. The refactor is purely an extraction. The new sticky bar is additive.

## Coexistence with PR #3 (free-shipping tracker)

Both PRs touch \`snippets/scripts.liquid\` (different lines in the importmap and different conditional script-tag blocks). Git merge handles cleanly. No shared JS or section files.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL is printed.

---

## Self-Review (run after writing this plan)

This section is the plan author's pre-flight check; not a task for the implementer.

### Spec coverage

| Spec requirement                                                                     | Plan task                                            |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| New `assets/cart-add.js` exporting `addToCart({ id, quantity })`                     | Task 1 Step 1                                        |
| Refactor `assets/product-form.js` to use the helper                                  | Task 1 Step 2                                        |
| `@theme/cart-add` importmap entry                                                    | Task 1 Step 3                                        |
| New `assets/sticky-atc.js` with `<sticky-atc>` extending `Component`                 | Task 2 Step 1                                        |
| IntersectionObserver on inline submit button → toggle `data-visible`                 | Task 2 Step 1 (the `new IntersectionObserver` block) |
| Bar button reads variant from inline form, calls `addToCart()`                       | Task 2 Step 1 (`#handleClick`)                       |
| Independent button state lifecycle on the bar                                        | Task 2 Step 1 (`#restoreButton`)                     |
| `<sticky-atc>` markup rendered after the product section's `</section>`              | Task 2 Step 2                                        |
| `md:hidden`, `z-30`, `translate-y-full`, `data-[visible=true]:translate-y-0` classes | Task 2 Step 2 (markup)                               |
| `aria-hidden` toggled in sync with `data-visible`                                    | Task 2 Step 1 (`setAttribute("aria-hidden", ...)`)   |
| Sold-out state: button "Sold out" + `disabled`                                       | Task 2 Step 2 (`{% unless product.available %}`)     |
| `@theme/sticky-atc` importmap entry + gated script tag                               | Task 2 Step 3                                        |
| `npm run format:check` passes                                                        | Tasks 1, 2 Step 4 each                               |
| `npm run theme:check` baseline preserved                                             | Tasks 1, 2 Step 5 each                               |
| Smoke checklist (11 items, including inline-ATC regression)                          | Task 3 Steps 3–13                                    |
| Single PR off `feature/sticky-atc`                                                   | Task 3 Steps 15–16                                   |

All spec acceptance criteria covered.

### Placeholder scan

- No "TBD", "TODO", "fill in later" anywhere.
- All file paths concrete.
- All code blocks complete.
- PR body uses a real `gh pr create` command with full body content.
- One soft spot: Task 3 Step 7 says "find a multi-variant product" without naming one. That's necessary because the dev store's product catalog is unknown to the plan. The implementer chooses any qualifying product at smoke time. Acceptable.

### Type / signature consistency

- `addToCart({ id, quantity = 1 })` signature is consistent across `cart-add.js` (definition), `product-form.js` (caller in Task 1 Step 2), and `sticky-atc.js` (caller in Task 2 Step 1).
- `data-visible`, `data-bar`, `data-add-to-cart` attribute names match between the JS (`this.$("[data-bar]")` etc.) and the Liquid markup.
- Importmap entry names (`@theme/cart-add`, `@theme/sticky-atc`) match the `import` statements in the JS files.
- `customElements.define("sticky-atc", StickyAtc)` matches the `<sticky-atc>` tag name in the section.
- `ERROR_RESET_MS = 2000` is used in both `ProductForm` and `StickyAtc`, consistent.

No inconsistencies.

---

## Execution Handoff

Plan complete. Two execution options:

1. **Subagent-driven (recommended)** — fresh subagent per task, two-stage review (spec compliance → code quality). Task 2 is a larger change (3 files, ~80 lines of new JS) where review checkpoints help. Required sub-skill: `superpowers:subagent-driven-development`.
2. **Inline execution** — execute tasks in this session with checkpoints. Faster but less rigorous; the refactor in Task 1 benefits from review since `product-form.js` was just touched in sub-project 2.

Which approach?
