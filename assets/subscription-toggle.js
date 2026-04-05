class SubscriptionToggle extends HTMLElement {
  connectedCallback() {
    this.radios = this.querySelectorAll('input[name="purchase_type"]');
    this.radios.forEach((radio) => {
      radio.addEventListener('change', () => this._update());
    });
  }

  _update() {
    const selected = this.querySelector('input[name="purchase_type"]:checked');
    if (!selected) return;

    this.querySelectorAll('label').forEach((label) => {
      label.classList.remove('border-[var(--color-primary)]', 'ring-1', 'ring-[var(--color-primary)]');
    });

    const activeLabel = selected.closest('label');
    if (activeLabel) {
      activeLabel.classList.add('border-[var(--color-primary)]', 'ring-1', 'ring-[var(--color-primary)]');
    }
  }
}

if (!customElements.get('subscription-toggle')) {
  customElements.define('subscription-toggle', SubscriptionToggle);
}
