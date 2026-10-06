const test = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const rankings = 'src/features/games/catalog/screens/RankingsScreen.tsx';
const drawer = 'src/components/drawer/CustomDrawerContent.tsx';
const tabs = 'src/app/(app)/(tabs)/_layout.tsx';
const game = { id: 'ranked-game', name: 'Ranked fixture', meepleBoardScore: 80, averageRating: 7.2, personalAverageRating: 0 };
const flush = () => new Promise(resolve => setImmediate(resolve));

test('Rankings preserves overall endpoint, pagination and game destination', async () => {
  const ui = await renderNative(rankings, 'default', {}, { states: ['geral', [game], 0, 2, false, false], captureEffects: true,
    services: { getRankings: { data: [game], totalPages: 2 } } });
  assert.match(ui.html, /MB ⭐ 8\.0/);
  assert.match(ui.html, /BGG ⭐ 7\.2/);
  await ui.press(game.name);
  assert.deepEqual(ui.routes[0], { pathname: '/games/details/[id]', params: { id: game.id } });
  ui.effects[0](); await flush();
  assert.deepEqual(ui.calls[0], ['getRankings', 0, 20, 'meepleboard']);
  ui.lists[0].onEndReached(); await flush();
  assert.deepEqual(ui.calls[1], ['getRankings', 1, 20, 'meepleboard']);
});

test('Personal ranking preserves zero and personal endpoint', async () => {
  const ui = await renderNative(rankings, 'default', {}, { states: ['minha', [game], 0, 1, false, false], captureEffects: true,
    services: { getMyRankings: { data: [game], totalPages: 1 } } });
  assert.match(ui.html, /⭐ 0\.0/); assert.doesNotMatch(ui.html, /BGG ⭐/);
  ui.effects[0](); await flush();
  assert.deepEqual(ui.calls, [['getMyRankings', 0, 20]]);
  ui.lists[0].onEndReached(); await flush(); assert.equal(ui.calls.length, 1);
});

test('Rankings failure records the page and retry clears the visible error', async () => {
  const ui = await renderNative(rankings, 'default', {}, { captureEffects: true, services: { getRankings: new Error('isolated network failure') } });
  const previous = console.error; console.error = () => {};
  try { ui.effects[0](); await flush(); } finally { console.error = previous; }
  assert.deepEqual(ui.updates.filter(([index]) => index === 6), [[6, null], [6, 0]]);
  assert.ok(ui.updates.some(([index, value]) => index === 4 && value === false));
});

test('Drawer marks campaigns as selected without changing its navigation destination', async () => {
  const ui = await renderNative(drawer, 'default', {}, { pathname: '/games/campaigns', isolateAuth: true });
  assert.equal(ui.controls.find(c => c.accessibilityLabel === 'Campanhas').accessibilityState.selected, true);
  await ui.press('Campanhas'); assert.deepEqual(ui.routes, ['/(app)/games/campaigns']);
});

