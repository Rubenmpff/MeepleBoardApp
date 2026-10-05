const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const form = 'src/features/games/matches/components/RegisterMatchForm.tsx';
const journal = 'src/features/games/journal/screens/MatchJournalScreen.tsx';
const detail = 'src/features/games/matches/screens/MatchDetailScreen.tsx';
const pending = 'src/features/games/matches/screens/PendingJournalScreen.tsx';
const selector = 'src/features/users/components/PlayerSelector.tsx';
const me = { id: 'me', userName: 'Test player' };
const game = { id: 'game-id', name: 'Test-only game', minPlayers: 1, maxPlayers: 4 };
const players = [{ id: 'me', username: 'Test player', score: '0', isWinner: true }, { id: 'other', username: 'Other player', score: '', isWinner: false }];
const match = { id: 'match-id', gameId: game.id, gameName: game.name, matchDate: '2026-09-01', players: [{ userId: 'me', userName: me.userName, score: 0, isWinner: true }, { userId: 'other', userName: 'Other player' }], journalStatus: 'Open' };
const formStates = { 2: 3, 3: game, 4: false, 8: players };
const submit = async (states = {}, props = {}, options = {}) => renderNative(form, 'default', { currentUser: me, ...props }, { states: { ...formStates, ...states }, ...options });

test('registration preserves zero and absent scores, winner, expansion and optional details', async () => {
  const view = await submit({ 5: [{ id: 'exp', bggId: 123, name: 'Test expansion' }], 9: ' Table ', 10: '45', 11: ' Summary ', 12: 7.5, 13: ' Notes ', 14: ' tag ' });
  await view.press('Guardar partida');
  const payload = view.calls.find(c => c[0] === 'submitMatch')[1];
  assert.equal(payload.players[0].score, 0);
  assert.equal(payload.players[1].score, undefined);
  assert.equal(payload.winnerId, 'me');
  assert.deepEqual(payload.expansions, [{ bggId: 123, name: 'Test expansion' }]);
  assert.equal(payload.durationInMinutes, 45);
  assert.equal(payload.location, 'Table');
  assert.equal(payload.personalRating, 7.5);
  assert.equal(payload.notes, 'Notes');
  const mapper = view.load('src/features/games/matches/utils/mapMatchFormToRequest.ts').mapMatchFormToRequest;
  assert.deepEqual(mapper(payload).playerScores, [{ userId: 'me', score: 0 }]);
});

test('invalid score is reported before submitting; existing negative-score limitation remains', async () => {
  for (const score of ['abc', '1.2', '-1']) {
    const view = await submit({ 8: [{ ...players[0], score }] });
    await view.press('Guardar partida');
    assert.equal(view.calls.some(c => c[0] === 'submitMatch'), false);
    assert.equal(view.calls.some(c => c[0] === 'alert'), true);
  }
});

test('solo and cooperative submissions retain existing winner rules', async () => {
  const solo = await submit({ 6: 'solo', 7: 'player_win', 8: [players[0]] });
  await solo.press('Guardar partida');
  assert.equal(solo.calls.find(c => c[0] === 'submitMatch')[1].winnerId, 'me');
  assert.equal(solo.calls.find(c => c[0] === 'submitMatch')[1].isSoloGame, true);
  const coop = await submit({ 6: 'cooperative' });
  await coop.press('Guardar partida');
  assert.equal(coop.calls.find(c => c[0] === 'submitMatch')[1].winnerId, undefined);
});

test('inline session form retains session id and accepted participants', async () => {
  const session = { id: 'session-id', status: 'Active', players: [{ userId: 'me', userName: me.userName, status: 'Accepted' }] };
  const view = await submit({ 0: session }, { sessionId: 'session-id', disableScroll: true });
  await view.press('Guardar partida');
  assert.equal(view.calls.find(c => c[0] === 'submitMatch')[1].sessionId, 'session-id');
});

