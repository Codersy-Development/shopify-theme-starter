# JavaScript / Web Components Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the 11 JS files in `/assets/` of this Shopify starter theme — adopt the existing-but-unused `Component` base class, introduce a `Drawer` subclass to eliminate duplicated drawer logic, split `collection-filters.js` into three focused custom elements, convert `product-card.js` from a global click handler to a custom element, fix the inconsistent escaping in `predictive-search.js`, and fix the missing `change`-event dispatch in the price range slider.

**Architecture:** All `/assets/*.js` files become custom elements extending `Component` (existing in `assets/component.js`) or its new subclass `Drawer`. Drawer-style components (cart-drawer, header-drawer, plus the mobile mode of collection-filters) share open/close + body-scroll-lock + escape-to-close + focus-trap behavior via the `Drawer` base. The `<collection-filters>` orchestrator is split into `<collection-filters>` + `<price-range-slider>` + `<grid-switcher>` — each focused on one responsibility. `<product-card>` becomes a real custom element with self-scoped click handling. Behavior is preserved everywhere except for two intentional fixes: consistent escaping in `predictive-search`, and `change`-event dispatch from the range slider.

**Tech Stack:** Vanilla JS web components (custom elements), ES module imports via importmap, Tailwind 4 CDN-built CSS, Shopify Liquid sections/snippets, Prettier + Shopify Theme Check tooling from sub-project 1.

**Spec:** [docs/superpowers/specs/2026-05-10-javascript-cleanup-design.md](../specs/2026-05-10-javascript-cleanup-design.md)

**Verification model (no tests added):**
- After every task: `npm run format:check` must pass.
- `npm run theme:check` exit code must remain 1 with the same baseline (34 errors / 20 warnings) — this sub-project does not change Theme Check output.
- Smoke testing is manual against `shopify theme dev`. The full smoke checklist runs in Task 11.

**Branch & commit conventions:**
- Work on a feature branch off `main`: `cleanup/javascript-web-components`.
- Each task ends with a single commit. Commit messages use `refactor:`, `feat:`, `fix:`, or `style:` prefixes per the existing convention.
- Final task opens the PR.

---

## Task 0: Create feature branch

**Files:** none

- [ ] **Step 1: Verify clean working tree**

Run: `git status --short`
Expected: only untracked `docs/superpowers/PROGRESS.md` (left over from a prior session) — no other unstaged changes. If anything else appears, stop and resolve before continuing.

- [ ] **Step 2: Verify on main**

Run: `git rev-parse --abbrev-ref HEAD`
Expected: `main`

- [ ] **Step 3: Create and check out branch**

Run: `git checkout -b cleanup/javascript-web-components`
Expected: `Switched to a new branch 'cleanup/javascript-web-components'`

---

## Task 1: Adopt `Component` in mechanical refactors (4 files)

**Goal:** Convert four pure-mechanical files (`accordion.js`, `cart-icon.js`, `header-nav.js`, `product-gallery.js`) to extend `Component` and use `setup()` instead of inline `connectedCallback()`. No behavior changes.

**Files:**
- Modify: `assets/accordion.js`
- Modify: `assets/cart-icon.js`
- Modify: `assets/header-nav.js`
- Modify: `assets/product-gallery.js`

- [ ] **Step 1: Refactor `assets/accordion.js`**

Replace the entire file with:

```js
/**
 * Animated accordion group.
 * Uses CSS grid-template-rows for smooth open/close height transitions.
 */
import { Component } from "@theme/component";

class AccordionGroup extends Component {
  setup() {
    this.$$("[data-accordion-trigger]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.closest("[data-accordion]");
        const allowMultiple = this.hasAttribute("data-allow-multiple");

        if (item.classList.contains("is-open")) {
          this.#close(item);
        } else {
          if (!allowMultiple) {
            this.$$("[data-accordion].is-open").forEach((open) => this.#close(open));
          }
          this.#open(item);
        }
      });
    });

    // Open items marked with data-open
    this.$$("[data-accordion][data-open]").forEach((item) => this.#open(item));
  }

  #open(item) {
    item.classList.add("is-open");
    const trigger = item.querySelector("[data-accordion-trigger]");
    trigger?.setAttribute("aria-expanded", "true");
  }

  #close(item) {
    item.classList.remove("is-open");
    const trigger = item.querySelector("[data-accordion-trigger]");
    trigger?.setAttribute("aria-expanded", "false");
  }
}

customElements.define("accordion-group", AccordionGroup);

export { AccordionGroup };
```

- [ ] **Step 2: Refactor `assets/cart-icon.js`**

Replace the entire file with:

```js
/**
 * Updates the cart item count bubble and aria-label in the header.
 * Listens for cart:updated events to keep the count in sync.
 */
import { Component } from "@theme/component";

class CartIcon extends Component {
  setup() {
    this.countEl = this.$("[data-cart-count]");
    this.trigger = this.$("button, a");
    document.addEventListener("cart:updated", (e) => this.update(e.detail));
  }

  update(detail) {
    if (detail?.item_count === undefined) return;

    const count = detail.item_count;

    if (this.countEl) {
      this.countEl.textContent = count;
      this.countEl.hidden = count === 0;
    }

    // Update aria-label with current count
    if (this.trigger) {
      const label = count === 1 ? "Cart, 1 item" : `Cart, ${count} items`;
      this.trigger.setAttribute("aria-label", label);
    }
  }
}

customElements.define("cart-icon", CartIcon);

export { CartIcon };
```

- [ ] **Step 3: Refactor `assets/header-nav.js`**

Replace the entire file with:

```js
/**
 * Desktop navigation with dropdown and mega menu support.
 * Opens panels on hover (with delay) and keyboard interaction.
 */
import { Component } from "@theme/component";

class HeaderNav extends Component {
  /** @type {number} Delay in ms before closing a panel after mouse leaves */
  static CLOSE_DELAY = 150;

  setup() {
    this.items = this.$$("[data-nav-item]");

    this.items.forEach((item) => {
      const trigger = item.querySelector("[data-nav-trigger]");
      let closeTimeout;

      // Hover open/close with delay
      item.addEventListener("mouseenter", () => {
        clearTimeout(closeTimeout);
        this.#closeAll(item);
        this.#open(item);
      });

      item.addEventListener("mouseleave", () => {
        closeTimeout = setTimeout(() => this.#close(item), HeaderNav.CLOSE_DELAY);
      });

      // Keyboard: toggle on click/enter/space
      trigger?.addEventListener("click", (e) => {
        e.preventDefault();
        if (item.classList.contains("is-open")) {
          this.#close(item);
        } else {
          this.#closeAll(item);
          this.#open(item);
        }
      });

      // Keyboard: close on Escape
      item.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && item.classList.contains("is-open")) {
          this.#close(item);
          trigger?.focus();
        }
      });
    });

    // Close all when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.contains(e.target)) {
        this.#closeAll();
      }
    });
  }

  #open(item) {
    item.classList.add("is-open");
    item.querySelector("[data-nav-trigger]")?.setAttribute("aria-expanded", "true");
  }

  #close(item) {
    item.classList.remove("is-open");
    item.querySelector("[data-nav-trigger]")?.setAttribute("aria-expanded", "false");
  }

  /**
   * Close all open items except the one passed.
   * @param {Element} [except]
   */
  #closeAll(except) {
    this.items.forEach((item) => {
      if (item !== except) this.#close(item);
    });
  }
}

customElements.define("header-nav", HeaderNav);

export { HeaderNav };
```

- [ ] **Step 4: Refactor `assets/product-gallery.js`**

Replace the entire file with:

