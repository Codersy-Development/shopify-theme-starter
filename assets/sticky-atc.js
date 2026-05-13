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
import { addToCart, announceCartStatus } from "@theme/cart-add";

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
      announceCartStatus("Failed to add item to cart. Please try again.");
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
