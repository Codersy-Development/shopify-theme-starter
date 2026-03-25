/**
 * Updates the cart item count bubble and aria-label in the header.
 * Listens for cart:updated events to keep the count in sync.
 */
class CartIcon extends HTMLElement {
  connectedCallback() {
    this.countEl = this.querySelector('[data-cart-count]');
    this.trigger = this.querySelector('button, a');
    document.addEventListener('cart:updated', (e) => this.update(e.detail));
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
      const label = count === 1 ? 'Cart, 1 item' : `Cart, ${count} items`;
      this.trigger.setAttribute('aria-label', label);
    }
  }
}

customElements.define('cart-icon', CartIcon);

export { CartIcon };
