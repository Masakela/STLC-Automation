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
  resilient-first hierarchy to minimise flaky tests — **data-testid > other data-\* > #id >
  semantic class > CSS** (`[name]` / `:has-text` in the CSS tier), configurable with
  `--locator-order`. Emitted in both TS and Java form.
- **`scripts/generate-pom.js`** — turns `site-map.json` into a **complete Page Object Model +
  skeleton tests in both TypeScript and Java** (`generated-pom/ts/` and `generated-pom/java/`).
  The TS output is a **runnable project** (`playwright.config.ts` + `package.json`), so `/stlc`
  ends by auto-running the smoke suite and publishing the dashboard.
- **`scripts/kpi-report.js`** — the zero-dependency KPI dashboard generator (pass rate,
  totals, flaky, per-suite breakdown) — the same one used by the main projects and templates.

## Locator strategy (resilient-first, to cut flaky tests)

**The objective: stop tests failing for the wrong reasons.** Most "flaky" UI failures aren't real
bugs — they're selectors that broke when the markup moved. A positional CSS path like
`div > ul:nth-child(3) > li a`, or a styling class like `.btn-primary-lg`, breaks the moment someone
restyles, reorders, or re-wraps the page — so the test goes red even though the feature still works.
Every false failure costs trust and triage time, and teams end up ignoring or disabling the suite.
This hierarchy prevents that by binding each locator to the most **stable, intent-revealing** hook
available — a test id or an id that says *what* the element is, not *where* it sits or *how* it
looks — and only falling back to presentational selectors (class, then CSS) when nothing better
exists. The payoff: tests that survive refactors and fail only when behavior actually breaks.

`analyze-site.js` applies this by deriving one locator per element, walking the hierarchy from the
most stable hook to the least:

| Tier | Looks for | Emits (TypeScript → Java) |
|------|-----------|---------------------------|
| 1. **testid** | `data-testid` / `data-test` / `data-test-id` | `getByTestId('x')` → `getByTestId("x")` |
| 2. **data-\*** | any other `data-*` attribute | `locator('[data-qa="v"]')` |
| 3. **id** | `id` | `locator('#id')` |
| 4. **class** | a stable semantic class (utility/hashed/state classes skipped) | `locator('tag.class')` |
| 5. **CSS** | `[name="v"]`, then `tag:has-text("…")` for text-only links/buttons, then `tag[type]` | `locator('…')` |

The **first tier that addresses an element wins**. Test hooks (`data-*`) and ids survive
refactors; class and CSS are the fallback. Skipped class patterns include utilities (`px-4`,
`mt-2`), state (`active`, `is-open`, `hidden`, `selected`), and hashed/scoped names
(`css-1a2b3c`, `sc-ab12`, `svelte-…`, `ng-…`, `v-…`) — so a class locator is meaningful, not noise.

**Override the order per run** (reorder or drop tiers):

```bash
# prefer id over data-* attributes:
node scripts/analyze-site.js <url> --locator-order testid,id,data,class,css
# never fall back to class, go straight to CSS:
node scripts/analyze-site.js <url> --locator-order testid,data,id,css
```

The default is `testid,data,id,class,css`.

> Auto-derived locators are a **reviewed starting point** — confirm the important ones. The best
> way to make them rock-solid is to add a `data-testid` in the app: the analyzer then locks onto
> Tier 1 on the next run, and your tests stop caring about markup changes entirely.

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
