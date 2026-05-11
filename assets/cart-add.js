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

  const cartResponse = await fetch("/cart.js");
  const cart = await cartResponse.json();

  document.dispatchEvent(
    new CustomEvent("cart:updated", { detail: { item_count: cart.item_count } }),
  );
  document.dispatchEvent(new CustomEvent("cart:open"));

  const status = document.getElementById("cart-status");
  if (status) {
    status.textContent = `Added ${addedItem.product_title} to cart. Cart now has ${cart.item_count} ${cart.item_count === 1 ? "item" : "items"}.`;
  }

  return addedItem;
}
