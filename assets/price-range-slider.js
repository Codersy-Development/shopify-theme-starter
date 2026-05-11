/**
 * Dual-thumb price range slider.
 *
 * Reads [data-range-min], [data-range-max], [data-range-track] inside
 * itself and binds drag handlers (mouse + touch). Updates the
 * neighboring [data-price-min] / [data-price-max] hidden inputs and
 * [data-label-min] / [data-label-max] display elements.
 *
 * Fix vs the original implementation: when a drag completes, dispatches
 * a native 'change' event on each price input so a parent
 * <collection-filters> form-change listener can auto-submit on desktop.
 */
import { Component } from "@theme/component";

class PriceRangeSlider extends Component {
  setup() {
    this.minThumb = this.$("[data-range-min]");
    this.maxThumb = this.$("[data-range-max]");
    this.track = this.$("[data-range-track]");
    this.sliderEl = this.$("[data-range-slider]");
    if (!this.minThumb || !this.maxThumb || !this.track || !this.sliderEl) return;

    this.minInput = this.$("[data-price-min]");
    this.maxInput = this.$("[data-price-max]");
    this.minLabel = this.$("[data-label-min]");
    this.maxLabel = this.$("[data-label-max]");

    this.rangeMax = parseFloat(this.dataset.rangeMax) || 100;
    this.currencySymbol = this.dataset.currency || "$";
    this.minVal = parseFloat(this.minInput?.value) || 0;
    this.maxVal = parseFloat(this.maxInput?.value) || this.rangeMax;

    this.#bindThumb(this.minThumb, (v) => {
      this.minVal = Math.min(v, this.maxVal - 1);
    });
    this.#bindThumb(this.maxThumb, (v) => {
      this.maxVal = Math.max(v, this.minVal + 1);
    });

    this.#renderPositions();
  }

  #renderPositions() {
    const minPct = (this.minVal / this.rangeMax) * 100;
    const maxPct = (this.maxVal / this.rangeMax) * 100;
    this.minThumb.style.left = `${minPct}%`;
    this.maxThumb.style.left = `${maxPct}%`;
    this.track.style.left = `${minPct}%`;
    this.track.style.right = `${100 - maxPct}%`;
    if (this.minInput) this.minInput.value = this.minVal > 0 ? this.minVal : "";
    if (this.maxInput) this.maxInput.value = this.maxVal < this.rangeMax ? this.maxVal : "";
    if (this.minLabel)
      this.minLabel.textContent = `${this.currencySymbol}${Math.round(this.minVal)}`;
    if (this.maxLabel)
      this.maxLabel.textContent = `${this.currencySymbol}${Math.round(this.maxVal)}+`;
  }

  #bindThumb(thumb, setter) {
    const onMove = (e) => {
      const rect = this.sliderEl.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      const val = Math.round((pct / 100) * this.rangeMax);
      setter(val);
      this.#renderPositions();
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      // Fix: notify the parent form so auto-submit on desktop fires.
      this.minInput?.dispatchEvent(new Event("change", { bubbles: true }));
      this.maxInput?.dispatchEvent(new Event("change", { bubbles: true }));
    };

    thumb.addEventListener("mousedown", (e) => {
      e.preventDefault();
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    thumb.addEventListener(
      "touchstart",
      () => {
        document.addEventListener("touchmove", onMove, { passive: true });
        document.addEventListener("touchend", onUp);
      },
      { passive: true },
    );
  }
}

customElements.define("price-range-slider", PriceRangeSlider);

export { PriceRangeSlider };
