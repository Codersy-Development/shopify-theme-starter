/**
 * Grid column switcher for collection pages.
 * Toggles md:grid-cols-N classes on the parent <collection-filters>'s
 * [data-product-grid] element and persists the user choice in
 * localStorage under "collection-grid-cols".
 */
import { Component } from "@theme/component";

class GridSwitcher extends Component {
  static STORAGE_KEY = "collection-grid-cols";

  setup() {
    this.grid = this.closest("collection-filters")?.querySelector("[data-product-grid]");
    this.btns = this.$$("[data-grid]");
    if (!this.grid || !this.btns.length) return;

    const saved = localStorage.getItem(GridSwitcher.STORAGE_KEY);
    if (saved) this.#apply(saved);

    this.btns.forEach((btn) =>
      btn.addEventListener("click", () => {
        const cols = btn.dataset.grid;
        this.#apply(cols);
        localStorage.setItem(GridSwitcher.STORAGE_KEY, cols);
      }),
    );
  }

  #apply(cols) {
    this.grid.classList.remove("md:grid-cols-3", "md:grid-cols-4");
    this.grid.classList.add(`md:grid-cols-${cols}`);
    this.btns.forEach((b) => {
      b.classList.toggle("bg-gray-100", b.dataset.grid === cols);
    });
  }
}

customElements.define("grid-switcher", GridSwitcher);

export { GridSwitcher };