```js
/**
 * Product image gallery with thumbnails and swipe support.
 * Fades between images and syncs with variant selection.
 */
import { Component } from "@theme/component";

class ProductGallery extends Component {
  setup() {
    this.slides = this.$$("[data-image-slide]");
    this.thumbnails = this.$$("[data-thumbnail]");
    this.mainImage = this.$("[data-main-image]");

    if (this.slides.length <= 1) return;

    this.thumbnails.forEach((thumb) =>
      thumb.addEventListener("click", () => this.goTo(thumb.dataset.target)),
    );

    this.#initSwipe();
    this.#initVariantSync();
  }

  get currentIndex() {
    return [...this.slides].findIndex((s) => s.classList.contains("is-active"));
  }

  goTo(imageId) {
    const id = String(imageId);

    this.slides.forEach((slide) => {
      slide.classList.toggle("is-active", slide.dataset.imageId === id);
    });

    this.thumbnails.forEach((thumb) => {
      const isActive = thumb.dataset.target === id;
      thumb.classList.toggle("border-gray-900", isActive);
      thumb.classList.toggle("border-transparent", !isActive);
      thumb.setAttribute("aria-selected", isActive);
    });
  }

  next() {
    const idx = (this.currentIndex + 1) % this.slides.length;
    this.goTo(this.slides[idx].dataset.imageId);
  }

  prev() {
    const idx = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.goTo(this.slides[idx].dataset.imageId);
  }

  #initSwipe() {
    let startX = 0;

    this.mainImage?.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true },
    );

    this.mainImage?.addEventListener(
      "touchend",
      (e) => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          diff > 0 ? this.next() : this.prev();
        }
      },
      { passive: true },
    );
  }

  #initVariantSync() {
    const variantsEl = this.$("[data-product-variants]");
    if (!variantsEl) return;

    let variants;
    try {
      variants = JSON.parse(variantsEl.textContent);
    } catch {
      return;
    }

    const select = document.querySelector('product-form select[name="id"]');
    select?.addEventListener("change", (e) => {
      const variant = variants.find((v) => v.id === Number(e.target.value));
      if (variant?.featured_image) {
        this.goTo(variant.featured_image.id);
      }
    });
  }
}

customElements.define("product-gallery", ProductGallery);

export { ProductGallery };
```

- [ ] **Step 5: Run format check**

Run: `npm run format:check`
Expected: PASS (exit 0)

- [ ] **Step 6: Run theme check**

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with the same `54 total offenses` summary as baseline (34 errors / 20 warnings).

- [ ] **Step 7: Commit**

```bash
git add assets/accordion.js assets/cart-icon.js assets/header-nav.js assets/product-gallery.js
git commit -m "refactor: adopt Component base in mechanical web components

Convert accordion, cart-icon, header-nav, and product-gallery to extend
the existing Component class and use setup() instead of inline
connectedCallback. No behavior change."
```

---

## Task 2: Create `Drawer` base class

**Goal:** Add `assets/drawer.js`, register it in the importmap, and load it unconditionally. No consumer changes yet — Tasks 3, 4, and 7 will refactor `cart-drawer`, `header-drawer`, and `collection-filters` onto it.

**Files:**
- Create: `assets/drawer.js`
- Modify: `snippets/scripts.liquid`

- [ ] **Step 1: Create `assets/drawer.js`**

Create the file with this exact content:

```js
/**
 * Base class for drawer-style components.
 *
 * Encapsulates the open/close + body-scroll-lock + escape-to-close +
 * focus-trap behavior shared by cart-drawer, header-drawer, and the
 * mobile mode of collection-filters.
 *
 * Subclasses MUST call `super.setup()` first so that `this.panel` and
 * `this.overlay` are populated before subclass listeners run.
 *
 * Markup contract: the host element contains `[data-panel]` and
 * `[data-overlay]` descendants. Any descendant `[data-close]` closes
 * the drawer when clicked.
 *
 * For hosts that need drawer behavior on a sub-region of themselves
 * (e.g. <collection-filters> on its mobile filters aside), use the
 * static `Drawer.controllerFor(panel, overlay, host)` instead of
 * extending Drawer.
 */
import { Component } from "@theme/component";

class Drawer extends Component {
  /** Delay (ms) before focusing the close button so the open transition completes first. */
  static FOCUS_DELAY_MS = 350;

  setup() {
    this.panel = this.$("[data-panel]");
    this.overlay = this.$("[data-overlay]");
    this._returnFocusEl = null;

    this.$$("[data-close]").forEach((el) =>
      el.addEventListener("click", () => this.close()),
    );
    this.overlay?.addEventListener("click", () => this.close());

    document.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;
      if (e.key === "Escape") this.close();
      if (e.key === "Tab") this.#trapFocus(e);
    });
  }

  get isOpen() {
    return this.panel?.classList.contains("is-open");
  }

  open() {
    this._returnFocusEl = document.activeElement;
    this.panel?.classList.add("is-open");
    this.overlay?.classList.add("is-open");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      this.panel?.querySelector("[data-close]")?.focus();
    }, Drawer.FOCUS_DELAY_MS);
  }

  close() {
    if (!this.isOpen) return;

    this.panel?.classList.remove("is-open");
    this.overlay?.classList.remove("is-open");
    document.body.style.overflow = "";
    this._returnFocusEl?.focus?.();
  }

  #trapFocus(e) {
    const focusable = this.panel?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable || !focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /**
   * Build a drawer controller for hosts that don't extend Drawer.
   * Returns an object exposing the same `open()`, `close()`, and
   * `isOpen` interface, against the supplied panel and overlay.
   *
   * @param {Element} panel
   * @param {Element|null} overlay
   * @param {Element} host  Element the keydown listener filters against (Escape and Tab only fire while a descendant of host has focus or while host.contains(document.activeElement)).
   */
  static controllerFor(panel, overlay, host) {
    let returnFocusEl = null;

    const isOpen = () => panel?.classList.contains("is-open");

    const trapFocus = (e) => {
      const focusable = panel?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const open = () => {
      returnFocusEl = document.activeElement;
      panel?.classList.add("is-open");
      overlay?.classList.add("is-open");
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        panel?.querySelector("[data-close]")?.focus();
      }, Drawer.FOCUS_DELAY_MS);
    };

    const close = () => {
      if (!isOpen()) return;
      panel?.classList.remove("is-open");
      overlay?.classList.remove("is-open");
      document.body.style.overflow = "";
      returnFocusEl?.focus?.();
    };

    overlay?.addEventListener("click", close);
    panel?.querySelectorAll("[data-close]").forEach((el) =>
      el.addEventListener("click", close),
    );
    document.addEventListener("keydown", (e) => {
      if (!isOpen()) return;
      if (!host.contains(document.activeElement)) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") trapFocus(e);
    });

    return {
      open,
      close,
      get isOpen() {
        return isOpen();
      },
    };
  }
}

customElements.define("drawer-base", Drawer);

export { Drawer };
```

> Note: We register the class as `<drawer-base>` purely so `customElements.define` doesn't throw if a worker accidentally instantiates `<drawer-base>` in markup. The base class is not meant to be used directly in HTML; subclasses (e.g. `<cart-drawer>`) are.

- [ ] **Step 2: Add `@theme/drawer` to importmap and register script tag**

Open `snippets/scripts.liquid`. Update it to:

```liquid
<script type="importmap">
  {
    "imports": {
      "@theme/component": {{ 'component.js' | asset_url | json }},
      "@theme/drawer": {{ 'drawer.js' | asset_url | json }},
      "@theme/cart-drawer": {{ 'cart-drawer.js' | asset_url | json }},
      "@theme/cart-icon": {{ 'cart-icon.js' | asset_url | json }},
      "@theme/product-form": {{ 'product-form.js' | asset_url | json }},
      "@theme/header-drawer": {{ 'header-drawer.js' | asset_url | json }},
      "@theme/predictive-search": {{ 'predictive-search.js' | asset_url | json }},
      "@theme/product-gallery": {{ 'product-gallery.js' | asset_url | json }},
      "@theme/collection-filters": {{ 'collection-filters.js' | asset_url | json }},
      "@theme/accordion": {{ 'accordion.js' | asset_url | json }},
      "@theme/product-card": {{ 'product-card.js' | asset_url | json }},
      "@theme/header-nav": {{ 'header-nav.js' | asset_url | json }}
    }
  }
</script>

<script type="module" src="{{ 'component.js' | asset_url }}"></script>
<script type="module" src="{{ 'drawer.js' | asset_url }}"></script>
<script type="module" src="{{ 'product-form.js' | asset_url }}"></script>
<script type="module" src="{{ 'accordion.js' | asset_url }}"></script>
<script type="module" src="{{ 'product-card.js' | asset_url }}"></script>

{% if template contains 'product' %}
  <script type="module" src="{{ 'product-gallery.js' | asset_url }}"></script>
{% endif %}

{% if template contains 'collection' %}
  <script type="module" src="{{ 'collection-filters.js' | asset_url }}"></script>
{% endif %}
<script type="module" src="{{ 'header-drawer.js' | asset_url }}"></script>
<script type="module" src="{{ 'header-nav.js' | asset_url }}"></script>
<script type="module" src="{{ 'cart-icon.js' | asset_url }}"></script>

{% if settings.cart_type == 'drawer' %}
  <script type="module" src="{{ 'cart-drawer.js' | asset_url }}"></script>
{% endif %}

{% if settings.predictive_search_enabled %}
  <script type="module" src="{{ 'predictive-search.js' | asset_url }}"></script>
{% endif %}
```

