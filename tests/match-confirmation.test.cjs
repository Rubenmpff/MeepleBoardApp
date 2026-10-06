const test = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const form = 'src/features/games/matches/components/RegisterMatchForm.tsx';
const summary = 'src/features/games/matches/components/MatchSummary.tsx';
const me = { id: 'me', userName: 'Author' };
const match = { id: 'saved-match', gameId: 'game', gameName: 'Fixture game', gameImageUrl: 'fixture://cover', matchDate: '2026-10-06T17:00:00Z', durationInMinutes: 45, winnerId: 'me', winnerName: 'Author', players: [{ userId: 'me', userName: 'Author', score: 17 }, { userId: 'peer', userName: 'Participant', score: 0 }] };
const session = { id: 'session', name: 'Fixture session', status: 'Active', players: [{ userId: 'me', userName: 'Author', status: 'Accepted' }] };
const saved = (options = {}, props = {}) => renderNative(form, 'default', { sessionId: session.id, currentUser: me, ...props }, { states: { 0: session, 17: match, ...options.states }, ...options });

test('saved confirmation uses factual names/scores/cover and opens details without exposing the form', async () => {
  let returned = 0;
  const view = await saved({}, { onRegistered: () => returned++ });
  assert.match(view.html, /Partida guardada/);
  assert.match(view.html, /Fixture game/); assert.match(view.html, /Vencedor: Author/);
  assert.match(view.html, /Participant<\/span><\/div><span>0/);
  assert.equal(view.images[0].resizeMode, 'contain');
  assert.equal(view.controls.some(c => c.accessibilityLabel === 'Guardar partida'), false);
  await view.press('Ver detalhes da partida');
  assert.deepEqual(view.routes[0], { pathname: '/games/matches/[id]', params: { id: match.id, originSessionId: session.id } });
  await view.press('Voltar à sessão'); assert.equal(returned, 1);
});

test('failed photos retry only uploads against saved ID and never submit the match again', async () => {
  const view = await saved({ states: { 0: session, 17: match, 18: ['failed://photo'] }, services: { uploadJournalPhoto: undefined } });
  assert.match(view.html, /A partida ficou guardada/);
  await view.press('Repetir envio das fotografias');
  assert.deepEqual(view.calls.find(c => c[0] === 'uploadJournalPhoto'), ['uploadJournalPhoto', match.id, 'failed://photo']);
  assert.equal(view.calls.some(c => c[0] === 'submitMatch'), false);
  assert.deepEqual(view.updates.find(([i]) => i === 18), [18, []]);
});

test('repeated upload failure retains failed URI and saved confirmation; upload blocks navigation', async () => {
  const failed = await saved({ states: { 0: session, 17: match, 18: ['failed://photo'] }, services: { uploadJournalPhoto: new Error('fixture failure') } });
  await failed.press('Repetir envio das fotografias');
  assert.deepEqual(failed.updates.find(([i]) => i === 18), [18, ['failed://photo']]);
  assert.equal(failed.calls.some(c => c[0] === 'submitMatch'), false);
  const busy = await saved({ states: { 0: session, 16: true, 17: match } });
  assert.equal(busy.controls.find(c => c.accessibilityLabel === 'Voltar à sessão').disabled, true);
  assert.equal(busy.controls.find(c => c.accessibilityLabel === 'Ver detalhes da partida').disabled, true);
  assert.equal(busy.guards[0].enabled, true);
});

test('covers keep proportions and switch to neutral placeholder for missing/failed URL', async () => {
  const uri = 'fixture://cover';
  const ready = await renderNative('src/features/games/matches/components/GameCover.tsx', 'default', { uri });
  assert.equal(ready.images[0].resizeMode, 'contain'); ready.images[0].onError();
  assert.deepEqual(ready.updates, [[0, uri]]);
  const failed = await renderNative('src/features/games/matches/components/GameCover.tsx', 'default', { uri }, { states: { 0: uri } });
  assert.equal(failed.images.length, 0);
  const absent = await renderNative('src/features/games/matches/components/GameCover.tsx', 'default', {});
  assert.equal(absent.images.length, 0);
});

