// Each Node test file runs in its own process. Test actual local calendar handling in Lisbon.
process.env.TZ = 'Europe/Lisbon';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const { initialSessionMatchDate, withLocalDay, withLocalTime } = require('../src/features/games/matches/utils/registrationDate.ts');

function localFields(date) { return [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()]; }

test('session day uses local timezone across UTC midnight; match clock does not inherit session start time', () => {
  const now = new Date('2026-07-06T15:25:00Z');
  const session = { scheduledStartDate: '2026-07-02T23:30:00Z', startDate: '2026-06-20T08:00:00Z' };
  const result = initialSessionMatchDate(session, now);
  assert.deepEqual(localFields(result), [2026, 7, 3, 16, 25]);
  assert.equal(result.toISOString(), '2026-07-03T15:25:00.000Z');
  assert.equal(now.toISOString(), '2026-07-06T15:25:00.000Z');
});

test('winter date keeps the independent local clock and serializes using the destination offset', () => {
  const now = new Date('2026-07-06T15:25:00Z');
  const result = initialSessionMatchDate({ scheduledStartDate: '2026-12-02T23:30:00Z' }, now);
  assert.deepEqual(localFields(result), [2026, 12, 2, 16, 25]);
  assert.equal(result.toISOString(), '2026-12-02T16:25:00.000Z');
});

test('changing calendar day preserves drafted time; changing time preserves drafted day', () => {
  const current = new Date('2026-10-06T12:34:00Z');
  const dated = withLocalDay(current, new Date('2026-11-01T01:00:00Z'));
  assert.deepEqual(localFields(dated), [2026, 11, 1, 13, 34]);
  const timed = withLocalTime(dated, new Date('2026-07-02T20:15:00Z'));
  assert.deepEqual(localFields(timed), [2026, 11, 1, 21, 15]);
  assert.equal(timed.toISOString(), '2026-11-01T21:15:00.000Z');
});

test('legacy session date fallback is valid; missing/invalid dates preserve current quick-style initial value', () => {
  const now = new Date('2026-10-06T12:34:00Z');
  assert.equal(initialSessionMatchDate({}, now), now);
  assert.equal(initialSessionMatchDate({ scheduledStartDate: 'invalid', startDate: 'invalid' }, now), now);
  assert.deepEqual(localFields(initialSessionMatchDate({ startDate: '2026-09-01T08:00:00Z' }, now)), [2026, 9, 1, 13, 34]);
});
