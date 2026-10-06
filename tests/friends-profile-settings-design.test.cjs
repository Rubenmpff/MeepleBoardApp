const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { renderNative } = require('./helpers/renderNative.cjs');
const friendsScreen = 'src/features/friends/screens/FriendsScreen.tsx';
const requestsScreen = 'src/features/friends/screens/FriendRequestsScreen.tsx';
const searchScreen = 'src/features/friends/screens/UserSearchScreen.tsx';
const profileScreen = 'src/features/friends/screens/FriendProfileScreen.tsx';
const historyScreen = 'src/features/friends/screens/SharedGameHistoryScreen.tsx';
const settingsScreen = 'src/features/settings/screens/SettingsScreen.tsx';
const friend = { id: 'friend-a', userName: 'Ana', sharedMatchesCount: 0, isOnline: false };
const profile = { ...friend, relationshipStatus: 'friends', totalMatches: 0, totalGamesPlayed: 0, totalGamesOwned: 0,
  sharedMatches: 0, sharedGames: 0, sharedMinutes: 0, sharedSessions: 0, currentUserWins: 0, otherUserWins: 0,
  draws: 0, topSharedGames: [], commonOwnedGames: [], recentSharedMatches: [], recentSharedSessions: [], canViewLibrary: false };
const match = { matchId: 'match-a', gameId: 'game-a', gameName: 'Game A', matchDate: '2026-10-01T12:00:00Z',
  result: 'draw', currentUserScore: 0, otherUserScore: null, durationInMinutes: 0 };

