/**
 * Cart drawer with quantity controls.
 * Toggles .is-open on panel & overlay directly — transitions handled by CSS.
 */
class CartDrawer extends HTMLElement {
  connectedCallback() {
    this.panel = this.querySelector('[data-panel]');
    this.overlay = this.querySelector('[data-overlay]');
    this.triggerEl = null;

    this.querySelectorAll('[data-close]').forEach((el) =>
      el.addEventListener('click', () => this.close())
    );
    this.overlay?.addEventListener('click', () => this.close());

    document.addEventListener('cart:open', () => this.open());
    document.addEventListener('cart:refresh', () => this.refresh());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
      if (e.key === 'Tab' && this.isOpen) this.#trapFocus(e);
    });

    this.#bindQuantityButtons();
  }

  get isOpen() {
    return this.panel?.classList.contains('is-open');
  }

  open() {
    this.triggerEl = document.activeElement;
    this.panel?.classList.add('is-open');
    this.overlay?.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      this.panel.querySelector('[data-close]')?.focus();
    }, 350);

    this.refresh();
  }

  close() {
    if (!this.isOpen) return;

    this.panel?.classList.remove('is-open');
    this.overlay?.classList.remove('is-open');
    document.body.style.overflow = '';
    this.triggerEl?.focus();
  }

  #trapFocus(e) {
    const focusable = this.panel.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
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

  #bindQuantityButtons() {
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-change-qty]');
      if (!btn) return;
      const line = parseInt(btn.dataset.line, 10);
      const qty = parseInt(btn.dataset.qty, 10);
      this.#updateQuantity(line, qty);
    });
  }

  async #updateQuantity(line, quantity) {
    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line, quantity }),
      });

      if (!response.ok) throw new Error('Failed to update cart');

      const cart = await response.json();

      document.dispatchEvent(
        new CustomEvent('cart:updated', { detail: { item_count: cart.item_count } })
      );

      const status = document.getElementById('cart-status');
      if (status) {
        status.textContent = quantity === 0
          ? 'Item removed from cart.'
          : `Cart updated. ${cart.item_count} ${cart.item_count === 1 ? 'item' : 'items'} in cart.`;
      }

      await this.refresh();
    } catch (error) {
      console.error('Cart update error:', error);
    }
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
        const newFooter = fragment.querySelector('[data-cart-drawer-footer]');
        const currentFooter = this.querySelector('[data-cart-drawer-footer]');
        if (newFooter && currentFooter) {
          currentFooter.replaceWith(newFooter);
        } else if (newFooter && !currentFooter) {
          this.panel.appendChild(newFooter);
        } else if (!newFooter && currentFooter) {
          currentFooter.remove();
        }
      }
    } catch (error) {
      console.error('Failed to refresh cart drawer:', error);
    }
  }
}

customElements.define('cart-drawer', CartDrawer);

export { CartDrawer };
