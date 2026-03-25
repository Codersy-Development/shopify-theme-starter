/**
 * Mobile menu drawer using simple CSS transitions (no <dialog>).
 * Slides in from the left, overlay fades in.
 */
class HeaderDrawer extends HTMLElement {
  connectedCallback() {
    this.panel = this.querySelector('[data-panel]');
    this.overlay = this.querySelector('[data-overlay]');

    this.querySelector('[data-open]')?.addEventListener('click', () => this.open());
    this.querySelectorAll('[data-close]').forEach((el) =>
      el.addEventListener('click', () => this.close())
    );
    this.overlay?.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  get isOpen() {
    return this.getAttribute('aria-hidden') === 'false';
  }

  open() {
    this.setAttribute('aria-hidden', 'false');

    this.overlay.classList.remove('pointer-events-none');
    this.overlay.classList.add('pointer-events-auto');

    requestAnimationFrame(() => {
      this.overlay.classList.remove('bg-black/0');
      this.overlay.classList.add('bg-black/50');
      this.panel.classList.remove('-translate-x-full');
      this.panel.classList.add('translate-x-0');
    });

    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.isOpen) return;

    this.setAttribute('aria-hidden', 'true');

    this.overlay.classList.remove('bg-black/50');
    this.overlay.classList.add('bg-black/0');
    this.panel.classList.remove('translate-x-0');
    this.panel.classList.add('-translate-x-full');

    this.panel.addEventListener('transitionend', () => {
      this.overlay.classList.remove('pointer-events-auto');
      this.overlay.classList.add('pointer-events-none');
      document.body.style.overflow = '';
    }, { once: true });
  }
}

customElements.define('header-drawer', HeaderDrawer);

export { HeaderDrawer };
