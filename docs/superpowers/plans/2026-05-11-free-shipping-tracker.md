# Free Shipping Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a free-shipping progress tracker (label + horizontal bar) to the cart drawer's footer, driven by a new `free_shipping_threshold` theme setting. No new JavaScript — the existing `cart-drawer.js refresh()` flow re-renders the footer on every `cart:updated` event, so the snippet re-computes for free.

**Architecture:** Three small changes: a new theme setting in `config/settings_schema.json` (placed in the existing "Cart" group), a new snippet `snippets/free-shipping-tracker.liquid` that self-gates on the setting and renders both states (below / at-or-above threshold), and a one-line `{% render %}` insertion in `sections/cart-drawer.liquid`'s `[data-cart-drawer-footer]`. All three changes ship in one commit on a fresh feature branch off `main`.

**Tech Stack:** Shopify Liquid (snippet + section), Tailwind 4 utility classes (no new Tailwind config), the existing Section Rendering API plumbing in `cart-drawer.js` (unchanged), Prettier + Theme Check from sub-project 1.

**Spec:** [docs/superpowers/specs/2026-05-11-free-shipping-tracker-design.md](../specs/2026-05-11-free-shipping-tracker-design.md)

**Verification model (no tests added):**
- After implementation: `npm run format:check` must pass (exit 0).
- `npm run theme:check` must remain exit 1 with the same baseline (55 files inspected, 54 total offenses, 34 errors, 20 warnings).
- Manual smoke checklist runs in Task 3 against `shopify theme dev`.