test('Friends preserve sorting, filtering and the source collection', async () => {
  const data = [friend, { ...friend, id: 'friend-b', userName: 'Bruno', sharedMatchesCount: 5 }];
  const r = await renderNative(friendsScreen, 'default', {}, { friends: data, states: { 1: 'mostPlayed' } });
  assert.deepEqual(r.lists[0].data.map(x => x.id), ['friend-b', 'friend-a']);
  assert.equal(data[0].id, 'friend-a');
  const filtered = await renderNative(friendsScreen, 'default', {}, { friends: data, states: { 0: ' ana ' } });
  assert.deepEqual(filtered.lists[0].data.map(x => x.id), ['friend-a']);
  await filtered.press('Limpar pesquisa');
  assert.deepEqual(filtered.updates.at(-1), [0, '']);
});
test('Friends preserve profile, search, requests and drawer navigation', async () => {
  const r = await renderNative(friendsScreen, 'default', {}, { friends: [friend] });
  await r.press('Ana'); await r.press('Adicionar amigo'); await r.press('Pedidos de amizade');
  assert.equal(r.routes[0].params.id, 'friend-a');
  assert.equal(r.routes[1], '/friends/search');
  assert.equal(r.routes[2], '/friends/requests');
  assert.match(r.html, /0 partidas juntos/);
});
test('Friends error retry and loading keep navigation available', async () => {
  const r = await renderNative(friendsScreen, 'default', {}, { friendsError: 'Falha de rede' });
  await r.press('Tentar novamente');
  assert.deepEqual(r.calls.at(-1), ['refetchFriends', true]);
  const loading = await renderNative(friendsScreen, 'default', {}, { friendsLoading: true, language: 'en' });
  assert.match(loading.html, /Friends/); assert.match(loading.html, /Loading/);
});
for (const [language, expected] of [['pt', 'Recebidos'], ['en', 'Received']]) {
  test(`Requests and search have translated empty states: ${language}`, async () => {
    const r = await renderNative(requestsScreen, 'default', {}, { language, states: { 2: false } });
    assert.match(r.html, new RegExp(expected));
    const search = await renderNative(searchScreen, 'default', {}, { language });
    assert.equal(search.inputs.length, 1);
    assert.match(search.html, language === 'pt' ? /pelo menos 2/ : /at least 2/);
    assert.equal(search.lists[0].keyboardShouldPersistTaps, 'handled');
  });
}
for (const [action, button, method] of [['accept', 'Confirmar', 'acceptFriendRequest'], ['reject', 'Recusar', 'rejectFriendRequest'], ['cancel', 'Cancelar pedido', 'cancelFriendRequest']]) {
  test(`Request ${action} preserves the endpoint, request ID and cache invalidation`, async () => {
    const incoming = [{ requestId: 'req-a', fromUserName: 'Ana' }], outgoing = [{ requestId: 'req-b', toUserName: 'Bruno' }];
    const r = await renderNative(requestsScreen, 'default', {}, { states: { 0: incoming, 1: outgoing, 2: false }, services: { [method]: undefined } });
    await r.press(button);
    assert.deepEqual(r.calls.find(x => x[0] === method), [method, action === 'cancel' ? 'req-b' : 'req-a']);
    assert.ok(r.calls.some(x => x[0] === 'invalidateFriendsCache'));
  });
}
test('User search sends a request and preserves the pending relationship', async () => {
  const user = { ...friend, relationshipStatus: 'none' };
  const r = await renderNative(searchScreen, 'default', {}, { states: { 0: 'Ana', 1: [user] }, services: { sendFriendRequest: undefined } });
  await r.press('Adicionar');
  assert.deepEqual(r.calls.find(x => x[0] === 'sendFriendRequest'), ['sendFriendRequest', friend.id]);
  assert.equal(r.updates.find(x => x[0] === 1)[1][0].relationshipStatus, 'outgoingPending');
});
test('User search incoming requests use the existing requests destination', async () => {
  const r = await renderNative(searchScreen, 'default', {}, { language: 'en', states: { 1: [{ ...friend, relationshipStatus: 'incomingPending' }] } });
  await r.press('Respond'); assert.equal(r.routes[0], '/friends/requests');
});
test('Friend profile shows real zero totals without a future statistics action', async () => {
  const r = await renderNative(profileScreen, 'default', {}, { states: { 0: profile, 1: false }, language: 'en' });
  assert.match(r.html, /No shared matches yet/);
  assert.doesNotMatch(r.html, /still being prepared|Statistics|friends:text/);
  const collection = await renderNative(profileScreen, 'default', {}, { states: { 0: profile, 1: false, 3: 'collection' }, language: 'en' });
  assert.match(collection.html, /Ana.*collection is private/);
});
test('Shared game counts translate English plurals without altering navigation', async () => {
  const populated = { ...profile, sharedMatches: 2, topSharedGames: [{ gameId: 'game-a', name: 'Game A', matchesCount: 2 }] };
  const r = await renderNative(profileScreen, 'default', {}, { states: { 0: populated, 1: false }, language: 'en' });
  assert.match(r.html, /2 matches/); assert.doesNotMatch(r.html, /matchs|friends:text/);
});
test('Removing a friend still requires destructive confirmation', async () => {
  const r = await renderNative(profileScreen, 'default', {}, { states: { 0: profile, 1: false }, stubFriendActions: true, services: { removeFriend: undefined } });
  r.calls.find(x => x[0] === 'friendActions')[1].onRemove();
  assert.ok(!r.calls.some(x => x[0] === 'removeFriend'));
  const alert = r.calls.find(x => x[0] === 'alert');
  assert.match(alert[2], /Ana/);
  await alert[3].find(x => x.style === 'destructive').onPress();
  assert.deepEqual(r.calls.find(x => x[0] === 'removeFriend'), ['removeFriend', friend.id]);
  assert.equal(r.routes[0], 'back');
  assert.doesNotMatch(r.html, /Bloquear|em breve/);
});
test('Shared history displays zero and missing scores distinctly and retains match navigation', async () => {
  const r = await renderNative(historyScreen, 'default', {}, { states: { 1: [match], 2: false }, params: { id: friend.id, gameId: match.gameId }, language: 'en' });
  assert.match(r.html, /0 — –/); assert.doesNotMatch(r.html, /No score recorded/);
  // The screen's list callback owns the match destination.
  const element = r.lists[0].renderItem({ item: match });
  element.props.onPress(); assert.equal(r.routes[0].params.id, match.matchId);
});
test('Shared statistics include a best score of zero', async () => {
  const r = await renderNative(historyScreen, 'default', {}, { states: { 0: 'stats', 1: [match], 2: false }, language: 'en' });
  assert.match(r.html, /Your best score/); assert.match(r.html, /Your best score<\/span><span>0/);
});
test('Shared history retry retains friend and game identifiers', async () => {
  const r = await renderNative(historyScreen, 'default', {}, { states: { 2: false, 4: 'Falha de rede' }, params: { id: 'friend-a', gameId: 'game-a' }, services: { getSharedMatchesForGame: [match] } });
  await r.press('Tentar novamente'); assert.deepEqual(r.calls.find(x => x[0] === 'getSharedMatchesForGame'), ['getSharedMatchesForGame', 'friend-a', 'game-a']);
});
test('Personal profile keeps only the working settings destination, in both languages', async () => {
  for (const [language, label] of [['pt', 'Abrir definições'], ['en', 'Open settings']]) {
    const r = await renderNative('src/features/users/screens/UserProfileScreen.tsx', 'default', {}, { language });
    await r.press(label); assert.equal(r.routes[0], '/settings'); assert.doesNotMatch(r.html, /Your Profile|will appear here/);
  }
});
test('Settings preserve privacy enums, selected state and language requests', async () => {
  const r = await renderNative(settingsScreen, 'default', {}, { language: 'en', states: { 0: 'pt', 2: 2 }, services: { updateLibraryPrivacy: undefined } });
  await r.press('Private'); await r.press('English');
  assert.deepEqual(r.calls.find(x => x[0] === 'updateLibraryPrivacy'), ['updateLibraryPrivacy', 0]);
  assert.deepEqual(r.calls.find(x => x[0] === 'changeAppLanguage'), ['changeAppLanguage', 'en']);
  assert.equal(r.controls.find(x => x.accessibilityLabel === 'Public').accessibilityState.selected, true);
});
test('Settings restore the previous privacy after a failed update', async () => {
  const r = await renderNative(settingsScreen, 'default', {}, { states: { 2: 1 }, services: { updateLibraryPrivacy: new Error('isolated failure') } });
  await r.press('Privada');
  assert.deepEqual(r.updates.filter(x => x[0] === 2), [[2, 0], [2, 1]]);
  assert.ok(r.calls.some(x => x[0] === 'alert' && x[2].includes('privacidade')));
});
test('Settings logout requires confirmation and then uses the existing welcome route', async () => {
  const r = await renderNative(settingsScreen, 'default', {}, { language: 'en', services: { logout: undefined } });
  await r.press('Log out');
  assert.ok(!r.calls.some(x => x[0] === 'logout'));
  const alert = r.calls.find(x => x[0] === 'alert');
  await alert[3].find(x => x.style === 'destructive').onPress();
  assert.deepEqual(r.routes[0], ['replace', '/welcome']);
});
test('Group 4 translations use the same keys in PT and EN', () => {
  function keys(value, prefix = '') { return Object.entries(value).flatMap(([key, child]) => typeof child === 'object' ? keys(child, prefix + key + '.') : [prefix + key]); }
  for (const ns of ['friends', 'settings']) {
    const read = lang => JSON.parse(fs.readFileSync(`src/i18n/locales/${lang}/${ns}.json`, 'utf8'));
    assert.deepEqual(keys(read('pt')).sort(), keys(read('en')).sort());
  }
});