test('summary never derives result from scores or solo flag; names and absent scores remain distinct', async () => {
  for (const language of ['pt', 'en']) {
    const view = await renderNative(summary, 'default', { match: { ...match, winnerId: null, winnerName: null, isSoloGame: true, players: [{ userId: 'me', userName: 'Author', score: null }] } }, { language });
    assert.match(view.html, language === 'pt' ? /Resultado não definido/ : /Result not defined/);
    assert.match(view.html, language === 'pt' ? /Não definida/ : /Not defined/);
    const unavailable = await renderNative(summary, 'default', { match: { ...match, winnerName: null } }, { language });
    assert.match(unavailable.html, language === 'pt' ? /Nome do vencedor indisponível/ : /Winner name unavailable/);
  }
});

test('whole session match row opens detail and detail back preserves origin or falls back to session', async () => {
  const view = await renderNative('src/features/games/sessions/screens/GameSessionDetailScreen.tsx', 'default', {}, { states: { 0: { ...session, organizerId: 'me', organizerUserName: 'Author', matches: [match] }, 1: false }, params: { id: session.id } });
  await view.press('Ver detalhes da partida: Fixture game');
  assert.deepEqual(view.routes[0], { pathname: '/games/matches/[id]', params: { id: match.id, originSessionId: session.id } });
  for (const canGoBack of [true, false]) {
    const detail = await renderNative('src/features/games/matches/screens/MatchDetailScreen.tsx', 'default', {}, { states: { 0: match, 1: false }, params: { id: match.id, originSessionId: session.id }, canGoBack });
    await detail.press('Voltar');
    assert.deepEqual(detail.routes[0], canGoBack ? 'back' : ['replace', { pathname: '/games/sessions/[id]', params: { id: session.id } }]);
  }
});

test('double save during in-flight request sends once; failed creation allows retry with unchanged draft', async () => {
  const states = { 0: session, 2: 3, 3: { id: 'game', name: 'Fixture game', minPlayers: 1, maxPlayers: 4 }, 4: false, 8: [{ id: 'me', username: 'Author', score: '0', isWinner: true }] };
  let resolve;
  const response = new Promise(r => { resolve = r; });
  const view = await renderNative(form, 'default', { sessionId: session.id, currentUser: me }, { states, createdMatch: response });
  const first = view.press('Guardar partida');
  await view.press('Guardar partida');
  assert.equal(view.calls.filter(c => c[0] === 'submitMatch').length, 1);
  resolve(match); await first; await view.press('Guardar partida');
  assert.equal(view.calls.filter(c => c[0] === 'submitMatch').length, 1);
  const failed = await renderNative(form, 'default', { sessionId: session.id, currentUser: me }, { states });
  await failed.press('Guardar partida'); await failed.press('Guardar partida');
  assert.equal(failed.calls.filter(c => c[0] === 'submitMatch').length, 2);
  assert.equal(failed.updates.some(([i, v]) => i === 3 && v === null), false);
});

test('initial partial photo failure retains saved response and only failed URIs without recreating match', async () => {
  const view = await renderNative(form, 'default', { sessionId: session.id, currentUser: me }, {
    states: { 0: session, 2: 3, 3: { id: 'game', name: 'Fixture game', minPlayers: 1, maxPlayers: 4 }, 4: false, 8: [{ id: 'me', username: 'Author', score: '0', isWinner: true }], 15: ['ok://photo', 'failed://photo'] }, createdMatch: match,
    services: { uploadJournalPhoto: (_, uri) => { if (uri.startsWith('failed')) throw new Error('fixture failure'); } },
  });
  await view.press('Guardar partida'); await view.press('Guardar partida');
  assert.equal(view.calls.filter(c => c[0] === 'submitMatch').length, 1);
  assert.deepEqual(view.updates.find(([i]) => i === 17), [17, match]);
  assert.deepEqual(view.updates.find(([i]) => i === 18), [18, ['failed://photo']]);
});
