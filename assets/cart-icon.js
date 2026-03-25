/**
 * Updates the cart item count bubble in the header.
 * Listens for cart:updated events to keep the count in sync.
 */
class CartIcon extends HTMLElement {
  connectedCallback() {
    this.countEl = this.querySelector('[data-cart-count]');
    document.addEventListener('cart:updated', (e) => this.update(e.detail));
  }

  update(detail) {
    if (this.countEl && detail?.item_count !== undefined) {
      this.countEl.textContent = detail.item_count;
      this.countEl.hidden = detail.item_count === 0;
    }
  }
}

customElements.define('cart-icon', CartIcon);

export { CartIcon };
