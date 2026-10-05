// Run with: node --test tests/playerScores.test.cjs (no extra dependencies).
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};
const { toMatchPlayerDto, parsePlayerScore } = require('../src/features/users/utils/playerMappers.ts');
const { mapMatchFormToRequest } = require('../src/features/games/matches/utils/mapMatchFormToRequest.ts');
const form = (players) => ({ gameId: 'game', gameName: 'Game', matchDate: '2026-01-01', isSoloGame: false, players });

test('mapping preserves individual scores including zero and omits blank scores', () => {
  const players = toMatchPlayerDto([
    { id: 'a', username: 'A', score: '0', isWinner: false },
    { id: 'b', username: 'B', score: '42', isWinner: true },
    { id: 'c', username: 'C', score: '   ', isWinner: false },
  ]);
  const payload = JSON.parse(JSON.stringify(mapMatchFormToRequest(form(players))));
  assert.deepEqual(payload.playerIds, ['a', 'b', 'c']);
  assert.deepEqual(payload.playerScores, [{ userId: 'a', score: 0 }, { userId: 'b', score: 42 }]);
  assert.equal(payload.winnerId, 'b');
});

test('legacy and campaign forms without scores omit the optional field', () => {
  const input = { ...form([{ userId: 'a', isWinner: true }]), campaignId: 'campaign' };
  const payload = JSON.parse(JSON.stringify(mapMatchFormToRequest(input)));
  assert.equal('playerScores' in payload, false);
  assert.equal(payload.campaignSessionId, 'campaign');
});

test('session requests preserve scores through the shared mapping', () => {
  const payload = mapMatchFormToRequest({ ...form([{ userId: 'a', score: 0, isWinner: true }]), sessionId: 'session' });
  assert.equal(payload.gameSessionId, 'session');
  assert.deepEqual(payload.playerScores, [{ userId: 'a', score: 0 }]);
});

test('missing score differs from invalid input; existing int? rules are retained', () => {
  assert.equal(parsePlayerScore(undefined), undefined);
  assert.equal(parsePlayerScore(''), undefined);
  assert.equal(parsePlayerScore(' 0 '), 0);
  assert.equal(parsePlayerScore('2147483647'), 2147483647);
  for (const value of ['abc', 'NaN', 'Infinity', '1.5', '-1', '2147483648']) {
    assert.throws(() => parsePlayerScore(value), /pontuação/);
  }
});

test('mapping rejects invalid numeric scores before JSON can turn NaN into null', () => {
  for (const score of [NaN, Infinity, 1.5, -1, 2147483648]) {
    assert.throws(() => mapMatchFormToRequest(form([{ userId: 'a', score, isWinner: true }])), /pontuação/);
  }
});

test('mapping rejects a score without a participant id', () => {
  assert.throws(() => mapMatchFormToRequest(form([{ userId: ' ', score: 0, isWinner: false }])), /participante/);
});
