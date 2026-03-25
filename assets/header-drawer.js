/**
 * Mobile menu drawer using simple CSS transitions.
 * Slides in from the left, overlay fades in.
 * Includes focus trap and focus management for accessibility.
 */
class HeaderDrawer extends HTMLElement {
  connectedCallback() {
    this.panel = this.querySelector('[data-panel]');
    this.overlay = this.querySelector('[data-overlay]');
    this.openBtn = this.querySelector('[data-open]');

    this.openBtn?.addEventListener('click', () => this.open());
    this.querySelectorAll('[data-close]').forEach((el) =>
      el.addEventListener('click', () => this.close())
    );
    this.overlay?.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
      if (e.key === 'Tab' && this.isOpen) this.#trapFocus(e);
    });
  }

  get isOpen() {
    return this.getAttribute('aria-hidden') === 'false';
  }

  open() {
    this.setAttribute('aria-hidden', 'false');
    this.openBtn?.setAttribute('aria-expanded', 'true');

    this.overlay.classList.remove('pointer-events-none');
    this.overlay.classList.add('pointer-events-auto');

    requestAnimationFrame(() => {
      this.overlay.classList.remove('bg-black/0');
      this.overlay.classList.add('bg-black/50');
      this.panel.classList.remove('-translate-x-full');
      this.panel.classList.add('translate-x-0');
    });

    document.body.style.overflow = 'hidden';

    // Focus the close button after transition
    this.panel.addEventListener('transitionend', () => {
      this.panel.querySelector('[data-close]')?.focus();
    }, { once: true });
  }

  close() {
    if (!this.isOpen) return;

    this.setAttribute('aria-hidden', 'true');
    this.openBtn?.setAttribute('aria-expanded', 'false');

    this.overlay.classList.remove('bg-black/50');
    this.overlay.classList.add('bg-black/0');
    this.panel.classList.remove('translate-x-0');
    this.panel.classList.add('-translate-x-full');

    this.panel.addEventListener('transitionend', () => {
      this.overlay.classList.remove('pointer-events-auto');
      this.overlay.classList.add('pointer-events-none');
      document.body.style.overflow = '';

      // Return focus to hamburger button
      this.openBtn?.focus();
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
}

customElements.define('header-drawer', HeaderDrawer);

export { HeaderDrawer };
