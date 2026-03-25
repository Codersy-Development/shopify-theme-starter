/**
 * Mobile menu drawer.
 * Just toggles .is-open — all transitions handled by CSS.
 * No inert, no inline styles, no rAF tricks.
 */
class HeaderDrawer extends HTMLElement {
  connectedCallback() {
    this.panel = this.querySelector('[data-panel]');
    this.openBtn = this.querySelector('[data-open]');

    this.openBtn?.addEventListener('click', () => this.open());
    this.querySelectorAll('[data-close]').forEach((el) =>
      el.addEventListener('click', () => this.close())
    );
    this.querySelector('[data-overlay]')?.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
      if (e.key === 'Tab' && this.isOpen) this.#trapFocus(e);
    });
  }

  get isOpen() {
    return this.classList.contains('is-open');
  }

  open() {
    this.classList.add('is-open');
    this.openBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      this.panel.querySelector('[data-close]')?.focus();
    }, 350);
  }

  close() {
    if (!this.isOpen) return;

    this.classList.remove('is-open');
    this.openBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    this.openBtn?.focus();
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
}

customElements.define('header-drawer', HeaderDrawer);

export { HeaderDrawer };
