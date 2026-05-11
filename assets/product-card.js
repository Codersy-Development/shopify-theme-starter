/**
 * Product card with optional color swatches.
 * Clicking a swatch swaps the card image and points all card links at
 * the variant URL.
 */
import { Component } from "@theme/component";

class ProductCard extends Component {
  setup() {
    this.addEventListener("click", (e) => this.#handleSwatchClick(e));
  }

  #handleSwatchClick(e) {
    const swatch = e.target.closest("[data-swatch]");
    if (!swatch) return;

    e.preventDefault();
    e.stopPropagation();

    // Swap image
    const img = this.$(".product-card-image");
    if (img && swatch.dataset.imageSrc) {
      img.src = swatch.dataset.imageSrc;
      if (swatch.dataset.imageSrcset) {
        img.srcset = swatch.dataset.imageSrcset;
      }
    }

    // Update all links in the card to point to the correct variant
    if (swatch.dataset.url) {
      this.$$("a").forEach((a) => {
        a.href = swatch.dataset.url;
      });
    }

    // Active swatch ring
    this.$$("[data-swatch]").forEach((s) => {
      s.classList.remove("ring-2", "ring-offset-1", "ring-gray-900");
    });
    swatch.classList.add("ring-2", "ring-offset-1", "ring-gray-900");
  }
}

customElements.define("product-card", ProductCard);

export { ProductCard };
