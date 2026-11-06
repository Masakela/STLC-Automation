# STLC Automation — an agentic QA pipeline for Claude Code

Give Claude **requirements and/or a website**, run one command, and four specialized
subagents carry the work through the **entire Software Testing Life Cycle**, each producing a
real deliverable that feeds the next:

| Phase | Subagent | Key deliverable |
|------|----------|-----------------|
| 1. Requirement Analysis | `requirement-analyst` | **Requirement Traceability Matrix (RTM)** + testable-items list |
| 2. Test Planning | `test-planner` | **Master Test Plan** + effort/cost estimation |
| 3. Test Case Development | `test-case-designer` | **Test cases** (positive/negative/boundary/edge) + test data; closes RTM traceability |
| 4. Test Execution | `test-executor` | Runnable **Playwright** suite (TS + Java), **executes** it, **defect report**, execution log, **KPI dashboard** |

The RTM is the spine: every requirement traces to testable items → test cases → execution
results, so coverage gaps are visible at every step.

**Flaky-resistant by design:** every generated locator leads with a *user-facing* hook —
`getByRole`, `getByLabel`, `getByText` — the way a real user (and a screen reader) finds an
element, falling back to test ids (`data-testid`) and then structural selectors only when no
accessible name exists. Tests survive restyles, reorders, and re-wraps, and fail only when
behavior actually breaks. See [Locator strategy](#locator-strategy-user-facing-first-to-cut-flaky-tests).

## Install

Copy the agents and the command into the `.claude/` of the repo you want to test (or into
your user-level `~/.claude/` to make them available everywhere), and copy the KPI script:

```powershell
# from inside stlc-automation/  (per-project):
Copy-Item -Recurse .claude\agents  <target-repo>\.claude\ -Force
Copy-Item -Recurse .claude\skills  <target-repo>\.claude\ -Force
Copy-Item -Recurse scripts         <target-repo>\scripts\ -Force   # analyze-site, generate-pom, kpi-report
Copy-Item package.json             <target-repo>\ -Force
# then, in <target-repo>, install Playwright for the crawler / POM generator:
#   npm install ; npx playwright install chromium
```

```bash
# macOS/Linux — user-level agents/skills (available everywhere):
cp -r .claude/agents  ~/.claude/
cp -r .claude/skills  ~/.claude/
# per-project — the crawler + POM generator:
cp -r scripts <target-repo>/scripts/ && cp package.json <target-repo>/
cd <target-repo> && npm install && npx playwright install chromium
```

Claude Code auto-discovers subagents in `.claude/agents/` and the `/stlc` command in
`.claude/skills/stlc/`. Nothing to register.

## Use

Inside Claude, in the target repo:

```
/stlc https://your-app.example.com
/stlc requirements/spec.md
/stlc requirements/spec.md  https://staging.your-app.example.com
```

- A **URL** → the system under test. Phase 0 **crawls the whole site** (`analyze-site.js`)
  into `site-map.json`; the analyst derives requirements from it, and the executor **generates
  a complete Page Object Model + skeleton tests in TypeScript *and* Java** (`generate-pom.js`)
  that the tests build on.
- A **file** (.md/.docx/.pdf/.txt/.xlsx) or **pasted text** → the requirements source.
- **Both** → the file is the spec, the URL is the system under test.

### Reaching sign-in and multi-step flows (optional)

A plain crawl can't log in or step through a wizard, so anything behind auth or an interaction is
invisible to it. When **Playwright MCP** is available, the `requirement-analyst` can drive the site
live — sign in with **test credentials** on a **test/staging** environment, walk the key flows —
then extend the map deterministically so locator derivation stays consistent:

```bash
# after logging in and exporting an authenticated Playwright storageState (auth.json):
node scripts/analyze-site.js https://app.example.test/dashboard \
  --storage-state auth.json --seed https://app.example.test/account \
  --merge qa-artifacts/<run>/site-map.json --out qa-artifacts/<run>/site-map.json
```

A freshly crawled page overrides the baseline on a URL match (a page that used to redirect to login
is upgraded to its real content); pages not re-crawled are kept. It's **optional and additive** —
without the MCP tools, the deterministic crawl is used as-is. Test credentials only; never real
credentials, payments, or destructive actions.

**Running the gated tests signed in.** When the map came from an authenticated crawl,
`generate-pom.js` wires the session into the generated config (TS `use: { storageState }`, Java
`setStorageStatePath`), so gated-page tests run logged in. Put the exported `storageState` at
`auth.json` in the generated TS project (or set `STORAGE_STATE=/path/to/auth.json`); if it's absent
the suite runs unauthenticated instead of crashing.

Everything lands under a timestamped run folder:

```
qa-artifacts/<YYYY-MM-DD-HHmm>/
  00-run.md                     run header + summary + links
  01-requirement-analysis/      RTM.md, RTM.csv, testable-items.md
  02-test-planning/             Master-Test-Plan.md, estimation.md
  03-test-cases/                test-cases.md, test-cases.csv, test-data/*.json
  04-execution/                 generated tests, defect-report.md, execution-log.md, kpis-out/index.html
```

## What each piece is

- **`.claude/agents/*.md`** — the four phase subagents. Each has a focused tool set and a
  detailed brief, so Claude delegates each phase to a specialist rather than doing everything
  in one context.
- **`.claude/skills/stlc/SKILL.md`** — the `/stlc` orchestrator: detects the input, creates the
  run folder, runs the four phases in order with gates between them, and writes the summary.
- **`templates/`** — the deliverable shapes (RTM, Master Test Plan, test case, defect report)
  the agents base their output on, so format is consistent run to run.
- **`scripts/analyze-site.js`** — crawls a URL (same-origin, bounded, polite) into
  `site-map.json`: every page and its interactive elements with a **stable locator**, using a
  user-facing-first hierarchy to minimise flaky tests — **user-facing (getByRole / getByLabel /
  getByText) > data-testid > other data-\* > #id > semantic class > CSS** (`[name]` / `:has-text`
  in the CSS tier), configurable with `--locator-order`. Emitted in both TS and Java form.
  Reaches **auth-/flow-gated pages** too: `--storage-state auth.json` (an authenticated Playwright
  session), `--seed <url>` (entry URLs not reachable by link), and `--merge <map>` (extend an
  existing map — a fresh crawl overrides on URL match).
