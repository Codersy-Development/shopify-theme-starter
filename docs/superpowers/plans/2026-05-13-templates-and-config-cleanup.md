# Templates & Config Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clear the 3 remaining Theme Check offenses in `templates/gift_card.liquid` (2 `ImgWidthAndHeight` + 1 `TranslationKeyExists`) by adding `width`/`height` HTML attributes to two `<img>` tags and registering the missing `gift_cards.issued.title` translation key in `locales/en.default.json`. Returns `npm run theme:check` and `npm run lint` to **exit 0** — the milestone.

**Architecture:** Two files change, three discrete additions. No refactors, no new files. `locales/en.default.json` is excluded from Prettier (`.prettierignore` lists `locales/`); the executor must preserve its existing 2-space-indent + plain JSON style by hand. `templates/gift_card.liquid` is Prettier-managed.

**Tech Stack:** Shopify Liquid, JSON locales, Shopify Theme Check (bundled with `shopify` CLI 3.90.1), Prettier with `@shopify/prettier-plugin-liquid`. No JavaScript, CSS, or test infrastructure changes.

**Spec:** [docs/superpowers/specs/2026-05-13-templates-and-config-cleanup-design.md](../specs/2026-05-13-templates-and-config-cleanup-design.md)

**Branch:** `feature/templates-and-config-cleanup` already exists off `main` (`d659ebc`) with the spec committed (`6d4efca`). Continue working on this branch.

**Baseline Theme Check state (capture before any change):**

```
3 offenses across 1 file
3 errors
exit 1
```

All 3 offenses live in `templates/gift_card.liquid`.

**Target after this plan:**

```
0 total offenses
exit 0
```

`npm run lint` (which chains `format:check && theme:check`) also exits 0 — first time since sub-project 1 merged.

---

## Task 1: Add the `gift_cards.issued.title` translation key

`locales/en.default.json` currently has four top-level namespaces: `general`, `cart`, `breadcrumb`, `newsletter`. Insert a new `gift_cards` namespace between `general` and `cart`.

**Files:**

- Modify: `locales/en.default.json` (insert one new namespace)

**Important:** `locales/en.default.json` is excluded from Prettier (see `.prettierignore` — `locales/` is in the ignore list). Do NOT run Prettier on this file. Preserve the existing 2-space indent + plain JSON style by hand. The Edit below uses the file's exact existing surrounding lines as anchors.

- [ ] **Step 1.1: Verify the working tree is clean and on the right branch**

Run:

```bash
git status
git log --oneline -3
```

Expected: clean working tree, branch `feature/templates-and-config-cleanup`, HEAD `6d4efca` (the spec commit) followed by the main-branch commits underneath.

- [ ] **Step 1.2: Insert the new namespace via Edit**

`old_string`:

```json
  "general": {
    "404": {
      "title": "Page not found",
      "subtext": "The page you requested does not exist."
    },
    "search": {
      "title": "Search",
      "placeholder": "Search our store...",
      "no_results": "No results found",
      "results_count": {
        "one": "{{ count }} result",
        "other": "{{ count }} results"
      }
    }
  },
  "cart": {
```

`new_string`:

```json
  "general": {
    "404": {
      "title": "Page not found",
      "subtext": "The page you requested does not exist."
    },
    "search": {
      "title": "Search",
      "placeholder": "Search our store...",
      "no_results": "No results found",
      "results_count": {
        "one": "{{ count }} result",
        "other": "{{ count }} results"
      }
    }
  },
  "gift_cards": {
    "issued": {
      "title": "Gift card"
    }
  },
  "cart": {
```

(The `"cart": {` opening on the final line of both `old_string` and `new_string` is the anchor that pins the insertion site. Edit only adds the new 5-line namespace block above it.)

- [ ] **Step 1.3: Verify the JSON is well-formed**

Do not run Prettier (the file is in `.prettierignore`). Instead validate the JSON parses:

```bash
node -e "JSON.parse(require('fs').readFileSync('locales/en.default.json', 'utf8')); console.log('valid JSON')"
```

Expected output: `valid JSON`.

If parsing fails, the Edit didn't apply cleanly — fix the file (likely a stray comma or missing brace) before continuing.

- [ ] **Step 1.4: Run Theme Check to confirm the translation-key offense is gone**

```bash
npm run theme:check
```

Expected: exit 1 (two `ImgWidthAndHeight` errors remain in `templates/gift_card.liquid` — Task 2 fixes those). Offense count drops from **3 across 1 file** to **2 across 1 file**. The `TranslationKeyExists` finding on `gift_cards.issued.title` should be gone.

If the `TranslationKeyExists` finding is still present, double-check the JSON structure — particularly that the new namespace is nested correctly under the top-level object and not accidentally inside `general`.

- [ ] **Step 1.5: Verify format:check still passes**

```bash
npm run format:check
```

Expected: exit 0. `locales/en.default.json` is in `.prettierignore` so Prettier doesn't touch it; the rest of the codebase is unchanged.

- [ ] **Step 1.6: Commit**

