/**
 * Collection filters orchestrator.
 *
 * Owns: form auto-submit on change (desktop), the toggle button
 * (Show/Hide on desktop, Open/Close drawer on mobile), and the
 * viewport-aware "Show Filters" / "Hide Filters" label.
 *
 * Delegates: <grid-switcher> and <price-range-slider> are independent
 * custom elements rendered inside this orchestrator. The mobile drawer
 * mode is delegated to Drawer.controllerFor() against [data-filters] +
 * [data-filter-overlay].
 */
import { Component } from "@theme/component";
import { Drawer } from "@theme/drawer";

class CollectionFilters extends Component {
  /** Debounce (ms) for type=number inputs before auto-submit. */
  static NUMBER_DEBOUNCE_MS = 800;

  setup() {
    this.form = this.$("[data-filter-form]");
    this.aside = this.$("[data-filters]");
    this.overlay = this.$("[data-filter-overlay]");
    this.label = this.$("[data-filters-label]");

    this.desktopVisible = true;
    this.mdQuery = window.matchMedia("(min-width: 768px)");
    this.drawer = Drawer.controllerFor(this.aside, this.overlay, this);

    // Keep the label in sync with whatever toggles the aside's classes
    // (drawer open/close, desktop show/hide). Catches Escape and overlay-click
    // closes too, which don't route through our toggle() handler.
    new MutationObserver(() => this.#updateLabel()).observe(this.aside, {
      attributes: true,
      attributeFilter: ["class"],
    });
    this.mdQuery.addEventListener("change", () => this.#updateLabel());

    // Toggle buttons (toolbar + drawer header)
    this.$$("[data-toggle-filters]").forEach((btn) =>
      btn.addEventListener("click", () => this.toggle()),
    );
    this.$$("[data-close-filters]").forEach((btn) =>
      btn.addEventListener("click", () => this.drawer.close()),
    );

    // Desktop: auto-submit on change. Mobile: user clicks Apply.
    this.form?.addEventListener("change", (e) => {
      if (!this.mdQuery.matches) return;
      if (e.target.type === "number") {
        clearTimeout(this._debounce);
        this._debounce = setTimeout(() => this.form.submit(), CollectionFilters.NUMBER_DEBOUNCE_MS);
      } else {
        this.form.submit();
      }
    });

    this.#updateLabel();
  }

  toggle() {
    if (this.mdQuery.matches) {
      this.desktopVisible = !this.desktopVisible;
      this.aside.classList.toggle("is-desktop-hidden");
    } else {
      this.drawer.isOpen ? this.drawer.close() : this.drawer.open();
    }
  }

  #updateLabel() {
    if (!this.label) return;
    const showing = this.mdQuery.matches ? this.desktopVisible : this.drawer.isOpen;
    this.label.textContent = showing ? "Hide Filters" : "Show Filters";
  }
}

customElements.define("collection-filters", CollectionFilters);

export { CollectionFilters };
