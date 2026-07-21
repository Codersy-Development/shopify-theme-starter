/**
 * Predictive search component.
 * Fetches results from Shopify's predictive search API as the user types
 * and renders product / page / article suggestions.
 */
import { Component } from "@theme/component";

class PredictiveSearch extends Component {
  static DEBOUNCE_MS = 300;

  static string(key, fallback) {
    return window.themeStrings?.[key] ?? fallback;
  }

  static get EMPTY_HTML() {
    return `<div class="px-4 py-8 text-center text-sm text-gray-400">${PredictiveSearch.string("searchStart", "Start typing to search...")}</div>`;
  }

  static get LOADING_HTML() {
    return `<div class="px-4 py-6 text-center text-sm text-gray-400">${PredictiveSearch.string("searching", "Searching...")}</div>`;
  }

  static get ERROR_HTML() {
    return `<div class="px-4 py-6 text-center text-sm text-gray-500">${PredictiveSearch.string("searchError", "Something went wrong. Try again.")}</div>`;
  }

  setup() {
    this.openBtn = this.$("[data-open-search]");
    this.closeBtn = this.$("[data-close-search]");
    this.dropdown = this.$(".predictive-search-results");
    this.input = this.$("[data-search-input]");
    this.resultsContainer = this.$("[data-search-results]");
    this.debounceTimer = null;

    this.openBtn?.addEventListener("click", () => this.open());
    this.closeBtn?.addEventListener("click", () => this.close());

    this.input?.addEventListener("input", () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.search(), PredictiveSearch.DEBOUNCE_MS);
    });

    this.input?.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });

    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.contains(e.target)) this.close();
    });
  }

  get isOpen() {
    return this.dropdown?.classList.contains("is-active");
  }

  open() {
    this.dropdown?.classList.add("is-active");
    setTimeout(() => {
      this.input?.focus();
    }, 50);
  }

  close() {
    this.dropdown?.classList.remove("is-active");
    if (this.input) this.input.value = "";
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = PredictiveSearch.EMPTY_HTML;
    }
  }

  async search() {
    const query = this.input?.value?.trim();
    if (!query || query.length < 2) {
      this.resultsContainer.innerHTML = PredictiveSearch.EMPTY_HTML;
      return;
    }

    this.resultsContainer.innerHTML = PredictiveSearch.LOADING_HTML;

    try {
      const response = await fetch(
        `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product,page,article&resources[limit]=6`,
      );
      const data = await response.json();
      const products = data.resources?.results?.products || [];
      const pages = data.resources?.results?.pages || [];
      const articles = data.resources?.results?.articles || [];

      if (products.length === 0 && pages.length === 0 && articles.length === 0) {
        const noResults = this.#escape(
          PredictiveSearch.string("searchNoResults", "No results for “[query]”"),
        ).replace("[query]", this.#escape(query));
        this.resultsContainer.innerHTML = `<div class="px-4 py-6 text-center text-sm text-gray-500">${noResults}</div>`;
        return;
      }

      let html = "";

      if (products.length > 0) {
        html += '<div class="py-2">';
        html += `<p class="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">${this.#escape(PredictiveSearch.string("searchProducts", "Products"))}</p>`;
        for (const product of products) {
          const title = this.#escape(product.title);
          const url = this.#escape(product.url);
          const price = this.#escape(product.price);
          const image = product.image
            ? `<img src="${this.#escape(product.image)}" alt="${title}" class="w-10 h-10 object-cover rounded" width="40" height="40">`
            : '<div class="w-10 h-10 bg-gray-100 rounded"></div>';
          html += `
            <a href="${url}" class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 no-underline transition-colors">
              ${image}
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 truncate">${title}</p>
                <p class="text-xs text-gray-500">${price}</p>
              </div>
            </a>
          `;
        }
        html += "</div>";
      }

      if (pages.length > 0) {
        html += '<div class="py-2 border-t border-gray-100">';
        html += `<p class="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">${this.#escape(PredictiveSearch.string("searchPages", "Pages"))}</p>`;
        for (const page of pages) {
          const title = this.#escape(page.title);
          const url = this.#escape(page.url);
          html += `<a href="${url}" class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 no-underline transition-colors">${title}</a>`;
        }
        html += "</div>";
      }

      if (articles.length > 0) {
        html += '<div class="py-2 border-t border-gray-100">';
        html += `<p class="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">${this.#escape(PredictiveSearch.string("searchArticles", "Articles"))}</p>`;
        for (const article of articles) {
          const title = this.#escape(article.title);
          const url = this.#escape(article.url);
          html += `<a href="${url}" class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 no-underline transition-colors">${title}</a>`;
        }
        html += "</div>";
      }

      const viewAllUrl = this.#escape(`/search?q=${encodeURIComponent(query)}`);
      html += `<a href="${viewAllUrl}" class="block px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 no-underline border-t border-gray-200 transition-colors">${this.#escape(PredictiveSearch.string("searchViewAll", "View all results"))}</a>`;

      this.resultsContainer.innerHTML = html;
    } catch (error) {
      console.error("Predictive search error:", error);
      this.resultsContainer.innerHTML = PredictiveSearch.ERROR_HTML;
    }
  }

  #escape(str) {
    const el = document.createElement("span");
    el.textContent = str ?? "";
    return el.innerHTML;
  }
}

customElements.define("predictive-search", PredictiveSearch);

export { PredictiveSearch };
