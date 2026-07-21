/**
 * Updates the cart item count bubble and aria-label in the header.
 * Listens for cart:updated events to keep the count in sync.
 */
import { Component } from "@theme/component";
import { themeString, itemsWord } from "@theme/cart-add";

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
      // The badge is hidden via Tailwind's `hidden` class in Liquid, so toggle
      // that class — the `hidden` DOM attribute loses to the badge's `flex` class.
      this.countEl.classList.toggle("hidden", count === 0);
    }

    // Update aria-label with current count
    if (this.trigger) {
      const label = themeString("cartLabel", "Cart, [count] [items]")
        .replace("[count]", count)
        .replace("[items]", itemsWord(count));
      this.trigger.setAttribute("aria-label", label);
    }
  }
}

customElements.define("cart-icon", CartIcon);

export { CartIcon };
