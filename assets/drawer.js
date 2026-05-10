/**
 * Base class for drawer-style components.
 *
 * Encapsulates the open/close + body-scroll-lock + escape-to-close +
 * focus-trap behavior shared by cart-drawer, header-drawer, and the
 * mobile mode of collection-filters.
 *
 * Subclasses MUST call `super.setup()` first so that `this.panel` and
 * `this.overlay` are populated before subclass listeners run.
 *
 * Markup contract: the host element contains `[data-panel]` and
 * `[data-overlay]` descendants. Any descendant `[data-close]` closes
 * the drawer when clicked.
 *
 * For hosts that need drawer behavior on a sub-region of themselves
 * (e.g. <collection-filters> on its mobile filters aside), use the
 * static `Drawer.controllerFor(panel, overlay, host)` instead of
 * extending Drawer.
 */
import { Component } from "@theme/component";

class Drawer extends Component {
  /** Delay (ms) before focusing the close button so the open transition completes first. */
  static FOCUS_DELAY_MS = 350;

  setup() {
    this.panel = this.$("[data-panel]");
    this.overlay = this.$("[data-overlay]");
    this._returnFocusEl = null;

    this.$$("[data-close]").forEach((el) => el.addEventListener("click", () => this.close()));
    this.overlay?.addEventListener("click", () => this.close());

    document.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;
      if (e.key === "Escape") this.close();
      if (e.key === "Tab") this.#trapFocus(e);
    });
  }

  get isOpen() {
    return this.panel?.classList.contains("is-open");
  }

  open() {
    this._returnFocusEl = document.activeElement;
    this.panel?.classList.add("is-open");
    this.overlay?.classList.add("is-open");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      this.panel?.querySelector("[data-close]")?.focus();
    }, Drawer.FOCUS_DELAY_MS);
  }

  close() {
    if (!this.isOpen) return;

    this.panel?.classList.remove("is-open");
    this.overlay?.classList.remove("is-open");
    document.body.style.overflow = "";
    this._returnFocusEl?.focus?.();
  }

  #trapFocus(e) {
    const focusable = this.panel?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable || !focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /**
   * Build a drawer controller for hosts that don't extend Drawer.
   * Returns an object exposing the same `open()`, `close()`, and
   * `isOpen` interface, against the supplied panel and overlay.
   *
   * @param {Element} panel
   * @param {Element|null} overlay
   * @param {Element} host  Element the keydown listener filters against (Escape and Tab only fire while a descendant of host has focus or while host.contains(document.activeElement)).
   */
  static controllerFor(panel, overlay, host) {
    let returnFocusEl = null;

    const isOpen = () => panel?.classList.contains("is-open");

    const trapFocus = (e) => {
      const focusable = panel?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const open = () => {
      returnFocusEl = document.activeElement;
      panel?.classList.add("is-open");
      overlay?.classList.add("is-open");
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        panel?.querySelector("[data-close]")?.focus();
      }, Drawer.FOCUS_DELAY_MS);
    };

    const close = () => {
      if (!isOpen()) return;
      panel?.classList.remove("is-open");
      overlay?.classList.remove("is-open");
      document.body.style.overflow = "";
      returnFocusEl?.focus?.();
    };

    overlay?.addEventListener("click", close);
    panel?.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (!isOpen()) return;
      if (!host.contains(document.activeElement)) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") trapFocus(e);
    });

    return {
      open,
      close,
      get isOpen() {
        return isOpen();
      },
    };
  }
}

customElements.define("drawer-base", Drawer);

export { Drawer };
