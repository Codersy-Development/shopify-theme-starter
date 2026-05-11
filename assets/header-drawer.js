/**
 * Mobile menu drawer.
 * Open/close + body lock + escape + focus trap come from Drawer.
 * This subclass adds: hamburger trigger and aria-expanded sync.
 */
import { Drawer } from "@theme/drawer";

class HeaderDrawer extends Drawer {
  setup() {
    super.setup();
    this.openBtn = this.$("[data-open]");
    this.openBtn?.addEventListener("click", () => this.open());
  }

  open() {
    super.open();
    this.openBtn?.setAttribute("aria-expanded", "true");
  }

  close() {
    if (!this.isOpen) return;
    super.close();
    this.openBtn?.setAttribute("aria-expanded", "false");
    this.openBtn?.focus();
  }
}

customElements.define("header-drawer", HeaderDrawer);

export { HeaderDrawer };
