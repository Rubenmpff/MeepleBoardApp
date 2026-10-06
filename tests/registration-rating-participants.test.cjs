const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const form = 'src/features/games/matches/components/RegisterMatchForm.tsx';
const me = { id: 'me', userName: 'Author' };
const players = [{ id: 'me', username: 'Author', score: '-17', isWinner: true }, { id: 'peer', username: 'Peer', score: '0', isWinner: false }];
const session = { id: 'session', status: 'Active', name: 'Test', players: players.map(p => ({ userId: p.id, userName: p.username, status: 'Accepted' })) };
const baseline = { 0: session, 2: 3, 3: { id: 'game', name: 'Test', minPlayers: 2, maxPlayers: 4 }, 4: false, 8: players, 12: 7.5, 23: true };
const render = (states = {}, props = {}, options = {}) => renderNative(form, 'default', { currentUser: me, ...props }, { ...options, states: { ...baseline, ...states } });
test('competitive one player or repeated ID cannot save in quick or session; mode stays unchanged', async () => {
  for (const props of [{}, { sessionId: session.id }]) for (const selected of [[players[0]], [players[0], players[0]]]) {
    const view = await render({ 8: selected }, props);
    await view.press('Guardar partida');
    assert.equal(view.calls.some(c => c[0] === 'submitMatch'), false);
    assert.match(view.calls.find(c => c[0] === 'alert')[2], /dois participantes distintos/);
    assert.equal(view.updates.some(([i]) => i === 6), false);
    assert.deepEqual(view.updates.find(([i]) => i === 2), [2, 1]);
  }
});
test('one-player hint offers explicit mode choice in quick only; session Solo is disabled and guarded', async () => {
  const quick = await render({ 2: 1, 8: [players[0]] });
  await quick.press('Escolher modo de jogo'); assert.deepEqual(quick.updates.find(([i]) => i === 2), [2, 0]);
  const within = await render({ 2: 1, 8: [players[0]] }, { sessionId: session.id });
  assert.match(within.html, /participante confirmado/);
  assert.equal(within.controls.some(c => c.accessibilityLabel === 'Escolher modo de jogo'), false);
  const modes = await render({ 2: 0 }, { sessionId: session.id });
  assert.equal(modes.controls.find(c => c.accessibilityLabel === 'Solo').disabled, true);
  const blocked = await render({ 6: 'solo', 8: [players[0]] }, { sessionId: session.id });
  await blocked.press('Guardar partida'); assert.equal(blocked.calls.some(c => c[0] === 'submitMatch'), false);
});
test('rating is required outside optional fields, and missing/invalid ratings never save', async () => {
  const result = await render({ 2: 2, 26: false });
  assert.match(result.html, /A tua avaliação · obrigatória/); assert.match(result.html, /Cada pessoa avalia/);
  for (const rating of [undefined, null, NaN, -.5, 10.5, 7.25]) {
    const view = await render({ 12: rating }); await view.press('Guardar partida');
    assert.equal(view.calls.some(c => c[0] === 'submitMatch'), false);
  }
});
test('zero/halves are reviewed and submitted only as own rating; failed save preserves rating and retry payload', async () => {
  for (const rating of [0, .5, 7.5, 10]) {
    const view = await render({ 12: rating }, {}, { submitError: new Error('offline') });
    assert.match(view.html, new RegExp(`${rating}/10`));
    await view.press('Guardar partida'); await view.press('Guardar partida');
    const submits = view.calls.filter(c => c[0] === 'submitMatch');
    assert.equal(submits.length, 2); assert.equal(submits[0][1].personalRating, rating);
    assert.equal(submits[0][1].players.some(p => 'personalRating' in p), false);
    assert.equal(view.updates.some(([i]) => i === 12), false);
    assert.deepEqual(submits[0][1], submits[1][1]);
  }
});
test('stars expose whole points and explicit zero with half-point adjustments', async () => {
  const changes = [];
  const view = await renderNative('src/features/games/matches/components/MatchRatingField.tsx', 'default', { value: 7.5, onChange: value => changes.push(value) });
  await view.press('Avaliar com 7 de 10'); await view.press('Avaliar com 0 de 10'); await view.press('Diminuir avaliação');
  assert.deepEqual(changes, [7, 0, 7]); assert.match(view.html, /★/);
});

 test('shared diary stars distinguish explicit zero from an absent rating', async () => {
  for (const readonly of [true, false]) {
    const zero = await renderNative('src/shared/components/StarRating.tsx', 'StarRating', { value: 0, readonly, appearance: 'refresh' });
    assert.match(zero.html, /0.0\/10/); assert.match(zero.html, /Avaliação zero/);
    assert.doesNotMatch(zero.html, /Toca.*avaliar/);
  }
  const empty = await renderNative('src/shared/components/StarRating.tsx', 'StarRating', { appearance: 'refresh' });
  assert.doesNotMatch(empty.html, /0.0\/10|Avaliação zero/);
});
