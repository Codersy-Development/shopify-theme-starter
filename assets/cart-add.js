/**
 * Write a message to the #cart-status aria-live region. No-op if the
 * region isn't on the page. Use this for any cart-flow announcement so
 * the singular/plural formatting can stay in one place.
 */
export function announceCartStatus(text) {
  const status = document.getElementById("cart-status");
  if (status) {
    status.textContent = text;
  }
}

/**
 * Translated strings injected by snippets/scripts.liquid, with English
 * fallbacks. [bracket] tokens are replaced by the caller.
 */
export function themeString(key, fallback) {
  return window.themeStrings?.[key] ?? fallback;
}

/** "item" / "items" for the given count, translated. */
export function itemsWord(count) {
  return count === 1 ? themeString("itemsOne", "item") : themeString("itemsOther", "items");
}

/**
 * Add an item to the cart via Shopify's AJAX API and broadcast the
 * resulting state. Returns the added item object on success.
 *
 * Dispatches on document:
 *  - cart:updated  { detail: { item_count } }   (after /cart.js refetch)
 *  - cart:open                                  (opens the cart drawer)
 *
 * Also writes the screen-reader announcement to #cart-status.
 *
 * Throws on non-OK response from /cart/add.js. Callers handle the
 * error UI (e.g. button "Error — try again" + restore).
 */
export async function addToCart({ id, quantity = 1 }) {
  const formData = new FormData();
  formData.append("id", id);
  formData.append("quantity", String(quantity));

  const response = await fetch("/cart/add.js", { method: "POST", body: formData });
  if (!response.ok) {
    throw new Error(`Add to cart failed: ${response.status}`);
  }
  const addedItem = await response.json();

  // /cart/add.js returns the added line item, not updated cart totals — fetch /cart.js for item_count.
  const cartResponse = await fetch("/cart.js");
  const cart = await cartResponse.json();

  document.dispatchEvent(
    new CustomEvent("cart:updated", { detail: { item_count: cart.item_count } }),
  );
  document.dispatchEvent(new CustomEvent("cart:open"));

  announceCartStatus(
    themeString("addedToCart", "Added [title] to cart. Cart now has [count] [items].")
      .replace("[title]", addedItem.product_title)
      .replace("[count]", cart.item_count)
      .replace("[items]", itemsWord(cart.item_count)),
  );

  return addedItem;
}
