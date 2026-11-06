#!/usr/bin/env node
/*
 * generate-pom.js — turn site-map.json (from analyze-site.js) into a complete Page Object
 * Model + skeleton tests, in BOTH TypeScript (@playwright/test) and Java (Playwright + TestNG).
 *
 * Usage: node generate-pom.js [--map site-map.json] [--out generated-pom] [--max-locators 40]
 *                             [--storage-state auth.json]
 *
 * The generated page objects are a reviewed starting point: locators are auto-derived and the
 * test bodies are skeletons (visibility checks + TODOs) — a QA engineer refines the assertions.
 *
 * Auth: if the map came from an authenticated crawl (map.authenticated) or --storage-state is
 * passed, the generated TS/Java config loads that session so gated-page tests run signed in. It
 * falls back to unauthenticated when the storageState file is absent, so a run never crashes.
 */
'use strict';
const fs = require('fs');
const path = require('path');
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; }
const MAP = arg('map', 'site-map.json');
const OUT = arg('out', 'generated-pom');
const MAXLOC = parseInt(arg('max-locators', '40'), 10);

const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
const SS = arg('storage-state', '') || (map.authenticated ? 'auth.json' : '');
// Java context setup — signed-in when SS is set (guards file existence so it never crashes).
const jaSetupBody = SS
  ? `    Browser.NewContextOptions opts = new Browser.NewContextOptions().setBaseURL("${map.origin}");
    String ss = System.getenv().getOrDefault("STORAGE_STATE", "${SS}");
    if (ss != null && !ss.isEmpty() && java.nio.file.Files.exists(java.nio.file.Paths.get(ss))) opts.setStorageStatePath(java.nio.file.Paths.get(ss));
    page = browser.newContext(opts).newPage();`
  : `    page = browser.newContext(new Browser.NewContextOptions().setBaseURL("${map.origin}")).newPage();`;
const mkdir = (p) => fs.mkdirSync(p, { recursive: true });
const tsPages = path.join(OUT, 'ts', 'pages');
const tsTests = path.join(OUT, 'ts', 'tests');
const jaPages = path.join(OUT, 'java', 'src', 'main', 'java', 'com', 'example', 'pages');
const jaTests = path.join(OUT, 'java', 'src', 'test', 'java', 'com', 'example', 'tests');
[tsPages, tsTests, jaPages, jaTests].forEach(mkdir);

let tsCount = 0, jaCount = 0, locTotal = 0;
const summary = [];

for (const pg of map.pages) {
  const els = pg.elements.slice(0, MAXLOC);
  if (!els.length) { summary.push(`- ${pg.name}Page — (no addressable elements, skipped)`); continue; }
  locTotal += els.length;
  const needsAria = els.some((e) => e.java.includes('AriaRole'));

  // ---------- TypeScript page object ----------
  const tsFields = els.map((e) => `  readonly ${e.field}: Locator;`).join('\n');
  const tsInit = els.map((e) => `    this.${e.field} = page.${e.ts};`).join('\n');
  const ts = `import { Page, Locator } from '@playwright/test';

/** ${pg.name} — ${pg.path}  (auto-generated from ${map.origin}) */
export class ${pg.name}Page {
  readonly page: Page;
${tsFields}

  constructor(page: Page) {
    this.page = page;
${tsInit}
  }

  async goto() {
    await this.page.goto('${pg.path}');
  }
}
`;
  fs.writeFileSync(path.join(tsPages, `${pg.name}.page.ts`), ts); tsCount++;

  // ---------- TypeScript skeleton spec ----------
  const firstAssert = els[0] ? `    await expect(p.${els[0].field}).toBeVisible();` : '';
  const tsSpec = `import { test, expect } from '@playwright/test';
import { ${pg.name}Page } from '../pages/${pg.name}.page';

test.describe('${pg.name}', () => {
  test('REQ-TODO ${pg.name} renders its key elements', async ({ page }) => {
    const p = new ${pg.name}Page(page);
    await p.goto();
${firstAssert}
    // TODO: assert real behavior for this page (fill forms, submit, verify outcomes).
  });
});
`;
  fs.writeFileSync(path.join(tsTests, `${pg.name.toLowerCase()}.spec.ts`), tsSpec);

  // ---------- Java page object ----------
  const jaFields = els.map((e) => `  public final Locator ${e.field};`).join('\n');
  const jaInit = els.map((e) => `    this.${e.field} = page.${e.java};`).join('\n');
  const ja = `package com.example.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
${needsAria ? 'import com.microsoft.playwright.options.AriaRole;\n' : ''}
/** ${pg.name} — ${pg.path}  (auto-generated from ${map.origin}) */
public class ${pg.name}Page {
  private final Page page;
${jaFields}

  public ${pg.name}Page(Page page) {
    this.page = page;
${jaInit}
  }

  public void navigate() {
    page.navigate("${pg.path}");
  }
}
`;
  fs.writeFileSync(path.join(jaPages, `${pg.name}Page.java`), ja); jaCount++;

  // ---------- Java skeleton test ----------
  const jaTest = `package com.example.tests;

import com.example.pages.${pg.name}Page;
import com.microsoft.playwright.*;
import org.testng.annotations.*;

public class ${pg.name}Test {
  Playwright pw; Browser browser; Page page;

  @BeforeMethod public void setUp() {
    pw = Playwright.create();
    browser = pw.chromium().launch();
${jaSetupBody}
  }
  @AfterMethod public void tearDown() { if (browser != null) browser.close(); if (pw != null) pw.close(); }

  @Test public void ${pg.name.toLowerCase()}RendersKeyElements() {
    ${pg.name}Page p = new ${pg.name}Page(page);
    p.navigate();
    ${els[0] ? `com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat(p.${els[0].field}).isVisible();` : ''}
    // TODO: assert real behavior for this page.
  }
}
`;
  fs.writeFileSync(path.join(jaTests, `${pg.name}Test.java`), jaTest);

  summary.push(`- **${pg.name}Page** — \`${pg.path}\` — ${els.length} locators (ts + java)`);
}