test('step continuation retains game and player requirements', async () => {
  const initial = await renderNative(form, 'default', { currentUser: me });
  assert.equal(initial.controls.find(c => c.accessibilityLabel === 'Continuar').disabled, true);
  const noPlayers = await submit({ 2: 2, 8: [] });
  assert.equal(noPlayers.controls.find(c => c.accessibilityLabel === 'Continuar').disabled, true);
  const selected = await submit({ 2: 2 });
  await selected.press('Continuar');
  assert.deepEqual(selected.updates.find(c => c[0] === 2), [2, 3]);
});

test('player score editing retains raw zero and blank values and current-player lock', async () => {
  const changes = [];
  const view = await renderNative(selector, 'default', { users: [], players, currentUser: me, onChange: next => changes.push(next) });
  const score = view.inputs.find(p => p.accessibilityLabel === 'Pontuação de Test player (opcional)');
  score.onChangeText('0');
  score.onChangeText('');
  assert.equal(changes[0][0].score, '0');
  assert.equal(changes[1][0].score, '');
  assert.equal(view.controls.some(c => c.accessibilityLabel === 'Remover Test player'), false);
  await view.press('Marcar Other player como vencedor');
  assert.deepEqual(changes.at(-1).map(p => p.isWinner), [false, true]);
});

test('session player selection permits removal; suggestions exclude selected players', async () => {
  const changes = [];
  const view = await renderNative(selector, 'default', { users: [me, { id: 'new', userName: 'New player' }], players, currentUser: me, mode: 'session', onChange: next => changes.push(next) });
  assert.equal(view.controls.some(c => c.accessibilityLabel === 'Adicionar Test player'), false);
  await view.press('Adicionar New player');
  assert.equal(changes.at(-1).at(-1).score, '');
  await view.press('Remover Test player');
  assert.equal(changes.at(-1).some(p => p.id === 'me'), false);
});

test('match details display zero, omit absent scores and preserve game navigation', async () => {
  const view = await renderNative(detail, 'default', {}, { states: { 0: match, 1: false } });
  assert.match(view.html, /0 pts/);
  assert.equal((view.html.match(/ pts/g) || []).length, 1);
  await view.press('Ver jogo');
  assert.equal(view.routes[0].params.id, game.id);
  await view.press('Voltar');
  assert.equal(view.routes[1], 'back');
});

test('pending list preserves journal destination and separates error from empty', async () => {
  const view = await renderNative(pending, 'default', {}, { states: { 0: [match], 1: false } });
  await view.press('Avaliar esta partida: ' + game.name);
  assert.equal(view.routes[0], '/(app)/games/matches/match-id/journal');
  const empty = await renderNative(pending, 'default', {}, { states: { 1: false } });
  assert.match(empty.html, /Tudo em dia/);
  const error = await renderNative(pending, 'default', {}, { states: { 1: false, 3: true }, services: { getPendingJournalMatches: [] } });
  assert.doesNotMatch(error.html, /Tudo em dia/);
  await error.press('Tentar novamente');
  assert.equal(error.calls.some(c => c[0] === 'getPendingJournalMatches'), true);
  assert.deepEqual(error.updates.find(c => c[0] === 3), [3, false]);
});

test('detail and journal retry preserve service calls and show load failures separately', async () => {
  const details = await renderNative(detail, 'default', {}, { states: { 1: false, 3: true }, services: { getById: new Error('test-only failure') } });
  assert.match(details.html, /Não foi possível carregar/);
  assert.doesNotMatch(details.html, /Partida não encontrada/);
  await details.press('Tentar novamente');
  assert.deepEqual(details.updates.filter(c => c[0] === 3), [[3, false], [3, true]]);
  const diary = await renderNative(journal, 'default', {}, { states: { 2: false, 8: true }, services: { getById: match, getJournalEntries: [] } });
  await diary.press('Tentar novamente');
  assert.deepEqual(diary.updates.find(c => c[0] === 0), [0, match]);
  assert.deepEqual(diary.updates.find(c => c[0] === 8), [8, false]);
});

