/**
 * Cart drawer with quantity controls.
 *
 * Open/close + body lock + escape + focus trap come from Drawer.
 * This subclass adds: cart:open / cart:refresh event listeners,
 * quantity-button click delegation, and Section Rendering API
 * refresh logic.
 */
import { Drawer } from "@theme/drawer";
import { themeString, itemsWord } from "@theme/cart-add";

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
            ? themeString("itemRemoved", "Item removed from cart.")
            : themeString("cartUpdated", "Cart updated. [count] [items] in cart.")
                .replace("[count]", cart.item_count)
                .replace("[items]", itemsWord(cart.item_count));
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