// ---------- make the TS POM a runnable project (so /stlc can auto-run the smoke suite) ----------
const tsConfig = SS
  ? `import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';

// Gated pages need a signed-in session. Point STORAGE_STATE (or the default below) at an
// authenticated Playwright storageState JSON; if it's missing, tests run unauthenticated instead
// of crashing, so the suite is green with or without the session file.
const ssPath = process.env.STORAGE_STATE || '${SS}';
const storageState = ssPath && fs.existsSync(ssPath) ? ssPath : undefined;

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: process.env.APP_BASE_URL || '${map.origin}', ...(storageState ? { storageState } : {}) },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
`
  : `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: process.env.APP_BASE_URL || '${map.origin}' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
`;
fs.writeFileSync(path.join(OUT, 'ts', 'playwright.config.ts'), tsConfig);
fs.writeFileSync(path.join(OUT, 'ts', 'package.json'),
  JSON.stringify({ name: 'generated-pom-ts', private: true,
    scripts: { test: 'playwright test', kpi: 'node ../../scripts/kpi-report.js --pw test-results/results.json --out kpis-out' },
    devDependencies: { '@playwright/test': '^1.47.0' } }, null, 2) + '\n');

// ---------- summary ----------
const md = `# Generated Page Object Model

Source: ${map.startUrl} · ${map.pageCount} page(s) crawled · generated ${new Date().toISOString()}

## Pages
${summary.join('\n')}

## Layout
- \`ts/pages/*.page.ts\` — TypeScript page objects (@playwright/test)
- \`ts/tests/*.spec.ts\` — skeleton specs (one per page)
- \`java/src/main/java/com/example/pages/*Page.java\` — Java page objects (Playwright for Java)
- \`java/src/test/java/com/example/tests/*Test.java\` — skeleton TestNG tests

## Notes
Locators are auto-derived (user-facing getByRole/getByLabel/getByText > getByTestId > data-* > #id > class > css). They are a
**reviewed starting point** — confirm the important ones and replace the skeleton assertions with
real behavior. The STLC pipeline maps each page/flow to requirements and fills these tests.
${SS ? `\n## Authenticated run\nThis POM was generated from an authenticated crawl, so the config loads a signed-in session for gated-page tests. Put the \`storageState\` JSON at \`${SS}\` in the TS project (or set \`STORAGE_STATE=/path/to/auth.json\` / the Java env var). If the file is absent, tests run unauthenticated rather than failing.\n` : ''}`;
fs.writeFileSync(path.join(OUT, 'POM-SUMMARY.md'), md);
console.error(`Generated ${tsCount} TS + ${jaCount} Java page objects (${locTotal} locators) into ${OUT}/`);
