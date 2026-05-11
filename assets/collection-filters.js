/**
 * Collection filters & sorting.
 * Mobile: full-screen drawer from left with Apply/Clear buttons.
 * Desktop: inline sidebar with auto-submit on change.
 */
class CollectionFilters extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector("[data-filter-form]");
    this.aside = this.querySelector("[data-filters]");
    this.overlay = this.querySelector("[data-filter-overlay]");
    this.label = this.querySelector("[data-filters-label]");

    this.desktopVisible = true;
    this.mdQuery = window.matchMedia("(min-width: 768px)");

    // Toggle buttons (toolbar + drawer header)
    this.querySelectorAll("[data-toggle-filters]").forEach((btn) =>
      btn.addEventListener("click", () => this.toggle()),
    );
    this.querySelectorAll("[data-close-filters]").forEach((btn) =>
      btn.addEventListener("click", () => this.closeDrawer()),
    );
    this.overlay?.addEventListener("click", () => this.closeDrawer());

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.drawerOpen) this.closeDrawer();
    });

    // Desktop: auto-submit on change. Mobile: user clicks Apply.
    this.form?.addEventListener("change", (e) => {
      if (!this.mdQuery.matches) return;
      if (e.target.type === "number") {
        clearTimeout(this._debounce);
        this._debounce = setTimeout(() => this.form.submit(), 800);
      } else {
        this.form.submit();
      }
    });

    // Set initial desktop label
    this.#updateDesktopLabel();
  }

  get drawerOpen() {
    return this.aside?.classList.contains("is-open");
  }

  toggle() {
    if (this.mdQuery.matches) {
      this.desktopVisible = !this.desktopVisible;
      this.aside.classList.toggle("is-desktop-hidden");
      this.#updateDesktopLabel();
    } else {
      this.drawerOpen ? this.closeDrawer() : this.openDrawer();
    }
  }

  openDrawer() {
    this.aside?.classList.add("is-open");
    this.overlay?.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  closeDrawer() {
    this.aside?.classList.remove("is-open");
    this.overlay?.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  #updateDesktopLabel() {
    if (this.label) {
      this.label.textContent = this.desktopVisible ? "Hide Filters" : "Show Filters";
    }
  }
}

customElements.define("collection-filters", CollectionFilters);

export { CollectionFilters };
