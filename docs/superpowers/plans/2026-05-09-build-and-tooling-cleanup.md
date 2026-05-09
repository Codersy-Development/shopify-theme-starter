# Build & Tooling Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Prettier (with `@shopify/prettier-plugin-liquid`) and Shopify Theme Check to the starter theme, format the codebase once, and wire everything into npm scripts. No runtime behavior changes.

**Architecture:** Two new tools — Prettier as an npm devDependency, Theme Check via the already-installed Shopify CLI. Configuration files live at the repo root. The first formatting run is isolated in its own commit and added to `.git-blame-ignore-revs` so blame churn is contained.

**Tech Stack:** npm, Prettier 3, `@shopify/prettier-plugin-liquid` 1.x, Shopify CLI 3.90 (already installed, ships theme-check).

**Spec:** [docs/superpowers/specs/2026-05-09-build-and-tooling-cleanup-design.md](../specs/2026-05-09-build-and-tooling-cleanup-design.md)

---

## Pre-flight

The working tree currently has a benign drift in `package-lock.json` (a `"license"` field that npm re-syncs on install). It will be regenerated cleanly during Task 1, so reset it before starting.

- [ ] **Verify clean working tree (besides known drift)**

```bash
git status --short
```

Expected output: only ` M package-lock.json` and possibly nothing else. If anything else is modified, stop and surface it.

- [ ] **Discard the package-lock drift**

```bash
git checkout package-lock.json
git status --short
```

Expected: empty output.

---

## Task 1: Install Prettier + Liquid plugin

**Files:**

- Modify: `package.json`
- Modify (auto): `package-lock.json`
- Create: `.prettierrc.json`
- Create: `.prettierignore`

- [ ] **Step 1.1: Install Prettier and the Liquid plugin as devDependencies**

```bash
npm install --save-dev prettier@^3.3 @shopify/prettier-plugin-liquid@^1.9
```

Expected: both packages added to `package.json` devDependencies, `package-lock.json` updated. No errors.

- [ ] **Step 1.2: Create `.prettierrc.json`**

Path: `.prettierrc.json`

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "singleQuote": false,
  "trailingComma": "all",
  "plugins": ["@shopify/prettier-plugin-liquid"]
}
```

- [ ] **Step 1.3: Create `.prettierignore`**

Path: `.prettierignore`

```
node_modules/
assets/application.css
package-lock.json
.shopify/
locales/
.git/
```

Note: `locales/` is excluded because Shopify owns the JSON layout there and re-formats can break locale order.

- [ ] **Step 1.4: Sanity check Prettier runs at all**

```bash
npx prettier --check .prettierrc.json
```

Expected: exits 0 (the file we just wrote is already formatted by us).

```bash
npx prettier --check sections/header.liquid
```

Expected: exits with code 1 and prints the file path under "Code style issues found". This is the desired pre-format state — it confirms the Liquid plugin is loaded and finds work to do. If the command instead prints "No parser could be inferred for file", the plugin failed to load — stop and investigate.

---

## Task 2: Add format/format:check scripts to `package.json`

**Files:**

- Modify: `package.json`

- [ ] **Step 2.1: Add `format` and `format:check` scripts**

Open `package.json`. The `scripts` object currently looks like:

```json
"scripts": {
  "build:css": "npx @tailwindcss/cli -i ./src/input.css -o ./assets/application.css --minify",
  "watch:css": "npx @tailwindcss/cli -i ./src/input.css -o ./assets/application.css --watch",
  "dev": "concurrently \"npm run watch:css\" \"shopify theme dev --environment development\"",
  "deploy": "npm run build:css && shopify theme push --environment production"
}
```

Replace with:

```json
"scripts": {
  "build:css": "npx @tailwindcss/cli -i ./src/input.css -o ./assets/application.css --minify",
  "watch:css": "npx @tailwindcss/cli -i ./src/input.css -o ./assets/application.css --watch",
  "dev": "concurrently \"npm run watch:css\" \"shopify theme dev --environment development\"",
  "deploy": "npm run build:css && shopify theme push --environment production",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "theme:check": "shopify theme check",
  "lint": "npm run format:check && npm run theme:check"
}
```

(Adding all four scripts now even though `theme:check` and `lint` are wired in Task 3 — keeps `package.json` edits to one diff.)

- [ ] **Step 2.2: Verify scripts are valid JSON and runnable**

```bash
npm run format:check
```

Expected: prettier runs across the repo and exits with code 1, listing dozens of files with style issues. This is the expected pre-format state. If it crashes with a parse error, fix the JSON.

---

## Task 3: Add Theme Check configuration

**Files:**

- Create: `.theme-check.yml`

- [ ] **Step 3.1: Verify the Shopify CLI's bundled theme-check is available**

```bash
shopify theme check --help
```

Expected: usage output. If the command isn't found, stop — the Shopify CLI is a hard dependency and should be installed (the user has 3.90.1).

- [ ] **Step 3.2: Create `.theme-check.yml` with the default ruleset**

Path: `.theme-check.yml`

```yaml
# Shopify Theme Check configuration.
# https://shopify.dev/docs/themes/tools/theme-check/configuration

