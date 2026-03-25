/**
 * Desktop navigation with dropdown and mega menu support.
 * Opens panels on hover (with delay) and keyboard interaction.
 */
class HeaderNav extends HTMLElement {
  /** @type {number} Delay in ms before closing a panel after mouse leaves */
  static CLOSE_DELAY = 150;

  connectedCallback() {
    this.items = this.querySelectorAll("[data-nav-item]");

    this.items.forEach((item) => {
      const trigger = item.querySelector("[data-nav-trigger]");
      let closeTimeout;

      // Hover open/close with delay
      item.addEventListener("mouseenter", () => {
        clearTimeout(closeTimeout);
        this.#closeAll(item);
        this.#open(item);
      });

      item.addEventListener("mouseleave", () => {
        closeTimeout = setTimeout(
          () => this.#close(item),
          HeaderNav.CLOSE_DELAY,
        );
      });

      // Keyboard: toggle on click/enter/space
      trigger?.addEventListener("click", (e) => {
        e.preventDefault();
        if (item.classList.contains("is-open")) {
          this.#close(item);
        } else {
          this.#closeAll(item);
          this.#open(item);
        }
      });

      // Keyboard: close on Escape
      item.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && item.classList.contains("is-open")) {
          this.#close(item);
          trigger?.focus();
        }
      });
    });

    // Close all when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.contains(e.target)) {
        this.#closeAll();
      }
    });
  }

  #open(item) {
    item.classList.add("is-open");
    item
      .querySelector("[data-nav-trigger]")
      ?.setAttribute("aria-expanded", "true");
  }

  #close(item) {
    item.classList.remove("is-open");
    item
      .querySelector("[data-nav-trigger]")
      ?.setAttribute("aria-expanded", "false");
  }

  /**
   * Close all open items except the one passed.
   * @param {Element} [except]
   */
  #closeAll(except) {
    this.items.forEach((item) => {
      if (item !== except) this.#close(item);
    });
  }
}

customElements.define("header-nav", HeaderNav);

export { HeaderNav };
