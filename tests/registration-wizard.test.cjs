const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const form = 'src/features/games/matches/components/RegisterMatchForm.tsx';
const result = 'src/features/games/matches/components/MatchResultFields.tsx';
const me = { id: 'me', userName: 'Author' };
const game = { id: 'game', name: 'Fixture game', imageUrl: 'fixture://cover', minPlayers: 2, maxPlayers: 4 };
const players = [{ id: 'me', username: 'Author', score: '-17', isWinner: true }, { id: 'peer', username: 'Peer', score: '0', isWinner: false }];
const session = { id: 'session', name: 'Private context', status: 'Active', players: [{ userId: 'me', userName: 'Author', status: 'Accepted' }, { userId: 'peer', userName: 'Peer', status: 'Accepted' }, { userId: 'declined', userName: 'Declined', status: 'Declined' }, { userId: 'pending', userName: 'Pending', status: 'Pending' }] };
const states = { 0: session, 2: 2, 3: game, 4: false, 8: players, 23: true, 24: new Date('2026-10-01T14:30:00Z') };
const render = (overrides = {}, options = {}, props = {}) => renderNative(form, 'default', { currentUser: me, sessionId: session.id, ...props }, { ...options, states: { ...states, ...overrides } });

test('four steps keep cover and mode accessible, and review lists names/zero/negatives with correction links', async () => {
  const view = await render({ 2: 3, 9: 'Table', 10: '45', 13: 'Private notes', 14: 'test', 15: ['fixture://photo'] });
  assert.match(view.html, /Jogo.*Jogadores.*Resultado.*Rever/);
  assert.match(view.html, /Fixture game/); assert.match(view.html, /Author.*-17/); assert.match(view.html, /Peer.*0/);
  assert.equal(view.images[0].resizeMode, 'contain');
  for (const [label, step] of [['Corrigir Jogo', 0], ['Corrigir Jogadores', 1], ['Corrigir Resultado', 2], ['Corrigir Detalhes', 2], ['Corrigir Modo', 0]]) {
    await view.press(label); assert.deepEqual(view.updates.filter(([i]) => i === 2).at(-1), [2, step]);
  }
  assert.match(view.html, /Private notes/);
  assert.equal(view.controls.some(c => c.accessibilityLabel === 'Adicionar fotografia'), false);
});

test('every active score is mandatory; blank, decimal, invalid and overflow never reach submit', async () => {
  for (const score of ['', ' ', '1.2', '1,2', 'NaN', '-', '2147483648', '-2147483649']) {
    const view = await render({ 8: [players[0], { ...players[1], score }] });
    await view.press('Rever partida');
    assert.equal(view.updates.some(([i]) => i === 2), false);
    assert.deepEqual(view.updates.find(([i]) => i === 27), [27, true]);
    const guarded = await render({ 2: 3, 8: [players[0], { ...players[1], score }] });
    await guarded.press('Guardar partida'); assert.equal(guarded.calls.some(c => c[0] === 'submitMatch'), false);
  }
});

test('no scores omits all values including invalid saved draft text; toggling preserves raw draft and winner', async () => {
  const view = await render({ 23: false, 8: [players[0], { ...players[1], score: 'unfinished' }] });
  await view.press('Com pontuação'); assert.deepEqual(view.updates.find(([i]) => i === 23), [23, true]);
  assert.equal(view.updates.some(([i]) => i === 8), false);
  const review = await render({ 2: 3, 23: false, 8: [players[0], { ...players[1], score: 'unfinished' }] });
  await review.press('Guardar partida');
  const payload = review.calls.find(c => c[0] === 'submitMatch')[1];
  assert.equal(payload.scoresEnabled, false); assert.ok(payload.players.every(p => p.score === undefined));
  const request = review.load('src/features/games/matches/utils/mapMatchFormToRequest.ts').mapMatchFormToRequest(payload);
  assert.equal(request.playerScores, undefined); assert.equal(request.winnerId, 'me');
  const active = await render(); await active.press('Sem pontuação');
  assert.deepEqual(active.updates.find(([i]) => i === 23), [23, false]);
  assert.equal(active.updates.some(([i]) => i === 8), false);
});

test('manual winner is required even with one competitive player and never follows higher score', async () => {
  const missing = await render({ 8: [{ ...players[0], isWinner: false }] });
  await missing.press('Rever partida'); assert.equal(missing.updates.some(([i]) => i === 2), false);
  const valid = await render({ 2: 3 }); await valid.press('Guardar partida');
  const payload = valid.calls.find(c => c[0] === 'submitMatch')[1];
  assert.equal(payload.winnerId, 'me'); assert.deepEqual(payload.players.map(p => p.score), [-17, 0]);
  assert.equal(payload.matchDate, '2026-10-01T14:30:00.000Z');
});