> The two added lines: a `@theme/drawer` entry in the importmap (alphabetized after `component`), and a `<script type="module" src="{{ 'drawer.js' | asset_url }}"></script>` tag below the `component.js` tag. The other importmap entries we'll add for `price-range-slider` and `grid-switcher` come in Tasks 5 and 6.

- [ ] **Step 3: Run format check**

Run: `npm run format:check`
Expected: PASS

- [ ] **Step 4: Run theme check**

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with unchanged baseline (34 errors / 20 warnings).

- [ ] **Step 5: Commit**

```bash
git add assets/drawer.js snippets/scripts.liquid
git commit -m "feat: add Drawer base class for shared drawer behavior

Extracts the open/close + body-scroll-lock + escape-to-close + focus-trap
logic that cart-drawer and header-drawer currently duplicate. Also
exposes Drawer.controllerFor() for hosts (collection-filters) that need
the same behavior on a sub-region rather than as a custom element.

No consumers yet; subsequent commits migrate cart-drawer, header-drawer,
and collection-filters onto it."
```

---

## Task 3: Refactor `cart-drawer` to extend `Drawer`

**Goal:** `<cart-drawer>` extends `Drawer`. The duplicated focus-trap, escape, body-lock, and return-focus logic comes from the base class. Cart-specific behavior (event listeners for `cart:open` / `cart:refresh`, quantity buttons, `refresh()`) stays.

**Files:**
- Modify: `assets/cart-drawer.js`

- [ ] **Step 1: Replace `assets/cart-drawer.js`**

Replace the entire file with:

```js
/**
 * Cart drawer with quantity controls.
 *
 * Open/close + body lock + escape + focus trap come from Drawer.
 * This subclass adds: cart:open / cart:refresh event listeners,
 * quantity-button click delegation, and Section Rendering API
 * refresh logic.
 */
import { Drawer } from "@theme/drawer";

class CartDrawer extends Drawer {
  setup() {
    super.setup();

    document.addEventListener("cart:open", () => this.open());
    document.addEventListener("cart:refresh", () => this.refresh());

    this.#bindQuantityButtons();
  }

  open() {
    super.open();
    this.refresh();
  }

  #bindQuantityButtons() {
    this.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-change-qty]");
      if (!btn) return;
      const line = parseInt(btn.dataset.line, 10);
      const qty = parseInt(btn.dataset.qty, 10);
      this.#updateQuantity(line, qty);
    });
  }

  async #updateQuantity(line, quantity) {
    try {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line, quantity }),
      });

      if (!response.ok) throw new Error("Failed to update cart");

      const cart = await response.json();

      document.dispatchEvent(
        new CustomEvent("cart:updated", { detail: { item_count: cart.item_count } }),
      );

      const status = document.getElementById("cart-status");
      if (status) {
        status.textContent =
          quantity === 0
            ? "Item removed from cart."
            : `Cart updated. ${cart.item_count} ${cart.item_count === 1 ? "item" : "items"} in cart.`;
      }

      await this.refresh();
    } catch (error) {
      console.error("Cart update error:", error);
    }
  }

  async refresh() {
    try {
      const response = await fetch(`${window.location.pathname}?sections=cart-drawer`);
      const data = await response.json();
      const html = data["cart-drawer"];

      if (html) {
        const fragment = document.createRange().createContextualFragment(html);
        const newContent = fragment.querySelector("[data-cart-drawer-content]");
        const currentContent = this.$("[data-cart-drawer-content]");
        if (newContent && currentContent) {
          currentContent.replaceWith(newContent);
        }
        const newFooter = fragment.querySelector("[data-cart-drawer-footer]");
        const currentFooter = this.$("[data-cart-drawer-footer]");
        if (newFooter && currentFooter) {
          currentFooter.replaceWith(newFooter);
        } else if (newFooter && !currentFooter) {
          this.panel.appendChild(newFooter);
        } else if (!newFooter && currentFooter) {
          currentFooter.remove();
        }
      }
    } catch (error) {
      console.error("Failed to refresh cart drawer:", error);
    }
  }
}

customElements.define("cart-drawer", CartDrawer);

export { CartDrawer };
```

- [ ] **Step 2: Run format check**

Run: `npm run format:check`
Expected: PASS

- [ ] **Step 3: Run theme check**

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with unchanged baseline.

- [ ] **Step 4: Commit**

```bash
git add assets/cart-drawer.js
git commit -m "refactor: cart-drawer extends Drawer

Removes the duplicated focus trap, escape handling, body-overflow lock,
and return-focus logic — all inherited from the new Drawer base. Cart
event listeners, quantity-button delegation, and Section Rendering API
refresh stay."
```

---

## Task 4: Refactor `header-drawer` to extend `Drawer`

**Goal:** `<header-drawer>` extends `Drawer`. The hamburger button still toggles `aria-expanded`. All other duplicated logic moves to the base class.

**Files:**
- Modify: `assets/header-drawer.js`

- [ ] **Step 1: Replace `assets/header-drawer.js`**

Replace the entire file with:

```js
/**
 * Mobile menu drawer.
 * Open/close + body lock + escape + focus trap come from Drawer.
 * This subclass adds: hamburger trigger and aria-expanded sync.
 */
import { Drawer } from "@theme/drawer";

class HeaderDrawer extends Drawer {
  setup() {
    super.setup();
    this.openBtn = this.$("[data-open]");
    this.openBtn?.addEventListener("click", () => this.open());
  }

  open() {
    super.open();
    this.openBtn?.setAttribute("aria-expanded", "true");
  }

  close() {
    if (!this.isOpen) return;
    super.close();
    this.openBtn?.setAttribute("aria-expanded", "false");
    this.openBtn?.focus();
  }
}

customElements.define("header-drawer", HeaderDrawer);

export { HeaderDrawer };
```

> Subclass note: `super.close()` already calls `_returnFocusEl?.focus()`, but the original `header-drawer.js` calls `this.openBtn?.focus()` explicitly after closing. We keep the explicit `openBtn?.focus()` so the focus return is deterministic (returnFocusEl could be a different element if the user tabbed elsewhere before pressing Escape).

- [ ] **Step 2: Run format check**

Run: `npm run format:check`
Expected: PASS

- [ ] **Step 3: Run theme check**

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with unchanged baseline.

- [ ] **Step 4: Commit**

```bash
git add assets/header-drawer.js
git commit -m "refactor: header-drawer extends Drawer

Inherits focus trap, escape, body lock, return focus from the base
class. Subclass keeps the hamburger trigger and aria-expanded sync."
```

---

## Task 5: Extract `<grid-switcher>` from `collection-filters`

**Goal:** Create `<grid-switcher>` as a focused custom element. Wrap the grid-column buttons in `sections/main-collection.liquid` with the new element. Remove the `#initGridSwitcher` and `#setGrid` methods (and the call site in `connectedCallback`) from `collection-filters.js`.

