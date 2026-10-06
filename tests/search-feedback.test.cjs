const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const libraryScreen = 'src/features/library/screens/MyLibraryScreen.tsx';
const searchScreen = 'src/features/games/catalog/screens/GameSearchScreen.tsx';
test('Played-history failure is recorded without discarding data and retry clears the error', async () => {
  const r = await renderNative(libraryScreen, 'default');
  const { default: reducer, fetchPlayedGames } = r.load('src/features/library/store/librarySlice.ts');
  const saved = [{ gameId: 'game-id', gameName: 'Meeple Teste Competitivo', timesPlayed: 1 }];
  let state = { ...reducer(undefined, { type: '@@init' }), playedGames: saved };
  state = reducer(state, fetchPlayedGames.rejected(new Error('Network error'), 'request', 'me'));
  assert.equal(state.playedGamesError, 'Network error');
  assert.deepEqual(state.playedGames, saved);
  state = reducer(state, fetchPlayedGames.pending('retry', 'me'));
  assert.equal(state.playedGamesError, null);
  assert.equal(state.playedGamesLoading, true);
  state = reducer(state, fetchPlayedGames.fulfilled(saved, 'retry', 'me'));
  assert.equal(state.playedGamesLoading, false);
  assert.equal(state.playedGamesError, null);
});
test('Collection search filters loaded entries instead of issuing a catalogue search', async () => {
  const r = await renderNative(libraryScreen, 'default', {}, {
    states: { 1: 'Meeple Teste Solo' },
    library: [{ id: 'entry', gameId: 'solo', gameName: 'Meeple Teste Solo', status: 1 }],
    playedGames: [{ gameId: 'other', gameName: 'Meeple Teste Competitivo', timesPlayed: 1 }],
  });
  assert.deepEqual(r.lists[0].data.map(g => g.gameName), ['Meeple Teste Solo']);
  assert.ok(!r.calls.some(c => c[0] === 'fetchSuggestions'));
});
for (const language of ['pt', 'en']) {
  test(`Collection communication failure stays visible with cached entries (${language})`, async () => {
    const r = await renderNative(libraryScreen, 'default', {}, { language, playedError: 'Network error', playedGames: [{ gameId: 'game-id', gameName: 'Meeple Teste Competitivo', timesPlayed: 1 }] });
    assert.ok(r.html.includes('Meeple Teste Competitivo'));
    assert.ok(r.html.includes(r.i18n.t('toast.loadErrorDescription', { ns: 'library' })));
    await r.press(r.i18n.t('screen.retry', { ns: 'library' }));
    assert.ok(r.calls.some(c => c[0] === 'refetch'));
    assert.ok(r.calls.some(c => c[0] === 'refetchPlayed'));
  });
  test(`Collection loading and failed history never masquerade as empty (${language})`, async () => {
    const loading = await renderNative(libraryScreen, 'default', {}, { language, playedLoading: true });
    assert.ok(!loading.html.includes(loading.i18n.t('ui.emptyCollection', { ns: 'library' })));
    const failed = await renderNative(libraryScreen, 'default', {}, { language, playedError: 'Network error' });
    assert.ok(failed.html.includes(failed.i18n.t('toast.loadErrorDescription', { ns: 'library' })));
    assert.ok(!failed.html.includes(failed.i18n.t('ui.emptyCollection', { ns: 'library' })));
  });
  test(`Catalogue separates loading, empty success and communication failure (${language})`, async () => {
    const options = { language, states: { 0: 'zzzinexistente' } };
    const loading = await renderNative(searchScreen, 'default', {}, { ...options, loading: true });
    assert.ok(loading.html.includes(loading.i18n.t('search.searching', { ns: 'games' })));
    const empty = await renderNative(searchScreen, 'default', {}, options);
    assert.ok(empty.html.includes(empty.i18n.t('search.empty', { ns: 'games' })));
    const failed = await renderNative(searchScreen, 'default', {}, { ...options, error: 'HTTP 500' });
    assert.ok(failed.html.includes(failed.i18n.t('search.communicationError', { ns: 'games' })));
    assert.ok(!failed.html.includes(failed.i18n.t('search.empty', { ns: 'games' })));
    await failed.press(failed.i18n.t('ui.retry', { ns: 'games' }));
    assert.ok(failed.calls.some(c => c[0] === 'fetchSuggestions' && c[2] === true));
  });
}
