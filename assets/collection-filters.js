/**
 * Collection filters & sorting.
 * Mobile: full-screen drawer from left with Apply/Clear buttons.
 * Desktop: inline sidebar with auto-submit on change.
 */
class CollectionFilters extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('[data-filter-form]');
    this.aside = this.querySelector('[data-filters]');
    this.overlay = this.querySelector('[data-filter-overlay]');
    this.label = this.querySelector('[data-filters-label]');

    this.desktopVisible = true;
    this.mdQuery = window.matchMedia('(min-width: 768px)');

    // Toggle buttons (toolbar + drawer header)
    this.querySelectorAll('[data-toggle-filters]').forEach((btn) =>
      btn.addEventListener('click', () => this.toggle())
    );
    this.querySelectorAll('[data-close-filters]').forEach((btn) =>
      btn.addEventListener('click', () => this.closeDrawer())
    );
    this.overlay?.addEventListener('click', () => this.closeDrawer());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.drawerOpen) this.closeDrawer();
    });

    // Desktop: auto-submit on change. Mobile: user clicks Apply.
    this.form?.addEventListener('change', (e) => {
      if (!this.mdQuery.matches) return;
      if (e.target.type === 'number') {
        clearTimeout(this._debounce);
        this._debounce = setTimeout(() => this.form.submit(), 800);
      } else {
        this.form.submit();
      }
    });

    // Price range slider sync
    this.querySelectorAll('[data-range-slider]').forEach((slider) =>
      this.#initRangeSlider(slider)
    );

    // Grid column switcher
    this.#initGridSwitcher();

    // Set initial desktop label
    this.#updateDesktopLabel();
  }

  get drawerOpen() {
    return this.aside?.classList.contains('is-open');
  }

  toggle() {
    if (this.mdQuery.matches) {
      this.desktopVisible = !this.desktopVisible;
      this.aside.classList.toggle('is-desktop-hidden');
      this.#updateDesktopLabel();
    } else {
      this.drawerOpen ? this.closeDrawer() : this.openDrawer();
    }
  }

  openDrawer() {
    this.aside?.classList.add('is-open');
    this.overlay?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  closeDrawer() {
    this.aside?.classList.remove('is-open');
    this.overlay?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  #updateDesktopLabel() {
    if (this.label) {
      this.label.textContent = this.desktopVisible ? 'Hide Filters' : 'Show Filters';
    }
  }

  #initGridSwitcher() {
    const grid = this.querySelector('[data-product-grid]');
    const btns = this.querySelectorAll('[data-grid]');
    if (!grid || !btns.length) return;

    const saved = localStorage.getItem('collection-grid-cols');
    if (saved) this.#setGrid(grid, btns, saved);

    btns.forEach((btn) =>
      btn.addEventListener('click', () => {
        const cols = btn.dataset.grid;
        this.#setGrid(grid, btns, cols);
        localStorage.setItem('collection-grid-cols', cols);
      })
    );
  }

  #setGrid(grid, btns, cols) {
    grid.classList.remove('md:grid-cols-3', 'md:grid-cols-4');
    grid.classList.add(`md:grid-cols-${cols}`);
    btns.forEach((b) => {
      b.classList.toggle('bg-gray-100', b.dataset.grid === cols);
    });
  }

  #initRangeSlider(container) {
    const minThumb = container.querySelector('[data-range-min]');
    const maxThumb = container.querySelector('[data-range-max]');
    const track = container.querySelector('[data-range-track]');
    const wrapper = container.closest('.pb-4') || container.parentElement;
    const minInput = wrapper.querySelector('[data-price-min]');
    const maxInput = wrapper.querySelector('[data-price-max]');
    const minLabel = wrapper.querySelector('[data-label-min]');
    const maxLabel = wrapper.querySelector('[data-label-max]');

    if (!minThumb || !maxThumb || !track) return;

    const rangeMax = parseFloat(container.dataset.rangeMax) || 100;
    const currencySymbol = container.dataset.currency || '$';
    let minVal = parseFloat(minInput?.value) || 0;
    let maxVal = parseFloat(maxInput?.value) || rangeMax;

    const update = () => {
      const minPct = (minVal / rangeMax) * 100;
      const maxPct = (maxVal / rangeMax) * 100;
      minThumb.style.left = `${minPct}%`;
      maxThumb.style.left = `${maxPct}%`;
      track.style.left = `${minPct}%`;
      track.style.right = `${100 - maxPct}%`;
      if (minInput) minInput.value = minVal > 0 ? minVal : '';
      if (maxInput) maxInput.value = maxVal < rangeMax ? maxVal : '';
      if (minLabel) minLabel.textContent = `${currencySymbol}${Math.round(minVal)}`;
      if (maxLabel) maxLabel.textContent = `${currencySymbol}${Math.round(maxVal)}+`;
    };

    const drag = (thumb, setter) => {
      const onMove = (e) => {
        const rect = container.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let pct = ((clientX - rect.left) / rect.width) * 100;
        pct = Math.max(0, Math.min(100, pct));
        const val = Math.round((pct / 100) * rangeMax);
        setter(val);
        update();
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      };
      thumb.addEventListener('mousedown', (e) => {
        e.preventDefault();
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
      thumb.addEventListener('touchstart', (e) => {
        document.addEventListener('touchmove', onMove, { passive: true });
        document.addEventListener('touchend', onUp);
      }, { passive: true });
    };

    drag(minThumb, (v) => { minVal = Math.min(v, maxVal - 1); });
    drag(maxThumb, (v) => { maxVal = Math.max(v, minVal + 1); });

    update();
  }
}

customElements.define('collection-filters', CollectionFilters);

export { CollectionFilters };
