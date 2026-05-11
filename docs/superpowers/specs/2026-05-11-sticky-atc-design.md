# Sticky Add-to-Cart Bar — Design

**Date:** 2026-05-11
**Feature:** Mobile sticky add-to-cart bar on product pages
**Status:** Draft (pending user review)

## Context

This is a new feature on the heels of the free-shipping tracker (PR #3). Sub-project 2 (the JS cleanup) merged as `37ed0ce` and brought every custom element under the `Component` / `Drawer` patterns. `assets/product-form.js` already extends `Component`, uses `setup()`, and has a `#restoreButton(originalText)` helper from that cleanup. This feature builds on that foundation.

The mobile product page is long: image gallery first, then title + price + description + variant select + ATC. On scroll past the inline ATC, the customer loses a quick path to buy. A sticky bar solves it.

This spec brainstorm happened immediately after the free-shipping tracker spec. The two features are independent — different surfaces (cart drawer vs product page), different concerns. They land on different branches off `main`.

## Current State

- `sections/main-product.liquid:97-144` — inline `<product-form>` wraps a `{% form 'product', product %}` block with an optional variant `<select name="id">` (when `product.variants.size > 1`) or a hidden `<input name="id">` (single-variant), followed by a submit button reading "Add to cart" (or "Sold out" disabled when `product.available == false`).
- `assets/product-form.js` — `<product-form>` extends `Component`. `handleSubmit(e)` POSTs `FormData(this.form)` to `/cart/add.js`, fetches `/cart.js` for the new item count, dispatches `cart:updated` + `cart:open` on document, and writes a screen-reader announcement to `#cart-status`. Button state is managed via `#restoreButton(originalText)`.
- No sticky bar exists. No shared cart-add helper module — `product-form.js` owns the fetch/dispatch logic inline.
- `<cart-drawer>` listens on document for `cart:open` and `cart:refresh`. `<cart-icon>` listens for `cart:updated`. These events form the established API; the new bar reuses them.

## Goals

- New shared helper `assets/cart-add.js` exporting `async function addToCart({ id, quantity })`. POSTs to `/cart/add.js`, fetches `/cart.js`, dispatches `cart:updated` + `cart:open`, writes the screen-reader announcement to `#cart-status`. Throws on `!response.ok`.
- Refactor `assets/product-form.js` to call `addToCart()`. Removes the duplicated fetch + dispatch + announce code.
- New custom element `<sticky-atc>` (`assets/sticky-atc.js` + element rendered at the bottom of `sections/main-product.liquid`). Mobile-only.
- Bar visibility driven by an `IntersectionObserver` on the inline form's submit button. When the inline ATC leaves the viewport, the bar slides up; when it returns, the bar slides down.
- Compact bar layout: 40×40 thumbnail (`product.featured_image`) + truncated product title + `product.price | money` + ATC button. Single row, ~64px tall.
- Bar's button reads the current variant ID from the inline form at click time and calls `addToCart()`. Variant changes on the inline form are picked up automatically (no manual sync needed).
- Bar manages its own button state (`"Adding…"` / `"Error — try again"` / restore) independently of the inline button.
- Sold-out state: when `product.available == false`, bar button is `disabled` and reads "Sold out" (matching the inline button).

## Non-Goals

- No desktop bar. Two-column desktop layout already keeps inline ATC near the gallery.
- No variant selector inside the bar. User picks variant on the inline form (or accepts the default); bar mirrors the selection at click time.
- No variant-aware price update in the bar. Bar shows `product.price | money`, same as the inline product-info area, which also doesn't react to variant change. Variant-aware pricing is a separate concern out of scope.
- No quantity selector. Bar adds qty 1 (matches the inline form, which also has no qty input).
- No changes to `sections/cart-drawer.liquid`, `assets/cart-drawer.js`, `<cart-icon>`, or the event API (`cart:updated`, `cart:open`, `cart:refresh`).
- No page-bottom padding to "make room" for the bar. A follow-up can add that if it becomes a problem.
- No new theme settings. The feature is on for all product pages on mobile; merchants who want it off can remove the `<sticky-atc>` line.

## Architecture

### File layout

```
assets/
  cart-add.js              (NEW)  Shared addToCart() helper
  product-form.js          (MODIFIED) Uses cart-add helper
  sticky-atc.js            (NEW)  <sticky-atc> custom element

snippets/
  scripts.liquid           (MODIFIED) Importmap + script tags

sections/
  main-product.liquid      (MODIFIED) Renders <sticky-atc>
```

### `assets/cart-add.js`

Pure functional module, no DOM coupling beyond the `#cart-status` aria-live region.

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

### `assets/product-form.js` (refactored)

```js
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

The private `#announce` method goes away (now inside `cart-add.js`).

### `assets/sticky-atc.js`

```js
/**
 * Sticky add-to-cart bar for mobile product pages.
 *
 * Slides into view when the inline product form's submit button leaves
 * the viewport; slides out when it returns. The bar's own ATC button
 * reads the current variant from the inline form and adds it via the
 * shared cart-add helper.
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

### `sections/main-product.liquid` edit

After the closing `</section>` of the existing product section, append:

```liquid
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
```

Markup notes:

- `md:hidden` — Tailwind 4 hides the inner bar from 768px up. Desktop never sees it.
- `z-30` — sits above page content but below the cart drawer's overlay (`z-40`) and panel (`z-50`). When the cart drawer opens, it covers the sticky bar.
- `translate-y-full` + `data-[visible=true]:translate-y-0` — Tailwind 4's attribute-selector arbitrary variant drives the slide. JS just toggles `data-visible`; no class swapping, no custom CSS.
- `aria-hidden` flips in sync with `data-visible` so screen readers don't announce the offscreen bar.
- Image uses the existing `snippets/image.liquid` (`max_width: 80, sizes: '40px'`), consistent with the cart drawer's thumbnails.

### `snippets/scripts.liquid` edit

Add two importmap entries. The existing importmap is grouped by concern, not alphabetized, so place each entry near its peers:

```liquid
"@theme/cart-add": {{ 'cart-add.js' | asset_url | json }},
```

(positioned next to `@theme/cart-drawer` / `@theme/cart-icon` — the cart-related cluster)

```liquid
"@theme/sticky-atc": {{ 'sticky-atc.js' | asset_url | json }},
```

(positioned next to `@theme/product-form` / `@theme/product-gallery` — the product-page cluster)

Add a script tag inside the existing `{% if template contains 'product' %}` block:

```liquid
{% if template contains 'product' %}
  <script type="module" src="{{ 'product-gallery.js' | asset_url }}"></script>
  <script type="module" src="{{ 'sticky-atc.js' | asset_url }}"></script>
{% endif %}
```

`cart-add.js` doesn't need its own `<script>` tag — it's an importmap entry consumed by other modules.

### Data flow

```
inline ATC button leaves viewport (user scrolled)
   ↓
IntersectionObserver fires entry.isIntersecting = false
   ↓
<sticky-atc>[data-bar] dataset.visible = "true" → CSS transitions translate-y-full → translate-y-0
aria-hidden = "false"
   ↓
user taps the bar's ATC button
   ↓
#handleClick reads FormData(inlineForm).get("id") → variant id
   ↓
addToCart({ id, quantity: 1 }) → POST /cart/add.js → fetch /cart.js → dispatch cart:updated + cart:open
   ↓
<cart-drawer> opens (via cart:open listener)
<cart-icon> count updates (via cart:updated listener)
<sticky-atc> button restores to "Add to cart"
```

## Testing & Verification

Verification: `npm run format:check`, `npm run theme:check` (baseline preserved at 54 offenses / exit 1), and manual smoke against `shopify theme dev`.

Smoke checklist (mobile viewport via devtools, e.g. iPhone 375×800):

1. **Bar hidden at top of page.** Open a product page. Inline ATC visible → bar offscreen. Inspect `[data-bar]`: `data-visible="false"`, `aria-hidden="true"`.
2. **Bar slides up on scroll.** Scroll past the inline ATC → bar slides into view (200ms transition). `data-visible="true"`, `aria-hidden="false"`.
3. **Bar slides down on scroll-back.** Scroll back up to reveal the inline ATC → bar slides offscreen.
4. **Add to cart from bar.** With bar visible, tap "Add to cart". Button shows "Adding…" then restores. Cart drawer opens. Cart icon count increments. Screen-reader status fires.
5. **Variant respected.** On a multi-variant product: change the inline form's `<select>`, scroll past inline ATC, tap bar's ATC. The selected variant is added (verify in cart drawer).
6. **Sold-out state.** Visit a product with `available == false`. Bar button reads "Sold out", `disabled`. Tap does nothing.
7. **Failure path.** Block `/cart/add.js` in devtools. Tap bar's ATC. Button shows "Error — try again", restores after 2s. No console crash.
8. **Desktop no-show.** Resize to ≥768px → inner bar is `display: none` via `md:hidden`. The `<sticky-atc>` element is in the DOM but invisible.
9. **Cart drawer z-index.** With bar visible, open the cart drawer. Drawer overlay (`z-40`) covers the bar (`z-30`); drawer panel (`z-50`) is on top.
10. **Inline ATC regression.** After the `product-form.js` refactor, the inline ATC still works: button shows "Adding…", drawer opens, count updates. Failure path on inline button still shows "Error — try again" + restore after 2s.
11. **No-regression spot check.** Console clean on home, product, collection, /cart, search.

## Risks

- **`assets/product-form.js` refactor regression.** Most important smoke item (#10). _Mitigation:_ the refactor is purely an extraction — no behavior change beyond moving the fetch + dispatch + announce code into `cart-add.js`.
- **IntersectionObserver fires synchronously on mount.** If the user deep-links to a scroll position past the inline ATC, the bar appears immediately. This is correct.
- **Variant changes between visibility and click.** Bar reads `FormData(this.inlineForm).get("id")` at click time, so the latest variant is always used.
- **Bar overlaps page content.** Bottom ~64px of the page is covered while the bar is visible. _Mitigation:_ none for this spec; follow-up can add bottom padding.
- **`product.featured_image` missing.** Thumbnail renders as a 40×40 light-gray rounded box (the `{%- if product.featured_image -%}` guard prevents broken images).
- **Coexistence with free-shipping tracker (PR #3).** Both modify `snippets/scripts.liquid`. Additions are in different locations; git merge handles cleanly. No other shared files.

## Open Questions

None.

## Acceptance Criteria

- New `assets/cart-add.js` exports `async function addToCart({ id, quantity })` with the contract above.
- `assets/product-form.js` refactored to use `addToCart()`. Inline ATC behavior preserved end-to-end (success + error paths).
- New `assets/sticky-atc.js` defines `<sticky-atc>` extending `Component`. IntersectionObserver-driven visibility on `[data-bar]` via `data-visible` attribute. Bar button reads variant from inline form and submits via `addToCart()`. Independent button state lifecycle (`"Adding…"` / `"Error — try again"` / restore).
- New `<sticky-atc>` element rendered at the end of `sections/main-product.liquid`. Markup uses `md:hidden`, `z-30`, `translate-y-full` + `data-[visible=true]:translate-y-0`, `aria-hidden` in sync.
- Sold-out state: bar button reads "Sold out" + `disabled` when `product.available == false`.
- Two importmap entries in `snippets/scripts.liquid`: `@theme/cart-add` and `@theme/sticky-atc`. One script tag for `sticky-atc.js` inside the existing `{% if template contains 'product' %}` block.
- `npm run format:check` passes.
- `npm run theme:check` exit unchanged from baseline.
- Smoke checklist (11 items) passes.
- Single PR off `main`, branch `feature/sticky-atc`.

## Follow-Up Work (Not This Spec)

- Page-bottom padding when bar is visible (so the bar doesn't cover the footer / related products).
- Variant-aware price update (both in bar and in the inline product-info area).
- Quantity selector on both the inline form and the bar.
- Optional theme setting to disable the bar globally.
- Desktop variant of the bar (lower priority — desktop layout already keeps inline ATC near the gallery).
