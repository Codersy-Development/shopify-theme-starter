/**
 * Hijacks the product form to add items via the Cart AJAX API.
 *
 * Delegates the fetch + cart:updated/cart:open dispatch + screen-reader
 * announcement to the shared addToCart() helper. This class only owns
 * the button-state lifecycle (Adding... → success → restore, or error
 * → restore after 2s).
 */
import { Component } from "@theme/component";
import { addToCart, announceCartStatus, themeString } from "@theme/cart-add";

class ProductForm extends Component {
  static ERROR_RESET_MS = 2000;

  setup() {
    this.form = this.$("form");
    this.submitButton = this.$('[type="submit"]');
    this.form?.addEventListener("submit", (e) => this.handleSubmit(e));

    // Keep displayed prices (inline + sticky bar) in sync with the selected variant.
    this.$('select[name="id"]')?.addEventListener("change", (e) => {
      const price = e.target.selectedOptions[0]?.dataset.price;
      if (!price) return;
      document.querySelectorAll("[data-product-price]").forEach((el) => {
        el.textContent = price;
      });
    });
  }

  async handleSubmit(e) {
    e.preventDefault();

    const originalText = this.submitButton.textContent;
    this.submitButton.disabled = true;
    this.submitButton.setAttribute("aria-busy", "true");
    this.submitButton.textContent = themeString("adding", "Adding...");

    try {
      // Only id+quantity are forwarded; if line-item properties or selling-plan
      // inputs are ever added to the form, widen addToCart's signature.
      const id = new FormData(this.form).get("id");
      await addToCart({ id, quantity: 1 });
      this.#restoreButton(originalText);
    } catch (error) {
      console.error("Add to cart error:", error);
      this.submitButton.textContent = themeString("addError", "Error — try again");
      announceCartStatus(themeString("addFailed", "Failed to add item to cart. Please try again."));
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
