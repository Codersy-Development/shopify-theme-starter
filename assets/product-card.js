/**
 * Product card swatch interaction.
 * Swaps card image when a color swatch is clicked.
 */
document.addEventListener('click', (e) => {
  const swatch = e.target.closest('[data-swatch]');
  if (!swatch) return;

  e.preventDefault();
  e.stopPropagation();

  const card = swatch.closest('[data-product-card]');
  if (!card) return;

  // Swap image
  const img = card.querySelector('.product-card-image');
  if (img && swatch.dataset.imageSrc) {
    img.src = swatch.dataset.imageSrc;
    if (swatch.dataset.imageSrcset) {
      img.srcset = swatch.dataset.imageSrcset;
    }
  }

  // Update all links in the card to point to the correct variant
  if (swatch.dataset.url) {
    card.querySelectorAll('a').forEach((a) => {
      a.href = swatch.dataset.url;
    });
  }

  // Active swatch ring
  card.querySelectorAll('[data-swatch]').forEach((s) => {
    s.classList.remove('ring-2', 'ring-offset-1', 'ring-gray-900');
  });
  swatch.classList.add('ring-2', 'ring-offset-1', 'ring-gray-900');
});