root: .

ignore:
  - node_modules/
  - .shopify/
  - src/
  - docs/
```

This uses the default ruleset (no `extends:` needed for a regular theme — `extends:` is for app-extension presets).

- [ ] **Step 3.3: Run theme:check and capture findings**

```bash
npm run theme:check 2>&1 | tee /tmp/theme-check-output.txt
```

Expected: theme-check runs, prints any issues it found, then a summary line. Exit code may be non-zero if errors are found — that's fine for this step.

- [ ] **Step 3.4: Save findings to a notes file**

Path: `docs/superpowers/notes/2026-05-09-theme-check-findings.md`

Create the file with this structure (fill the code block with the actual output from `/tmp/theme-check-output.txt`):

```markdown
# Theme Check Findings — 2026-05-09

Captured during the build & tooling cleanup. These findings are NOT fixed in this sub-project; they feed sub-projects 2 (JS), 3 (Liquid sections), and 4 (snippets).

## Raw Output
```

<paste the contents of /tmp/theme-check-output.txt here>

```

## Triage Notes

(Empty — to be filled in when sub-project 2 starts. Categorize findings into: real bugs, performance issues, accessibility issues, deprecations, false positives.)
```

- [ ] **Step 3.5: If any check is genuinely noisy (false positives), downgrade it**

Read the captured output. If you see a check firing many times across files where the finding is not actionable (e.g. `MissingTemplate` on a starter that intentionally lacks some templates), open `.theme-check.yml` and add an override at the bottom:

```yaml
# Example — only add entries that match observed false-positive checks.
# MissingTemplate:
#   severity: warning
```

If the captured output is reasonable, leave the file as-is from Step 3.2.

---

## Task 4: Update `.gitignore`

**Files:**

- Modify: `.gitignore`

- [ ] **Step 4.1: Append additional ignores**

Current contents:

```
node_modules/
assets/application.css
.DS_Store
```

Replace with:

```
node_modules/
assets/application.css
.DS_Store

# Local env / logs
.env
.env.local
*.log
```

- [ ] **Step 4.2: Verify `.gitignore` parses (no shell errors)**

```bash
git status --ignored | head
```

Expected: command succeeds; no syntax error in `.gitignore`.

---

## Task 5: Commit tooling setup

**Files:**

- All created/modified in Tasks 1–4 (see staging list below)

- [ ] **Step 5.1: Confirm what will be staged**

```bash
git status --short
```

Expected files:

```
M  .gitignore
A  .prettierignore
A  .prettierrc.json
A  .theme-check.yml
M  package-lock.json
M  package.json
A  docs/superpowers/notes/2026-05-09-theme-check-findings.md
```

- [ ] **Step 5.2: Stage tooling files explicitly (no `git add -A`)**

```bash
git add .gitignore .prettierignore .prettierrc.json .theme-check.yml \
        package.json package-lock.json \
        docs/superpowers/notes/2026-05-09-theme-check-findings.md
```

- [ ] **Step 5.3: Verify nothing else is staged**

```bash
git status --short
```

Expected: all listed files now show in green (`A` or `M` in the left column); nothing in the right column.

- [ ] **Step 5.4: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore: add Prettier and Shopify Theme Check tooling

Adds @shopify/prettier-plugin-liquid for Liquid/JS/CSS/JSON
formatting and wires Theme Check via the existing Shopify CLI.
Captures the initial Theme Check findings into a notes file
that will inform later cleanup sub-projects.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds, no pre-commit hook (none installed).

---

## Task 6: Apply Prettier formatting to the codebase

**Files:** every file Prettier matches outside `.prettierignore`.

- [ ] **Step 6.1: Confirm clean working tree before the format run**

```bash
git status --short
```

Expected: empty output.

- [ ] **Step 6.2: Run Prettier across the repo**

```bash
npm run format
```

Expected: prints a list of files that were rewritten. No errors. If a Liquid file fails to parse, stop and investigate that file specifically — the plugin can occasionally trip on unusual constructs and the right fix is usually a tiny edit, not disabling the plugin.

- [ ] **Step 6.3: Verify `format:check` now passes**

```bash
npm run format:check
```

Expected: "All matched files use Prettier code style!" — exit code 0.

- [ ] **Step 6.4: Verify Theme Check still passes (no Liquid syntax was broken by formatting)**

```bash
npm run theme:check
```

Expected: same set of findings as captured in Task 3, no NEW errors. If new errors appear, the formatter mangled a Liquid file — find the file from the diff and revert just that one with `git checkout <file>`, then add it to `.prettierignore` and re-run from Step 6.2.

- [ ] **Step 6.5: Sanity-check the diff is formatting-only**

```bash
git diff --stat | tail
git diff sections/header.liquid | head -40
```

Expected: many files changed, but the visible content of one sample file should show whitespace, quote, and tag-spacing changes only — no logic changes.

- [ ] **Step 6.6: Verify the Tailwind build still produces output**

```bash
npm run build:css
```

Expected: `assets/application.css` is regenerated without errors. (We don't commit it — it's in `.gitignore`.)

- [ ] **Step 6.7: Commit the formatting changes**

```bash
git add -A
git status --short
```

Expected: many files staged. `assets/application.css` is in `.gitignore` so it won't appear.

```bash
git commit -m "$(cat <<'EOF'
style: apply Prettier formatting across the theme