**Files:**
- Create: `assets/grid-switcher.js`
- Modify: `sections/main-collection.liquid` (lines 41–68 area — wrap the radiogroup div)
- Modify: `snippets/scripts.liquid`
- Modify: `assets/collection-filters.js`

- [ ] **Step 1: Create `assets/grid-switcher.js`**

```js
/**
 * Grid column switcher for collection pages.
 * Toggles md:grid-cols-N classes on the parent <collection-filters>'s
 * [data-product-grid] element and persists the user choice in
 * localStorage under "collection-grid-cols".
 */
import { Component } from "@theme/component";

class GridSwitcher extends Component {
  static STORAGE_KEY = "collection-grid-cols";

  setup() {
    this.grid = this.closest("collection-filters")?.querySelector("[data-product-grid]");
    this.btns = this.$$("[data-grid]");
    if (!this.grid || !this.btns.length) return;

    const saved = localStorage.getItem(GridSwitcher.STORAGE_KEY);
    if (saved) this.#apply(saved);

    this.btns.forEach((btn) =>
      btn.addEventListener("click", () => {
        const cols = btn.dataset.grid;
        this.#apply(cols);
        localStorage.setItem(GridSwitcher.STORAGE_KEY, cols);
      }),
    );
  }

  #apply(cols) {
    this.grid.classList.remove("md:grid-cols-3", "md:grid-cols-4");
    this.grid.classList.add(`md:grid-cols-${cols}`);
    this.btns.forEach((b) => {
      b.classList.toggle("bg-gray-100", b.dataset.grid === cols);
    });
  }
}

customElements.define("grid-switcher", GridSwitcher);

export { GridSwitcher };
```

- [ ] **Step 2: Wrap the grid-switcher markup in `sections/main-collection.liquid`**

In `sections/main-collection.liquid`, locate the block at lines 43–68 (the `<div role="radiogroup" aria-label="Grid columns">` wrapping the two grid buttons). Change the wrapper from `<div>` to `<grid-switcher>` and the closing `</div>` accordingly.

Before (lines 43–68):

```liquid
              <div
                class="hidden md:flex items-center gap-1"
                role="radiogroup"
                aria-label="Grid columns"
              >
                <button
                  type="button"
                  data-grid="3"
                  …
                </button>
                <button
                  type="button"
                  data-grid="4"
                  …
                </button>
              </div>
```

After:

```liquid
              <grid-switcher
                class="hidden md:flex items-center gap-1"
                role="radiogroup"
                aria-label="Grid columns"
              >
                <button
                  type="button"
                  data-grid="3"
                  …
                </button>
                <button
                  type="button"
                  data-grid="4"
                  …
                </button>
              </grid-switcher>
```

> Use Edit to replace `<div\n                class="hidden md:flex items-center gap-1"\n                role="radiogroup"\n                aria-label="Grid columns"\n              >` with `<grid-switcher\n                class="hidden md:flex items-center gap-1"\n                role="radiogroup"\n                aria-label="Grid columns"\n              >`. Then change the matching `</div>` (the one closing this block, around line 68) to `</grid-switcher>`. To disambiguate the closing tag, include enough surrounding context (the closing `</button>` immediately before it).

- [ ] **Step 3: Register `@theme/grid-switcher` in `snippets/scripts.liquid`**

Add an importmap entry and a gated script tag.

In the importmap block, add (alphabetized between `cart-icon` and `header-drawer`):

```liquid
      "@theme/grid-switcher": {{ 'grid-switcher.js' | asset_url | json }},
```

In the `{% if template contains 'collection' %}` block, add a script tag below the existing `collection-filters.js` line:

```liquid
{% if template contains 'collection' %}
  <script type="module" src="{{ 'collection-filters.js' | asset_url }}"></script>
  <script type="module" src="{{ 'grid-switcher.js' | asset_url }}"></script>
{% endif %}
```

- [ ] **Step 4: Remove grid-switcher logic from `assets/collection-filters.js`**

In `assets/collection-filters.js`:
1. Remove the line `this.#initGridSwitcher();` from `connectedCallback()`.
2. Remove both private methods `#initGridSwitcher()` and `#setGrid()` (currently lines ~82–105).

The rest of the file stays unchanged in this task — the file still extends `HTMLElement` and still owns the range slider; both will move out in Task 6 and Task 7.

- [ ] **Step 5: Run format check**

Run: `npm run format:check`
Expected: PASS

- [ ] **Step 6: Run theme check**

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with unchanged baseline.

- [ ] **Step 7: Commit**

```bash
git add assets/grid-switcher.js sections/main-collection.liquid snippets/scripts.liquid assets/collection-filters.js
git commit -m "refactor: extract <grid-switcher> from collection-filters

Moves the grid-column toggle + localStorage persistence into a focused
custom element. Wraps the existing radiogroup div in main-collection.liquid
with <grid-switcher>. collection-filters.js no longer initializes the
grid switcher; its file shrinks accordingly."
```

---

## Task 6: Extract `<price-range-slider>` from `collection-filters` (with `change`-event fix)

**Goal:** Create `<price-range-slider>` as a focused custom element. Wrap the slider markup in `sections/main-collection.liquid`. Remove the `#initRangeSlider` method (and its call site) from `collection-filters.js`. **Fix:** dispatch a native `change` event on `[data-price-min]` and `[data-price-max]` after a drag completes so the parent form's auto-submit fires on desktop.

**Files:**
- Create: `assets/price-range-slider.js`
- Modify: `sections/main-collection.liquid` (lines 219–257 area — wrap the slider + labels + hidden inputs)
- Modify: `snippets/scripts.liquid`
- Modify: `assets/collection-filters.js`

- [ ] **Step 1: Create `assets/price-range-slider.js`**

```js
/**
 * Dual-thumb price range slider.
 *
 * Reads [data-range-min], [data-range-max], [data-range-track] inside
 * itself and binds drag handlers (mouse + touch). Updates the
 * neighboring [data-price-min] / [data-price-max] hidden inputs and
 * [data-label-min] / [data-label-max] display elements.
 *
 * Fix vs the original implementation: when a drag completes, dispatches
 * a native 'change' event on each price input so a parent
 * <collection-filters> form-change listener can auto-submit on desktop.
 */
import { Component } from "@theme/component";

class PriceRangeSlider extends Component {
  setup() {
    this.minThumb = this.$("[data-range-min]");
    this.maxThumb = this.$("[data-range-max]");
    this.track = this.$("[data-range-track]");
    if (!this.minThumb || !this.maxThumb || !this.track) return;

    this.minInput = this.$("[data-price-min]");
    this.maxInput = this.$("[data-price-max]");
    this.minLabel = this.$("[data-label-min]");
    this.maxLabel = this.$("[data-label-max]");

    this.rangeMax = parseFloat(this.dataset.rangeMax) || 100;
    this.currencySymbol = this.dataset.currency || "$";
    this.minVal = parseFloat(this.minInput?.value) || 0;
    this.maxVal = parseFloat(this.maxInput?.value) || this.rangeMax;

    this.#bindThumb(this.minThumb, (v) => {
      this.minVal = Math.min(v, this.maxVal - 1);
    });
    this.#bindThumb(this.maxThumb, (v) => {
      this.maxVal = Math.max(v, this.minVal + 1);
    });

    this.#renderPositions();
  }

  #renderPositions() {
    const minPct = (this.minVal / this.rangeMax) * 100;
    const maxPct = (this.maxVal / this.rangeMax) * 100;
    this.minThumb.style.left = `${minPct}%`;
    this.maxThumb.style.left = `${maxPct}%`;
    this.track.style.left = `${minPct}%`;
    this.track.style.right = `${100 - maxPct}%`;
    if (this.minInput) this.minInput.value = this.minVal > 0 ? this.minVal : "";
    if (this.maxInput) this.maxInput.value = this.maxVal < this.rangeMax ? this.maxVal : "";
    if (this.minLabel) this.minLabel.textContent = `${this.currencySymbol}${Math.round(this.minVal)}`;
    if (this.maxLabel) this.maxLabel.textContent = `${this.currencySymbol}${Math.round(this.maxVal)}+`;
  }

  #bindThumb(thumb, setter) {
    const onMove = (e) => {
      const rect = this.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      const val = Math.round((pct / 100) * this.rangeMax);
      setter(val);
      this.#renderPositions();
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      // Fix: notify the parent form so auto-submit on desktop fires.
      this.minInput?.dispatchEvent(new Event("change", { bubbles: true }));
      this.maxInput?.dispatchEvent(new Event("change", { bubbles: true }));
    };

    thumb.addEventListener("mousedown", (e) => {
      e.preventDefault();
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    thumb.addEventListener(
      "touchstart",
      () => {
        document.addEventListener("touchmove", onMove, { passive: true });
        document.addEventListener("touchend", onUp);
      },
      { passive: true },
    );
  }
}

customElements.define("price-range-slider", PriceRangeSlider);

export { PriceRangeSlider };
```

