const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const create = 'src/features/games/sessions/screens/CreateSessionScreen.tsx';
const detail = 'src/features/games/sessions/screens/GameSessionDetailScreen.tsx';
const invitations = 'src/features/games/sessions/components/SessionInvitations.tsx';
const future = new Date(Date.now() + 3 * 86400000);
const session = { id: 'session-existing', organizerId: 'me', name: 'Existing session', status: 'Upcoming', players: [
  { userId: 'me', isOrganizer: true, userName: 'Me', status: 1 },
  { userId: 'peer', isOrganizer: false, userName: 'Peer', status: 2 },
], matches: [] };

test('missing selection blocks submission without changing filled fields and shows PT/EN validation', async () => {
  for (const language of ['pt', 'en']) {
    const view = await renderNative(create, 'default', {}, { language, states: { 0: 'Filled name', 1: 'Filled place', 4: future } });
    await view.press(language === 'pt' ? 'Criar Sessão' : 'Create session');
    assert.equal(view.calls.some(c => c[0] === 'createSession'), false);
    assert.equal(view.calls.find(c => c[0] === 'alert')[1], language === 'pt' ? 'Seleciona pelo menos um amigo para criar a sessão' : 'Select at least one friend to create the session');
    assert.deepEqual(view.updates, [[8, true]]);
    const error = await renderNative(create, 'default', {}, { language, states: { 0: 'Filled name', 1: 'Filled place', 4: future, 8: true } });
    assert.ok(error.html.includes(language === 'pt' ? 'Seleciona pelo menos um amigo para criar a sessão' : 'Select at least one friend to create the session'));
    assert.equal(error.inputs[0].value, 'Filled name');
    assert.equal(error.inputs[1].value, 'Filled place');
  }
});

test('no friends explains solo route and has working Friends destination', async () => {
  const view = await renderNative(create, 'default', {}, {});
  assert.match(view.html, /Registar partida → Solo/);
  await view.press('Ir para Amigos');
  assert.equal(view.routes.at(-1), '/(app)/(tabs)/(friends)/people');
});

test('all declined is explicit and the invitation action opens the contextual subpage', async () => {
  const view = await renderNative(invitations, 'default', { session, onInvited: async () => { reloads++; } }, {
    friends: [{ id: 'peer', userName: 'Peer' }, { id: 'new', userName: 'New friend' }], services: { addPlayer: undefined },
  });
  assert.match(view.html, /Todos os convidados recusaram/);
  assert.ok(!view.controls.some(c => c.accessibilityLabel === 'Convidar Peer'));
  await view.press('Convidar amigos');
  assert.deepEqual(view.routes.at(-1), { pathname: '/games/sessions/invite', params: { sessionId: 'session-existing' } });
});

test('pending guests do not show all-declined; invitation selection lives in the subpage', async () => {
  const view = await renderNative(invitations, 'default', { session: { ...session, players: session.players.map(p => ({ ...p, status: p.isOrganizer ? 1 : 0 })) }, onInvited: async () => {} }, { friends: [{ id: 'peer', userName: 'Peer' }] });
  assert.doesNotMatch(view.html, /Todos os convidados recusaram/);
  await view.press('Convidar amigos');
  assert.equal(view.routes.at(-1).params.sessionId, session.id);
});

test('only organizer sees additional invitations on upcoming sessions, including existing solo sessions', async () => {
  for (const [status, owner, shown] of [['Upcoming', 'me', true], ['Upcoming', 'other', false], ['Closed', 'me', false], ['Active', 'me', false]]) {
    const view = await renderNative(detail, 'default', {}, { states: { 0: { ...session, status, organizerId: owner }, 1: false }, stubRegisterForm: true });
    assert.equal(view.html.includes('Convidar amigos'), shown);
  }
  const legacy = await renderNative(detail, 'default', {}, { states: { 0: { ...session, players: [session.players[0]] }, 1: false } });
  assert.match(legacy.html, /Existing session/);
  assert.match(legacy.html, /Cancelar sessão/);
});
