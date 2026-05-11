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