> Implementation note vs the original: the original looked up the inputs/labels via `closest(".pb-4") || parentElement`. The new component looks them up *inside itself* via `this.$(...)` because in the next step we wrap the inputs and labels into the `<price-range-slider>` element. This is cleaner and avoids the brittle `.pb-4` lookup.

- [ ] **Step 2: Wrap the slider markup in `sections/main-collection.liquid`**

In `sections/main-collection.liquid`, locate lines 219–257 (the price-range filter case in the `{% case filter.type %}` block — currently spans the slider div + label flex + two hidden inputs).

Replace the existing block:

```liquid
                          <!-- Range slider -->
                          <div
                            data-range-slider
                            data-range-max="{{ range_max_money }}"
                            data-currency="{{ cart.currency.symbol }}"
                            class="mx-1 mb-3"
                          >
                            <div data-range-track></div>
                            <div data-range-min></div>
                            <div data-range-max></div>
                          </div>
                          <div class="flex justify-between text-xs text-gray-500">
                            <span data-label-min>
                              {{- cart.currency.symbol -}}
                              {{- min_money | round -}}
                            </span>
                            <span data-label-max>
                              {{- cart.currency.symbol -}}
                              {{- max_money | round }}+</span
                            >
                          </div>

                          <!-- Hidden inputs submitted with form -->
                          <input
                            type="hidden"
                            name="{{ filter.min_value.param_name }}"
                            data-price-min
                            {% if filter.min_value.value %}
                              value="{{ min_money }}"
                            {% endif %}
                          >
                          <input
                            type="hidden"
                            name="{{ filter.max_value.param_name }}"
                            data-price-max
                            {% if filter.max_value.value %}
                              value="{{ max_money }}"
                            {% endif %}
                          >
```

with:

```liquid
                          <price-range-slider
                            data-range-max="{{ range_max_money }}"
                            data-currency="{{ cart.currency.symbol }}"
                            class="block"
                          >
                            <!-- Range slider -->
                            <div data-range-slider class="mx-1 mb-3">
                              <div data-range-track></div>
                              <div data-range-min></div>
                              <div data-range-max></div>
                            </div>
                            <div class="flex justify-between text-xs text-gray-500">
                              <span data-label-min>
                                {{- cart.currency.symbol -}}
                                {{- min_money | round -}}
                              </span>
                              <span data-label-max>
                                {{- cart.currency.symbol -}}
                                {{- max_money | round }}+</span
                              >
                            </div>

                            <!-- Hidden inputs submitted with form -->
                            <input
                              type="hidden"
                              name="{{ filter.min_value.param_name }}"
                              data-price-min
                              {% if filter.min_value.value %}
                                value="{{ min_money }}"
                              {% endif %}
                            >
                            <input
                              type="hidden"
                              name="{{ filter.max_value.param_name }}"
                              data-price-max
                              {% if filter.max_value.value %}
                                value="{{ max_money }}"
                              {% endif %}
                            >
                          </price-range-slider>
```

> The `data-range-max` and `data-currency` attributes move from the inner `<div data-range-slider>` to the `<price-range-slider>` host (because the JS reads `this.dataset.rangeMax` / `this.dataset.currency`). The inner `<div data-range-slider>` keeps its `class="mx-1 mb-3"` for layout.

- [ ] **Step 3: Register `@theme/price-range-slider` in `snippets/scripts.liquid`**

In the importmap block, add (alphabetized between `predictive-search` and `product-card`):

```liquid
      "@theme/price-range-slider": {{ 'price-range-slider.js' | asset_url | json }},
```

In the `{% if template contains 'collection' %}` block:

```liquid
{% if template contains 'collection' %}
  <script type="module" src="{{ 'collection-filters.js' | asset_url }}"></script>
  <script type="module" src="{{ 'grid-switcher.js' | asset_url }}"></script>
  <script type="module" src="{{ 'price-range-slider.js' | asset_url }}"></script>
{% endif %}
```

- [ ] **Step 4: Remove range-slider logic from `assets/collection-filters.js`**

In `assets/collection-filters.js`:
1. Remove the line `this.querySelectorAll("[data-range-slider]").forEach((slider) => this.#initRangeSlider(slider));` from `connectedCallback()`.
2. Remove the `#initRangeSlider(container)` method entirely (currently lines ~107–177).

After this step, `collection-filters.js` should be roughly half its original length.

- [ ] **Step 5: Run format check**

Run: `npm run format:check`
Expected: PASS

- [ ] **Step 6: Run theme check**

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with unchanged baseline.

- [ ] **Step 7: Commit**

```bash
git add assets/price-range-slider.js sections/main-collection.liquid snippets/scripts.liquid assets/collection-filters.js
git commit -m "refactor: extract <price-range-slider> + fix change-event dispatch

Moves the dual-thumb range slider drag/update logic into a focused
custom element. Wraps the slider markup, labels, and hidden inputs in
<price-range-slider> in main-collection.liquid.

fix: on drag end, dispatches a native 'change' event on the
[data-price-min]/[data-price-max] inputs so the parent
<collection-filters> form auto-submit fires on desktop. Previously,
desktop slider drags never auto-submitted because input.value =
assignment doesn't fire change."
```

---

## Task 7: Refactor `<collection-filters>` to extend `Component` and use `Drawer.controllerFor`

**Goal:** With grid-switcher and range-slider extracted, `<collection-filters>` is now an orchestrator only. Convert it to extend `Component`, use `setup()` instead of `connectedCallback()`, and delegate the mobile drawer behavior to `Drawer.controllerFor()`.

**Files:**
- Modify: `assets/collection-filters.js`

- [ ] **Step 1: Replace `assets/collection-filters.js`**

Replace the entire file with:

```js
/**
 * Collection filters orchestrator.
 *
 * Owns: form auto-submit on change (desktop), the toggle button
 * (Show/Hide on desktop, Open/Close drawer on mobile), and the desktop
 * "Show Filters" / "Hide Filters" label.
 *
 * Delegates: <grid-switcher> and <price-range-slider> are independent
 * custom elements rendered inside this orchestrator. The mobile drawer
 * mode is delegated to Drawer.controllerFor() against [data-filters] +
 * [data-filter-overlay].
 */
import { Component } from "@theme/component";
import { Drawer } from "@theme/drawer";

class CollectionFilters extends Component {
  /** Debounce (ms) for type=number inputs before auto-submit. */
  static NUMBER_DEBOUNCE_MS = 800;

  setup() {
    this.form = this.$("[data-filter-form]");
    this.aside = this.$("[data-filters]");
    this.overlay = this.$("[data-filter-overlay]");
    this.label = this.$("[data-filters-label]");

    this.desktopVisible = true;
    this.mdQuery = window.matchMedia("(min-width: 768px)");
    this.drawer = Drawer.controllerFor(this.aside, this.overlay, this);

    // Toggle buttons (toolbar + drawer header)
    this.$$("[data-toggle-filters]").forEach((btn) =>
      btn.addEventListener("click", () => this.toggle()),
    );
    this.$$("[data-close-filters]").forEach((btn) =>
      btn.addEventListener("click", () => this.drawer.close()),
    );

    // Desktop: auto-submit on change. Mobile: user clicks Apply.
    this.form?.addEventListener("change", (e) => {
      if (!this.mdQuery.matches) return;
      if (e.target.type === "number") {
        clearTimeout(this._debounce);
        this._debounce = setTimeout(
          () => this.form.submit(),
          CollectionFilters.NUMBER_DEBOUNCE_MS,
        );
      } else {
        this.form.submit();
      }
    });

    // Set initial desktop label
    this.#updateDesktopLabel();
  }

  toggle() {
    if (this.mdQuery.matches) {
      this.desktopVisible = !this.desktopVisible;
      this.aside.classList.toggle("is-desktop-hidden");
      this.#updateDesktopLabel();
    } else {
      this.drawer.isOpen ? this.drawer.close() : this.drawer.open();
    }
  }

  #updateDesktopLabel() {
    if (this.label) {
      this.label.textContent = this.desktopVisible ? "Hide Filters" : "Show Filters";
    }
  }
}

customElements.define("collection-filters", CollectionFilters);

export { CollectionFilters };
```

