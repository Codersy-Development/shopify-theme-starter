# Free Shipping Progress Tracker — Design

**Date:** 2026-05-11
**Feature:** Cart drawer free-shipping progress tracker
**Status:** Draft (pending user review)

## Context

This is a new feature, not a cleanup. It adds a progress tracker in the cart drawer that shows how close the customer is to a merchant-configured free-shipping threshold. The pattern is standard across Shopify themes; this starter doesn't have it yet.

The cart drawer's footer is already re-rendered on every `cart:updated` event via `cart-drawer.js refresh()` (which uses Shopify's Section Rendering API to fetch the cart-drawer section and swap `[data-cart-drawer-footer]`). The tracker lives in that footer and rides the existing refresh — no new JavaScript needed.

Sub-project 2 (the JS cleanup, PR #2) merged as `37ed0ce` immediately before this feature was scoped.

## Current State

- No `free_shipping_threshold` setting in `config/settings_schema.json`. The "Free shipping on orders over $50" text in `sections/announcement-bar.liquid` is a static `text`-type setting unrelated to anything programmatic.
- `sections/cart-drawer.liquid` has `[data-cart-drawer-content]` (items list) and `[data-cart-drawer-footer]` (subtotal + checkout button + view-cart link). The footer is what `cart-drawer.js` swaps on cart updates.
- `<cart-drawer>` extends `Drawer` and implements `refresh()` against `/cart.js?sections=cart-drawer`. The refresh logic already replaces `[data-cart-drawer-footer]` wholesale, which is the natural place for the tracker.

## Goals

- New theme setting `free_shipping_threshold` (number, storefront currency units) under the existing Cart group in `config/settings_schema.json`. Merchant-editable in the theme customizer. No default — blank means the tracker stays hidden.
- New snippet `snippets/free-shipping-tracker.liquid` that renders a horizontal progress bar plus a status label.
- Three render states:
  - **Threshold unset** (blank or `<= 0`) — snippet renders nothing.
  - **Cart below threshold** — label "Add `{{ remaining | money }}` more for free shipping", bar at `cart.total_price / threshold_cents` proportion.
  - **Cart at or above threshold** — label "You qualify for free shipping!", bar at 100% (no overflow past 100%).
- Tracker placed inside `sections/cart-drawer.liquid`'s `[data-cart-drawer-footer]`, above the subtotal row, only within the `cart.item_count > 0` branch.
- Updates ride the existing `cart-drawer.js refresh()` flow.

## Non-Goals

- **No new JavaScript file.** The Section Rendering API refresh already handles live updates.
- **No animated tween between values.** Bar snaps to the new width on section refresh; the `transition-all duration-300` classes are present so the bar smooths if/when the DOM element happens to be reused, but no work is done to engineer reuse.
- **No `/cart` page support.** `sections/main-cart.liquid` is unchanged. A follow-up can extend to that surface if desired.
- **No merchant-customizable message text.** Copy is hardcoded in the snippet.
- **No icon or illustration.** Text + bar only.
- **No multi-tier thresholds** (e.g., "$50 for shipping, $100 for free gift"). Single threshold.
- **No multi-currency Markets support.** Threshold is a single flat number across markets; we document the caveat in the setting `info` and consider Markets a follow-up.

## Architecture

Three changes, all small:

1. **`config/settings_schema.json`** — add `free_shipping_threshold` to whichever group `cart_type` belongs to (the implementation step reads the file and inserts into the right group). The setting:

   ```json
   {
     "type": "number",
     "id": "free_shipping_threshold",
     "label": "Free shipping threshold",
     "info": "Minimum order amount in your storefront currency (e.g., dollars) that qualifies for free shipping. Leave blank or set to 0 to hide the free-shipping tracker in the cart drawer."
   }
   ```

2. **`snippets/free-shipping-tracker.liquid`** (new) — self-contained snippet. Renders nothing when the setting is blank or zero. Computes:
   - `threshold_cents = settings.free_shipping_threshold | times: 100`
   - `remaining_cents = threshold_cents | minus: cart.total_price` (floored at 0)
   - `progress_pct = cart.total_price | times: 100 | divided_by: threshold_cents` (capped at 100)

3. **`sections/cart-drawer.liquid`** — add one line, `{% render 'free-shipping-tracker' %}`, at the top of the `[data-cart-drawer-footer]` block, inside the existing `{% if cart.item_count > 0 %}` branch.

### Data flow on cart change

```
user clicks +/- on cart line item
   ↓
cart-drawer.js #updateQuantity()
   ↓
fetch /cart/change.js → dispatch cart:updated
   ↓
this.refresh() fetches the cart-drawer section via the Section Rendering API
   ↓
[data-cart-drawer-footer] is replaced via DOM swap
   ↓
new footer includes the re-rendered free-shipping-tracker snippet
   ↓
new label text + bar width reflect current cart.total_price
```

The existing `cart-drawer.js` requires zero changes.

### Why a snippet, not inline section markup

- Keeps `sections/cart-drawer.liquid` focused on cart structure.
- The snippet is self-contained (visibility check inside), so consumers just `{% render %}` it.
- If a follow-up wants the tracker on `/cart` too, only one snippet to reuse.

## Snippet Contract

`snippets/free-shipping-tracker.liquid` — exact shape:

```liquid
{% comment %}
  Free shipping progress tracker.

  Shows progress toward `settings.free_shipping_threshold` (in storefront
  currency units, e.g. dollars). Renders nothing when the setting is blank
  or zero — gives merchants a one-setting on/off.

  Rendered inside <cart-drawer>'s [data-cart-drawer-footer]. The cart-drawer
  JS replaces that footer on cart:updated, so this snippet re-computes
  automatically with no extra wiring.
{% endcomment %}

{%- if settings.free_shipping_threshold > 0 -%}
  {%- liquid
    assign threshold_cents = settings.free_shipping_threshold | times: 100
    assign remaining_cents = threshold_cents | minus: cart.total_price
    assign progress_pct = cart.total_price | times: 100 | divided_by: threshold_cents
    if progress_pct > 100
      assign progress_pct = 100
    endif
    if remaining_cents < 0
      assign remaining_cents = 0
    endif
  -%}

  <div class="mb-4" data-free-shipping-tracker>
    <p class="text-sm text-gray-600 mb-2">
      {%- if remaining_cents > 0 -%}
        Add {{ remaining_cents | money }} more for free shipping
      {%- else -%}
        You qualify for free shipping!
      {%- endif -%}
    </p>
    <div
      class="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow="{{ progress_pct }}"
      aria-label="Free shipping progress"
    >
      <div
        class="h-full bg-gray-900 transition-all duration-300"
        style="width: {{ progress_pct }}%;"
      ></div>
    </div>
  </div>
{%- endif -%}
```

Markup notes:

- `data-free-shipping-tracker` attribute on the outer div as a future hook (zero cost).
- `role="progressbar"` + `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-label` for screen-reader access.
- The `<p>` label is the primary signal for screen readers; the percentage is supplementary.
- `style="width: {{ progress_pct }}%"` is inline because the value is dynamic per render. Tailwind's arbitrary-value syntax can't take a Liquid variable.
- `transition-all duration-300` smooths the bar growth if the DOM node persists; doesn't hurt to leave the classes even when the whole footer is replaced.
- `mb-4` separates the tracker from the subtotal row that follows.

## Section Edit

Inside the existing `{% if cart.item_count > 0 %} ... <div data-cart-drawer-footer> ... </div>` block in `sections/cart-drawer.liquid`, immediately after the opening `<div data-cart-drawer-footer ...>` and before the existing `<div class="flex items-center justify-between mb-4">` that renders Subtotal, insert:

```liquid
{% render 'free-shipping-tracker' %}
```

The snippet handles its own visibility, so the section doesn't need to guard it.

## Testing & Verification

No new JS, no new test infrastructure. Verification matches the rest of the theme: `npm run format:check`, `npm run theme:check`, manual smoke against `shopify theme dev`.

Smoke checklist:

1. **Threshold unset.** Cart drawer with items → tracker does NOT render. Footer shows only Subtotal + Checkout + View cart, as today.
2. **Threshold set, cart empty.** Set `free_shipping_threshold = 50` in theme customizer. Open cart drawer empty → tracker does NOT render (empty-cart branch unchanged).
3. **Threshold set, cart below threshold.** Add one $10 product → cart drawer footer shows tracker with label "Add $40.00 more for free shipping" + bar at 20%.
4. **Cart approaches threshold.** Bump cart to $25 → label "Add $25.00 more for free shipping", bar at 50%. Tracker re-renders via the existing `cart-drawer.js refresh()` flow; no flicker, no console errors.
5. **Cart reaches threshold.** Cart total $50 → label "You qualify for free shipping!", bar at 100%.
6. **Cart exceeds threshold.** Cart total $75 → label still "You qualify for free shipping!", bar still 100% (capped).
7. **Remove items.** Drop below threshold → label and bar revert correctly.
8. **Decimal threshold.** Set threshold to `49.99`. Cart at $25 → label shows "Add $24.99 more for free shipping" (math: `4999 - 2500 = 2499` cents).
9. **Accessibility.** VoiceOver / screen reader: the `<p>` label is announced; the bar reports `aria-valuenow`.
10. **No-regression spot check.** Browser console clean on home, product, collection, cart, and search pages. `npm run format:check` passes. `npm run theme:check` exit unchanged from baseline.

## Risks

- **Currency assumption.** `| money` formats based on storefront currency. A merchant using Shopify Markets with multiple currencies sees one flat threshold across markets. _Mitigation:_ documented in the setting `info` text; Markets support is a follow-up.
- **Decimal precision.** `setting | times: 100` on a 2-decimal value is exact (`49.99 → 4999`). More than 2 decimals yields undefined behavior. _Mitigation:_ `info` text recommends whole numbers or two decimals.
- **Drawer-only scope.** Customers visiting `/cart` directly don't see the tracker. _Mitigation:_ in scope as documented; follow-up if requested.

## Open Questions

None.

## Acceptance Criteria

- New setting `free_shipping_threshold` exists in `config/settings_schema.json` (type `number`, no default, placed in the same group as `cart_type`).
- `snippets/free-shipping-tracker.liquid` exists and renders nothing when the setting is blank or `<= 0`.
- `sections/cart-drawer.liquid` includes `{% render 'free-shipping-tracker' %}` at the top of `[data-cart-drawer-footer]`, inside the `cart.item_count > 0` branch, before the Subtotal row.
- Below-threshold state shows "Add $X more for free shipping" + partial-fill bar.
- At-or-above-threshold state shows "You qualify for free shipping!" + 100% bar (no overflow past 100%).
- Tracker re-renders correctly on `cart:updated` via the existing `cart-drawer.js refresh()` flow.
- Progress bar markup carries `role="progressbar"` + `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-label`.
- `npm run format:check` passes.
- `npm run theme:check` exit unchanged from baseline (still 54 offenses across 10 files — this feature shouldn't introduce or fix any Theme Check finding).
- All commits land on a single feature branch off `main`; ship as one PR.

## Follow-Up Work (Not This Spec)

- Sticky add-to-cart bar on the product page (separate brainstorm, separate spec, separate PR).
- Cart-page (`sections/main-cart.liquid`) rendering of the same tracker snippet.
- Multi-currency / Shopify Markets per-market thresholds.
- Multi-tier thresholds (e.g., "$50 ships free; spend $100 for a gift").
- Merchant-customizable message text via additional settings.
