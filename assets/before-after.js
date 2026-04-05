class BeforeAfterSlider extends HTMLElement {
  connectedCallback() {
    this.container = this.querySelector('[data-slider-container]');
    this.clip = this.querySelector('[data-before-clip]');
    this.handle = this.querySelector('[data-slider-handle]');
    if (!this.container || !this.clip || !this.handle) return;

    this.dragging = false;

    this.handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.dragging = true;
      this.handle.setPointerCapture(e.pointerId);
    });

    this.handle.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      this._updatePosition(e.clientX);
    });

    this.handle.addEventListener('pointerup', () => {
      this.dragging = false;
    });

    this.container.addEventListener('click', (e) => {
      this._updatePosition(e.clientX);
    });
  }

  _updatePosition(clientX) {
    const rect = this.container.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    this.clip.style.width = pct + '%';
    this.handle.style.left = pct + '%';
  }
}

if (!customElements.get('before-after-slider')) {
  customElements.define('before-after-slider', BeforeAfterSlider);
}
