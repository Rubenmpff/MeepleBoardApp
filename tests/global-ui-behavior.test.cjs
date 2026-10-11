const test = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const rankings = 'src/features/games/catalog/screens/RankingsScreen.tsx';
const profile = 'src/features/users/screens/ProfileHomeScreen.tsx';
const newSheet = 'src/features/navigation/components/NewSheet.tsx';
const play = 'src/features/navigation/screens/PlayScreen.tsx';
const tabs = 'src/app/(app)/(tabs)/_layout.tsx';
const game = { id: 'ranked-game', name: 'Ranked fixture', meepleBoardScore: 80, averageRating: 7.2, personalAverageRating: 0 };
const flush = () => new Promise(resolve => setImmediate(resolve));

test('Rankings preserves overall endpoint, pagination and game destination', async () => {
  const ui = await renderNative(rankings, 'default', {}, { states: ['geral', [game], 0, 2, false, false], captureEffects: true,
    services: { getRankings: { data: [game], totalPages: 2 } } });
  assert.match(ui.html, /★ 8,0 MeepleBoard/);
  assert.match(ui.html, /★ 7,2 BGG/);
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
  assert.match(ui.html, /★ 0,0/); assert.doesNotMatch(ui.html, /BGG/);
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

test('Jogar shows sessions and campaigns; the new sheet opens campaign creation', async () => {
  const ui = await renderNative(play, 'default', {}, {});
  await ui.press('Campanhas'); assert.ok(ui.updates.some(([i, v]) => i === 0 && v === 'campaigns'));
  const sheet = await renderNative(newSheet, 'default', { visible: true, onClose() {} });
  await sheet.press('Nova campanha'); assert.deepEqual(sheet.routes, ['/(app)/games/campaigns/create']);
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
  test(`Perfil keeps the pending count and every former More destination (${language})`, async () => {
    const ui = await renderNative(profile, 'default', {}, { language, pendingJournalCount: 4, statisticsSummary: { matches: 158, distinctGames: 3, results: { wins: 29 } },
      friends: [{ id: 'friend-a', userName: 'Amigo A', sharedMatchesCount: 12 }] });
    assert.match(ui.html, />4</); assert.match(ui.html, />158</); assert.match(ui.html, /Amigo A/);
    const t = (key) => ui.i18n.t(key, { ns: 'navigation' });
    for (const label of [t('me.viewStatistics'), t('me.allFriends'), t('settings'), `${t('me.pendingJournal')}: 4`]) await ui.press(label);
    assert.deepEqual(ui.routes, ['/statistics', '/(app)/(tabs)/(friends)/people', '/settings', '/games/pending-journal']);
    await ui.press('Amigo A'); assert.deepEqual(ui.routes.at(-1), { pathname: '/friends/[id]', params: { id: 'friend-a' } });
    assert.equal(ui.controls.some(c => c.accessibilityLabel === t('back')), false);
    const sheet = await renderNative(newSheet, 'default', { visible: true, onClose() {} }, { language });
    for (const key of ['registerMatch', 'newSession', 'addGame']) await sheet.press(t('newSheet.' + key));
    assert.deepEqual(sheet.routes, ['/games/register-match', '/games/sessions/create', { pathname: '/(app)/(tabs)/(library)/library', params: { area: 'discover' } }]);
    const settings = await renderNative('src/features/settings/screens/SettingsScreen.tsx', 'default', {}, { language });
    await settings.press(ui.i18n.t('logout.button', { ns: 'settings' }));
    assert.equal(settings.calls.find(c => c[0] === 'alert')[1], ui.i18n.t('logout.title', { ns: 'settings' }));
  });
  test(`Startup reuses logo and translates both loading stages (${language})`, async () => {
    for (const redirecting of [false, true]) {
      const ui = await renderNative('src/components/ui/StartupState.tsx', 'default', { redirecting }, { language });
      assert.match(ui.html, language === 'pt' ? (redirecting ? /A verificar a sessão/ : /A preparar o MeepleBoard/) : (redirecting ? /Checking your session/ : /Preparing MeepleBoard/));
      assert.equal(ui.images[0].accessibilityLabel, 'MeepleBoard');
      assert.ok(ui.nativeViews.some(([kind]) => kind === 'safeArea'));
    }
  });
  test(`Tabs offer four places and the new sheet in the approved order (${language})`, async () => {
    const names = ['(home)', '(library)', '(play)', '(me)', '(friends)'], events = [], destinations = [];
    const navigation = { emit: e => { events.push(e); return { defaultPrevented: false }; }, navigate: n => destinations.push(n) };
    const ui = await renderNative(tabs, 'default', {}, { language, stateModules: [tabs], tabProps: { state: { index: 1, routes: names.map(name => ({ name, key: name + '-key' })) }, navigation } });
    const config = ui.calls.find(c => c[0] === 'tabs')[1];
    assert.equal(config.initialRouteName, '(home)');
    const labels = ['home', 'games', 'new', 'play', 'me'].map(key => ui.i18n.t('tabs.' + key, { ns: 'navigation' }));
    assert.deepEqual(ui.controls.map(c => c.accessibilityLabel), labels);
    for (const label of labels) await ui.press(label);
    assert.deepEqual(destinations, ['(home)', '(library)', '(play)', '(me)']);
    assert.ok(ui.updates.some(([, v]) => v === true), 'the new sheet opens');
    assert.equal(events.length, 4); assert.ok(events.every(e => e.type === 'tabPress' && e.canPreventDefault));
    const selected = ui.controls.filter(c => c.accessibilityState?.selected);
    assert.equal(selected.length, 1); assert.equal(selected[0].accessibilityLabel, labels[1]);
    const friends = await renderNative(tabs, 'default', {}, { language, tabProps: { state: { index: 4, routes: names.map(name => ({ name, key: name + '-key' })) }, navigation } });
    assert.equal(friends.controls.find(c => c.accessibilityState?.selected).accessibilityLabel, labels[4]);
  });
}

test('Global navigation uses bottom tabs without a swipe pager or keyboard gesture listeners', async () => {
  const ui = await renderNative(tabs, 'default', {}, { captureEffects: true, tabProps: { state: { index: 0, routes: [] }, navigation: {} } });
  assert.equal(ui.effects.length, 0);
  assert.equal(ui.calls.some(c => c[0] === 'keyboardListener'), false);
  assert.equal(ui.calls.find(c => c[0] === 'tabs')[1].screenOptions.headerShown, false);
});

for (const token of [null, 'isolated-token-fixture']) test(`Redirect keeps existing ${token ? 'authenticated' : 'anonymous'} flow`, async () => {
  const ui = await renderNative('src/app/index.tsx', 'default', {}, { captureEffects: true, services: { getValidToken: token, clearAll: undefined } });
  ui.effects[0](); await flush();
  assert.deepEqual(ui.routes, [['replace', token ? '/dashboard' : '/welcome']]);
  assert.deepEqual(ui.calls.map(c => c[0]), token ? ['getValidToken'] : ['getValidToken', 'clearAll']);
});
