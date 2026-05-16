/**
 * Hide-on-scroll-down, show-on-scroll-up sticky header.
 *
 * The header element itself owns `position: sticky` + transition classes;
 * this component just flips a `data-hidden` attribute based on scroll
 * direction. Pauses while a nav dropdown / mega menu / predictive-search
 * panel is open, and while the theme editor is active.
 */
import { Component } from "@theme/component";

class StickyHeader extends Component {
  /** Pixels from top before hide-on-scroll-down engages. */
  static SHOW_THRESHOLD = 100;
  /** Min scroll delta (px) to act on, filters out jitter. */
  static DELTA_THRESHOLD = 4;

  setup() {
    this.lastY = window.scrollY;
    this.ticking = false;

    this.onScroll = this.onScroll.bind(this);
    window.addEventListener("scroll", this.onScroll, { passive: true });
  }

  disconnectedCallback() {
    window.removeEventListener("scroll", this.onScroll);
  }

  onScroll() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.update();
      this.ticking = false;
    });
  }

  update() {
    const y = window.scrollY;
    const delta = y - this.lastY;

    if (Math.abs(delta) < StickyHeader.DELTA_THRESHOLD) return;
    this.lastY = y;

    if (window.Shopify?.designMode || this.#hasOpenPanel()) {
      this.#show();
      return;
    }

    if (y <= StickyHeader.SHOW_THRESHOLD || delta < 0) {
      this.#show();
    } else {
      this.#hide();
    }
  }

  #show() {
    this.removeAttribute("data-hidden");
  }

  #hide() {
    this.setAttribute("data-hidden", "");
  }

  #hasOpenPanel() {
    return !!this.querySelector(".is-open, .is-active");
  }
}

customElements.define("sticky-header", StickyHeader);

export { StickyHeader };