One-time mass formatting after introducing Prettier and the
Shopify Liquid plugin. No semantic changes. This commit is
listed in .git-blame-ignore-revs so git blame skips it.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6.8: Capture the format commit SHA**

```bash
git rev-parse HEAD
```

Note the SHA — needed for Task 7.

---

## Task 7: Add `.git-blame-ignore-revs`

**Files:**

- Create: `.git-blame-ignore-revs`

- [ ] **Step 7.1: Create the file with the formatting commit SHA**

Path: `.git-blame-ignore-revs`

Replace `<SHA_FROM_STEP_6_8>` with the actual SHA captured in the previous task.

```
# Commits listed here are skipped by `git blame --ignore-revs-file=...`.
# Configure once locally with:
#   git config blame.ignoreRevsFile .git-blame-ignore-revs

# Apply Prettier formatting across the theme
<SHA_FROM_STEP_6_8>
```

- [ ] **Step 7.2: Verify the SHA references a real commit**

```bash
git cat-file -t $(grep -v '^#' .git-blame-ignore-revs | grep -v '^$' | head -1)
```

Expected: prints `commit`. If it prints `fatal: Not a valid object name`, the SHA is wrong — re-check Step 6.8.

- [ ] **Step 7.3: Verify blame integration works locally**

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
git blame sections/header.liquid | head -5
```

Expected: blame output shows commits OLDER than the format run for lines that the formatter only reformatted (not the formatter commit). This is a one-time local config; future contributors run the same command after cloning.

- [ ] **Step 7.4: Commit the blame-ignore file**

```bash
git add .git-blame-ignore-revs
git commit -m "$(cat <<'EOF'
chore: add .git-blame-ignore-revs for the format run

Tells git blame to skip the bulk formatting commit so authorship
of original lines is preserved.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Final verification

- [ ] **Step 8.1: All lint scripts pass**

```bash
npm run lint
```

Expected: `format:check` passes (exit 0), `theme:check` runs and exits 0 (warnings allowed).

- [ ] **Step 8.2: Three new commits land on `main`**

```bash
git log --oneline -5
```

Expected (top three are new):

```
<sha7> chore: add .git-blame-ignore-revs for the format run
<sha6> style: apply Prettier formatting across the theme
<sha5> chore: add Prettier and Shopify Theme Check tooling
399ec13 docs: add build & tooling cleanup spec
6912f7d add header dropdown
```

- [ ] **Step 8.3: Working tree is clean**

```bash
git status --short
```

Expected: empty output.

- [ ] **Step 8.4: Confirm `npm run dev` is structurally intact (don't actually start)**

```bash
npm run build:css
```

Expected: builds cleanly. We deliberately don't run `npm run dev` because it starts a long-lived process; the CSS build alone confirms the script wiring isn't broken.

---

## Acceptance Criteria (from spec)

- [x] `npm install` succeeds with the new devDependencies. _(Task 1 Step 1.1)_
- [x] `npm run format:check` passes. _(Task 8 Step 8.1)_
- [x] `npm run theme:check` runs and exits without error. _(Task 8 Step 8.1)_
- [x] `npm run lint` runs both checks. _(Task 2 Step 2.1, verified Task 8 Step 8.1)_
- [x] Tooling commit + format-run commit exist. _(Tasks 5, 6)_
- [x] `.git-blame-ignore-revs` exists with the formatting-run SHA. _(Task 7)_
- [x] Theme Check findings captured in a notes file. _(Task 3 Step 3.4)_
- [x] No runtime semantic changes. _(verified Task 6 Step 6.4 — Theme Check finds same issues post-format)_
