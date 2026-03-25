/**
 * Cart drawer component using native <dialog>.
 * Auto-opens after add-to-cart and fetches fresh cart HTML via the Section Rendering API.
 */
class CartDrawer extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('dialog');
    this.overlay = this.querySelector('[data-overlay]');

    this.querySelector('[data-close]')?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());

    document.addEventListener('cart:open', () => this.open());
    document.addEventListener('cart:refresh', () => this.refresh());

    // Close on Escape
    this.dialog?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
  }

  open() {
    this.dialog?.showModal();
    document.body.style.overflow = 'hidden';
    this.refresh();
  }

  close() {
    document.body.style.overflow = '';
    this.dialog?.close();
  }

  async refresh() {
    try {
      const response = await fetch(`${window.location.pathname}?sections=cart-drawer`);
      const data = await response.json();
      const html = data['cart-drawer'];

      if (html) {
        const fragment = document.createRange().createContextualFragment(html);
        const newContent = fragment.querySelector('[data-cart-drawer-content]');
        const currentContent = this.querySelector('[data-cart-drawer-content]');
        if (newContent && currentContent) {
          currentContent.replaceWith(newContent);
        }
      }
    } catch (error) {
      console.error('Failed to refresh cart drawer:', error);
    }
  }
}

customElements.define('cart-drawer', CartDrawer);

export { CartDrawer };