**Branch & commit conventions:**
- Feature branch off `main`: `feature/free-shipping-tracker`.
- Single implementation commit. Final push opens the PR as draft (smoke testing happens against the PR, as with sub-project 2's flow).

---

## Task 0: Create feature branch

**Files:** none

- [ ] **Step 1: Verify clean working tree**

Run: `git status --short`
Expected: only the untracked `docs/superpowers/PROGRESS.md` (carried over from earlier sessions). If anything else appears, stop and resolve before continuing.

- [ ] **Step 2: Verify on main and up to date**

Run: `git rev-parse --abbrev-ref HEAD && git fetch origin && git rev-list --count HEAD..origin/main`
Expected: branch is `main`, commit count behind origin is `0`. If you're behind, run `git pull --ff-only` before continuing.

- [ ] **Step 3: Create and check out branch**

Run: `git checkout -b feature/free-shipping-tracker`
Expected: `Switched to a new branch 'feature/free-shipping-tracker'`

---

## Task 1: Implement the feature (single commit)

**Goal:** Three changes — setting, snippet, render call — landed together so the feature is end-to-end functional in one commit.

**Files:**
- Modify: `config/settings_schema.json`
- Create: `snippets/free-shipping-tracker.liquid`
- Modify: `sections/cart-drawer.liquid`

- [ ] **Step 1: Add the `free_shipping_threshold` setting to `config/settings_schema.json`**

Use Edit. Replace this exact `old_string` (the closing of the existing `cart_type` object plus the closing `]` of the Cart group's `settings` array, lines 93–104):

```
      {
        "type": "select",
        "id": "cart_type",
        "label": "Cart type",
        "options": [
          { "value": "drawer", "label": "Drawer" },
          { "value": "page", "label": "Page" }
        ],
        "default": "drawer",
        "info": "Choose how the cart is displayed. Drawer slides in from the right, page navigates to /cart."
      }
    ]
```

with this `new_string`:

```
      {
        "type": "select",
        "id": "cart_type",
        "label": "Cart type",
        "options": [
          { "value": "drawer", "label": "Drawer" },
          { "value": "page", "label": "Page" }
        ],
        "default": "drawer",
        "info": "Choose how the cart is displayed. Drawer slides in from the right, page navigates to /cart."
      },
      {
        "type": "number",
        "id": "free_shipping_threshold",
        "label": "Free shipping threshold",
        "info": "Minimum order amount in your storefront currency (e.g., dollars) that qualifies for free shipping. Leave blank or set to 0 to hide the free-shipping tracker in the cart drawer."
      }
    ]
```

The change adds a trailing comma after the `cart_type` object's closing brace and inserts the new `free_shipping_threshold` object before the closing `]` of the `settings` array.

- [ ] **Step 2: Create `snippets/free-shipping-tracker.liquid`**

Create the file with this exact content:

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

- [ ] **Step 3: Render the snippet inside `sections/cart-drawer.liquid`**

Use Edit. Insert the `{% render 'free-shipping-tracker' %}` call immediately after the opening `<div data-cart-drawer-footer ...>` tag, before the Subtotal row.

Replace this exact `old_string` (lines 133–134):

```
      <div data-cart-drawer-footer class="border-t border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between mb-4">
```

with:

```
      <div data-cart-drawer-footer class="border-t border-gray-200 px-6 py-4">
        {% render 'free-shipping-tracker' %}
        <div class="flex items-center justify-between mb-4">
```

The render line uses 8-space indentation to match the surrounding content inside the footer div.

- [ ] **Step 4: Run format check**

Run: `npm run format:check`
Expected: PASS (exit 0). All matched files use Prettier code style.

If it fails on `snippets/free-shipping-tracker.liquid` (the Liquid Prettier plugin may reflow some whitespace), run `npx prettier --write snippets/free-shipping-tracker.liquid` and re-run `npm run format:check`. The reflow is acceptable as long as the semantics are unchanged.

- [ ] **Step 5: Run theme check**

Run: `npm run theme:check; echo "exit=$?"`
Expected: `exit=1` with the baseline summary: `55 files inspected with 54 total offenses found across 10 files. 34 errors. 20 warnings.` Theme Check inspects the new snippet too — confirm the offense count is unchanged. If the count grew, the new snippet triggered a Theme Check rule that needs addressing before continuing.

- [ ] **Step 6: Confirm working tree contains only the expected three changes**

Run: `git status --short`
Expected:

```
 M config/settings_schema.json
?? docs/superpowers/PROGRESS.md
?? snippets/free-shipping-tracker.liquid
 M sections/cart-drawer.liquid
```

(Order may vary; `docs/superpowers/PROGRESS.md` is the unrelated untracked file from earlier sessions.) If anything else is modified, stop and investigate before staging.

- [ ] **Step 7: Commit**

Stage only the three intended files (do NOT use `git add -A` — that would pick up `PROGRESS.md`):

```bash
git add config/settings_schema.json snippets/free-shipping-tracker.liquid sections/cart-drawer.liquid
git commit -m "feat: free shipping progress tracker in cart drawer

Adds a horizontal progress bar + label inside the cart-drawer footer
showing how close the customer is to a merchant-configured free
shipping threshold.

- New setting: settings.free_shipping_threshold (number, blank = off)
- New snippet: snippets/free-shipping-tracker.liquid
- One-line render in sections/cart-drawer.liquid's data-cart-drawer-footer

Three states:
- Threshold blank or <= 0: tracker hidden
- Cart below threshold: 'Add \$X more for free shipping' + partial bar
- Cart at/above threshold: 'You qualify for free shipping!' + 100% bar

Re-renders via the existing cart-drawer.js refresh() flow on
cart:updated — no new JavaScript required."
```

---

## Task 2: Smoke + push + open PR

**Goal:** Run the manual smoke checklist against `shopify theme dev`, then push and open a draft PR. (Manual smoke happens before push so any fixes land on the same commit history pre-PR.)

**Files:** none (this is verification + PR)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Both `watch:css` and `shopify theme dev` start. The CLI prints a preview URL — open it in a browser.

- [ ] **Step 2: Smoke — threshold unset**

In a separate tab, open the theme customizer: `https://<store>.myshopify.com/admin/themes/current/editor`. Verify that under **Theme settings → Cart**, a new "Free shipping threshold" field exists below "Cart type".

Leave the field blank. Save. On the storefront, add an item to the cart, open the cart drawer. Expected: NO tracker visible. Footer shows only Subtotal + Checkout + View cart, exactly as before.

- [ ] **Step 3: Smoke — threshold set, cart below**

In the customizer, set Free shipping threshold to `50`. Save. On the storefront, ensure cart has one item totaling less than $50 (e.g., a $10 product). Open the cart drawer.

Expected:
- A label reading "Add $40.00 more for free shipping" appears above the Subtotal row (assuming a $10 cart).
- A horizontal progress bar below the label, filled to ~20% (matching `10/50`).

Tweak: change the cart quantity (use the +/- buttons) to reach $25. Expected: label updates to "Add $25.00 more for free shipping", bar to ~50%. No flicker, no console errors.

- [ ] **Step 4: Smoke — cart reaches threshold**

Bump cart total to exactly $50 (e.g., 5x of $10).
Expected: label flips to "You qualify for free shipping!", bar at 100%.

- [ ] **Step 5: Smoke — cart exceeds threshold**

Bump cart total to $75.
Expected: label still "You qualify for free shipping!", bar still 100% (clamped, NOT 150%).

- [ ] **Step 6: Smoke — remove items back below threshold**

Remove items until cart total drops below $50.
Expected: label and bar revert correctly (e.g., $30 cart → "Add $20.00 more for free shipping", bar at 60%).

- [ ] **Step 7: Smoke — decimal threshold**

In the customizer, change the threshold to `49.99`. Save. Set cart to $25.
Expected: label shows "Add $24.99 more for free shipping" (math: `4999 - 2500 = 2499` cents → `$24.99` via the `| money` filter).

- [ ] **Step 8: Accessibility check**

Open browser devtools, find the progress bar div, confirm it has:
- `role="progressbar"`
- `aria-valuemin="0"`
- `aria-valuemax="100"`
- `aria-valuenow` matching the bar's fill percentage
- `aria-label="Free shipping progress"`

If you have a screen reader available (VoiceOver on macOS, NVDA on Windows), tab to the cart drawer and confirm the label `<p>` is announced.

- [ ] **Step 9: No-regression spot check**

Browse to: home page, a product page, a collection page, the standalone `/cart` page, and a search results page. In each, open browser devtools console.
Expected: console clean (no errors, no warnings introduced by this change). `/cart` page does NOT show the tracker (correct — it's drawer-only).

- [ ] **Step 10: Stop the dev server**

`Ctrl-C` the `npm run dev` terminal.

- [ ] **Step 11: Push the branch**

```bash
git push -u origin feature/free-shipping-tracker
```

- [ ] **Step 12: Open the PR as draft**

```bash
gh pr create --draft --title "feat: free shipping progress tracker in cart drawer" --body "$(cat <<'EOF'
## Summary

Adds a free-shipping progress tracker (label + horizontal bar) to the cart-drawer footer. Driven by a new \`settings.free_shipping_threshold\` theme setting under **Theme settings → Cart**. Three states:

- **Threshold blank or 0** → tracker hidden (off by default until merchant opts in).
- **Cart below threshold** → "Add \$X more for free shipping" + partial-fill bar.
- **Cart at/above threshold** → "You qualify for free shipping!" + 100% bar (capped — no overflow past 100%).

Tracker lives inside \`[data-cart-drawer-footer]\` which \`cart-drawer.js refresh()\` already replaces on \`cart:updated\`, so updates ride for free with no new JavaScript.

Spec: [docs/superpowers/specs/2026-05-11-free-shipping-tracker-design.md](./blob/feature/free-shipping-tracker/docs/superpowers/specs/2026-05-11-free-shipping-tracker-design.md)
Plan: [docs/superpowers/plans/2026-05-11-free-shipping-tracker.md](./blob/feature/free-shipping-tracker/docs/superpowers/plans/2026-05-11-free-shipping-tracker.md)

## Files changed

- \`config/settings_schema.json\` — new \`free_shipping_threshold\` setting in the Cart group.
- \`snippets/free-shipping-tracker.liquid\` — new snippet (self-gates on the setting; renders nothing when blank/0).
- \`sections/cart-drawer.liquid\` — one-line \`{% render %}\` call at the top of the footer.

## Static checks

- [x] \`npm run format:check\` passes
- [x] \`npm run theme:check\` exit unchanged from baseline (54 total offenses across 10 files)

## Smoke checklist

Run against \`shopify theme dev\`:

- [x] Threshold unset → tracker hidden
- [x] Threshold set, cart below → 'Add \$X more' + partial bar
- [x] Cart reaches threshold → 'You qualify' + 100% bar
- [x] Cart exceeds threshold → bar stays at 100% (capped)
- [x] Decimal threshold (49.99) renders correctly
- [x] Aria attributes present (role=progressbar, valuemin/max/now, aria-label)
- [x] No console errors on home, product, collection, /cart, search

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL is printed.

- [ ] **Step 13: Update PROGRESS.md**

Edit `docs/superpowers/PROGRESS.md` to add a "Feature work (post-cleanup)" section noting the free-shipping tracker PR. (PROGRESS.md is already on `main` from sub-project 2 — the feature branch already contains it.) Commit and push:

```bash
git add docs/superpowers/PROGRESS.md
git commit -m "docs: note free shipping tracker in PROGRESS"
git push
```

The exact PROGRESS.md edit: add a new section after "Suggested next sub-project" along the lines of:

```markdown
## Feature work (post-cleanup, not part of the 6-sub-project plan)

| Feature                                  | Status               | Reference                                 |
| ---------------------------------------- | -------------------- | ----------------------------------------- |
| Free shipping progress tracker (drawer)  | 🟡 In review (draft) | PR #N (link)                              |
| Sticky add-to-cart on product page       | ⬜ Brainstorm pending | —                                         |
```

(Replace `PR #N` with the actual PR number printed in Step 12.)

---

## Self-Review (run after writing this plan)

This section is the plan author's pre-flight check; not a task for the implementer.

### Spec coverage

| Spec requirement | Plan task |
|---|---|
| New `free_shipping_threshold` setting in `config/settings_schema.json`, in Cart group, type `number`, no default, with `info` text | Task 1 Step 1 |
| `snippets/free-shipping-tracker.liquid` self-gates on setting blank/0 | Task 1 Step 2 (the `{%- if settings.free_shipping_threshold > 0 -%}` guard) |
| Below-threshold label + partial bar | Task 1 Step 2 (`if remaining_cents > 0` branch) |
| At/above-threshold label + 100% bar (capped) | Task 1 Step 2 (`progress_pct > 100` clamp + else branch) |
| `{% render 'free-shipping-tracker' %}` placement (top of `[data-cart-drawer-footer]`, before Subtotal row, inside `cart.item_count > 0`) | Task 1 Step 3 |
| Aria attributes (role=progressbar, valuemin/max/now, aria-label) | Task 1 Step 2 (markup includes all five) |
| `mb-4` margin separator + `transition-all duration-300` | Task 1 Step 2 |
| `npm run format:check` passes | Task 1 Step 4 |
| `npm run theme:check` exit unchanged | Task 1 Step 5 |
| Smoke checklist (10 items) | Task 2 Steps 2–9 |
| Single commit | Task 1 Step 7 |
| Feature branch off `main` | Task 0 |

All spec acceptance criteria covered.

### Placeholder scan

- No "TBD", "TODO", "fill in later" anywhere.
- All file paths are concrete.
- The PR body uses an actual gh command with full body content (not a placeholder).
- One placeholder-ish item: Step 13 says "Replace `PR #N`" — that's necessary because the PR number isn't known until Step 12 runs. Documented inline; the implementer can fill it in after Step 12.

### Type / signature consistency

- The setting ID `free_shipping_threshold` is consistent across the schema edit, the snippet's `settings.free_shipping_threshold` lookup, and the spec.
- The snippet markup precisely matches what the spec quotes.
- The render call `{% render 'free-shipping-tracker' %}` matches the snippet filename.
- All Tailwind classes used in the snippet exist in Tailwind 4's standard utilities.

No inconsistencies.

---

## Execution Handoff

Plan complete. Two execution options:

1. **Subagent-driven** — fresh subagent per task, two-stage review. Probably overkill for a 3-file feature, but consistent with how sub-project 2 ran. Required sub-skill: `superpowers:subagent-driven-development`.
2. **Inline execution** — execute tasks in this session with checkpoints. Faster for a small feature. Required sub-skill: `superpowers:executing-plans`.
