const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const { renderNative } = require('./helpers/renderNative.cjs');
const base = 'src/features/games/sessions/';
const selector = base + 'components/FriendSelector.tsx';
const screen = base + 'screens/InviteSessionFriendsScreen.tsx';
const session = { id: 'session', name: 'Session real fixture', organizerId: 'me', status: 'Upcoming', players: [
  { userId: 'me', userName: 'Me', isOrganizer: true, status: 1 },
  { userId: 'old', userName: 'Old friend', isOrganizer: false, status: 2 },
], matches: [] };
const friends = [{ id: 'good', userName: 'José' }, { id: 'bad', userName: 'Ana' }, { id: 'old', userName: 'Old friend' }];
const moduleFixture = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(base + 'utils/sendSessionInvitations.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { module: moduleFixture, exports: moduleFixture.exports });
const batch = moduleFixture.exports.sendSessionInvitations;
const plain = value => JSON.parse(JSON.stringify(value));

test('friend search ignores accents, retains selected summary and supports removing hidden selections', async () => {
  let selected;
  const props = { friends, loading: false, selectedIds: ['bad'], onChange: ids => selected = ids, onRetry() {}, onFriends() {}, emptyMessage: 'Empty' };
  const view = await renderNative(selector, 'default', props, { states: { 0: 'jose' } });
  assert.match(view.html, /José/);
  assert.match(view.html, /Ana/);
  assert.ok(!view.controls.some(c => c.accessibilityLabel === 'Selecionar Old friend para convite'));
  await view.press('Selecionar José para convite');
  assert.deepEqual(selected, ['bad', 'good']);
  await view.press('Remover Ana da seleção');
  assert.deepEqual(selected, []);
});

test('already invited or declined friends are visible but locked; no results differs from no friends', async () => {
  const props = { friends, loading: false, selectedIds: [], onChange() { throw Error('Locked friend selected'); }, onRetry() {}, onFriends() {}, emptyMessage: 'No friends available', unavailable: { old: 'Recusado' } };
  const view = await renderNative(selector, 'default', props);
  await assert.rejects(view.press('Old friend: Recusado'), /Disabled button/);
  const emptySearch = await renderNative(selector, 'default', props, { states: { 0: 'zzzz' } });
  assert.match(emptySearch.html, /Nenhum amigo corresponde/);
  assert.doesNotMatch(emptySearch.html, /No friends available/);
});

test('selected friend that disappeared from current friends can still be removed', async () => {
  let ids;
  const view = await renderNative(selector, 'default', { friends: [], loading: false, selectedIds: ['gone'], onChange: value => ids = value, onRetry() {}, onFriends() {}, emptyMessage: 'Empty' });
  await view.press('Remover Amigo indisponível da seleção');
  assert.deepEqual(ids, []);
});

test('attendance includes organizer and states pending and declined explicitly in PT/EN', async () => {
  const players = [...session.players, { userId: 'peer', isOrganizer: false, status: 'Accepted' }, { userId: 'pending', status: 0 }];
  for (const language of ['pt', 'en']) {
    const view = await renderNative(base + 'components/SessionAttendance.tsx', 'default', { players }, { language });
    assert.match(view.html, language === 'pt' ? /2 confirmados/ : /2 confirmed/);
    assert.ok(view.html.includes(language === 'pt' ? 'Inclui o organizador' : 'Includes the organiser'));
    assert.match(view.html, language === 'pt' ? /1 pendente.*1 recusado/ : /1 pending.*1 declined/);
    assert.doesNotMatch(view.html, /1\/1/);
  }
});

test('batch continues after a failed friend; retry never sends to known successful or declined invitees', async () => {
  let stored = session, calls = [];
  const read = async () => stored;
  const send = async (_, id) => { calls.push(id); if (id === 'bad') throw Error('Offline'); stored = { ...stored, players: [...stored.players, { userId: id, status: 0 }] }; };
  const result = await batch('session', ['good', 'bad', 'good', 'old'], 'me', read, send);
  assert.deepEqual(calls, ['good', 'bad']);
  assert.deepEqual(plain(result.results).map(r => r.status), ['sent', 'failed', 'alreadyInvited']);
  calls = [];
  const retry = await batch('session', ['good', 'bad', 'old'], 'me', read, async (_, id) => calls.push(id));
  assert.deepEqual(calls, ['bad']);
  assert.equal(retry.results.find(r => r.userId === 'bad').status, 'sent');
});

test('server-saved invitation after transport failure is reconciled and not retried', async () => {
  let stored = session, sends = 0;
  const read = async () => stored;
  const result = await batch('session', ['good'], 'me', read, async () => {
    sends++; stored = { ...stored, players: [...stored.players, { userId: 'good', status: 0 }] }; throw Error('Lost response');
  });
  assert.equal(result.results[0].status, 'alreadyInvited');
  await batch('session', ['good'], 'me', read, async () => { sends++; });
  assert.equal(sends, 1);
});

test('no successful preflight read means no sends; changed owner/status also blocks batch', async () => {
  let sends = 0;
  for (const read of [async () => { throw Error('Offline'); }, async () => ({ ...session, status: 'Closed' }), async () => ({ ...session, organizerId: 'other' })]) {
    const result = await batch('session', ['good'], 'me', read, async () => { sends++; });
    assert.equal(result.results[0].status, 'failed');
  }
  assert.equal(sends, 0);
});

test('subpage keeps only failed selections and retains named successes when retrying', async () => {
  let reads = 0;
  const after = { ...session, players: [...session.players, { userId: 'good', status: 0 }] };
  const view = await renderNative(screen, 'default', {}, { params: { sessionId: session.id }, friends,
    states: { 0: session, 1: false, 3: ['good', 'bad'] }, services: {
      getById: () => ++reads === 1 ? session : after,
      addPlayer: (_, id) => { if (id === 'bad') throw Object.assign(Error('Not friend'), { response: { status: 400 } }); },
    } });
  await view.press('Enviar 2 convites');
  assert.deepEqual(view.updates.find(u => u[0] === 3)[1], ['bad']);
  const results = view.updates.find(u => u[0] === 5)[1];
  assert.deepEqual(results.map(r => [r.name, r.status]), [['José', 'sent'], ['Ana', 'failed']]);
  const retried = await renderNative(screen, 'default', {}, { params: { sessionId: session.id }, friends,
    states: { 0: after, 1: false, 3: ['bad'], 5: results }, services: { getById: after, addPlayer: undefined } });
  assert.match(retried.html, /José: Convite enviado/);
  assert.match(retried.html, /Ana: É necessária amizade aceite/);
  await retried.press('Enviar 1 convite');
  assert.deepEqual(retried.calls.filter(c => c[0] === 'addPlayer'), [['addPlayer', session.id, 'bad']]);
  assert.deepEqual(retried.updates.find(u => u[0] === 3)[1], []);
  assert.equal(retried.updates.find(u => u[0] === 5)[1].length, 2);
});

test('subpage load retry, authorization, safe keyboard layout and return preserve session context', async () => {
  const error = await renderNative(screen, 'default', {}, { states: { 1: false, 2: true }, params: { sessionId: session.id }, services: { getById: session } });
  await error.press('Tentar novamente');
  assert.deepEqual(error.calls.find(c => c[0] === 'getById'), ['getById', session.id]);
  const denied = await renderNative(screen, 'default', {}, { states: { 0: { ...session, organizerId: 'other' }, 1: false } });
  assert.match(denied.html, /Só o organizador/);
  assert.ok(!denied.controls.some(c => c.accessibilityLabel === 'Enviar 0 convites'));
  const done = await renderNative(screen, 'default', {}, { states: { 0: session, 1: false, 5: [{ userId: 'good', name: 'José', status: 'sent' }] } });
  assert.ok(done.nativeViews.some(v => v[0] === 'keyboard'));
  await done.press('Voltar à sessão'); assert.equal(done.routes.at(-1), 'back');
  const detail = await renderNative(base + 'screens/GameSessionDetailScreen.tsx', 'default', {}, { states: { 0: session, 1: false }, captureFocusEffects: true, services: { getById: session } });
  await detail.effects[0]();
  assert.ok(detail.calls.some(c => c[0] === 'getById'));
  assert.ok(detail.updates.some(u => u[0] === 1 && u[1] === false), 'initial focus must finish the loading state');
});

test('creation keeps three ordered sections, selected friends and keyboard dismissal for native dates in PT/EN', async () => {
  for (const language of ['pt', 'en']) {
    const view = await renderNative(base + 'screens/CreateSessionScreen.tsx', 'default', {}, { language, friends,
      states: { 0: 'Saved draft name', 1: 'Saved draft location', 2: ['good'], 4: new Date(Date.now() + 86400000) } });
    const labels = language === 'pt' ? ['Sobre a sessão', 'Quando', 'Quem vem'] : ['About the session', 'When', "Who's coming"];
    const html = view.html.replace(/&#x27;/g, "'");
    assert.ok(html.indexOf(labels[0]) < html.indexOf(labels[1]));
    assert.ok(html.indexOf(labels[1]) < html.indexOf(labels[2]));
    assert.ok(view.html.includes(language === 'pt' ? '1 amigo selecionado' : '1 friend selected'));
    assert.ok(view.images.length);
    const date = view.controls.find(c => c.accessibilityLabel?.startsWith(language === 'pt' ? 'Data:' : 'Date:'));
    assert.ok(date);
    await date.onPress();
    assert.ok(view.calls.some(c => c[0] === 'dismissKeyboard'));
    assert.equal(view.inputs[0].value, 'Saved draft name');
    assert.equal(view.inputs[1].value, 'Saved draft location');
  }
});

test('synchronous submit lock prevents rapid double taps before the button rerenders', async () => {
  const view = await renderNative(screen, 'default', {}, { params: { sessionId: session.id }, friends,
    states: { 0: session, 1: false, 3: ['good'] }, services: { getById: session, addPlayer: undefined } });
  await Promise.all([view.press('Enviar 1 convite'), view.press('Enviar 1 convite')]);
  assert.equal(view.calls.filter(c => c[0] === 'addPlayer').length, 1);
});

test('ambiguous send plus failed refresh is resolved by next preflight without duplicate POST', async () => {
  let stored = session, reads = 0, sends = 0;
  const read = async () => { reads++; if (reads === 2) throw Error('Refresh offline'); return stored; };
  const send = async () => { sends++; stored = { ...stored, players: [...stored.players, { userId: 'good', status: 0 }] }; throw Error('Lost POST response'); };
  const first = await batch('session', ['good'], 'me', read, send);
  assert.equal(first.results[0].status, 'failed');
  assert.equal(first.refreshFailed, true);
  const retry = await batch('session', ['good'], 'me', read, send);
  assert.equal(retry.results[0].status, 'alreadyInvited');
  assert.equal(retry.refreshFailed, false);
  assert.equal(sends, 1);
});