```bash
git add locales/en.default.json
git commit -m "$(cat <<'EOF'
fix: add gift_cards.issued.title translation key

`templates/gift_card.liquid` line 7 uses `{{ 'gift_cards.issued.title' | t }}`
but no `gift_cards` namespace existed in `locales/en.default.json` — Theme
Check flagged it with TranslationKeyExists. New namespace inserted between
the existing `general` and `cart` namespaces; value "Gift card" matches
Shopify's reference theme (Dawn) convention for the gift-card page title.

Theme Check baseline drops from 3 offenses to 2 (both ImgWidthAndHeight
errors in the same template, fixed in the next commit).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: one commit, 1 file changed.

---

## Task 2: Add `width`/`height` attributes to the two `<img>` tags

Two attribute additions in `templates/gift_card.liquid`. Doing both in one commit keeps the template's history clean.

**Files:**

- Modify: `templates/gift_card.liquid` (two distinct `<img>` tags)

- [ ] **Step 2.1: Add `width="160" height="160"` to the QR code `<img>`**

`old_string`:

<!-- prettier-ignore -->
```liquid
        <img
          src="{{ gift_card | qr_code }}"
          alt="Gift card QR code"
          class="mx-auto mb-6 w-40 h-40"
        >
```

`new_string`:

<!-- prettier-ignore -->
```liquid
        <img
          src="{{ gift_card | qr_code }}"
          alt="Gift card QR code"
          width="160"
          height="160"
          class="mx-auto mb-6 w-40 h-40"
        >
```

The class `w-40 h-40` resolves to 10rem × 10rem = 160px × 160px at the default 16px root font size. The HTML attributes match the rendered visual size, which is exactly what `ImgWidthAndHeight` wants for layout-reservation / CLS prevention.

- [ ] **Step 2.2: Add `height="44"` to the Apple Wallet badge `<img>`**

`old_string`:

<!-- prettier-ignore -->
```liquid
      {% if gift_card.pass_url %}
        <a href="{{ gift_card.pass_url }}" class="inline-block mb-4">
          <img
            src="{{ 'gift-card/add-to-apple-wallet.svg' | shopify_asset_url }}"
            alt="Add to Apple Wallet"
            width="120"
          >
        </a>
      {% endif %}
```

`new_string`:

<!-- prettier-ignore -->
```liquid
      {% if gift_card.pass_url %}
        <a href="{{ gift_card.pass_url }}" class="inline-block mb-4">
          <img
            src="{{ 'gift-card/add-to-apple-wallet.svg' | shopify_asset_url }}"
            alt="Add to Apple Wallet"
            width="120"
            height="44"
          >
        </a>
      {% endif %}
```

Apple's modern Add-to-Wallet badge SVG has a ~2.7:1 aspect ratio; `120 / 2.7 ≈ 44`. The SVG is vector — the attribute purely reserves layout space; rendering scales correctly.

- [ ] **Step 2.3: Run Prettier on the file**

```bash
npx prettier --write templates/gift_card.liquid
```

Expected: file printed with elapsed time. Prettier may re-indent slightly; accept its output.

- [ ] **Step 2.4: Verify format and Theme Check are clean**

```bash
npm run format:check
```

Expected: exit 0.

```bash
npm run theme:check
```

Expected: **exit 0**. Summary line:

```
57 files inspected with 0 total offenses found.
0 errors.
0 warnings.
```

This is the milestone — first exit 0 for `theme:check` since sub-project 1 was merged.

If Theme Check still reports an `ImgWidthAndHeight` finding on `templates/gift_card.liquid`, re-read the file and check whether both substitutions applied. Grep:

```bash
grep -c 'width="160"' templates/gift_card.liquid
grep -c 'height="160"' templates/gift_card.liquid
grep -c 'height="44"' templates/gift_card.liquid
```

Expected counts: 1, 1, 1.

- [ ] **Step 2.5: Verify `npm run lint` exits 0**

```bash
npm run lint
```

Expected: exit 0. The lint script chains `format:check && theme:check`; both now pass.

- [ ] **Step 2.6: Commit**

```bash
git add templates/gift_card.liquid
git commit -m "$(cat <<'EOF'
fix: add width/height attributes to gift card <img> tags

Two ImgWidthAndHeight errors cleared:

1. QR code <img> — added width="160" height="160" to match its
   `w-40 h-40` Tailwind class (10rem × 10rem = 160px square).
2. Apple Wallet badge <img> — added height="44" alongside the
   pre-existing width="120" (matches Apple's modern Add-to-Wallet
   badge aspect ratio at this width).

Theme Check now reports 0 total offenses; `npm run lint` exits 0
for the first time since sub-project 1 merged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: one commit, 1 file changed.

---

## Task 3: Push branch and open draft PR

- [ ] **Step 3.1: Verify branch state**

```bash
git status
git log --oneline main..HEAD
```

Expected: clean working tree, branch `feature/templates-and-config-cleanup`, 3 commits ahead of main:

