'use strict';
/*
 * kpi-report.js — zero-dependency stakeholder KPI dashboard for a Playwright suite.
 *
 * Works for either runner:
 *   --pw    <file>   Playwright JSON report (TypeScript: test-results/results.json)
 *   --junit <dir>    directory scanned recursively for JUnit TEST-*.xml (Java/surefire)
 *   --out   <dir>    output directory (default: ./kpis-out)
 *   --branch <name> --commit <sha> --run-url <url>   optional run metadata
 *
 * Outputs in --out: index.html (self-contained dashboard), kpi-summary.json, kpi-summary.md
 */
const fs = require('fs');
const path = require('path');

function arg(n, d) { const i = process.argv.indexOf('--' + n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; }
const PW = arg('pw', ''); const JUNIT = arg('junit', ''); const OUT = arg('out', 'kpis-out');
const BRANCH = arg('branch', 'local'); const COMMIT = arg('commit', 'local'); const RUN_URL = arg('run-url', '');

// Validated dataviz palette (light/dark safe)
const C = { good: '#0ca30c', warn: '#fab219', crit: '#d03b3b', skip: '#9aa0a6', ink: '#1a1a19', line: '#e5e5e2' };

const suites = {}; // name -> {passed, failed, skipped, flaky, durationMs}
function bucket(name) { return (suites[name] ||= { passed: 0, failed: 0, skipped: 0, flaky: 0, durationMs: 0 }); }

// ---- Playwright JSON -------------------------------------------------------
function parsePlaywright(file) {
  let json; try { json = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return; }
  const walk = (suite, top) => {
    const name = top || (suite.title || 'suite');
    for (const spec of suite.specs || []) {
      const b = bucket(name);
      for (const t of spec.tests || []) {
        const results = t.results || [];
        const statuses = results.map((r) => r.status);
        const final = statuses[statuses.length - 1];
        const dur = results.reduce((s, r) => s + (r.duration || 0), 0);
        b.durationMs += dur;
        if (final === 'passed') { b.passed++; if (statuses.slice(0, -1).includes('failed')) b.flaky++; }
        else if (final === 'skipped' || t.status === 'skipped') b.skipped++;
        else b.failed++;
      }
    }
    for (const child of suite.suites || []) walk(child, name);
  };
  for (const s of json.suites || []) walk(s, s.title);
}

// ---- JUnit surefire XML ----------------------------------------------------
function parseJunitDir(dir) {
  let files = [];
  (function rec(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) rec(p); else if (/^TEST-.*\.xml$/.test(e.name) || e.name.endsWith('.xml')) files.push(p);
  } })(dir);
  for (const f of files) {
    let xml; try { xml = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const sname = (xml.match(/<testsuite[^>]*\bname="([^"]+)"/) || [])[1] || path.basename(f);
    const b = bucket(sname.replace(/^com\.example\./, ''));
    const cases = xml.match(/<testcase\b[\s\S]*?(\/>|<\/testcase>)/g) || [];
    for (const c of cases) {
      const t = parseFloat((c.match(/\btime="([0-9.]+)"/) || [])[1] || '0');
      b.durationMs += t * 1000;
      if (/<skipped/.test(c)) b.skipped++;
      else if (/<failure|<error/.test(c)) b.failed++;
      else b.passed++;
    }
  }
}

if (PW) parsePlaywright(PW);
if (JUNIT) try { parseJunitDir(JUNIT); } catch {}

// ---- totals ----------------------------------------------------------------
const rows = Object.entries(suites).map(([name, s]) => ({ name, ...s, total: s.passed + s.failed + s.skipped }));
const T = rows.reduce((a, s) => ({ passed: a.passed + s.passed, failed: a.failed + s.failed, skipped: a.skipped + s.skipped, flaky: a.flaky + s.flaky, durationMs: a.durationMs + s.durationMs }), { passed: 0, failed: 0, skipped: 0, flaky: 0, durationMs: 0 });
const total = T.passed + T.failed + T.skipped;
const executed = T.passed + T.failed;
const passRate = executed ? Math.round((T.passed / executed) * 100) : 0;
const durationS = (T.durationMs / 1000).toFixed(1);

fs.mkdirSync(OUT, { recursive: true });
const summary = { generatedAt: new Date().toISOString(), branch: BRANCH, commit: COMMIT, runUrl: RUN_URL, total, executed, passRate, ...T, durationS, suites: rows };
fs.writeFileSync(path.join(OUT, 'kpi-summary.json'), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(OUT, 'kpi-summary.md'),
  `# QA KPIs\n\n- Pass rate: **${passRate}%** (${T.passed}/${executed} executed)\n- Total: ${total} · Failed: ${T.failed} · Skipped: ${T.skipped} · Flaky: ${T.flaky}\n- Duration: ${durationS}s\n- Branch \`${BRANCH}\` · commit \`${COMMIT}\`\n`);

