/**
 * Base class for drawer-style components.
 *
 * Encapsulates the open/close + body-scroll-lock + escape-to-close +
 * focus-trap behavior shared by cart-drawer, header-drawer, and the
 * mobile mode of collection-filters.
 *
 * `Drawer` is a class form that subclasses extend (cart-drawer,
 * header-drawer). Internally, `Drawer` delegates to
 * `Drawer.controllerFor` so the same logic lives in one place — the
 * class form is a thin wrapper around the controller. Subclasses still
 * call `super.setup()` / `super.open()` / `super.close()`, which simply
 * forwards to the internal controller.
 *
 * Subclasses MUST call `super.setup()` first so that `this.panel` and
 * `this.overlay` are populated before subclass listeners run.
 *
 * Markup contract: the host element contains `[data-panel]` and
 * `[data-overlay]` descendants. Any descendant `[data-close]` of the
 * host closes the drawer when clicked. `[data-close]` lookup is
 * host-scoped in both the class form and `controllerFor`.
 *
 * For hosts that need drawer behavior on a sub-region of themselves
 * (e.g. <collection-filters> on its mobile filters aside), use the
 * static `Drawer.controllerFor(panel, overlay, host)` instead of
 * extending Drawer. `controllerFor` is the canonical implementation.
 */
import { Component } from "@theme/component";

class Drawer extends Component {
  /** Delay (ms) before focusing the close button so the open transition completes first. */
  static FOCUS_DELAY_MS = 350;

  setup() {
    this.panel = this.$("[data-panel]");
    this.overlay = this.$("[data-overlay]");
    this._controller = Drawer.controllerFor(this.panel, this.overlay, this);
  }

  get isOpen() {
    return this._controller.isOpen;
  }

  open() {
    this._controller.open();
  }

  close() {
    this._controller.close();
  }

  /**
   * Build a drawer controller for hosts that don't extend Drawer.
   * Returns an object exposing the same `open()`, `close()`, and
   * `isOpen` interface, against the supplied panel and overlay.
   *
   * @param {Element} panel
   * @param {Element|null} overlay
   * @param {Element} host  Element used to scope the `[data-close]` lookup.
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
    host.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (!isOpen()) return;
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

export { Drawer };
