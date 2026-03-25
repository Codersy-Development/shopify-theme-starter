/**
 * Product image gallery with thumbnails and swipe support.
 * Fades between images and syncs with variant selection.
 */
class ProductGallery extends HTMLElement {
  connectedCallback() {
    this.slides = this.querySelectorAll('[data-image-slide]');
    this.thumbnails = this.querySelectorAll('[data-thumbnail]');
    this.mainImage = this.querySelector('[data-main-image]');

    if (this.slides.length <= 1) return;

    this.thumbnails.forEach((thumb) =>
      thumb.addEventListener('click', () => this.goTo(thumb.dataset.target))
    );

    this.#initSwipe();
    this.#initVariantSync();
  }

  get currentIndex() {
    return [...this.slides].findIndex((s) => s.classList.contains('is-active'));
  }

  goTo(imageId) {
    const id = String(imageId);

    this.slides.forEach((slide) => {
      slide.classList.toggle('is-active', slide.dataset.imageId === id);
    });

    this.thumbnails.forEach((thumb) => {
      const isActive = thumb.dataset.target === id;
      thumb.classList.toggle('border-gray-900', isActive);
      thumb.classList.toggle('border-transparent', !isActive);
      thumb.setAttribute('aria-selected', isActive);
    });
  }

  next() {
    const idx = (this.currentIndex + 1) % this.slides.length;
    this.goTo(this.slides[idx].dataset.imageId);
  }

  prev() {
    const idx = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.goTo(this.slides[idx].dataset.imageId);
  }

  #initSwipe() {
    let startX = 0;

    this.mainImage?.addEventListener(
      'touchstart',
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true }
    );

    this.mainImage?.addEventListener(
      'touchend',
      (e) => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          diff > 0 ? this.next() : this.prev();
        }
      },
      { passive: true }
    );
  }

  #initVariantSync() {
    const variantsEl = this.querySelector('[data-product-variants]');
    if (!variantsEl) return;

    let variants;
    try {
      variants = JSON.parse(variantsEl.textContent);
    } catch {
      return;
    }

    const select = document.querySelector('product-form select[name="id"]');
    select?.addEventListener('change', (e) => {
      const variant = variants.find((v) => v.id === Number(e.target.value));
      if (variant?.featured_image) {
        this.goTo(variant.featured_image.id);
      }
    });
  }
}

customElements.define('product-gallery', ProductGallery);

export { ProductGallery };