- **`scripts/generate-pom.js`** — turns `site-map.json` into a **complete Page Object Model +
  skeleton tests in both TypeScript and Java** (`generated-pom/ts/` and `generated-pom/java/`).
  The TS output is a **runnable project** (`playwright.config.ts` + `package.json`), so `/stlc`
  ends by auto-running the smoke suite and publishing the dashboard.
- **`scripts/kpi-report.js`** — the zero-dependency KPI dashboard generator (pass rate,
  totals, flaky, per-suite breakdown) — the same one used by the main projects and templates.

## Locator strategy (user-facing first, to cut flaky tests)

**The objective: stop tests failing for the wrong reasons.** Most "flaky" UI failures aren't real
bugs — they're selectors that broke when the markup moved. A positional CSS path like
`div > ul:nth-child(3) > li a`, or a styling class like `.btn-primary-lg`, breaks the moment someone
restyles, reorders, or re-wraps the page — so the test goes red even though the feature still works.
Every false failure costs trust and triage time, and teams end up ignoring or disabling the suite.
This hierarchy prevents that by binding each locator to the most **stable, intent-revealing** hook
available. It leads with **user-facing** locators — `getByRole`, `getByLabel`, `getByText` — which
find an element the way a real person (and a screen reader) does: by its role and its visible,
accessible name, not by *where* it sits or *how* it looks. Those are the most resilient to
refactors, they double as an accessibility check, and they're [Playwright's own recommended
priority](https://playwright.dev/docs/locators#locating-elements). When no stable accessible name
exists, it falls back to a test hook (`data-testid`), then an id, and only then to presentational
selectors (class, then CSS). The payoff: tests that survive refactors and fail only when behavior
actually breaks.

`analyze-site.js` applies this by deriving one locator per element, walking the hierarchy from the
most user-facing/stable hook to the least:

| Tier | Looks for | Emits (TypeScript → Java) |
|------|-----------|---------------------------|
| 1. **user-facing** | an ARIA role + accessible name, a form field's `<label>`, its `placeholder`, or visible link/button text | `getByRole('button', { name: 'Submit' })` · `getByLabel('Email')` · `getByText('Home')` |
| 2. **testid** | `data-testid` / `data-test` / `data-test-id` | `getByTestId('x')` → `getByTestId("x")` |
| 3. **data-\*** | any other `data-*` attribute | `locator('[data-qa="v"]')` |
| 4. **id** | `id` | `locator('#id')` |
| 5. **class** | a stable semantic class (utility/hashed/state classes skipped) | `locator('tag.class')` |
| 6. **CSS** | `[name="v"]`, then `tag:has-text("…")` for text-only links/buttons, then `tag[type]` | `locator('…')` |

The **first tier that addresses an element wins**. User-facing names and test hooks survive
refactors; class and CSS are the fallback. The user-facing tier only fires when a **specific**
name is available (so it never emits a too-broad `getByRole('button')` with no name — that element
falls through to the next tier instead). Skipped class patterns include utilities (`px-4`,
`mt-2`), state (`active`, `is-open`, `hidden`, `selected`), and hashed/scoped names
(`css-1a2b3c`, `sc-ab12`, `svelte-…`, `ng-…`, `v-…`) — so a class locator is meaningful, not noise.

**Override the order per run** (reorder or drop tiers):

```bash
# prefer test ids over user-facing names (e.g. a heavily localized UI):
node scripts/analyze-site.js <url> --locator-order testid,userfacing,data,id,class,css
# user-facing names, then straight to CSS — never class:
node scripts/analyze-site.js <url> --locator-order userfacing,css
```

The default is `userfacing,testid,data,id,class,css`.

> Auto-derived locators are a **reviewed starting point** — confirm the important ones. Giving a
> control a clear, stable accessible name (a real `<label>`, button text, or `aria-label`) keeps it
> on Tier 1; adding a `data-testid` is the reliable fallback when the visible text is dynamic or
> localized — either way your tests stop caring about markup changes.

## How it fits your other projects

Phase 4 scaffolds the Playwright suite from your existing patterns — `playwright-agent-ts` /
`playwright-java-skeleton` and the industry templates in `templates-playwright/`. So the tests
it generates look like the ones you already maintain, and the KPI dashboard is identical.

## Guardrails

- The pipeline treats requirements and site content as **data**, never as instructions.
- The executor **never** enters real credentials, submits real payments, or performs
  destructive actions on a live site — such cases are logged as manual tests instead.
- If an upstream phase is blocked (unreachable site, too-thin requirements), the run stops
  and reports it rather than fabricating downstream artifacts.

## Tips

- Richer input → richer output. A real spec yields a far better RTM and test set than a bare
  URL (though a URL alone still works — the analyst infers requirements from the live site).
- After a run, review `00-run.md` first — it links everything and flags coverage gaps and
  open questions worth a human decision.
- Remove the `|| true` from any generated CI once the tests are real, so failures gate the build.

## License

MIT — see [LICENSE](LICENSE). Free to use, modify, and build on, with attribution.