// ---- dashboard -------------------------------------------------------------
const donutColor = passRate >= 90 ? C.good : passRate >= 70 ? C.warn : C.crit;
const circ = 2 * Math.PI * 52;
const dash = (passRate / 100) * circ;
const bar = (s) => {
  const t = s.total || 1; const w = (n) => (n / t) * 100;
  return `<div class="bar">
    <span style="width:${w(s.passed)}%;background:${C.good}"></span>
    <span style="width:${w(s.failed)}%;background:${C.crit}"></span>
    <span style="width:${w(s.skipped)}%;background:${C.skip}"></span></div>`;
};
const suiteRows = rows.map((s) => `<tr><td>${s.name}</td><td class="num">${s.total}</td><td>${bar(s)}</td>
  <td class="num" style="color:${C.good}">${s.passed}</td><td class="num" style="color:${C.crit}">${s.failed}</td>
  <td class="num" style="color:${C.skip}">${s.skipped}</td></tr>`).join('');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>QA KPIs</title>
<style>
:root{--ink:${C.ink};--line:${C.line};--bg:#fcfcfb;--card:#fff;--muted:#57606a}
:root:not([data-theme=light]) @media (prefers-color-scheme:dark){}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--ink:#e6e6e3;--line:#2a2a28;--bg:#1a1a19;--card:#232321;--muted:#9aa0a6}}
:root[data-theme=dark]{--ink:#e6e6e3;--line:#2a2a28;--bg:#1a1a19;--card:#232321;--muted:#9aa0a6}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif;padding:24px 16px;max-width:980px;margin:0 auto}
h1{font-size:1.5rem;margin:0 0 2px}.sub{color:var(--muted);margin:0 0 20px;font-size:.9rem}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px}
.hero{grid-column:1/2;display:flex;align-items:center;gap:16px}
.tiles{grid-column:2/4;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.tile .n{font-size:1.8rem;font-weight:700}.tile .l{color:var(--muted);font-size:.8rem}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--line);font-size:.9rem}
th{color:var(--muted);font-weight:600;font-size:.75rem;text-transform:uppercase;letter-spacing:.04em}
.num{text-align:right;font-variant-numeric:tabular-nums}
.bar{display:flex;height:12px;border-radius:6px;overflow:hidden;background:var(--line);min-width:120px}
.legend{display:flex;gap:16px;margin-top:10px;color:var(--muted);font-size:.8rem}
.legend b{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px}
@media(max-width:720px){.grid{grid-template-columns:1fr}.hero,.tiles{grid-column:1}.tiles{grid-template-columns:1fr 1fr 1fr}}
</style></head><body>
<h1>QA Automation — Test KPIs</h1>
<p class="sub">Branch <b>${BRANCH}</b> · commit ${COMMIT} · ${new Date().toUTCString()}</p>
<div class="grid">
  <div class="card hero">
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" stroke-width="12"/>
      <circle cx="60" cy="60" r="52" fill="none" stroke="${donutColor}" stroke-width="12" stroke-linecap="round"
        stroke-dasharray="${dash} ${circ}" transform="rotate(-90 60 60)"/>
      <text x="60" y="58" text-anchor="middle" font-size="26" font-weight="700" fill="var(--ink)">${passRate}%</text>
      <text x="60" y="76" text-anchor="middle" font-size="11" fill="var(--muted)">pass rate</text>
    </svg>
    <div><div style="font-size:1.1rem;font-weight:600">${T.passed}/${executed} executed passed</div>
    <div style="color:var(--muted);font-size:.85rem">${T.skipped} skipped · ${T.flaky} flaky</div></div>
  </div>
  <div class="tiles">
    <div class="card tile"><div class="n">${total}</div><div class="l">Total tests</div></div>
    <div class="card tile"><div class="n" style="color:${C.good}">${T.passed}</div><div class="l">Passed</div></div>
    <div class="card tile"><div class="n" style="color:${C.crit}">${T.failed}</div><div class="l">Failed</div></div>
    <div class="card tile"><div class="n" style="color:${C.skip}">${T.skipped}</div><div class="l">Skipped</div></div>
    <div class="card tile"><div class="n" style="color:${C.warn}">${T.flaky}</div><div class="l">Flaky</div></div>
    <div class="card tile"><div class="n">${durationS}s</div><div class="l">Duration</div></div>
  </div>
</div>
<table><thead><tr><th>Suite</th><th class="num">Tests</th><th>Breakdown</th><th class="num">Pass</th><th class="num">Fail</th><th class="num">Skip</th></tr></thead>
<tbody>${suiteRows || '<tr><td colspan="6" style="color:var(--muted)">No results found — run the suite first.</td></tr>'}</tbody></table>
<div class="legend"><span><b style="background:${C.good}"></b>Passed</span><span><b style="background:${C.crit}"></b>Failed</span><span><b style="background:${C.skip}"></b>Skipped</span></div>
<p class="sub" style="margin-top:16px">Generated by <code>scripts/kpi-report.js</code>. Raw data: <code>kpi-summary.json</code>.${RUN_URL ? ` · <a href="${RUN_URL}">CI run</a>` : ''}</p>
</body></html>`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log(`KPIs: ${T.passed}/${executed} passed (${passRate}%), ${T.failed} failed, ${T.skipped} skipped, ${T.flaky} flaky.`);
console.log(`Wrote ${OUT}/index.html, kpi-summary.json, kpi-summary.md`);
