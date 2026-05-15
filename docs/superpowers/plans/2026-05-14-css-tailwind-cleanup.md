# CSS / Tailwind 4 Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the dead `@layer base a` rule from `src/input.css` and the unconsumed `color_primary` / `color_secondary` settings from `config/settings_schema.json` + `config/settings_data.json`. Closes the 6-sub-project decomposition.

**Architecture:** Three files change. All deletions, no additions. `src/input.css` is Prettier-managed; `config/settings_schema.json` and `config/settings_data.json` are in `.prettierignore` (via `config/*.json`) — preserve their existing 2-space-indent + plain JSON style by hand and validate with `node -e "JSON.parse(...)"`.

**Tech Stack:** Tailwind 4 (via `@tailwindcss/cli`), Shopify Liquid, JSON config, Shopify Theme Check (bundled with `shopify` CLI 3.90.1), Prettier with `@shopify/prettier-plugin-liquid`. No JavaScript or test infrastructure changes.

**Spec:** [docs/superpowers/specs/2026-05-14-css-tailwind-cleanup-design.md](../specs/2026-05-14-css-tailwind-cleanup-design.md)

**Branch:** `feature/css-tailwind-cleanup` already exists off `main` (`68b6b42`) with the spec committed (`2297e75`). Continue working on this branch.

**Baseline state (capture before any change):**

```
npm run format:check → exit 0
npm run theme:check  → exit 0, 0 offenses
npm run lint         → exit 0
```

**Target after this plan:** identical exit codes; the theme customizer no longer shows the "Colors" settings group; `assets/application.css` rebuilds without the now-removed `a { color: oklch(...); }` declaration.

---

## Task 1: Remove the dead `a` rule from `src/input.css`'s `@layer base`

The `@layer base` block currently contains three sub-rules (body, a, h1–h6). The `a` rule applies `text-blue-600 hover:text-blue-800 transition-colors` — but every actual anchor in the theme overrides it. Removing it makes the block reflect reality: a gray-on-white theme that doesn't style anchors generically.

**Files:**

- Modify: `src/input.css` (remove 3-line `a { ... }` rule + the blank line before it)

- [ ] **Step 1.1: Verify the working tree is clean and on the right branch**

```bash
git status
git log --oneline -3
```

Expected: clean working tree, branch `feature/css-tailwind-cleanup`, HEAD `2297e75` (the spec commit) on top of the main-branch commits.

- [ ] **Step 1.2: Remove the dead `a` rule via Edit**

`old_string`:

```css
@layer base {
  body {
    @apply font-sans text-gray-900 antialiased;
  }

  a {
    @apply text-blue-600 hover:text-blue-800 transition-colors;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply font-bold leading-tight;
  }
}
```

`new_string`:

```css
@layer base {
  body {
    @apply font-sans text-gray-900 antialiased;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply font-bold leading-tight;
  }
}
```

The blank line that separated `body` and `a` collapses (the blank line that separated `a` and `h1`–`h6` is preserved as the new separator between `body` and `h1`–`h6`).

- [ ] **Step 1.3: Run Prettier on the changed file**

```bash
npx prettier --write src/input.css
```

Expected: file printed with elapsed time. Prettier may slightly reformat trailing whitespace around the now-removed block; accept the output.

- [ ] **Step 1.4: Verify the file still parses + builds**

```bash
npm run format:check
```

Expected: exit 0.

```bash
npm run build:css
```

Expected: exit 0, Tailwind CLI prints "Done in <ms>" and writes `assets/application.css`. If it errors with a syntax complaint near the `@layer base` block, re-read `src/input.css` lines 18–34 and verify the structure matches the `new_string` above.

- [ ] **Step 1.5: Confirm Theme Check is still green**

```bash
npm run theme:check
```

