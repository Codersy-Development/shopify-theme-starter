/**
 * Base component class for custom elements.
 * Provides a lightweight foundation for web components.
 */
export class Component extends HTMLElement {
  connectedCallback() {
    this.setup();
  }

  /**
   * Override in subclasses to initialize the component.
   */
  setup() {}

  /**
   * Query a single element within this component.
   * @param {string} selector
   * @returns {Element|null}
   */
  $(selector) {
    return this.querySelector(selector);
  }

  /**
   * Query all elements within this component.
   * @param {string} selector
   * @returns {NodeListOf<Element>}
   */
  $$(selector) {
    return this.querySelectorAll(selector);
  }
}
