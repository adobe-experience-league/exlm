# EXLM Prompt Library

A curated set of prompts developers can paste into an AI coding agent (Cursor, Claude Code, Copilot Chat, etc.) when working in this repo. The prompts are tuned for the conventions documented in [AGENTS.md](../AGENTS.md) and assume the EDS skills shipped via [`skills-lock.json`](../skills-lock.json) are installed (`npx skills experimental_install`).

> If you add a new prompt, follow the format under [How to read a prompt entry](#how-to-read-a-prompt-entry). Keep prompts grounded in real repo conventions — `scripts/lib-franklin.js`, `paths.yaml`/`paths.json` parity, `LCP_BLOCKS`, the `code-review` skill, `?martech=off`, etc.

### MCP servers — optional, not required

The base prompts in this library are **MCP-agnostic** — they only require the EDS skills installed by `npx skills experimental_install`. Skills are a separate mechanism from MCP: skills are local markdown files the agent reads, while MCP servers are external tool providers the agent calls.

If you do have MCP servers configured, several prompts get stronger. Where that's the case, you'll see a **"MCP boost"** callout. The MCPs most commonly useful in this repo:

| MCP server (Cursor name)                                  | Typical use in this repo                                                                  |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `ExL_ExperienceLeague` (`search_documents`, `fetch_docs`) | Authoritative source content for migrations, doc lookups for `/docs-search` style prompts |
| `AEM-Content`                                             | Inspect live AEM content paths, validate blocks against authored content                  |
| `eds`                                                     | Inspect EDS / converter output for upstream-vs-repo bugs (see §15.3)                      |
| `figma`                                                   | Pull frames as the source of truth when scaffolding new blocks (§3.1)                     |
| `github`                                                  | PR description / review / merge workflows (§13)                                           |

For deeper standalone prompts that lean entirely on MCP tools, see [§18 — MCP-aware variants](#18-mcp-aware-variants).

## Table of contents

- [How to use this library](#how-to-use-this-library)
- [Conventions](#conventions)
- [How to read a prompt entry](#how-to-read-a-prompt-entry)
- [1. Setup and onboarding](#1-setup-and-onboarding)
- [2. Planning and analysis](#2-planning-and-analysis)
- [3. Blocks — new block](#3-blocks--new-block)
- [4. Blocks — variants and modifications](#4-blocks--variants-and-modifications)
- [5. Core scripts and `scripts.js` changes](#5-core-scripts-and-scriptsjs-changes)
- [6. CSS and styling tweaks](#6-css-and-styling-tweaks)
- [7. Bug fixes](#7-bug-fixes)
- [8. Content import and migration](#8-content-import-and-migration)
- [9. Performance, LCP, and Core Web Vitals](#9-performance-lcp-and-core-web-vitals)
- [10. Accessibility](#10-accessibility)
- [11. Testing](#11-testing)
- [12. Self-review before commit](#12-self-review-before-commit)
- [13. Commits, branches, and PR hygiene](#13-commits-branches-and-pr-hygiene)
- [14. `paths.yaml` / `paths.json` sync](#14-pathsyaml--pathsjson-sync)
- [15. Debugging](#15-debugging)
- [16. Documentation and handover](#16-documentation-and-handover)
- [17. Cross-cutting integrations (Coveo, feature flags, locales)](#17-cross-cutting-integrations-coveo-feature-flags-locales)
- [18. MCP-aware variants](#18-mcp-aware-variants)

## How to use this library

1. Open the AI panel in your editor (Cursor `Cmd/Ctrl+L`, Claude Code, Copilot Chat, etc.).
2. Find the section that matches your task.
3. Copy the prompt, replace anything in `{{double braces}}` with your specifics, and send it.
4. Most prompts reference an EDS **skill** via `/skill-name` (e.g. `/code-review`, `/page-import`). These are installed by `npx skills experimental_install` and listed under [`skills/`](../skills). If a slash command isn't recognized in your editor, paste the prompt as plain text — the agent will still pick the right skill from context.
5. Always finish a session by running `/code-review` on your staged diff before `git commit` (see [§12](#12-self-review-before-commit) and [AGENTS.md → Self-review before commit](../AGENTS.md#self-review-before-commit)).

## Conventions

- **Placeholders** use `{{double braces}}`, e.g. `{{block-name}}`, `{{jira-id}}`, `{{branch-preview-url}}`.
- **Skills** are referenced as `/skill-name`. The agent reads the skill's `SKILL.md` and follows it.
- **Test URLs** in this repo are always prefixed with `$` in the PR template (see [`.github/pull_request_template.md`](../.github/pull_request_template.md)) — agents should preserve that prefix.
- Prefer **extending existing patterns** over inventing new ones. Most prompts include a "find a sibling first" step for this reason.

## How to read a prompt entry

Each entry has the same structure:

- **When to use** — one-liner describing the trigger.
- **Prompt** — the text to paste, in a fenced block.
- **Variables** — what to fill in.
- **Tips** — repo-specific gotchas (LCP, paths, locales, etc.).

---

## 1. Setup and onboarding

### 1.1 First-time clone walkthrough

**When to use**: a developer (or you) has just cloned the repo and wants the AI to verify the environment and explain the layout.

**Prompt**:

```text
I just cloned the exlm repo. Read AGENTS.md and README.md, then:

1. Verify my Node version satisfies `>=22` and npm `>=10` (from package.json). If not, tell me how to fix it with nvm.
2. Walk me through running `npm install`, `npx skills experimental_install`, and `npm run up`. Explain what each does and what success looks like.
3. Summarize the difference between `npm run up`, `npm run up-secure`, `npm run up-secure-stage`, and `npm run up-secure-prod` so I know which to pick.
4. List the top-level folders (`blocks/`, `scripts/`, `styles/`, `icons/`, `solutions/`) and one sentence on what lives in each.
5. Point me at the AI skills that ship with the repo and explain when I'd use `/code-review`, `/building-blocks`, and `/page-import`.

Do not run any commands yet — give me the plan first.
```

**Tips**: agents should not auto-modify `/etc/hosts` for the secure flow — surface the instruction from `README.md` instead.

### 1.2 "What does this block do?"

**When to use**: orienting yourself in an unfamiliar block before touching it.

**Prompt**:

```text
Explain the `blocks/{{block-name}}/` block to me.

Cover:
- The authored structure (rows/cells) the block expects, inferred from the JS.
- The decorate() flow: top-level imports, DOM transforms, and any dynamic imports.
- Any CSS modifiers / variants from the stylesheet.
- Which `scripts/` modules it depends on, and whether any of those are in `LCP_BLOCKS`.
- Known integrations (Coveo, feature flags, Adobe Target, locales) it touches.

If anything looks unusual compared to the conventions in AGENTS.md, call it out.
```

---

## 2. Planning and analysis

### 2.1 Define acceptance criteria for a Jira task

**When to use**: you have a Jira ticket and need a plan before coding.

**Prompt**:

```text
Use the /analyze-and-plan skill on this requirement:

Jira: {{jira-id}}
Summary: {{one-line-summary}}
Details:
{{paste full ticket description, attachments captions, and any author screenshots}}

Output:
1. The task type (new block, variant, modification, bug fix, styling-only, or core scripts change).
2. Acceptance criteria as Gherkin (Given/When/Then) — one scenario per behavior.
3. Files you expect to touch.
4. Anything that would break `npm run quality` or the `code-review` skill if done naïvely (LCP, paths sync, lib-franklin edits, hardcoded config, secrets, locale handling).
5. Open questions for the PO before I start.

Do NOT write code yet.
```

**Tips**: pair with `/jira-dev-readiness` if available locally — it scores the ticket for completeness.

### 2.2 Find a sibling block to copy from

**When to use**: starting any new block — you want the closest existing pattern.

**Prompt**:

```text
Use the /block-inventory skill to list blocks in `blocks/` whose purpose is closest to: "{{describe the block in 1–2 sentences}}".

For the top 3 candidates, give me:
- Path to the block folder.
- One-paragraph summary of how they're built.
- Authored structure (number of rows/cells, presence of headings/links/images).
- Which would be the safest starting point to copy and why.

Then also check the Block Collection / Block Party via the /block-collection-and-party skill for any external reference I should look at.
```

---

## 3. Blocks — new block

### 3.1 Scaffold a new block end-to-end

**When to use**: building a brand-new block from a Jira ticket and (optionally) a Figma reference.

**Prompt**:

```text
Use the /content-driven-development workflow to scaffold a new `{{block-name}}` block.

Inputs:
- Jira: {{jira-id}}
- Acceptance criteria: {{paste or link}}
- Figma: {{figma-link-or-screenshot}}
- Reference sibling block (from /block-inventory): blocks/{{sibling-block}}/
- MCP boost (optional): if the `figma` MCP is available, prefer the dedicated end-to-end variant in [§18.1](#181-new-block-from-a-figma-frame-figma-mcp--end-to-end) instead of this prompt — it reads the frame directly and skips the screenshot step.

Requirements:
- Follow the EDS sections-and-blocks markup conventions used by the sibling.
- Export `default async function decorate(block) { … }` from `blocks/{{block-name}}/{{block-name}}.js`.
- Keep CSS scoped to `.{{block-name}} ...`. Use breakpoints 600 / 900 / 1200 unless the sibling differs.
- Use ES module imports with explicit `.js` extensions. Pull helpers from `scripts/lib-franklin.js` — do NOT edit that file.
- Add UE authoring metadata to `component-definition.json`, `component-filters.json`, and `component-models.json` to match the authored structure.
- Defensively handle missing optional rows/cells.

After scaffolding:
- Run `npm run lint` and fix anything it flags.
- List the test URLs I should add to the PR description (prefixed with `$`, with `?martech=off` where relevant).
- Tell me whether this block should be added to `LCP_BLOCKS` in `scripts/scripts.js` and why.
```

**Variables**: `block-name` (kebab-case), `sibling-block`, `jira-id`.

**Tips**:

- If the block is above the fold on its first authored page, update `LCP_BLOCKS`.
- Add the block to `component-definition.json` (group), `component-filters.json` (allowed where), and `component-models.json` (fields). Authors can't use a block that isn't registered.

### 3.2 New block — model only (UE registration)

**When to use**: the JS/CSS exists, but the block isn't showing up in Universal Editor.

**Prompt**:

```text
The block `blocks/{{block-name}}/` exists but isn't available in Universal Editor.

Use the /ue-component-model skill to:
1. Generate the matching entries in `component-definition.json`, `component-filters.json`, and `component-models.json`.
2. Match the authored structure the decorate() function actually expects — point out any mismatch.
3. Tell me where in the existing groups this block belongs.
4. After the edits, summarize the diff and any field IDs I'll need to coordinate with content authors on.
```

---

## 4. Blocks — variants and modifications

### 4.1 Add a variant to an existing block

**When to use**: extending a block with a new modifier class without breaking existing pages.

**Prompt**:

```text
Add a `{{variant-name}}` variant to `blocks/{{block-name}}/`.

Constraints:
- The variant is opt-in via the block's CSS class list (e.g. `block-name {{variant-name}}`). Existing pages without the variant must render unchanged.
- Update `component-filters.json` / `component-models.json` so authors can pick the variant from UE.
- Add CSS scoped to `.{{block-name}}.{{variant-name}} ...` — do not weaken existing selectors with `!important`.
- If JS branching is needed, prefer a small helper inside the block; do not add the variant logic to `scripts/scripts.js`.

Then:
- Show me a `git diff --stat` style summary.
- List PR test URLs covering both the default and the new variant.
```

### 4.2 Modify a block without breaking existing content

**When to use**: changing structure or selectors in a block already used in production.

**Prompt**:

```text
I need to change `blocks/{{block-name}}/` to {{describe change}}.

Before editing:
1. Search the repo and `paths.yaml` for pages/tests that use this block — list them.
2. Identify which selectors / authored cells external code or content might depend on.
3. Propose a backward-compatible change. If it can't be backward compatible, explain the migration steps for authors.

Then implement the change. Keep CSS scoped, do not edit `scripts/lib-franklin.js`, and defensively handle the old authored shape during a transition window if applicable.

Finish by listing the PR test URLs (prefixed with `$`, with `?martech=off`) that exercise both the old and new behavior.
```

---

## 5. Core scripts and `scripts.js` changes

### 5.1 Add a new domain module under `scripts/`

**When to use**: shared logic needed by multiple blocks.

**Prompt**:

```text
I want to add a new helper module at `scripts/{{folder}}/{{module}}.js` that does: {{describe behavior}}.

Before writing it:
1. Search `scripts/` for any existing module that already does this — list candidates and tell me whether I should extend one instead of creating a new one.
2. If a new module is justified, design its public API (named exports), keep side effects out of module top-level, and document expected callers.

After implementation:
- Make sure nothing in `scripts/scripts.js` imports the new module at the top level unless it is genuinely critical-path. Prefer dynamic `import()` from the lazy or delayed phase.
- Run `npm run lint` and fix issues.
- Show me which blocks should switch to the new helper (no changes to those blocks yet — just the list).
```

### 5.2 Touching `scripts/scripts.js` safely

**When to use**: you genuinely need to change the page bootstrap.

**Prompt**:

```text
I need to change `scripts/scripts.js` to {{describe change}}.

Treat this as critical-path work. Before editing:
1. Identify which phase (eager / lazy / delayed) the change belongs in. Default to delayed unless there's a clear reason.
2. Confirm no new heavy top-level imports — anything non-essential must be loaded via dynamic `import()`.
3. Check whether `LCP_BLOCKS`, `getPathDetails()`, locale routing, or feature-flag plumbing are affected. If yes, list the side effects.
4. Confirm we are NOT editing `scripts/lib-franklin.js`. If the change really requires that, stop and ask me to confirm.

Then make the smallest possible change and walk me through it line by line.
```

**Tips**: `scripts.js` is loaded on every page. Regressions here have the biggest blast radius — favor moving work to `scripts/delayed.js` or a dynamic import.

### 5.3 Update `LCP_BLOCKS`

**When to use**: promoting or demoting a block from above-the-fold treatment.

**Prompt**:

```text
I'm about to {{add | remove}} `{{block-name}}` to/from `LCP_BLOCKS` in `scripts/scripts.js`.

Confirm whether this is correct:
1. Inspect the block to verify it can render before lazy CSS loads (no late layout shifts, no late-loaded fonts/icons that would cause CLS).
2. Search content paths in `paths.yaml` for typical pages where this block sits above the fold.
3. Tell me the expected impact on LCP/CLS for those pages.
4. If correct, make the edit. If not, explain what would need to change in the block first.
```

---

## 6. CSS and styling tweaks

### 6.1 Styling-only change

**When to use**: visual fixes that should NOT touch JS.

**Prompt**:

```text
I need to {{describe visual change}} in `blocks/{{block-name}}/`.

Constraints:
- CSS only — no JS edits.
- Selectors must stay scoped to `.{{block-name}} ...`. Do not use generic selectors that could leak.
- No `!important` unless overriding a 3rd-party rule (and then add a one-line comment explaining why).
- Respect breakpoints 600 / 900 / 1200 already used elsewhere in this block (or in `styles/styles.css`).
- Use existing CSS custom properties from `styles/styles.css` when a token exists for the value.

After the change:
- Run `npm run lint:css:fix` and tell me what changed.
- List PR test URLs that exercise this block.
```

### 6.2 Audit a stylesheet against repo conventions

**Prompt**:

```text
Audit `blocks/{{block-name}}/{{block-name}}.css` against the conventions in AGENTS.md.

Flag, with line references:
- Unscoped selectors (anything not prefixed with `.{{block-name}}`).
- `!important` usage without an inline justification.
- Magic numbers that should be CSS custom properties (especially colors and spacings).
- Breakpoints that diverge from 600 / 900 / 1200 without a clear reason.
- Confusing names like `.{{block-name}}-container` that collide with EDS section wrappers.

Don't change anything yet — give me the list and your recommended fixes.
```

---

## 7. Bug fixes

### 7.1 Reproduce and fix from a bug report

**Prompt**:

```text
Bug: {{paste Jira description / Slack thread / screenshot caption}}

Reproduction URL: {{url with ?martech=off if appropriate}}

Use the /content-driven-development workflow:
1. Reproduce the bug locally via `npm run up` against the same content path. List the minimal repro steps.
2. Identify the root cause file and line. Do NOT speculate — point at the code.
3. Propose the smallest fix that respects:
   - No edits to `scripts/lib-franklin.js`.
   - CSS scope kept per block.
   - No new top-level imports in `scripts/scripts.js`.
4. Implement the fix.
5. Update or add a test if the affected logic has unit coverage.
6. Tell me the PR test URLs to add (with `?martech=off` and `$` prefix).
```

### 7.2 Regression in production — triage prompt

**When to use**: something works on `main` preview but broke on a branch preview.

**Prompt**:

```text
Regression: {{describe}}.

Compare:
- Working: {{main-preview-url}}
- Broken: {{branch-preview-url}}

1. List the commits on this branch that could plausibly cause it (use `git log main..HEAD`).
2. For each suspect commit, explain the hypothesized link to the symptom.
3. Suggest the first thing I should `git revert --no-commit` to test the hypothesis.
4. Do not change any files yet.
```

---

## 8. Content import and migration

### 8.1 Import a single page from a source URL

**When to use**: migrating a page from an external site (or an old AEM Sites instance) into authorable EDS content.

**Prompt**:

```text
Use the /page-import skill on this URL: {{source-url}}

Workflow:
1. /scrape-webpage — pull HTML, metadata, and images.
   - MCP boost (optional): if the source is an Experience League page and the `ExL_ExperienceLeague` MCP is available, prefer `search_documents` / `fetch_docs` over scraping — you'll get the authored source instead of rendered HTML.
2. /identify-page-structure — split into sections and content sequences.
3. /block-inventory + /authoring-analysis — map each sequence to an existing block from `blocks/` or default content.
4. /generate-import-html — emit the structured HTML ready for authoring.
5. /preview-import — verify it renders correctly in `npm run up`.

Constraints:
- Prefer existing blocks. Only flag a "missing block" if no sibling can be reused — and in that case, suggest the closest match and what would need to change.
- Preserve metadata (page title, description, keywords) in the import.
- Localized variants: respect `getPathDetails()` semantics (`/en/...` style paths).

End with a checklist of:
- Files created.
- Blocks that may need new variants.
- Any author follow-ups (alt text, links to fix, etc.).
```

### 8.2 Bulk migrate a section of a site

**Prompt**:

```text
I need to migrate {{N}} pages under {{source-section-url}} to EDS.

1. List the URLs (crawl or accept my pasted list — ask me which).
2. For each, run /page-import sequentially. Use a consistent destination path pattern under `{{target-path-pattern}}` (e.g. `/en/docs/{{slug}}`).
3. After each import, log:
   - Source → destination
   - Blocks used
   - Any unmapped content sequences
4. Stop and ask me before creating a new block. Never invent one silently.

At the end, produce a summary table I can paste into the Jira ticket.
```

---

## 9. Performance, LCP, and Core Web Vitals

### 9.1 LCP audit of a page

**Prompt**:

```text
Audit the LCP behavior of `{{path}}` on `{{branch-preview-url}}{{path}}?martech=off`.

1. Identify the LCP element from the HTML (image, marquee text, video poster, etc.).
2. Trace which block(s) decorate it and confirm they appear in `LCP_BLOCKS` in `scripts/scripts.js` if they should.
3. Check that LCP-critical images use `loading="eager"` and `fetchpriority="high"` where appropriate, and that lazy images don't.
4. Look for blocking work in the eager phase of `scripts/scripts.js` that could be moved to lazy/delayed.
5. Flag any third-party scripts (martech, Coveo, Adobe Target) that are loaded eagerly when they shouldn't be.

Do not change code yet — give me the audit and proposed fixes ranked by impact.
```

### 9.2 "Keeping it 100" check

**Prompt**:

```text
Use the /docs-search skill to pull the latest "Keeping it 100" performance criteria from aem.live, then audit:

URL: {{branch-preview-url}}{{path}}?martech=off

Score each criterion (LCP, CLS, INP, total transfer, blocking JS, etc.) and list the top 3 regressions vs the criteria. Suggest the smallest fix for each.

MCP boost (optional): if the `ExL_ExperienceLeague` MCP is available, you can also `search_documents` for Experience-League-specific guidance (e.g. preferred image patterns, video embed treatment) that may not be in aem.live.
```

---

## 10. Accessibility

### 10.1 a11y audit of a block

**Prompt**:

```text
Accessibility audit `blocks/{{block-name}}/`.

Check, with line references:
- Semantic HTML: headings in order, lists where appropriate, landmarks not duplicated.
- Interactive elements: real `<button>` / `<a>` (not div+onclick); keyboard reachable; visible focus.
- Labels: every input/control has a programmatic label; icons that are buttons have `aria-label`.
- Images: meaningful `alt` text; decorative images use empty `alt=""`.
- Color contrast: text vs background tokens used in the block.
- ARIA: only where native semantics don't suffice; no `role="button"` on actual buttons.

Output a prioritized list (blockers / serious / minor). Don't change code unless I ask.
```

---

## 11. Testing

### 11.1 Unit tests for a utility

**Prompt**:

```text
Add unit tests for `scripts/{{folder}}/{{module}}.js`.

- Use the test framework already configured in this repo (search package.json — don't assume Jest).
- Cover: happy path, missing input, locale variants (en / non-en if applicable), and any branching in the module.
- Tests live next to the module or under the project's existing test directory — match what already exists.
- Don't add new dependencies without asking me first.

After writing tests, run them and paste the result.
```

### 11.2 Browser test with Playwright

**Prompt**:

```text
Use the /testing-blocks skill to add a Playwright test for `blocks/{{block-name}}/`.

Target URL: {{branch-preview-url}}{{path}}?martech=off

Cover:
- Block renders with the expected DOM structure.
- Variant `{{variant-name}}` (if any) renders correctly.
- Primary user interaction (click / keyboard) works.
- No console errors on load.

Match the existing Playwright config and folder layout in this repo. Don't introduce a new runner.
```

---

## 12. Self-review before commit

> **Required step** per [AGENTS.md → Self-review before commit](../AGENTS.md#self-review-before-commit). The husky `pre-commit` hook only prints a reminder; the real gate is you running this before `git commit`.

### 12.1 `/code-review` on staged diff

**Prompt**:

```text
Run the /code-review skill in self-review mode on my currently staged changes (`git diff --staged`).

Check, at minimum:
- ESLint and Stylelint compliance (would `npm run lint` pass?).
- EDS patterns (scoped CSS, `lib-franklin.js` untouched, no heavy top-level imports in `scripts/scripts.js`).
- Performance (no synchronous third-party scripts, LCP_BLOCKS up to date if applicable).
- Accessibility (semantics, labels, focus, alt).
- Secrets / hardcoded config / `console.*` left in.
- `eslint-disable` lines without a one-line justification.
- `paths.yaml` and `paths.json` parity if either was touched.

Output: blockers, then nice-to-haves. Block me from committing until blockers are resolved.
```

### 12.2 Manual fallback (no AI tooling)

**Prompt**:

```text
I don't have skills available. Walk me through `git diff --staged` and flag anything that violates the conventions in AGENTS.md:

- Debug `console.log` / `console.warn`.
- Unscoped CSS selectors.
- `!important` without a justification comment.
- Hardcoded config / URLs / secrets.
- CSS-in-JS.
- Edits to `scripts/lib-franklin.js`.
- New top-level imports in `scripts/scripts.js`.
- `paths.yaml` changed without `paths.json` (or vice versa).

Don't change anything — just list issues with file:line references.
```

---

## 13. Commits, branches, and PR hygiene

### 13.1 Generate a branch name under the length limit

**Prompt**:

```text
Suggest a git branch name for: "{{one-line-description}}"

Constraints:
- Must pass `check-branch-name.js` in this repo.
- Keep it short — README recommends under ~18 chars to fit preview hostnames.
- Use kebab-case. Include `{{jira-id}}` if it fits.
- Give me 3 options ranked by clarity.
```

### 13.2 Generate a commit message

**Prompt**:

```text
Write a commit message for the currently staged changes (`git diff --staged`).

Constraints:
- This repo uses semantic-release. Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `perf:`, `test:`).
- Include the Jira ID `{{jira-id}}` in the body.
- Subject line ≤ 72 chars.
- Body explains the "why", not the "what".

Don't run git yet — just propose the message.
```

### 13.3 Generate a PR description

**Prompt**:

```text
Draft a PR description for branch `{{branch-name}}` against `main`.

Follow `.github/pull_request_template.md` exactly:
- Jira ID: {{jira-id}}
- Test URLs list. Pick the relevant ones from the template defaults, plus the paths I actually touched. Prefix each with `$` and append `?martech=off` where the template suggests it.
- "Before" URL stays as `https://main--exlm--adobe-experience-league.aem.live`.

Then summarize:
- What the change intends.
- How it changes existing code.
- What it breaks (if anything) and the migration plan.

Use the `git log main..HEAD` and `git diff main...HEAD` as ground truth.

MCP boost (optional): if the `github` MCP is available, call `pull_request_create` to open the PR with this description in one step.
```

### 13.4 Pre-merge babysit loop

**When to use**: PR is open and you want the agent to keep it merge-ready.

**Prompt**:

```text
Babysit PR {{pr-url}} until it's merge-ready:

1. Pull review comments (GitHub) and triage them — resolve clear ones with commits, ask me about ambiguous ones.
   - MCP boost (optional): if the `github` MCP is available, use `pull_request_get_comments` / `pull_request_get_detail` instead of the `gh` CLI for richer threading and review state.
2. Resolve trivial merge conflicts against `main`. Stop and ask for anything non-trivial.
3. If CI is red, identify the failing check (lint, quality, paths-validate) and propose a fix before applying.
4. After each fix, force-push the branch (preserve commit history with `--force-with-lease`).
5. When all checks are green and no unresolved reviewer threads remain, ping me.

Do not merge — that's my call.
```

---

## 14. `paths.yaml` / `paths.json` sync

### 14.1 Add or remove a path

**Prompt**:

```text
I need to {{add | remove | rename}} the path `{{path}}` in this repo.

1. Update `paths.yaml`.
2. Update `paths.json` to match — they MUST stay in sync (enforced by `validate-paths.js`).
3. Run `npm run validate:paths` and paste the result.
4. If any block or test references this path, list them.
```

### 14.2 Investigate a `validate:paths` failure

**Prompt**:

```text
`npm run validate:paths` is failing on this branch. Read `validate-paths.js`, then:

1. Diff `paths.yaml` against `paths.json` and show me the entries that differ.
2. Tell me which side is likely correct based on `git log` of both files.
3. Propose a unified patch and apply it.
4. Re-run `npm run validate:paths` to confirm.
```

---

## 15. Debugging

### 15.1 "Why isn't my block rendering?"

**Prompt**:

```text
Block `blocks/{{block-name}}/` isn't rendering on `{{branch-preview-url}}{{path}}?martech=off`.

Diagnose, in order:
1. Is the block registered in `component-definition.json` / `component-filters.json` / `component-models.json`? (If not, authors can't add it — but it should still render if the markup is in the page.)
2. Does the authored HTML at the URL include `<div class="{{block-name}}">…</div>`?
3. Does the decorate() function throw? Check for missing optional cells assumed mandatory.
4. Are there CSS rules hiding the block (display: none, height: 0)?
5. Does the block depend on a dynamic import that 404s in this environment?

Use the browser preview, `curl` against the URL, and the block source. Don't change code yet — diagnose first.
```

### 15.2 Locale / path parsing went sideways

**Prompt**:

```text
A page at `{{path}}` is being treated as the wrong locale or pointing at the wrong content path.

Inspect `scripts/scripts.js` (`getPathDetails()` and friends) and trace what it returns for `{{path}}`.

Cover both:
- EDS-style paths (`/en/...`, `/fr/...`).
- AEM content paths (`/content/...`).

Tell me whether the bug is in `getPathDetails()`, the calling block, or the authored URL. Don't change code yet.
```

### 15.3 Unexpected HTML in production

**Prompt**:

```text
Production HTML at `{{prod-url}}` is unexpected, but my repo code looks correct.

Remember that `fstab.yaml` mounts content from a converter (exlm-converter, Adobe I/O Runtime). The HTML transformation might be happening upstream of this repo.

1. Confirm `fstab.yaml` points where I think it does.
2. Compare the raw `.md` (or source) against the rendered HTML and identify whether the discrepancy is converter-introduced.
3. If it's converter-introduced, point me at the exlm-converter repo and the likely action that needs updating — don't try to fix it here.

MCP boost (optional): if the `eds` or `AEM-Content` MCP is available, use it to inspect the live converter output and the underlying authored content side-by-side instead of curling both manually.
```

---

## 16. Documentation and handover

### 16.1 Generate developer handover docs

**Prompt**:

```text
Use the /handover skill (and /development skill where useful) to generate a developer handover guide for this repo.

Cover:
- Project structure, with one paragraph per top-level folder.
- Custom blocks summary (group by purpose).
- Core scripts and design tokens.
- Integrations (Coveo, Adobe Target, feature flags, locales).
- Local dev workflows (signed-in vs not, stage vs prod proxy).
- CI gates (`npm run quality`, paths validation).
- Where to put new code and where NOT to (lib-franklin, scripts.js critical path).

Save it under `docs/developer-handover.md`.
```

### 16.2 Generate an admin guide

**Prompt**:

```text
Use the /admin and /auth skills to generate an admin handover at `docs/admin-handover.md`.

Cover Config Service setup, permissions, Admin API operations relevant to this project (cache, code sync), and how to rotate auth credentials. Pull current values from the live Config Service when possible — don't hardcode anything secret.
```

### 16.3 Generate an authoring guide

**Prompt**:

```text
Use the /authoring skill to produce an authoring handover at `docs/authoring-guide.md`.

For each block in `blocks/`, list:
- Purpose (1 sentence).
- Authored structure (rows / cells / variants).
- Where authors typically use it.
- Common pitfalls (missing optional cells, image sizing, etc.).

Pull purposes from the block JS and any existing comments — don't make them up.
```

---

## 17. Cross-cutting integrations (Coveo, feature flags, locales)

### 17.1 Add a Coveo / Atomic Search-aware feature

**Prompt**:

```text
I want to add a feature that interacts with Atomic Search results: {{describe}}.

Before writing code:
1. Find `initiateCoveoAtomicSearch` and the `atomic-search` block. Summarize how they're wired today.
2. Tell me whether my feature belongs inside the `atomic-search` block, as a sibling block, or as a hook on top of Coveo events.
3. Confirm I won't need to edit `scripts/lib-franklin.js`.

Then implement, keeping all Coveo-specific logic out of the critical path.
```

### 17.2 Gate a feature behind a flag

**Prompt**:

```text
Gate the new behavior in `{{file-or-block}}` behind a feature flag.

Use the existing pattern in `scripts/utils/feature-flag-utils.js` and the usages in `scripts/scripts.js`. Don't introduce a new flag system.

After implementing:
- Document the flag name, default value, and how to override it locally (URL param, cookie, etc., based on what the utility supports).
- Confirm the default-off path is the safe one — no regressions when the flag is off.
```

### 17.3 Add a locale-aware string or path

**Prompt**:

```text
I'm adding a {{string | URL | redirect}} that needs to be locale-aware.

1. Find the existing placeholder / localization mechanism (search `lib-franklin.js` for `fetchPlaceholders` and similar helpers in `scripts/`).
2. Use that mechanism — do not hardcode English.
3. For URLs, route through `getPathDetails()` so both `/en/...` and `/content/...` styles work.

Implement, then list the placeholder keys (if any) that need a translation entry.
```

---

## 18. MCP-aware variants

Full standalone prompts that lean on MCP servers as the primary tool surface. Use these when you have the relevant MCP configured and authenticated. If the MCP isn't available, fall back to the matching base prompt in the earlier sections.

> Before any of these, check the MCP's status. If it's errored or unauthenticated, surface that to the user rather than guessing — most MCPs surface auth issues via a `mcp_auth` tool or a status file in the agent's MCP registry.

### 18.1 New block from a Figma frame (`figma` MCP) — end to end

**When to use**: scaffolding a brand-new block where a Figma frame is the source of truth and the `figma` MCP is configured. Self-contained — does design extraction, code scaffolding, UE registration, lint, and a test plan in one pass. If the `figma` MCP isn't available, fall back to [§3.1](#31-scaffold-a-new-block-end-to-end).

**Prompt**:

```text
Scaffold the `{{block-name}}` block end to end from a Figma frame using the `figma` MCP.

Inputs:
- Figma frame: {{figma-frame-url}}
- Block name (kebab-case, will be both folder and CSS class): {{block-name}}
- Jira: {{jira-id}}
- Acceptance criteria: {{paste or link}}
- (Optional) sibling block for code patterns only — NOT for visuals: blocks/{{sibling-block}}/

Step 1 — Verify the MCP
- Confirm the `figma` MCP is reachable and authenticated. If it errors, STOP and tell me to fix the MCP before continuing. Do not silently fall back to a screenshot.

Step 2 — Read the frame and extract design intent
From the frame (and any linked breakpoint frames), extract:
- Layout: grid columns, gaps, paddings, breakpoint variants. Map to the repo's 600 / 900 / 1200 breakpoints; flag any frame that targets different breakpoints.
- Type styles: font family, weight, size, line-height, letter-spacing per text role (eyebrow, title, body, link, etc.). Map each to an existing CSS custom property in `styles/styles.css`; flag missing ones as "needs design token".
- Colors: hex per role (text, background, border, hover, focus). Map to existing custom properties in `styles/styles.css`; flag missing ones.
- Iconography: list every icon by Figma layer name. For each, check `icons/` for an existing SVG that matches; flag missing ones.
- Imagery: aspect ratios, sizes per breakpoint, whether eager or lazy.
- Component states: default, hover, focus, active, disabled, dark mode if present.
- Authoring contract: from the frame, infer the minimum authored structure (rows / cells). Be specific — e.g. "row 1 cell 1 = eyebrow text, row 1 cell 2 = optional CTA link".

Output a "design intent" summary as a compact table before writing any code. Wait for me to confirm if anything looks off — but only stop if I push back; otherwise proceed.

Step 3 — Locate the closest sibling (if I didn't pass one)
- Run /block-inventory and pick the block whose authored structure and interaction model match most closely. Use it ONLY for code patterns: decorate() shape, file layout, import style. Do not copy its visuals.

Step 4 — Scaffold the block
Create:
- `blocks/{{block-name}}/{{block-name}}.js`
  - `export default async function decorate(block) { … }`.
  - ES module imports with explicit `.js` extensions. Pull helpers from `scripts/lib-franklin.js`; do NOT edit that file.
  - Defensively handle missing optional cells/rows per the authoring contract from Step 2.
  - Use dynamic `import()` for anything non-essential. No heavy work at module top level.
- `blocks/{{block-name}}/{{block-name}}.css`
  - All selectors scoped to `.{{block-name}} …`. No global selectors. No `!important` without a one-line justification comment.
  - Use the CSS custom properties identified in Step 2. Inline a hex value only when Step 2 flagged it as a missing token, and add a `/* TODO: token */` marker.
  - Mobile-first; breakpoints at 600 / 900 / 1200 unless Step 2 said otherwise.
  - Honor every state from Step 2 (hover, focus, active, disabled, dark mode).
- (If new icons are needed) drop SVGs into `icons/` using existing icons as a stylistic reference. Flag each new icon for design review.

Step 5 — Register the block in Universal Editor
Update so authors can pick the block in UE, matching the authoring contract from Step 2:
- `component-definition.json` — group, title, model id.
- `component-filters.json` — where the block is allowed.
- `component-models.json` — fields for every authorable cell/value, plus a "variant" select if Step 2 found any.

Verify the registered model matches what `decorate()` actually consumes. Flag any mismatch and fix it before continuing.

Step 6 — Critical-path / LCP check
- If this block is likely to render above the fold on its first authored page, add it to `LCP_BLOCKS` in `scripts/scripts.js`. If unsure, ask me before editing `scripts.js`.
- Confirm no new top-level imports were added to `scripts/scripts.js`.

Step 7 — Lint and self-review
- Run `npm run lint`. Fix everything it flags.
- Run `npm run lint:css:fix` if there were Stylelint issues.
- Run the /code-review skill in self-review mode against the staged diff. Resolve every blocker before stopping.

Step 8 — Deliverable summary
At the end, output:
1. Files created / modified (paths only).
2. Authored structure the block expects (the contract for authors).
3. Variants registered, if any.
4. Design tokens flagged as missing (with the hex / value from Figma so design can add them).
5. New icons flagged for design review.
6. Whether `LCP_BLOCKS` was updated and why.
7. PR test URLs to add to `.github/pull_request_template.md` format — prefixed with `$`, with `?martech=off` where appropriate. Include URLs that exercise every variant and every state from Step 2 where reachable.
8. Open questions for design or the PO, if any.

Do NOT commit or open a PR — that's my call.
```

**Variables**: `block-name`, `figma-frame-url`, `jira-id`, `sibling-block` (optional).

**Tips**:

- The prompt asks the agent to stop if the `figma` MCP errors. That's deliberate — silently falling back to a screenshot defeats the purpose of this variant.
- Tokens flagged as "missing" should be added to `styles/styles.css` in a separate PR by design / a maintainer, not invented inside the block CSS.
- If the frame has multiple linked breakpoint variants but they don't land on 600 / 900 / 1200, treat that as a design conversation, not a CSS workaround.

### 18.2 Migrate Experience League pages with authoritative source (`ExL_ExperienceLeague` MCP)

**When to use**: importing pages that already exist on Experience League. The MCP returns the authored document instead of a rendered HTML snapshot, which avoids re-introducing render-time artifacts.

**Prompt**:

```text
Use the `ExL_ExperienceLeague` MCP for source-of-truth content.

Inputs:
- Search keyword: "{{keyword}}"
- OR explicit document IDs: [{{id-1}}, {{id-2}}, ...]

Workflow:
1. Call `search_documents` (if I gave a keyword) and present the top results to me. Wait for me to confirm which docs to import.
2. Call `fetch_docs` with the confirmed IDs to get the authored payloads.
3. Hand each payload to the /page-import skill in this order:
   - /identify-page-structure on the payload's structured content (skip /scrape-webpage — we already have authored source).
   - /authoring-analysis + /block-inventory to map to existing blocks.
   - /generate-import-html to produce the destination markup.
   - /preview-import to verify locally via `npm run up`.
4. For each imported doc, log: source ID → destination path → blocks used → unmapped sequences.
5. Stop and ask me before creating a new block; never invent one silently.
```

### 18.3 Inspect a live AEM content path before changing a block (`AEM-Content` MCP)

**When to use**: you're about to modify a block and want to see what authored content is actually depending on the current structure, not guess.

**Prompt**:

```text
Use the `AEM-Content` MCP to inspect authored content that depends on `blocks/{{block-name}}/`.

1. Query the MCP for pages containing this block. If the MCP doesn't expose a "find by block" query, fetch the candidate paths from `paths.yaml` and probe each.
2. For each authored instance, capture:
   - The authored cell structure (rows / cells / values).
   - Variants in use (modifier classes on the block).
   - Any cell values that look like contracts (URLs, slugs, asset paths) that an external system might depend on.
3. Compare the captured structure against what `blocks/{{block-name}}/{{block-name}}.js` currently expects. Flag mismatches.
4. Output a "safe change" envelope: what structural changes are safe, what would require author migration, and what would break silently.

Do NOT modify code yet.
```

### 18.4 PR babysit loop with the GitHub MCP

**When to use**: keeping an open PR merge-ready using the `github` MCP instead of the `gh` CLI.

**Prompt**:

```text
Babysit PR {{pr-url}} using the `github` MCP (fall back to the `gh` CLI if the MCP isn't authenticated).

Loop:
1. `pull_request_get_detail` on the PR. Pull state, mergeability, required checks.
2. `pull_request_get_comments` — triage:
   - Trivial fixes (typos, lint, suggested replacements): apply directly via a commit.
   - Ambiguous: surface to me with the comment thread and a proposed reply.
3. If CI is red, identify the failing check. If it's `npm run quality` or `validate:paths`, apply the fix and re-push with `git push --force-with-lease`.
4. If `main` has moved, rebase or merge — pick whichever this repo's history prefers.
5. After each push, wait for checks to re-run before the next iteration.
6. When the PR is green and has no unresolved reviewer threads, ping me. Do NOT merge.
```

### 18.5 Create a PR from a green local branch (`github` MCP)

**Prompt**:

```text
My branch `{{branch-name}}` is green locally (`npm run quality` passes) and pushed to origin.

Use the `github` MCP:
1. `pull_request_create` against `main`, with:
   - Title: Conventional Commit style summary of the squashed history of `main..HEAD`.
   - Body: follow `.github/pull_request_template.md` exactly. Test URLs prefixed with `$`, `?martech=off` where the template suggests it. Use my actual touched paths plus the relevant defaults.
   - Jira: {{jira-id}}
2. Return the PR URL.
3. If `pull_request_create_review` is available, add a "Self-review" review on the PR with my own comments highlighting non-obvious trade-offs (from `git diff main...HEAD`).

Do not request reviewers — I'll add them.
```

### 18.6 Authoritative aem.live / Experience League docs lookup (`ExL_ExperienceLeague` MCP)

**When to use**: any time the base prompt says "use /docs-search" and you want a stronger pull from Experience League directly.

**Prompt**:

```text
Use the `ExL_ExperienceLeague` MCP instead of /docs-search:

1. `search_documents` with keyword "{{keyword}}".
2. Show me the top 5 hits with titles + IDs.
3. After I pick, `fetch_docs` for the chosen IDs.
4. Summarize the docs in 1 paragraph each and cite the IDs.
5. Apply the guidance to the task at hand: {{describe-task}}.

If the MCP returns zero matches, fall back to /docs-search against aem.live and explicitly note the fallback in your answer.
```

### 18.7 Converter-vs-repo diagnosis (`eds` MCP)

**When to use**: production HTML differs from what this repo's code would produce — see §15.3. Stronger version when the `eds` MCP can inspect converter output directly.

**Prompt**:

```text
Production HTML at `{{prod-url}}` is unexpected. Use the `eds` MCP to diagnose whether the discrepancy comes from this repo or upstream (exlm-converter).

1. Read `fstab.yaml` to confirm the converter endpoint.
2. Use the `eds` MCP to fetch:
   - The rendered HTML at `{{prod-url}}`.
   - The pre-converter source for the same path, if exposed.
3. Diff the two. Categorize each difference as:
   - "This repo's block JS / CSS" — fix here.
   - "Converter transformation" — point me at the exlm-converter action that's likely responsible.
   - "Authored content" — flag for content authors.
4. Output the categorization as a table. Do not change code yet.
```

---

## Appendix — Quick reference

### Slash-command skills shipped with this repo

| Skill                                                                                                                                                                         | Use it for                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `/analyze-and-plan`                                                                                                                                                           | Turn a Jira ticket into acceptance criteria and a plan |
| `/block-inventory`                                                                                                                                                            | List available blocks and pick the closest sibling     |
| `/block-collection-and-party`                                                                                                                                                 | Browse external block references                       |
| `/building-blocks`                                                                                                                                                            | Implementation flow for block / scripts / CSS work     |
| `/code-review`                                                                                                                                                                | **Required** self-review on staged diff before commit  |
| `/content-driven-development`                                                                                                                                                 | Wrapper workflow for any code change                   |
| `/content-modeling`                                                                                                                                                           | Design author-friendly block structures                |
| `/ue-component-model`                                                                                                                                                         | Wire a block into Universal Editor metadata            |
| `/page-import`, `/scrape-webpage`, `/identify-page-structure`, `/page-decomposition`, `/authoring-analysis`, `/generate-import-html`, `/preview-import`, `/find-test-content` | Content import / migration pipeline                    |
| `/testing-blocks`                                                                                                                                                             | Unit + Playwright tests                                |
| `/docs-search`                                                                                                                                                                | Search aem.live docs                                   |
| `/handover`, `/development`, `/authoring`, `/admin`, `/auth`                                                                                                                  | Generate handover guides                               |
| `/whitepaper`                                                                                                                                                                 | Long-form PDF documentation                            |

### MCP servers (optional — see [§18](#18-mcp-aware-variants))

The base prompt library is MCP-agnostic. These are the servers that, when configured, unlock the variants in §18:

| MCP server             | Key tools (where known)                                                                                     | Used by                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------- |
| `ExL_ExperienceLeague` | `search_documents`, `fetch_docs`                                                                            | §8, §9.2, §18.2, §18.6     |
| `AEM-Content`          | (authenticated content inspection)                                                                          | §15.3, §18.3               |
| `eds`                  | (EDS / converter inspection)                                                                                | §15.3, §18.7               |
| `figma`                | (frame / design token extraction)                                                                           | §3.1, §18.1                |
| `github`               | `pull_request_create`, `pull_request_get_comments`, `pull_request_get_detail`, `pull_request_create_review` | §13.3, §13.4, §18.4, §18.5 |

If any MCP errors or needs authentication, surface that to the user before trying the variant prompt.

### Repo-specific gotchas to remind the agent of

- `scripts/lib-franklin.js` is core — **do not edit**.
- `scripts/scripts.js` is critical path — **no heavy top-level imports**.
- `LCP_BLOCKS` must include any above-the-fold block.
- `paths.yaml` and `paths.json` must stay in sync (`npm run validate:paths`).
- Branch names should be under ~18 chars (`check-branch-name.js`).
- Test URLs in PRs use the `$` prefix and `?martech=off`.
- All shipped JS is public — **no secrets**.
- Locale handling goes through `getPathDetails()`.