for (const language of ['pt', 'en']) {
  test(`Rankings translates empty/error states and retries the failed page (${language})`, async () => {
    const empty = await renderNative(rankings, 'default', {}, { language, states: ['minha', [], 0, 1, false, false] });
    assert.match(empty.html, language === 'pt' ? /Ainda não avaliaste/ : /You have not rated/);
    const error = await renderNative(rankings, 'default', {}, { language, states: ['geral', [], 0, 1, false, false, 0],
      services: { getRankings: { data: [], totalPages: 1 } } });
    assert.equal(error.lists.length, 0);
    await error.press(language === 'pt' ? 'Tentar novamente' : 'Try again');
    assert.deepEqual(error.calls, [['getRankings', 0, 20, 'meepleboard']]);
    const more = await renderNative(rankings, 'default', {}, { language, states: ['geral', [game], 0, 2, false, false, 1],
      services: { getRankings: { data: [game], totalPages: 2 } } });
    await more.press(language === 'pt' ? 'Tentar novamente' : 'Try again');
    assert.deepEqual(more.calls, [['getRankings', 1, 20, 'meepleboard']]);
    assert.match(more.html, /Ranked fixture/);
  });
  test(`Drawer keeps real identity, pending count, destinations and logout (${language})`, async () => {
    const ui = await renderNative(drawer, 'default', {}, { language, isolateAuth: true, pendingJournalCount: 4,
      user: { id: 'fixture-user', userName: 'Fixture Player', email: 'fixture@example.invalid' } });
    assert.match(ui.html, /Fixture Player/); assert.match(ui.html, />4</);
    const keys = ['profile', 'home', 'gameSearch', 'library', 'rankings', 'sessions', 'campaigns', 'friends', 'pendingJournal', 'settings'];
    for (const key of keys) await ui.press(ui.i18n.t(key, { ns: 'navigation' }));
    assert.deepEqual(ui.routes, ['/profile', '/dashboard', '/games/search', '/games/library', '/games/rankings', '/games/sessions', '/(app)/games/campaigns', '/friends', '/games/pending-journal', '/settings']);
    await ui.press(ui.i18n.t('logout', { ns: 'navigation' }));
    assert.deepEqual(ui.calls, [['dispatch', { type: 'auth/logout' }]]);
    assert.deepEqual(ui.routes.at(-1), ['replace', '/(auth)/signin']);
    assert.ok(ui.nativeViews.find(([kind, p]) => kind === 'safeArea' && p.edges.includes('bottom')));
  });
  test(`Startup reuses logo and translates both loading stages (${language})`, async () => {
    for (const redirecting of [false, true]) {
      const ui = await renderNative('src/components/ui/StartupState.tsx', 'default', { redirecting }, { language });
      assert.match(ui.html, language === 'pt' ? (redirecting ? /A verificar a sessão/ : /A preparar o MeepleBoard/) : (redirecting ? /Checking your session/ : /Preparing MeepleBoard/));
      assert.equal(ui.images[0].accessibilityLabel, 'MeepleBoard');
      assert.ok(ui.nativeViews.some(([kind]) => kind === 'safeArea'));
    }
  });
  test(`Tabs keep routes, selected state, drawer and preventable tab events (${language})`, async () => {
    const names = ['(home)', '(register)', '(library)', '(friends)'], events = [], destinations = [];
    const navigation = { emit: e => { events.push(e); return { defaultPrevented: e.target === '(friends)-key' }; }, navigate: n => destinations.push(n), getParent: () => ({ openDrawer: () => destinations.push('drawer') }) };
    const ui = await renderNative(tabs, 'default', {}, { language, tabProps: { state: { index: 2, routes: names.map(name => ({ name, key: name + '-key' })) }, navigation } });
    const config = ui.calls.find(c => c[0] === 'tabs')[1];
    assert.equal(config.initialRouteName, '(home)'); assert.equal(config.tabBarPosition, 'bottom'); assert.equal(config.screenOptions.swipeEnabled, true);
    for (const key of ['more', 'home', 'register', 'library', 'friends']) await ui.press(ui.i18n.t('tabs.' + key, { ns: 'navigation' }));
    assert.deepEqual(destinations, ['drawer', '(home)', '(register)', '(library)']);
    assert.equal(events.length, 4); assert.ok(events.every(e => e.type === 'tabPress' && e.canPreventDefault));
    const selected = ui.controls.filter(c => c.accessibilityState?.selected);
    assert.equal(selected.length, 1); assert.equal(selected[0].accessibilityLabel, ui.i18n.t('tabs.library', { ns: 'navigation' }));
  });
}

test('Keyboard still disables swipe and listeners are removed', async () => {
  const ui = await renderNative(tabs, 'default', {}, { states: [true], captureEffects: true,
    tabProps: { state: { index: 0, routes: [] }, navigation: {} } });
  assert.equal(ui.calls.find(c => c[0] === 'tabs')[1].screenOptions.swipeEnabled, false);
  const cleanup = ui.effects[0]();
  const listeners = ui.calls.filter(c => c[0] === 'keyboardListener');
  assert.deepEqual(listeners.map(c => c[1]), ['keyboardWillShow', 'keyboardWillHide']);
  listeners[0][2](); listeners[1][2](); cleanup();
  assert.deepEqual(ui.updates, [[0, true], [0, false]]);
  assert.equal(ui.calls.filter(c => c[0] === 'removeKeyboardListener').length, 2);
});

for (const token of [null, 'isolated-token-fixture']) test(`Redirect keeps existing ${token ? 'authenticated' : 'anonymous'} flow`, async () => {
  const ui = await renderNative('src/app/index.tsx', 'default', {}, { captureEffects: true, services: { getValidToken: token, clearAll: undefined } });
  ui.effects[0](); await flush();
  assert.deepEqual(ui.routes, [['replace', token ? '/dashboard' : '/welcome']]);
  assert.deepEqual(ui.calls.map(c => c[0]), token ? ['getValidToken'] : ['getValidToken', 'clearAll']);
});