> Behavior preserved vs. original: same toggle semantics (desktop toggles `is-desktop-hidden`, mobile opens/closes the drawer); same number-input debounce (800 ms); same auto-submit on non-number change; same overlay-click and Escape-to-close (now provided by `Drawer.controllerFor`).

- [ ] **Step 2: Run format check**

Run: `npm run format:check`
Expected: PASS

- [ ] **Step 3: Run theme check**

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with unchanged baseline.

- [ ] **Step 4: Commit**

```bash
git add assets/collection-filters.js
git commit -m "refactor: collection-filters becomes a focused orchestrator

Extends Component and uses setup(). Mobile drawer behavior delegates to
Drawer.controllerFor against [data-filters]/[data-filter-overlay] —
same overlay-click, Escape, body-scroll-lock, focus-trap as cart-drawer
and header-drawer.

File is now ~half its previous length; the range-slider and
grid-switcher logic moved out in earlier commits."
```

---

## Task 8: Convert `product-card.js` into a custom element

**Goal:** `<product-card>` is a real custom element with a self-scoped click listener. Edit `snippets/product-card.liquid` so the wrapping element becomes `<product-card>`.

**Files:**
- Modify: `assets/product-card.js`
- Modify: `snippets/product-card.liquid`

- [ ] **Step 1: Replace `assets/product-card.js`**

Replace the entire file with:

```js
/**
 * Product card with optional color swatches.
 * Clicking a swatch swaps the card image and points all card links at
 * the variant URL.
 */
import { Component } from "@theme/component";

class ProductCard extends Component {
  setup() {
    this.addEventListener("click", (e) => this.#handleSwatchClick(e));
  }

  #handleSwatchClick(e) {
    const swatch = e.target.closest("[data-swatch]");
    if (!swatch) return;

    e.preventDefault();
    e.stopPropagation();

    // Swap image
    const img = this.$(".product-card-image");
    if (img && swatch.dataset.imageSrc) {
      img.src = swatch.dataset.imageSrc;
      if (swatch.dataset.imageSrcset) {
        img.srcset = swatch.dataset.imageSrcset;
      }
    }

    // Update all links in the card to point to the correct variant
    if (swatch.dataset.url) {
      this.$$("a").forEach((a) => {
        a.href = swatch.dataset.url;
      });
    }

    // Active swatch ring
    this.$$("[data-swatch]").forEach((s) => {
      s.classList.remove("ring-2", "ring-offset-1", "ring-gray-900");
    });
    swatch.classList.add("ring-2", "ring-offset-1", "ring-gray-900");
  }
}

customElements.define("product-card", ProductCard);

export { ProductCard };
```

- [ ] **Step 2: Update `snippets/product-card.liquid`**

In `snippets/product-card.liquid`:
- Line 27: change `<div data-product-card class="group">` to `<product-card data-product-card class="group">`.
- Line 94: change the matching closing `</div>` to `</product-card>`.

> The `data-product-card` attribute is retained on the new element to keep any CSS selectors (`[data-product-card]`) matching until sub-project 6 reviews CSS holistically (per the spec's risk mitigation).

- [ ] **Step 3: Run format check**

Run: `npm run format:check`
Expected: PASS

- [ ] **Step 4: Run theme check**

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with unchanged baseline.

- [ ] **Step 5: Commit**

```bash
git add assets/product-card.js snippets/product-card.liquid
git commit -m "refactor: convert product-card into a custom element

Replaces the global document-level click listener with a <product-card>
custom element scoped per card. Wrapping <div data-product-card> in the
snippet becomes <product-card data-product-card>; the data attribute is
kept until the sub-project-6 CSS pass."
```

---

## Task 9: Fix escape gaps and adopt `Component` in `predictive-search.js`

**Goal:** Convert `<predictive-search>` to extend `Component`. **Fix:** apply `#escape()` to every interpolated value (titles, URLs, prices, image src/alt, query in "View all" link). Move placeholder HTML strings to `static` constants.

**Files:**
- Modify: `assets/predictive-search.js`

- [ ] **Step 1: Replace `assets/predictive-search.js`**

Replace the entire file with:

```js
/**
 * Predictive search component.
 * Fetches results from Shopify's predictive search API as the user types
 * and renders product / page / article suggestions.
 */
import { Component } from "@theme/component";

class PredictiveSearch extends Component {
  static EMPTY_HTML =
    '<div class="px-4 py-8 text-center text-sm text-gray-400">Start typing to search...</div>';

  static LOADING_HTML =
    '<div class="px-4 py-6 text-center text-sm text-gray-400">Searching...</div>';

  static ERROR_HTML =
    '<div class="px-4 py-6 text-center text-sm text-gray-500">Something went wrong. Try again.</div>';

  static DEBOUNCE_MS = 300;

  setup() {
    this.openBtn = this.$("[data-open-search]");
    this.closeBtn = this.$("[data-close-search]");
    this.dropdown = this.$(".predictive-search-results");
    this.input = this.$("[data-search-input]");
    this.resultsContainer = this.$("[data-search-results]");
    this.debounceTimer = null;

    this.openBtn?.addEventListener("click", () => this.open());
    this.closeBtn?.addEventListener("click", () => this.close());

    this.input?.addEventListener("input", () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.search(), PredictiveSearch.DEBOUNCE_MS);
    });

    this.input?.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });

    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.contains(e.target)) this.close();
    });
  }

  get isOpen() {
    return this.dropdown?.classList.contains("is-active");
  }

  open() {
    this.dropdown?.classList.add("is-active");
    setTimeout(() => {
      this.input?.focus();
    }, 50);
  }

  close() {
    this.dropdown?.classList.remove("is-active");
    if (this.input) this.input.value = "";
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = PredictiveSearch.EMPTY_HTML;
    }
  }

  async search() {
    const query = this.input?.value?.trim();
    if (!query || query.length < 2) {
      this.resultsContainer.innerHTML = PredictiveSearch.EMPTY_HTML;
      return;
    }

    this.resultsContainer.innerHTML = PredictiveSearch.LOADING_HTML;

    try {
      const response = await fetch(
        `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product,page,article&resources[limit]=6`,
      );
      const data = await response.json();
      const products = data.resources?.results?.products || [];
      const pages = data.resources?.results?.pages || [];
      const articles = data.resources?.results?.articles || [];

      if (products.length === 0 && pages.length === 0 && articles.length === 0) {
        this.resultsContainer.innerHTML = `<div class="px-4 py-6 text-center text-sm text-gray-500">No results for &ldquo;${this.#escape(query)}&rdquo;</div>`;
        return;
      }

      let html = "";

      if (products.length > 0) {
        html += '<div class="py-2">';
        html +=
          '<p class="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Products</p>';
        for (const product of products) {
          const title = this.#escape(product.title);
          const url = this.#escape(product.url);
          const price = this.#escape(product.price);
          const image = product.image
            ? `<img src="${this.#escape(product.image)}" alt="${title}" class="w-10 h-10 object-cover rounded" width="40" height="40">`
            : '<div class="w-10 h-10 bg-gray-100 rounded"></div>';
          html += `
            <a href="${url}" class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 no-underline transition-colors">
              ${image}
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 truncate">${title}</p>
                <p class="text-xs text-gray-500">${price}</p>
              </div>
            </a>
          `;
        }
        html += "</div>";
      }

      if (pages.length > 0) {
        html += '<div class="py-2 border-t border-gray-100">';
        html +=
          '<p class="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pages</p>';
        for (const page of pages) {
          const title = this.#escape(page.title);
          const url = this.#escape(page.url);
          html += `<a href="${url}" class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 no-underline transition-colors">${title}</a>`;
        }
        html += "</div>";
      }

      if (articles.length > 0) {
        html += '<div class="py-2 border-t border-gray-100">';
        html +=
          '<p class="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Articles</p>';
        for (const article of articles) {
          const title = this.#escape(article.title);
          const url = this.#escape(article.url);
          html += `<a href="${url}" class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 no-underline transition-colors">${title}</a>`;
        }
        html += "</div>";
      }

      const viewAllUrl = this.#escape(`/search?q=${encodeURIComponent(query)}`);
      html += `<a href="${viewAllUrl}" class="block px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 no-underline border-t border-gray-200 transition-colors">View all results</a>`;

      this.resultsContainer.innerHTML = html;
    } catch (error) {
      console.error("Predictive search error:", error);
      this.resultsContainer.innerHTML = PredictiveSearch.ERROR_HTML;
    }
  }

  #escape(str) {
    const el = document.createElement("span");
    el.textContent = str ?? "";
    return el.innerHTML;
  }
}