```
<hash> fix: add width/height attributes to gift card <img> tags
<hash> fix: add gift_cards.issued.title translation key
6d4efca docs: add Templates & config cleanup spec
```

If the log shows a different commit count or ordering, stop and investigate before pushing.

- [ ] **Step 3.2: Push the branch with upstream tracking**

```bash
git push -u origin feature/templates-and-config-cleanup
```

- [ ] **Step 3.3: Open a draft PR against `main`**

```bash
gh pr create --draft --base main --title "fix: clear last 3 Theme Check offenses — npm run lint now exits 0" --body "$(cat <<'EOF'
## Summary

Sub-project 5 of the theme cleanup decomposition — the last one that touches the Theme Check baseline. Clears the 3 remaining offenses, all in \`templates/gift_card.liquid\`:

- **\`locales/en.default.json\`** — add \`gift_cards.issued.title: "Gift card"\` (resolves the \`TranslationKeyExists\` error for \`{{ 'gift_cards.issued.title' | t }}\` on the gift-card page \`<title>\`).
- **\`templates/gift_card.liquid\`** — add \`width="160" height="160"\` to the QR code \`<img>\` (matches its \`w-40 h-40\` Tailwind class); add \`height="44"\` to the Apple Wallet badge \`<img>\` (matches Apple's Add-to-Wallet badge aspect ratio at width 120).

\`npm run theme:check\` now exits **0** with 0 offenses — first time since sub-project 1 merged. \`npm run lint\` (which chains format:check + theme:check) is fully green.

Spec: [docs/superpowers/specs/2026-05-13-templates-and-config-cleanup-design.md](../blob/feature/templates-and-config-cleanup/docs/superpowers/specs/2026-05-13-templates-and-config-cleanup-design.md)
Plan: [docs/superpowers/plans/2026-05-13-templates-and-config-cleanup.md](../blob/feature/templates-and-config-cleanup/docs/superpowers/plans/2026-05-13-templates-and-config-cleanup.md)

## Test plan

- [ ] **Gift card preview.** Run \`shopify theme dev\` and visit \`/gift_cards/preview\` (or \`/gift_cards/<id>/preview\` if a real card exists).
  - [ ] Page loads with no browser console errors.
  - [ ] Browser tab title reads "Gift card — \<Shop Name\>" (translation key resolved).
  - [ ] QR code image renders at 160×160px. Inspect: \`<img>\` has \`width="160"\` and \`height="160"\`.
  - [ ] Apple Wallet badge renders when \`gift_card.pass_url\` is present. Inspect: \`<img>\` has \`width="120"\` and \`height="44"\`. Visually unchanged from before.
  - [ ] No visible layout shift while images load.
- [ ] **No-regression.** Browser console clean on home, product, collection, cart, search, 404. \`npm run format:check\` exits 0. \`npm run theme:check\` exits 0 with 0 offenses. \`npm run lint\` exits 0.

## What changes for the project after this lands

- \`npm run lint\` is now safe to wire into a CI gate without immediate noise.
- Only sub-project 6 (CSS / Tailwind 4 in \`src/input.css\`) remains in the original 6-sub-project decomposition.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: a draft PR URL is printed.

- [ ] **Step 3.4: Confirm PR state**

```bash
gh pr view --json url,isDraft,number,baseRefName --jq .
```

Expected: `isDraft: true`, a PR number, `baseRefName: main`, github.com URL.

---

## Self-Review

**Spec coverage:**

- [Add `gift_cards.issued.title: "Gift card"` to `locales/en.default.json`] — Task 1 Step 1.2. ✓
- [Add `width="160" height="160"` to QR code `<img>`] — Task 2 Step 2.1. ✓
- [Add `height="44"` to Apple Wallet badge `<img>`] — Task 2 Step 2.2. ✓
- [`npm run format:check` exits 0] — Steps 1.5 and 2.4 verify. ✓
- [`npm run theme:check` exits 0 with 0 offenses] — Step 2.4 verifies. ✓
- [`npm run lint` exits 0] — Step 2.5 verifies. ✓
- [One PR off main] — Task 3 opens one draft PR. ✓

**Placeholder scan:** No TBDs, no "implement later", no "similar to Task N". Every Edit step includes full multi-line `old_string` and `new_string` blocks. Commit messages are complete; commands have explicit expected outputs.

**Type consistency:**

- Translation key id (`gift_cards.issued.title`) matches between the template's `{{ 'gift_cards.issued.title' | t }}` reference (pre-existing, unchanged) and the new JSON key path (`gift_cards` → `issued` → `title`). ✓
- Attribute values (`width="160"`, `height="160"`, `width="120"`, `height="44"`) match between Step 2.1/2.2 Edit content and the Step 2.4 verification greps. ✓
- File paths in commands match file paths in Edit instructions. ✓

**Prettier exclusion:** Task 1 explicitly notes `locales/en.default.json` is in `.prettierignore` and warns not to run Prettier on it. Task 2 runs Prettier on `templates/gift_card.liquid` which is Prettier-managed.
