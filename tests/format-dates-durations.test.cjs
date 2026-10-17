// Dates and durations look the same on every screen, in PT (pt-PT) and EN (en-GB). Real module, no network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve('src/ui/format.ts');
const mod = new Module(filename);
mod.require = id => { throw new Error('Unexpected dependency: ' + id); };
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const f = mod.exports;
const day = new Date(2026, 9, 7, 9, 49);

test('durations: one format everywhere, numbers in the language', () => {
  for (const lang of ['pt', 'en']) {
    assert.equal(f.formatDuration(0, lang), '0 min');
    assert.equal(f.formatDuration(48, lang), '48 min');
    assert.equal(f.formatDuration(120, lang), '2 h');
    assert.equal(f.formatDuration(65, lang), '1 h 05 min');
  }
  assert.equal(f.formatDuration(1234 * 60 + 5, 'en'), '1,234 h 05 min');
});

test('dates: day, short month and year composed, never «10/2026»', () => {
  assert.equal(f.formatDate(day, 'pt'), '7 out. 2026');
  assert.equal(f.formatDate(day, 'en'), '7 Oct 2026');
  assert.equal(f.formatDayMonth(day, 'pt'), '7 out.');
  assert.equal(f.formatDayMonth(day, 'en'), '7 Oct');
  assert.equal(f.formatMonthYear(day, 'pt', 'short'), 'out. 2026');
  assert.equal(f.formatMonthYear(day, 'en', 'short'), 'Oct 2026');
  assert.equal(f.formatMonthYear(day, 'pt'), 'outubro de 2026');
  assert.equal(f.formatMonthYear(day, 'en'), 'October 2026');
  for (const text of [f.formatDate(day, 'pt'), f.formatMonthYear(day, 'en', 'short')]) assert.doesNotMatch(text, /\d+\/\d{4}/);
});

test('a given time zone decides the day (statistics periods)', () => {
  const late = '2026-10-07T23:30:00Z';
  assert.equal(f.formatDate(late, 'pt', 'UTC'), '7 out. 2026');
  assert.equal(f.formatDate(late, 'pt', 'Europe/Lisbon'), '8 out. 2026');
  assert.equal(f.formatDate(late, 'en', 'America/New_York'), '7 Oct 2026');
});