customElements.define("predictive-search", PredictiveSearch);

export { PredictiveSearch };
```

> Fix details: every interpolated value (`product.title`, `product.url`, `product.price`, `product.image`, `page.title`, `page.url`, `article.title`, `article.url`, the "View all" search URL) now passes through `#escape()`. The `#escape()` helper itself was hardened against `null`/`undefined` (`str ?? ""`).

- [ ] **Step 2: Run format check**

Run: `npm run format:check`
Expected: PASS

- [ ] **Step 3: Run theme check**

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with unchanged baseline.

- [ ] **Step 4: Commit**

```bash
git add assets/predictive-search.js
git commit -m "fix: escape every interpolated value in predictive-search

Previously #escape() was applied to titles but not to URLs, prices, or
image src/alt. With user-controlled product titles or URLs, this was
an XSS surface. All interpolations now route through #escape(); the
helper itself is hardened against null/undefined.

Also extends Component (replaces inline connectedCallback with setup())
and lifts placeholder HTML to static class constants."
```

---

## Task 10: Adopt `Component` in `product-form.js` and tidy button-restore

**Goal:** `<product-form>` extends `Component`. Consolidate the duplicated "restore button state" block in catch / non-catch branches into a single `#restoreButton(originalText)` helper. Save the original `textContent` before any `.trim()`-ing.

**Files:**
- Modify: `assets/product-form.js`

- [ ] **Step 1: Replace `assets/product-form.js`**

Replace the entire file with:

