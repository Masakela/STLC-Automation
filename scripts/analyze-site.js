#!/usr/bin/env node
/*
 * analyze-site.js — crawl a website and produce a structured inventory (site-map.json)
 * that the STLC pipeline turns into requirements, test cases, and a complete Page Object Model.
 *
 * Same-origin only, bounded by --max-pages / --max-depth, polite (--delay). It visits each
 * page, enumerates interactive elements, and derives a STABLE locator for each using a
 * resilient-first hierarchy chosen to minimise flaky tests:
 *     data-testid  >  other data-* attribute  >  #id  >  semantic class  >  CSS
 * (test hooks and ids survive refactors; class/CSS are the fallback). Emitted in BOTH
 * TypeScript and Java Playwright form. Override the order with --locator-order.
 *
 * Usage:
 *   node analyze-site.js <url> [--max-pages 25] [--max-depth 2] [--delay 300]
 *                        [--locator-order testid,data,id,class,css] [--out site-map.json]
 *
 * Only crawl sites you own or have permission to test.
 */
'use strict';
let pw; try { pw = require('@playwright/test'); } catch (e) { pw = require('playwright'); }
const { chromium } = pw;
const fs = require('fs');

function arg(n, d) { const i = process.argv.indexOf('--' + n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; }
const START = process.argv[2];
if (!START || START.startsWith('--')) { console.error('Usage: node analyze-site.js <url> [--max-pages N] [--max-depth D] [--delay MS] [--out FILE]'); process.exit(1); }
const MAX_PAGES = parseInt(arg('max-pages', '25'), 10);
const MAX_DEPTH = parseInt(arg('max-depth', '2'), 10);
const DELAY = parseInt(arg('delay', '300'), 10);
const OUT = arg('out', 'site-map.json');
const ORIGIN = new URL(START).origin;

const norm = (u) => { try { const x = new URL(u, ORIGIN); x.hash = ''; return x.href.replace(/\/$/, '') || x.origin; } catch (e) { return null; } };
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const jesc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
// Locator hierarchy (resilient-first, to minimise flaky tests). Tiers, in order:
//   testid  -> data-testid / data-test / data-test-id  (getByTestId)
//   data    -> any other data-* attribute              [data-x="v"]
//   id      -> #id
//   class   -> tag.semanticClass(es)                    (utility/hashed classes skipped)
//   css     -> [name="v"]  >  tag:has-text("…")  >  tag[type]   (always addresses something)
// Override order (or drop a tier) with --locator-order, e.g. --locator-order testid,id,data,class,css
const ORDER = arg('locator-order', 'testid,data,id,class,css').split(',').map((s) => s.trim()).filter(Boolean);
const UTIL_CLASS = /^(is-|has-|js-|active|open|show|hide|hidden|selected|disabled|focus|hover|ng-|v-|svelte-|css-[0-9a-z]{3,}|sc-[0-9a-z]+|[a-z]+-\d+)$/i;
const semanticClasses = (cs) => (cs || []).filter((c) => /^[a-zA-Z][\w-]{2,}$/.test(c) && !UTIL_CLASS.test(c) && !/[0-9a-f]{6,}/i.test(c));
const mk = (strategy, ts, java) => ({ strategy, ts, java });

function tier(kind, e) {
  const nm = (e.text || '').trim().slice(0, 50);
  if (kind === 'testid') return e.testid ? mk('testid', `getByTestId('${esc(e.testid)}')`, `getByTestId("${jesc(e.testid)}")`) : null;
  if (kind === 'data') {
    const k = Object.keys(e.dataAttrs || {}).find((x) => !['data-testid', 'data-test', 'data-test-id'].includes(x));
    if (!k) return null;
    const sel = e.dataAttrs[k] ? `[${k}="${e.dataAttrs[k]}"]` : `[${k}]`;
    return mk('data-attr', `locator('${esc(sel)}')`, `locator("${jesc(sel)}")`);
  }
  if (kind === 'id') return e.id ? mk('id', `locator('#${esc(e.id)}')`, `locator("#${jesc(e.id)}")`) : null;
  if (kind === 'class') {
    const cls = semanticClasses(e.classes);
    if (!cls.length) return null;
    const sel = (e.tag || '') + '.' + cls.slice(0, 2).join('.');
    return mk('class', `locator('${esc(sel)}')`, `locator("${jesc(sel)}")`);
  }
  if (kind === 'css') {
    if (e.name) return mk('css-name', `locator('[name="${esc(e.name)}"]')`, `locator("[name=\\"${jesc(e.name)}\\"]")`);
    if (nm && (e.tag === 'a' || e.tag === 'button')) {
      const sel = `${e.tag}:has-text("${nm.replace(/"/g, '\\"')}")`;
      return mk('css-text', `locator('${esc(sel)}')`, `locator("${jesc(sel)}")`);
    }
    const sel = e.tag + (e.type ? `[type="${e.type}"]` : '');
    return mk('css', `locator('${esc(sel)}')`, `locator("${jesc(sel)}")`);
  }
  return null;
}
// Walk the configured hierarchy; first tier that addresses the element wins.
function locators(e) {
  for (const kind of ORDER) { const r = tier(kind, e); if (r) return r; }
  return null;
}

const camel = (s) => {
  const w = String(s).replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!w.length) return 'el';
  return w.map((x, i) => i === 0 ? x.toLowerCase() : x[0].toUpperCase() + x.slice(1).toLowerCase()).join('').slice(0, 40);
};
const pascal = (s) => { const c = camel(s); return c[0].toUpperCase() + c.slice(1); };
function fieldName(e, loc) {
  const isForm = e.role === 'textbox' || e.role === 'combobox' || e.role === 'checkbox' || e.role === 'radio';
  const src = isForm ? (e.labelText || e.placeholder || e.name || e.text) : (e.text || e.labelText || e.name || e.id);
  const base = camel(src || e.role || 'el');
  const suffix = e.role === 'link' ? 'Link' : e.role === 'button' ? 'Button' : e.role === 'checkbox' ? 'Checkbox'
    : e.role === 'combobox' ? 'Select' : (e.role === 'textbox') ? 'Input' : 'El';
  return base.toLowerCase().endsWith(suffix.toLowerCase()) ? base : base + suffix;
}
function pageName(pathname, title) {
  let n = pathname.replace(/^\/|\/$/g, '').replace(/\.(html?|php|aspx?)$/i, '');
  if (!n) return 'Home';
  return pascal(n.replace(/\//g, ' ')) || pascal(title) || 'Page';
}

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  const queue = [{ url: norm(START), depth: 0 }];
  const visited = new Set();
  const usedPageNames = {};
  const pages = [];

  while (queue.length && pages.length < MAX_PAGES) {
    const { url, depth } = queue.shift();
    if (!url || visited.has(url)) continue;
    visited.add(url);
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }); await page.waitForTimeout(DELAY); }
    catch (e) { console.error('  skip (load failed):', url, '-', e.message); continue; }

    const raw = await page.evaluate(() => {
      const accText = (el) => (el.getAttribute('aria-label') || '').trim()
        || (el.textContent || '').trim().slice(0, 60);
      const labelText = (el) => {
        if (el.labels && el.labels[0]) return el.labels[0].textContent.trim();
        const id = el.id; if (id) { const l = document.querySelector('label[for="' + CSS.escape(id) + '"]'); if (l) return l.textContent.trim(); }
        return '';
      };
      const out = []; const seen = new Set();
      const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=tab], [role=checkbox], [role=combobox], [role=textbox]';
      document.querySelectorAll(sel).forEach((el) => {
        const tag = el.tagName.toLowerCase();
        const type = (el.getAttribute('type') || '').toLowerCase();
        let role = el.getAttribute('role') || '';
        if (!role) role = tag === 'a' ? 'link' : tag === 'button' ? 'button'
          : (tag === 'input' && ['button', 'submit', 'reset'].includes(type)) ? 'button'
          : tag === 'select' ? 'combobox' : (tag === 'input' && type === 'checkbox') ? 'checkbox'
          : (tag === 'input' && type === 'radio') ? 'radio' : (tag === 'input' || tag === 'textarea') ? 'textbox' : '';
        const dataAttrs = {};
        for (let i = 0; i < el.attributes.length; i++) { const a = el.attributes[i]; if (a.name.indexOf('data-') === 0) dataAttrs[a.name] = a.value; }
        const rec = {
          tag, type, role,
          testid: dataAttrs['data-testid'] || dataAttrs['data-test'] || dataAttrs['data-test-id'] || '',
          dataAttrs,
          classes: Array.from(el.classList),
          id: el.id || '', name: el.getAttribute('name') || '',
          placeholder: el.getAttribute('placeholder') || '',
          labelText: labelText(el), text: accText(el),
          href: tag === 'a' ? (el.getAttribute('href') || '') : '',
        };
        const key = [rec.tag, rec.type, rec.role, rec.testid, rec.id, rec.name, rec.text, rec.href].join('|');
        if (seen.has(key)) return; seen.add(key);
        out.push(rec);
      });
      return { title: document.title, elements: out };
    });

    const u = new URL(url);
    let pn = pageName(u.pathname, raw.title);
    usedPageNames[pn] = (usedPageNames[pn] || 0) + 1;
    if (usedPageNames[pn] > 1) pn = pn + usedPageNames[pn];

    const usedFields = {};
    const elements = [];
    for (const e of raw.elements) {
      const loc = locators(e);
      if (!loc) continue;
      let fn = fieldName(e, loc);
      usedFields[fn] = (usedFields[fn] || 0) + 1;
      if (usedFields[fn] > 1) fn = fn + usedFields[fn];
      elements.push({ field: fn, role: e.role, text: (e.text || e.labelText || e.placeholder || '').slice(0, 60), strategy: loc.strategy, ts: loc.ts, java: loc.java });
    }

    pages.push({ name: pn, url, path: u.pathname || '/', title: raw.title, elementCount: elements.length, elements });
    console.error(`  [${pages.length}] ${u.pathname || '/'}  (${elements.length} locators)  -> ${pn}Page`);

    if (depth < MAX_DEPTH) {
      for (const e of raw.elements) {
        if (!e.href) continue;
        const nu = norm(e.href);
        if (nu && nu.startsWith(ORIGIN) && !visited.has(nu) && !queue.some((q) => q.url === nu)) queue.push({ url: nu, depth: depth + 1 });
      }
    }
  }
  await browser.close();
  const map = { startUrl: START, origin: ORIGIN, generatedAt: new Date().toISOString(), pageCount: pages.length, pages };
  fs.writeFileSync(OUT, JSON.stringify(map, null, 2));
  console.error(`\nWrote ${OUT} — ${pages.length} page(s), ${pages.reduce((s, p) => s + p.elementCount, 0)} locators.`);
})().catch((e) => { console.error('fatal:', e.message); process.exit(1); });
