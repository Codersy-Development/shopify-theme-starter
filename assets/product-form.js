/**
 * Hijacks the product form to add items via the Cart AJAX API.
 * On success, dispatches cart:updated and cart:open events to
 * update the cart icon and open the cart drawer.
 */
class ProductForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    this.submitButton = this.querySelector('[type="submit"]');
    this.form?.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();

    this.submitButton.disabled = true;
    const originalText = this.submitButton.textContent;
    this.submitButton.textContent = 'Adding...';

    try {
      const formData = new FormData(this.form);

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Add to cart failed: ${response.status}`);
      }

      // Fetch updated cart for item count
      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();

      document.dispatchEvent(
        new CustomEvent('cart:updated', { detail: { item_count: cart.item_count } })
      );
      document.dispatchEvent(new CustomEvent('cart:open'));
    } catch (error) {
      console.error('Add to cart error:', error);
      this.submitButton.textContent = 'Error — try again';
      setTimeout(() => {
        this.submitButton.textContent = originalText.trim();
      }, 2000);
      return;
    }

    this.submitButton.disabled = false;
    this.submitButton.textContent = originalText.trim();
  }
}

customElements.define('product-form', ProductForm);

export { ProductForm };