```js
/**
 * Hijacks the product form to add items via the Cart AJAX API.
 * On success, dispatches cart:updated and cart:open events to update
 * the cart icon and open the cart drawer. Announces the result to
 * screen readers via the #cart-status aria-live region.
 */
import { Component } from "@theme/component";

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
      const formData = new FormData(this.form);

      const response = await fetch("/cart/add.js", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Add to cart failed: ${response.status}`);
      }

      const addedItem = await response.json();

      // Fetch updated cart for item count
      const cartResponse = await fetch("/cart.js");
      const cart = await cartResponse.json();

      document.dispatchEvent(
        new CustomEvent("cart:updated", { detail: { item_count: cart.item_count } }),
      );
      document.dispatchEvent(new CustomEvent("cart:open"));

      this.#announce(
        `Added ${addedItem.product_title} to cart. Cart now has ${cart.item_count} ${cart.item_count === 1 ? "item" : "items"}.`,
      );

      this.#restoreButton(originalText);
    } catch (error) {
      console.error("Add to cart error:", error);
      this.submitButton.textContent = "Error — try again";
      this.#announce("Failed to add item to cart. Please try again.");
      setTimeout(() => this.#restoreButton(originalText), ProductForm.ERROR_RESET_MS);
    }
  }

  #announce(message) {
    const status = document.getElementById("cart-status");
    if (status) {
      status.textContent = message;
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

> Behavior changes vs. original (per spec): (1) `originalText` is captured *before* the button text is overwritten, no longer trimmed on save; (2) the duplicated restore block is now a single `#restoreButton()` call.

- [ ] **Step 2: Run format check**

Run: `npm run format:check`
Expected: PASS

- [ ] **Step 3: Run theme check**

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with unchanged baseline.

- [ ] **Step 4: Commit**

```bash
git add assets/product-form.js
git commit -m "refactor: product-form extends Component, dedupe button restore

Extracts the duplicated 'restore disabled/aria-busy/textContent' block
into a single #restoreButton helper called on both the success and
error paths. Captures the original button text before overwriting,
preserving any intentional whitespace."
```

---

## Task 11: Final verification — full smoke checklist + open PR

**Goal:** Run the full manual smoke checklist from the spec against `shopify theme dev`, fix any regressions, then push and open a PR.

**Files:** none (this task is verification + PR)

- [ ] **Step 1: Confirm static checks still pass**

Run in parallel:

```bash
npm run format:check
npm run theme:check; echo "exit=$?"
```

Expected: `format:check` PASS; `theme:check` exits 1 with the unchanged baseline (`54 total offenses`, `34 errors`, `20 warnings`).

If either differs, stop and fix before proceeding.

- [ ] **Step 2: Start the dev server**

Run: `npm run dev`
Expected: Both `watch:css` and `shopify theme dev` start. The Shopify CLI prints a preview URL — open it in a browser.

- [ ] **Step 3: Smoke test 1 — cart-drawer**

On the storefront:
1. Click the cart icon → drawer slides open, body scroll locks, focus moves into the drawer.
2. Press Tab repeatedly → focus cycles within the panel and never escapes to the page underneath.
3. Press Escape → drawer closes; focus returns to the cart icon.
4. Re-open. Click the overlay → drawer closes.
5. Re-open with at least one line item. Click + / − on a quantity → cart updates, item count bubble updates, drawer markup re-renders without flicker.

Expected: All steps work; browser console is clean.

- [ ] **Step 4: Smoke test 2 — header-drawer**

On mobile width (≤ 768 px):
1. Click the hamburger → drawer opens; `aria-expanded` on the hamburger flips to `true`.
2. Tab cycles within the drawer; Escape closes; focus returns to the hamburger.
3. Overlay click closes.

Expected: All steps work; browser console is clean.

- [ ] **Step 5: Smoke test 3 — collection-filters orchestrator**

Open a collection page. **Desktop (≥ 768 px):**
1. Click the toggle button → sidebar hides; label flips to "Show Filters". Click again → sidebar shows; label flips back.
2. Toggle a filter checkbox → form auto-submits.
3. Type into a number input (if present) → form auto-submits ~800 ms after the last keystroke.

**Mobile (< 768 px):**
4. Click the toggle → drawer opens (Drawer.controllerFor controls it).
5. Tab cycles within the drawer; Escape closes; overlay click closes.
6. Click Apply / Clear → form submits / clears as before.

Expected: All steps work; browser console is clean.

- [ ] **Step 6: Smoke test 4 — price-range-slider (with the fix)**

On a collection page that has a price filter:
1. **Desktop:** Drag the min thumb to a new position and release → form auto-submits (this is new behavior).
2. Drag the max thumb and release → form auto-submits.
3. While dragging, the min/max labels update live.
4. **Mobile:** Drag a thumb → labels update; form does NOT auto-submit (waits for Apply, as before).

Expected: All steps work; browser console is clean.

- [ ] **Step 7: Smoke test 5 — grid-switcher**

On a collection page (desktop):
1. Click the 3-col button → grid renders with 3 columns; `bg-gray-100` moves to the 3-col button.
2. Click the 4-col button → grid renders with 4 columns.
3. Reload → the last selection persists.

Expected: All steps work.

- [ ] **Step 8: Smoke test 6 — product-card swatches**

On a collection page with cards that have swatches:
1. Click a swatch on one card → image swaps; srcset swaps if present; all anchors in that card now point at the variant URL.
2. Click a swatch on a different card → only that card's image swaps.

Expected: Each card's swatches affect only that card.

- [ ] **Step 9: Smoke test 7 — predictive-search**

If `settings.predictive_search_enabled`:
1. Open the search dropdown → "Start typing to search..." placeholder shows.
2. Type 2+ characters → "Searching..." then results render.
3. Open devtools, inspect a result row's HTML → no double-quotes or angle brackets in attribute or text values come from raw API output (every value should pass through `#escape`).
4. Search for a term that returns no results → "No results for ..." message shows.

Expected: Console clean; HTML inspection shows escaped values.

- [ ] **Step 10: Smoke test 8 — product-form**

On a product page:
1. Click "Add to cart" → button text becomes "Adding...", `aria-busy="true"` set, then cart drawer opens with the new item, count updates.
2. Use devtools Network tab to block `/cart/add.js` and resubmit → button shows "Error — try again", reverts to original after 2 s.

Expected: All steps work; aria-live region announces correctly.

- [ ] **Step 11: Smoke test 9 — no-regression spot check**

1. Open a product page → gallery thumbnails clickable, swipe works on mobile, variant select syncs the gallery.
2. Open the home page → console is clean.
3. Visit a non-existent path (e.g. `/foo`) → 404 renders without console errors.

Expected: No regressions.

- [ ] **Step 12: Stop the dev server**

`Ctrl-C` the `npm run dev` terminal.

- [ ] **Step 13: Push the branch**

```bash
git push -u origin cleanup/javascript-web-components
```

- [ ] **Step 14: Open the PR**

Run:

```bash
gh pr create --title "cleanup: JavaScript / web components (sub-project 2 of 6)" --body "$(cat <<'EOF'
## Summary
- Adopt the existing `Component` base class across all `/assets/*.js` custom elements (was unused before this PR).
- Add a `Drawer` base class for shared drawer behavior (open/close, body lock, escape, focus trap, return focus). cart-drawer and header-drawer extend it; collection-filters delegates to `Drawer.controllerFor()` for its mobile drawer mode.
- Split `<collection-filters>` into three focused custom elements: `<collection-filters>` orchestrator, `<price-range-slider>`, `<grid-switcher>`.
- Convert `<product-card>` from a global click handler into a real custom element (snippet wrapper updated).
- Fix consistent `#escape()` application in predictive-search (was missing on URLs, prices, image src).
- Fix `<price-range-slider>` so desktop drag-end auto-submits the form (dispatches a native `change` event on hidden inputs).

Spec: [docs/superpowers/specs/2026-05-10-javascript-cleanup-design.md](../blob/cleanup/javascript-web-components/docs/superpowers/specs/2026-05-10-javascript-cleanup-design.md)

This is sub-project 2 of 6 in the broader theme cleanup effort. Sub-project 1 merged via #1.

## Test plan
- [ ] `npm run format:check` passes
- [ ] `npm run theme:check` exit code unchanged from baseline (still 34 errors / 20 warnings — those belong to sub-projects 3 and 4)
- [ ] cart-drawer: open, tab-trap, escape, overlay click, qty +/-
- [ ] header-drawer: open, tab-trap, escape, overlay click, aria-expanded
- [ ] collection-filters: desktop toggle + label, desktop auto-submit, mobile drawer
- [ ] price-range-slider: desktop drag-end auto-submits (new behavior); mobile waits for Apply
- [ ] grid-switcher: 3-col / 4-col toggle, localStorage persistence
- [ ] product-card: per-card swatch swap doesn't affect other cards
- [ ] predictive-search: every interpolation HTML-escaped
- [ ] product-form: success path, forced-error path, button restore
- [ ] no console errors on home, product, collection, cart, search, 404
EOF
)"
```

Expected: PR URL is printed.

- [ ] **Step 15: Update PROGRESS.md**

Edit `docs/superpowers/PROGRESS.md` so the sub-project-2 row in the status table flips to ✅ with the PR link, and update "Suggested next sub-project" to point at sub-project 3 (Liquid sections). Commit:

```bash
git add docs/superpowers/PROGRESS.md
git commit -m "docs: mark sub-project 2 (JavaScript) as merged"
git push
```

> If `PROGRESS.md` is still untracked at PR-merge time, `git add` will track it. The first push of the branch above will not include it; this commit lands on the same branch *after* the PR is opened, or on `main` after merge — your call.

---

## Self-Review (run after the plan is fully written)

This section is for the plan author's own pre-flight check; it is not a task for the implementer.

### 1. Spec coverage

| Spec requirement | Plan task |
|---|---|
| Adopt `Component` consistently | Tasks 1, 2 (drawer extends Component), 3, 4, 5, 6, 7, 8, 9, 10 |
| Introduce `Drawer` subclass | Task 2 |
| `Drawer.controllerFor()` for hosts | Task 2 (defined), Task 7 (consumed) |
| `cart-drawer` extends `Drawer` | Task 3 |
| `header-drawer` extends `Drawer` | Task 4 |
| Split `collection-filters` into three components | Tasks 5, 6, 7 |
| `<grid-switcher>` extracted | Task 5 |
| `<price-range-slider>` extracted with `change`-event fix | Task 6 |
| `<collection-filters>` orchestrator | Task 7 |
| `<product-card>` custom element + snippet edit | Task 8 |
| Predictive-search escape fixes | Task 9 |
| `product-form` `#restoreButton` helper | Task 10 |
| `snippets/scripts.liquid` updates | Tasks 2, 5, 6 (each task wires its own new file) |
| Smoke checklist (9 items) | Task 11 (Steps 3–11) |
| `format:check` + `theme:check` baseline check | Every task + Task 11 (Step 1) |

All spec requirements have at least one task. ✓

### 2. Placeholder scan

- No "TBD", "TODO", "implement later", or "fill in details" anywhere. ✓
- No "similar to Task N" — code is repeated where used. ✓
- Every code-changing step shows the actual code. ✓
- All file paths are absolute relative to repo root (`assets/...`, `snippets/...`, `sections/...`). ✓

### 3. Type / signature consistency

- `Drawer` class exposes: `setup()`, `get isOpen`, `open()`, `close()`, `static FOCUS_DELAY_MS`, `static controllerFor(panel, overlay, host)`. Used consistently in Tasks 3, 4, 7. ✓
- `Component` class exposes: `setup()`, `$()`, `$$()`. Used consistently in Tasks 1, 5, 6, 7, 8, 9, 10. ✓
- `<grid-switcher>` reads `STORAGE_KEY = "collection-grid-cols"` — matches the original `localStorage.getItem("collection-grid-cols")`. ✓
- `<price-range-slider>` reads `data-range-max` / `data-currency` from `this.dataset.rangeMax` / `this.dataset.currency` — Liquid wrap moved these attributes onto the `<price-range-slider>` host. ✓
- `<collection-filters>` selector lookups (`[data-filter-form]`, `[data-filters]`, `[data-filter-overlay]`, `[data-filters-label]`, `[data-toggle-filters]`, `[data-close-filters]`) match the existing markup; no markup changes here. ✓
- Importmap entries match exact filenames used in `customElements.define` and `import { … } from "@theme/…"`. ✓

No inconsistencies found.

---

## Execution Handoff

Plan complete. The implementer should pick:

- **Subagent-driven (recommended for size — 11 tasks, several touching the same file)** — fresh subagent per task, two-stage review between tasks. Required sub-skill: `superpowers:subagent-driven-development`.
- **Inline execution** — execute tasks in this session with checkpoints. Required sub-skill: `superpowers:executing-plans`.
