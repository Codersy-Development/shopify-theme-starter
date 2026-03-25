/**
 * Predictive search component.
 * Fetches results from Shopify's predictive search API as the user types.
 */
class PredictiveSearch extends HTMLElement {
  connectedCallback() {
    this.openBtn = this.querySelector('[data-open-search]');
    this.closeBtn = this.querySelector('[data-close-search]');
    this.dropdown = this.querySelector('.predictive-search-results');
    this.input = this.querySelector('[data-search-input]');
    this.resultsContainer = this.querySelector('[data-search-results]');
    this.debounceTimer = null;

    this.openBtn?.addEventListener('click', () => this.open());
    this.closeBtn?.addEventListener('click', () => this.close());

    this.input?.addEventListener('input', () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.search(), 300);
    });

    this.input?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.contains(e.target)) this.close();
    });
  }

  get isOpen() {
    return this.dropdown?.classList.contains('is-active');
  }

  open() {
    this.dropdown?.classList.add('is-active');
    // Wait for CSS transition to enable pointer-events before focusing
    setTimeout(() => {
      this.input?.focus();
    }, 50);
  }

  close() {
    this.dropdown?.classList.remove('is-active');
    if (this.input) this.input.value = '';
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = '<div class="px-4 py-8 text-center text-sm text-gray-400">Start typing to search...</div>';
    }
  }

  async search() {
    const query = this.input?.value?.trim();
    if (!query || query.length < 2) {
      this.resultsContainer.innerHTML = '<div class="px-4 py-8 text-center text-sm text-gray-400">Start typing to search...</div>';
      return;
    }

    this.resultsContainer.innerHTML = '<div class="px-4 py-6 text-center text-sm text-gray-400">Searching...</div>';

    try {
      const response = await fetch(
        `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product,page,article&resources[limit]=6`
      );
      const data = await response.json();
      const products = data.resources?.results?.products || [];
      const pages = data.resources?.results?.pages || [];
      const articles = data.resources?.results?.articles || [];

      if (products.length === 0 && pages.length === 0 && articles.length === 0) {
        this.resultsContainer.innerHTML = `<div class="px-4 py-6 text-center text-sm text-gray-500">No results for &ldquo;${this.#escape(query)}&rdquo;</div>`;
        return;
      }

      let html = '';

      if (products.length > 0) {
        html += '<div class="py-2">';
        html += '<p class="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Products</p>';
        for (const product of products) {
          const image = product.image ? `<img src="${product.image}" alt="${this.#escape(product.title)}" class="w-10 h-10 object-cover rounded" width="40" height="40">` : '<div class="w-10 h-10 bg-gray-100 rounded"></div>';
          html += `
            <a href="${product.url}" class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 no-underline transition-colors">
              ${image}
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 truncate">${this.#escape(product.title)}</p>
                <p class="text-xs text-gray-500">${product.price}</p>
              </div>
            </a>
          `;
        }
        html += '</div>';
      }

      if (pages.length > 0) {
        html += '<div class="py-2 border-t border-gray-100">';
        html += '<p class="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pages</p>';
        for (const page of pages) {
          html += `<a href="${page.url}" class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 no-underline transition-colors">${this.#escape(page.title)}</a>`;
        }
        html += '</div>';
      }

      if (articles.length > 0) {
        html += '<div class="py-2 border-t border-gray-100">';
        html += '<p class="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Articles</p>';
        for (const article of articles) {
          html += `<a href="${article.url}" class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 no-underline transition-colors">${this.#escape(article.title)}</a>`;
        }
        html += '</div>';
      }

      html += `<a href="/search?q=${encodeURIComponent(query)}" class="block px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 no-underline border-t border-gray-200 transition-colors">View all results</a>`;

      this.resultsContainer.innerHTML = html;
    } catch (error) {
      console.error('Predictive search error:', error);
      this.resultsContainer.innerHTML = '<div class="px-4 py-6 text-center text-sm text-gray-500">Something went wrong. Try again.</div>';
    }
  }

  #escape(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }
}

customElements.define('predictive-search', PredictiveSearch);

export { PredictiveSearch };