test('iPhone sign button edits negatives and pending minus without inventing zero or choosing winner', async () => {
  for (const [score, expected] of [['17', '-17'], ['-17', '17'], ['', '-'], ['0', '-0']]) {
    const changes = [];
    const view = await renderNative(result, 'default', { players: [{ ...players[0], score }], onChange: p => changes.push(p), scoresEnabled: true, onScoresEnabled() {}, competitive: true, showErrors: false });
    await view.press('Alterar sinal da pontuação de Author');
    assert.equal(changes[0][0].score, expected); assert.equal(changes[0][0].isWinner, true);
    const input = view.inputs.find(p => p.accessibilityLabel === 'Pontuação de Author');
    assert.equal(input.keyboardType, 'number-pad'); input.onChangeText('');
    assert.equal(changes.at(-1)[0].score, '');
  }
});

test('session selection locks current actor and exposes only accepted participants in a single list', async () => {
  const view = await render({ 2: 1, 8: [players[0]] });
  assert.match(view.html, /a tua presença é obrigatória/);
  assert.equal(view.controls.some(c => c.accessibilityLabel === 'Remover Author'), false);
  assert.equal(view.controls.some(c => c.accessibilityLabel === 'Adicionar Peer'), true);
  for (const name of ['Declined', 'Pending']) assert.equal(view.controls.some(c => c.accessibilityLabel === 'Adicionar ' + name), false);
  assert.equal(view.inputs.some(p => p.accessibilityLabel?.startsWith('Pontuação')), false);
  assert.equal((view.html.match(/Author/g) || []).length, 1);
});

test('optional details and native date controls occur before review; invalid future date and duration block it', async () => {
  const view = await render({ 25: 'date', 26: true });
  assert.equal(view.datePickers.length, 1);
  view.datePickers[0].onChange({}, new Date('2026-10-02T14:30:00Z'));
  assert.equal(view.updates.some(([i]) => i === 24), false);
  await view.press('Concluir');
  assert.equal(view.updates.some(([i]) => i === 24), true);
  assert.deepEqual(view.updates.find(([i]) => i === 25), [25, null]);
  assert.equal(view.inputs.some(p => p.accessibilityLabel?.includes('Duração (minutos)')), true);
  for (const values of [{ 24: new Date(Date.now() + 3600000) }, { 10: '1.5' }, { 10: '-1' }]) {
    const invalid = await render(values); await invalid.press('Rever partida');
    assert.equal(invalid.updates.some(([i]) => i === 2), false); assert.equal(invalid.calls.some(c => c[0] === 'alert'), true);
  }
});

test('keyboard avoidance and scroll remain active with larger text; English contains translated result controls', async () => {
  const view = await render({}, { fontScale: 1.8, width: 320, language: 'en' });
  assert.equal(view.nativeViews.find(([type]) => type === 'keyboard')[1].behavior, 'padding');
  assert.equal(view.nativeViews.find(([type, props]) => type === 'scroll' && props.keyboardShouldPersistTaps === 'handled')[1].keyboardDismissMode, 'on-drag');
  assert.match(view.html, /With scores|Without scores/); assert.doesNotMatch(view.html, /Com pontuação|Rever partida/);
});

test('quick saved confirmation protects the match and retries photos against its existing ID', async () => {
  const match = { id: 'saved', gameId: game.id, gameName: game.name, matchDate: '2026-10-01T14:30:00Z', winnerId: 'me', winnerName: 'Author', players: [{ userId: 'me', userName: 'Author', score: -17 }, { userId: 'peer', userName: 'Peer', score: 0 }] };
  const view = await render({ 17: match, 18: ['failed://photo'] }, { services: { uploadJournalPhoto: undefined } }, { sessionId: undefined });
  assert.equal(view.controls.some(c => c.accessibilityLabel === 'Guardar partida'), false);
  await view.press('Repetir envio das fotografias');
  assert.deepEqual(view.calls.find(c => c[0] === 'uploadJournalPhoto'), ['uploadJournalPhoto', 'saved', 'failed://photo']);
  await view.press('Ver detalhes da partida');
  assert.equal(view.routes[0].params.id, 'saved');
  assert.equal(view.calls.some(c => c[0] === 'submitMatch'), false);
  await view.press('Registar outra partida');
  assert.deepEqual(view.updates.find(([i]) => i === 17), [17, null]);
  assert.deepEqual(view.updates.find(([i]) => i === 8), [8, []]);
});

test('cooperative preview never labels an unselected team result as a defeat', async () => {
  const view = await render({ 2: 3, 6: 'cooperative', 8: players.map(p => ({ ...p, isWinner: false })) });
  assert.match(view.html, /Resultado não definido/); assert.doesNotMatch(view.html, /Equipa perdeu/);
});
