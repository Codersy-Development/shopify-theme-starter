/**
 * Cart drawer using simple CSS transitions.
 * Slides in from the right, overlay fades in.
 * Includes focus trap and focus management for accessibility.
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
  }

  get isOpen() {
    return this.getAttribute('aria-hidden') === 'false';
  }

  open() {
    this.triggerEl = document.activeElement;
    this.setAttribute('aria-hidden', 'false');

    this.overlay.classList.remove('pointer-events-none');
    this.overlay.classList.add('pointer-events-auto');

    requestAnimationFrame(() => {
      this.overlay.classList.remove('bg-black/0');
      this.overlay.classList.add('bg-black/50');
      this.panel.classList.remove('translate-x-full');
      this.panel.classList.add('translate-x-0');
    });

    document.body.style.overflow = 'hidden';

    // Focus the close button after transition
    this.panel.addEventListener('transitionend', () => {
      this.panel.querySelector('[data-close]')?.focus();
    }, { once: true });

    this.refresh();
  }

  close() {
    if (!this.isOpen) return;

    this.setAttribute('aria-hidden', 'true');

    this.overlay.classList.remove('bg-black/50');
    this.overlay.classList.add('bg-black/0');
    this.panel.classList.remove('translate-x-0');
    this.panel.classList.add('translate-x-full');

    this.panel.addEventListener('transitionend', () => {
      this.overlay.classList.remove('pointer-events-auto');
      this.overlay.classList.add('pointer-events-none');
      document.body.style.overflow = '';

      // Return focus to trigger element
      this.triggerEl?.focus();
    }, { once: true });
  }

  #trapFocus(e) {
    const focusable = this.panel.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
