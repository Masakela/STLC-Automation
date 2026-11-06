#!/usr/bin/env node
/*
 * generate-pom.js — turn site-map.json (from analyze-site.js) into a complete Page Object
 * Model + skeleton tests, in BOTH TypeScript (@playwright/test) and Java (Playwright + TestNG).
 *
 * Usage: node generate-pom.js [--map site-map.json] [--out generated-pom] [--max-locators 40]
 *
 * The generated page objects are a reviewed starting point: locators are auto-derived and the
 * test bodies are skeletons (visibility checks + TODOs) — a QA engineer refines the assertions.
 */
'use strict';
const fs = require('fs');
const path = require('path');
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; }
const MAP = arg('map', 'site-map.json');
const OUT = arg('out', 'generated-pom');
const MAXLOC = parseInt(arg('max-locators', '40'), 10);

const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
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
    page = browser.newContext(new Browser.NewContextOptions().setBaseURL("${map.origin}")).newPage();
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
fs.writeFileSync(path.join(OUT, 'ts', 'playwright.config.ts'),
`import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: process.env.APP_BASE_URL || '${map.origin}' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
`);
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
`;
fs.writeFileSync(path.join(OUT, 'POM-SUMMARY.md'), md);
console.error(`Generated ${tsCount} TS + ${jaCount} Java page objects (${locTotal} locators) into ${OUT}/`);
