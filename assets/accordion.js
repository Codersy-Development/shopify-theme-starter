/**
 * Animated accordion group.
 * Uses CSS grid-template-rows for smooth open/close height transitions.
 */
class AccordionGroup extends HTMLElement {
  connectedCallback() {
    this.querySelectorAll('[data-accordion-trigger]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('[data-accordion]');
        const allowMultiple = this.hasAttribute('data-allow-multiple');

        if (item.classList.contains('is-open')) {
          this.#close(item);
        } else {
          if (!allowMultiple) {
            this.querySelectorAll('[data-accordion].is-open').forEach((open) =>
              this.#close(open)
            );
          }
          this.#open(item);
        }
      });
    });

    // Open items marked with data-open
    this.querySelectorAll('[data-accordion][data-open]').forEach((item) =>
      this.#open(item)
    );
  }

  #open(item) {
    item.classList.add('is-open');
    const trigger = item.querySelector('[data-accordion-trigger]');
    trigger?.setAttribute('aria-expanded', 'true');
  }

  #close(item) {
    item.classList.remove('is-open');
    const trigger = item.querySelector('[data-accordion-trigger]');
    trigger?.setAttribute('aria-expanded', 'false');
  }
}

customElements.define('accordion-group', AccordionGroup);

export { AccordionGroup };