test('journal zero remains saveable and existing half-rating rounding is unchanged', async () => {
  for (const rating of [0, 7.5]) {
    const view = await renderNative(journal, 'default', {}, { states: { 0: match, 2: false, 4: rating, 5: ' Notes ', 6: ' tag ' }, services: { upsertJournalEntry: undefined } });
    await view.press('Guardar avaliação');
    assert.deepEqual(view.calls.find(c => c[0] === 'upsertJournalEntry')[2], { personalRating: Math.round(rating), notes: 'Notes', tags: 'tag' });
  }
  const unrated = await renderNative(journal, 'default', {}, { states: { 0: match, 2: false } });
  assert.equal(unrated.controls.find(c => c.accessibilityLabel === 'Guardar avaliação').disabled, true);
});

test('half-star and whole-star controls keep toggle-to-zero behaviour and large touch areas', async () => {
  const changes = [];
  const view = await renderNative('src/shared/components/StarRating.tsx', 'StarRating', { value: 4.5, appearance: 'refresh', onChange: v => changes.push(v) });
  assert.equal(view.controls.length, 20);
  await view.controls[8].onPress();
  await view.controls[9].onPress();
  assert.deepEqual(changes, [0, 5]);
  assert.equal(view.controls[8].style[1].width, 50);
  assert.equal(view.controls[8].style[1].height, 64);
});

test('registration queues photos and uploads only after match creation', async () => {
  const view = await submit({ 15: ['test-only-uri'] }, {}, { createdMatch: { id: 'created' }, services: { uploadJournalPhoto: undefined } });
  await view.press('Guardar partida');
  assert.deepEqual(view.calls.filter(c => c[0] === 'uploadJournalPhoto'), [['uploadJournalPhoto', 'created', 'test-only-uri']]);
  assert.ok(view.calls.findIndex(c => c[0] === 'submitMatch') < view.calls.findIndex(c => c[0] === 'uploadJournalPhoto'));
});

test('photo permission denial and picker cancellation never upload', async () => {
  for (const options of [{ photoPermission: false }, { photoResult: { canceled: true } }]) {
    const view = await renderNative(journal, 'default', {}, { states: { 0: match, 2: false }, ...options });
    await view.press('Adicionar fotografia');
    assert.equal(view.calls.some(c => c[0] === 'uploadJournalPhoto'), false);
  }
});

test('journal photo selection uploads the picked URI and refreshes existing entries', async () => {
  const view = await renderNative(journal, 'default', {}, { states: { 0: match, 2: false },
    photoResult: { canceled: false, assets: [{ uri: 'test-only-picked-photo' }] },
    services: { uploadJournalPhoto: undefined, getById: match, getJournalEntries: [] } });
  await view.press('Adicionar fotografia');
  assert.deepEqual(view.calls.find(c => c[0] === 'uploadJournalPhoto'), ['uploadJournalPhoto', 'game-id', 'test-only-picked-photo']);
  assert.equal(view.calls.some(c => c[0] === 'getJournalEntries'), true);
});

test('journal photo cap and confirmed removal preserve existing behaviour', async () => {
  const entries = [{ id: 'entry', userId: 'me', userName: me.userName, photoUrls: ['1', '2', '3', '4', '5'] }];
  const view = await renderNative(journal, 'default', {}, { states: { 0: match, 1: entries, 2: false }, services: { removeJournalPhoto: undefined, getJournalEntries: entries } });
  assert.equal(view.controls.some(c => c.accessibilityLabel === 'Adicionar fotografia'), false);
  await view.press('Remover fotografia');
  assert.equal(view.calls.some(c => c[0] === 'removeJournalPhoto'), false);
  const confirm = view.calls.find(c => c[0] === 'alert')[3].find(b => b.style === 'destructive');
  await confirm.onPress();
  assert.deepEqual(view.calls.find(c => c[0] === 'removeJournalPhoto'), ['removeJournalPhoto', 'game-id', '1']);
});

test('new screen and selector strings are translated in English', async () => {
  const view = await renderNative(journal, 'default', {}, { states: { 0: match, 2: false }, language: 'en' });
  assert.match(view.html, /Match journal/);
  assert.match(view.html, /Save review/);
  assert.doesNotMatch(view.html, /Guardar|Adicionar|Notas|Fotografias/);
  const selection = await renderNative(selector, 'default', { users: [], players: [], onChange() {} }, { language: 'en' });
  assert.match(selection.html, /Add players/);
});