Expected: exit 0, 0 offenses. (Theme Check doesn't scan `src/`, but verify the baseline is preserved.)

- [ ] **Step 1.6: Commit**

```bash
git add src/input.css
git commit -m "$(cat <<'EOF'
fix: remove dead `a` rule from input.css @layer base

The rule applied `text-blue-600 hover:text-blue-800 transition-colors`
to all anchors, but the theme is gray-on-white — 44 anchors override
it with `no-underline` plus explicit `text-gray-*` classes, and the
remaining 11 anchors without explicit `text-*` inherit a darker color
from their container's text-color cascade. The rule was dead code
that contradicted the theme's design intent.

Removing it shrinks `@layer base` from 3 sub-rules to 2 (body, h1-h6).
No visual change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: one commit, 1 file changed.

---

## Task 2: Remove the unused `color_primary` / `color_secondary` settings

Two files change in one commit. They must change together — leaving `color_primary`/`color_secondary` values in `settings_data.json` after the schema is removed would orphan the data keys (they wouldn't cause an error but they'd be cruft).

**Important:** Both `config/settings_schema.json` and `config/settings_data.json` are excluded from Prettier (via `config/*.json` in `.prettierignore`). Do NOT run Prettier on either file. Preserve the existing 2-space indent + plain JSON style by hand. The Edits below use exact surrounding lines as anchors.

**Files:**

- Modify: `config/settings_schema.json` (remove the entire `"Colors"` group object)
- Modify: `config/settings_data.json` (remove two keys from `current`)

- [ ] **Step 2.1: Remove the `"Colors"` group from `config/settings_schema.json`**

The group sits between the preceding group's closing `}` (currently line 72) and the `"Cart"` group's opening `{` (currently line 90). The Edit captures both anchor boundaries.

`old_string`:

<!-- prettier-ignore -->
```json
      }
    ]
  },
  {
    "name": "Colors",
    "settings": [
      {
        "type": "color",
        "id": "color_primary",
        "label": "Primary color",
        "default": "#111827"
      },
      {
        "type": "color",
        "id": "color_secondary",
        "label": "Secondary color",
        "default": "#2563eb"
      }
    ]
  },
  {
    "name": "Cart",
```

`new_string`:

<!-- prettier-ignore -->
```json
      }
    ]
  },
  {
    "name": "Cart",
```

(The preceding group's closing braces + comma are preserved; the entire Colors object including its trailing comma is removed; the `"Cart"` opening is preserved on its own line.)

- [ ] **Step 2.2: Validate `config/settings_schema.json` is still valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('config/settings_schema.json', 'utf8')); console.log('valid JSON')"
```

Expected output: `valid JSON`.

If parsing fails, the Edit didn't apply cleanly — likely a stray comma or missing brace. Inspect the file around the cut site (where `Cart` group now follows the preceding group directly).

- [ ] **Step 2.3: Remove `color_primary` and `color_secondary` from `config/settings_data.json`**

`old_string`:

<!-- prettier-ignore -->
```json
{
  "current": {
    "color_primary": "#111827",
    "color_secondary": "#2563eb",
    "cart_type": "drawer",
    "logo_max_width": 120
  }
}
```

`new_string`:

<!-- prettier-ignore -->
```json
{
  "current": {
    "cart_type": "drawer",
    "logo_max_width": 120
  }
}
```

- [ ] **Step 2.4: Validate `config/settings_data.json` is still valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('config/settings_data.json', 'utf8')); console.log('valid JSON')"
```

Expected output: `valid JSON`.

- [ ] **Step 2.5: Run all verification gates**

```bash
npm run format:check
```

Expected: exit 0. Neither Prettier-excluded JSON file was touched by Prettier; nothing else changed.

```bash
npm run theme:check
```

Expected: exit 0, 0 offenses (unchanged).

```bash
npm run build:css
```

Expected: exit 0 (settings JSON doesn't affect the CSS build, but confirms nothing regressed).

```bash
npm run lint
```

Expected: exit 0 (the lint script chains format:check + theme:check; both still pass).

- [ ] **Step 2.6: Commit**

```bash
git add config/settings_schema.json config/settings_data.json
git commit -m "$(cat <<'EOF'
fix: remove unused color_primary / color_secondary settings

Both settings were declared in `config/settings_schema.json` under
the "Colors" group and persisted in `config/settings_data.json`'s
`current` object, but no code anywhere in the theme reads either
setting — `settings.color_primary` and `settings.color_secondary`
return zero grep hits across sections/, snippets/, layout/, assets/,
and src/. The colors picked in the theme customizer did nothing.

Removing the Colors group from the schema and the corresponding
data keys clears the cruft. Theme customizer no longer offers the
two color pickers. Visual output is unchanged.

If a future sub-project wants a real color-customization story, it
should add CSS variables in `layout/theme.liquid` (like `--page-width`)
and re-introduce the schema settings wired to consumers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: one commit, 2 files changed.

---

## Task 3: Push branch and open draft PR

- [ ] **Step 3.1: Verify branch state**

```bash
git status
git log --oneline main..HEAD
```

Expected: clean working tree, branch `feature/css-tailwind-cleanup`, 3 commits ahead of main:

```
<hash> fix: remove unused color_primary / color_secondary settings
<hash> fix: remove dead `a` rule from input.css @layer base
2297e75 docs: add CSS / Tailwind 4 cleanup spec
```

If the log shows different commit counts or ordering, stop and investigate.

- [ ] **Step 3.2: Push branch with upstream tracking**

```bash
git push -u origin feature/css-tailwind-cleanup
```

- [ ] **Step 3.3: Open a draft PR against `main`**

```bash
gh pr create --draft --base main --title "fix: drop dead anchor rule + unused color settings (sub-project 6 / final)" --body "$(cat <<'EOF'
## Summary

Sub-project 6 of the theme cleanup decomposition — the final one. Three files, all deletions:

- **\`src/input.css\`** — remove the \`a { @apply text-blue-600 hover:text-blue-800 transition-colors; }\` rule from \`@layer base\`. The theme is gray-on-white; 44 anchors override the blue with \`no-underline\` plus explicit \`text-gray-*\`, and the rest inherit a darker color cascade. The rule was dead code that contradicted the theme's design intent.
- **\`config/settings_schema.json\`** — remove the entire \`"Colors"\` settings group (containing \`color_primary\` and \`color_secondary\`). Zero code anywhere in the theme references either setting.
- **\`config/settings_data.json\`** — remove the corresponding persisted \`color_primary\` and \`color_secondary\` keys from \`current\`. Remaining keys: \`cart_type\`, \`logo_max_width\`.

\`npm run lint\` continues to exit 0; theme:check holds at 0 offenses. After this PR merges, the 6-sub-project decomposition described in \`docs/superpowers/PROGRESS.md\` is complete.

Spec: [docs/superpowers/specs/2026-05-14-css-tailwind-cleanup-design.md](../blob/feature/css-tailwind-cleanup/docs/superpowers/specs/2026-05-14-css-tailwind-cleanup-design.md)
Plan: [docs/superpowers/plans/2026-05-14-css-tailwind-cleanup.md](../blob/feature/css-tailwind-cleanup/docs/superpowers/plans/2026-05-14-css-tailwind-cleanup.md)

## Test plan

- [ ] **\`shopify theme dev\`** — open home, collection, search, product, cart, 404, blog/article pages. Anchor styling visually identical to before; no rogue blue links.
- [ ] **Theme customizer** — no \"Colors\" settings group appears. The remaining groups appear in their previous order minus the Colors gap.
- [ ] **Browser DevTools** — pick two unstyled anchors (e.g., the \`<a href=\"{{ item.url }}\" class=\"no-underline\">\` on the search page) and confirm Computed Styles show no inherited \`text-blue-600\` color from \`@layer base\`.
- [ ] **No-regression.** Browser console clean across pages. \`npm run format:check\` exits 0. \`npm run theme:check\` exits 0 with 0 offenses. \`npm run build:css\` exits 0. \`npm run lint\` exits 0.

## What changes for the project after this lands

- The 6-sub-project decomposition is complete.
- Wiring \`npm run lint\` into a CI gate is now unblocked (lint is stably green; this PR doesn't regress it).

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

- [Remove dead `a` rule from `src/input.css`'s `@layer base`] — Task 1 Step 1.2. ✓
- [Remove the `"Colors"` settings group from `config/settings_schema.json`] — Task 2 Step 2.1. ✓
- [Remove `color_primary` / `color_secondary` keys from `config/settings_data.json`'s `current`] — Task 2 Step 2.3. ✓
- [`npm run format:check` exits 0] — Steps 1.4 and 2.5 verify. ✓
- [`npm run theme:check` exits 0] — Steps 1.5 and 2.5 verify. ✓
- [`npm run build:css` exits 0] — Steps 1.4 and 2.5 verify. ✓
- [`npm run lint` exits 0] — Step 2.5 verifies. ✓
- [Both JSON files remain valid] — Steps 2.2 and 2.4 validate with `node -e "JSON.parse(...)"`. ✓
- [One PR off main] — Task 3 opens one draft PR. ✓

**Placeholder scan:** No TBDs, no "implement later", no "similar to Task N". Every Edit step has full multi-line `old_string` / `new_string` blocks (with `<!-- prettier-ignore -->` markers on the Prettier-excluded JSON blocks so the plan doc itself stays format-clean while preserving the JSON indentation as anchor evidence). Commands have explicit expected outputs.

**Type consistency:**

- Setting IDs `color_primary` and `color_secondary` are referenced consistently between the schema removal (Step 2.1) and the data removal (Step 2.3). ✓
- Remaining keys in `settings_data.json` (`cart_type`, `logo_max_width`) preserved exactly. ✓
- The `@layer base` post-image in Step 1.2 contains the body and h1–h6 sub-rules with identical content to the pre-image (minus the `a` rule and one blank line). ✓
- File paths in commands match file paths in Edit instructions. ✓

**Prettier discipline:** Task 1 runs Prettier on `src/input.css` (Prettier-managed). Task 2 explicitly does NOT run Prettier on either `config/*.json` file (Prettier-excluded) and instead uses `node -e "JSON.parse(...)"` to validate.
