const test = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');

test('Legacy entry points redirect to a single destination and preserve every parameter', async () => {
  const aliases = {
    'src/app/(app)/games/library/index.tsx': '/(app)/(tabs)/(library)/library',
    'src/app/(app)/(tabs)/(library)/index.tsx': '/(app)/(tabs)/(library)/library',
    'src/app/(app)/friends/index.tsx': '/(app)/(tabs)/(friends)/people',
    'src/app/(app)/(tabs)/(friends)/index.tsx': '/(app)/(tabs)/(friends)/people',
    'src/app/(app)/(tabs)/(register)/index.tsx': '/games/register-match',
  };
  const params = { id: 'fixture-id', gameId: 'game-id', gameName: 'A & B %', memberIds: ['one', 'two'], returnTo: '/games/sessions/fixture-id' };
  for (const [file, pathname] of Object.entries(aliases)) {
    const ui = await renderNative(file, 'default', {}, { params });
    assert.deepEqual(ui.redirects, [{ pathname, params }]);
    assert.equal(ui.controls.length, 0);
  }
});

test('Root headings have no return action; details return and standalone links have a fallback', async () => {
  const file = 'src/components/navigation/ScreenHeader.tsx';
  const root = await renderNative(file, 'default', { mode: 'root', title: 'Friends' });
  assert.equal(root.controls.length, 0);
  const detail = await renderNative(file, 'default', { title: 'Details' });
  await detail.press('Voltar'); assert.deepEqual(detail.routes, ['back']);
  const standalone = await renderNative(file, 'default', { title: 'Details' }, { canGoBack: false });
  await standalone.press('Voltar'); assert.deepEqual(standalone.routes, [['replace', '/dashboard']]);
});

// A small React component executes the real hook with isolated navigation adapters.
// It doesn't claim to exercise UIKit/native swipe or actual router history.
async function guard(props, options = {}) {
  // Load through a real form: blank creation has no automatic user edits.
  const ui = await renderNative('src/features/games/sessions/screens/CreateSessionScreen.tsx', 'default', {}, {
    states: { 0: props.dirty ? 'Draft' : '', 3: !!props.busy }, ...options,
  });
  return ui;
}

test('Blank cancel returns without a discard prompt and direct entry falls back to sessions', async () => {
  const ui = await guard({ dirty: false });
  assert.equal(ui.guards[0].enabled, false);
  await ui.press('Cancelar'); assert.deepEqual(ui.routes, ['back']);
  const direct = await guard({ dirty: false }, { canGoBack: false });
  await direct.press('Cancelar'); assert.deepEqual(direct.routes, [['replace', '/games/sessions']]);
});

for (const language of ['pt', 'en']) test(`Unsaved exits keep editing or continue the original navigation action (${language})`, async () => {
  const ui = await guard({ dirty: true }, { language });
  assert.equal(ui.guards[0].enabled, true);
  const action = { type: 'GO_BACK', source: 'fixture-screen', target: 'fixture-stack' };
  ui.guards[0].callback({ data: { action } });
  assert.equal(ui.calls.filter(c => c[0] === 'navigationDispatch').length, 0);
  const prompt = ui.calls.find(c => c[0] === 'alert');
  assert.equal(prompt[3][0].style, 'cancel'); assert.equal(prompt[3][1].style, 'destructive');
  prompt[3][0].onPress();
  assert.equal(ui.calls.filter(c => c[0] === 'navigationDispatch').length, 0);
  ui.guards[0].callback({ data: { action } });
  ui.calls.filter(c => c[0] === 'alert').at(-1)[3][1].onPress();
  assert.deepEqual(ui.calls.at(-1), ['navigationDispatch', action]);
});

test('Dirty standalone cancel confirms once, then uses its contextual fallback', async () => {
  const ui = await guard({ dirty: true }, { canGoBack: false });
  await ui.press('Cancelar'); assert.equal(ui.routes.length, 0);
  ui.calls.find(c => c[0] === 'alert')[3][1].onPress();
  assert.deepEqual(ui.routes, [['replace', '/games/sessions']]);
});

test('Pending saves block exit without offering destructive discard', async () => {
  const ui = await guard({ dirty: true, busy: true });
  ui.guards[0].callback({ data: { action: { type: 'GO_BACK' } } });
  assert.equal(ui.calls.find(c => c[0] === 'alert')[3], undefined);
  assert.equal(ui.calls.some(c => c[0] === 'navigationDispatch'), false);
});

test('Successful creation permits its existing replacement without a discard prompt', async () => {
  const ui = await renderNative('src/features/games/sessions/screens/CreateSessionScreen.tsx', 'default', {}, {
    states: { 0: 'Fixture session', 4: new Date('2099-10-06T18:00:00Z') }, createdSession: { id: 'created-session' },
  });
  await ui.press(ui.i18n.t('sessions.createTitle', { ns: 'matches' }));
  const alert = ui.calls.find(c => c[0] === 'alert'); alert[3][0].onPress();
  // Also covers an action delivered before React has rendered the saved state.
  const action = { type: 'REPLACE', payload: { name: 'details' } };
  ui.guards[0].callback({ data: { action } });
  assert.equal(ui.calls.filter(c => c[0] === 'alert').length, 1);
  assert.deepEqual(ui.calls.at(-1), ['navigationDispatch', action]);
});

test('Register separates previous step from cancelling and preserves zero while going back', async () => {
  const ui = await renderNative('src/features/games/matches/components/RegisterMatchForm.tsx', 'default', { currentUser: { id: 'me', userName: 'Me' } }, {
    states: { 2: 3, 3: { id: 'game', name: 'Fixture', minPlayers: 1, maxPlayers: 4 }, 4: false, 8: [{ id: 'me', username: 'Me', score: '0', isWinner: true }] },
  });
  await ui.press('Anterior');
  assert.deepEqual(ui.updates.find(update => update[0] === 2), [2, 2]);
  assert.equal(ui.routes.length, 0);
  assert.equal(ui.calls.some(call => call[0] === 'alert'), false);
  assert.equal(ui.updates.some(update => update[0] === 8), false);
  await ui.press('Cancelar');
  assert.deepEqual(ui.routes, ['back']);
  assert.equal(ui.guards[0].enabled, true);
  const action = { type: 'GO_BACK', target: 'origin-stack' };
  ui.guards[0].callback({ data: { action } });
  ui.calls.find(call => call[0] === 'alert')[3][1].onPress();
  assert.deepEqual(ui.calls.at(-1), ['navigationDispatch', action]);
  assert.equal(ui.calls.some(call => call[0] === 'submitMatch'), false);
});

test('Cancelling inline registration clears only its draft after confirmation', async () => {
  const ui = await renderNative('src/features/games/matches/components/RegisterMatchForm.tsx', 'default', { currentUser: { id: 'me' }, disableScroll: true, sessionId: 'session-id' }, {
    states: { 0: { id: 'session-id', status: 'Active', players: [{ userId: 'me', status: 'Accepted' }] }, 3: { id: 'game', name: 'Fixture' }, 4: false },
  });
  await ui.press('Cancelar');
  assert.equal(ui.updates.some(update => update[0] === 3), false);
  ui.calls.find(call => call[0] === 'alert')[3][1].onPress();
  assert.deepEqual(ui.updates.find(update => update[0] === 3), [3, null]);
  assert.equal(ui.routes.length, 0);
  assert.equal(ui.calls.some(call => call[0] === 'submitMatch'), false);
});
