const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const libraryScreen = 'src/features/library/screens/MyLibraryScreen.tsx';
const detailsScreen = 'src/features/games/catalog/screens/GameDetailsScreen.tsx';
const searchScreen = 'src/features/games/catalog/screens/GameSearchScreen.tsx';
const library = [{ id: 'entry-id', gameId: 'game-id', gameName: 'Test-only game', status: 3, pricePaid: 0, game: { id: 'game-id', name: 'Test-only game' } }];
const game = { id: 'game-id', bggId: 42, name: 'Test-only game', description: 'Test-only description', averageRating: 7.6, meepleBoardScore: 0 };
const detailsStates = tab => ({ 0: game, 4: false, 6: false, 8: false, 10: tab });

test('Library retains real entry navigation, wishlist action and view preference in PT and EN', async () => {
  for (const language of ['pt', 'en']) {
    const r = await renderNative(libraryScreen, 'default', {}, { language, library });
    assert.ok(r.html.includes('Test-only game'));
    assert.ok(r.html.includes(`${r.i18n.t('ui.all', { ns: 'library' })} 1`));
    await r.press(r.i18n.t('ui.viewPage', { ns: 'library' }) + ': Test-only game');
    assert.deepEqual(r.routes, [{ pathname: '/games/details/[id]', params: { id: 'game-id' } }]);
    // Adding a game now starts from the Jogos hub, which opens "Descobrir jogos".
    const hub = await renderNative('src/features/library/screens/GamesScreen.tsx', 'default', {}, { language, library });
    await hub.press(r.i18n.t('ui.add', { ns: 'library' }));
    assert.ok(hub.updates.some(([, value]) => value === 'discover'));
    await r.press(r.i18n.t('ui.addCollection', { ns: 'library' }));
    assert.ok(r.calls.some(c => c[0] === 'updateGame' && c[1] === 'game-id' && c[2] === 1 && c[3] === 0));
    await r.press(r.i18n.t('ui.list', { ns: 'library' }));
    assert.ok(r.calls.some(c => c[0] === 'viewMode' && c[1] === 'list'));
  }
});

test('Library keeps entries and actions when grid adapts to narrow screens and large text', async () => {
  for (const dimensions of [{ width: 320 }, { width: 390, fontScale: 1.6 }]) {
    const r = await renderNative(libraryScreen, 'default', {}, { library, ...dimensions });
    assert.equal(r.lists[0].numColumns, 1);
    assert.equal(r.lists[0].data[0].gameId, 'game-id');
    assert.ok(r.html.includes('Test-only game'));
  }
});

test('Library error is not displayed as an empty collection and retry uses existing refetch', async () => {
  const error = await renderNative(libraryScreen, 'default', {}, { error: 'Network error' });
  assert.ok(!error.html.includes('A tua coleção está vazia'));
  await error.press('Tentar novamente');
  assert.deepEqual(error.calls, [['refetch'], ['refetchPlayed']]);
  const empty = await renderNative(libraryScreen, 'default', {}, { language: 'en' });
  assert.ok(empty.html.includes('Your collection is empty'));
  const loading = await renderNative(libraryScreen, 'default', {}, { loading: true });
  assert.ok(!loading.html.includes('A tua coleção está vazia'));
});

test('Collection secondary actions stop propagation and keep long-press support', async () => {
  for (const name of ['CollectionGridCard', 'CollectionListItem']) {
    let opened = 0, menus = 0, registered = 0;
    const r = await renderNative(`src/features/library/components/${name}.tsx`, name, {
      entry: { gameId: 'game-id', gameName: 'Test-only game', timesPlayed: 2, status: 1 },
      onPress: () => opened++, onLongPress: () => menus++, onMenuPress: () => menus++, onPrimaryAction: () => registered++,
    }, { language: 'en' });
    await r.press('Register another match');
    await r.press('Actions for Test-only game');
    assert.equal(opened, 0); assert.equal(registered, 1); assert.equal(menus, 1);
    assert.equal(r.calls.filter(c => c[0] === 'stopPropagation').length, 2);
    assert.ok(r.controls.some(c => typeof c.onLongPress === 'function'));
  }
});

test('Game details preserve data, zero MeepleBoard rating and back navigation in PT and EN', async () => {
  for (const language of ['pt', 'en']) {
    const r = await renderNative(detailsScreen, 'default', {}, { language, states: detailsStates('info') });
    const decimal = language === 'pt' ? ',' : '.';
    for (const text of ['Test-only game', 'Test-only description', `7${decimal}6`, `0${decimal}0`]) assert.ok(r.html.includes(text), text);
    await r.press(r.i18n.t('ui.back', { ns: 'games' }));
    assert.deepEqual(r.routes, ['back']);
  }
});

test('Game details loading and failure remain distinct from a missing game', async () => {
  const loading = await renderNative(detailsScreen, 'default');
  assert.ok(loading.html.includes('A carregar o jogo'));
  const error = await renderNative(detailsScreen, 'default', {}, { states: { 4: false, 5: true } });
  assert.ok(error.html.includes('Não foi possível carregar os dados.'));
  await error.press('Tentar novamente');
  assert.deepEqual(error.calls, [['getById', 'game-id']]);
});

test('Game history preserves returned data and distinguishes failed requests from empty history', async () => {
  const loaded = await renderNative(detailsScreen, 'default', {}, { states: {
    ...detailsStates('history'), 1: [{ id: 'match-id', matchDate: '2026-10-05', personalNotes: 'Test-only notes', notes: 'Legacy private notes', winnerName: 'Test-only winner', personalRating: 3, tags: 'test' }],
  } });
  for (const text of ['Test-only notes', 'Test-only winner', '#test']) assert.ok(loaded.html.includes(text));
  assert.ok(!loaded.html.includes('Legacy private notes'));
  const error = await renderNative(detailsScreen, 'default', {}, { states: { ...detailsStates('history'), 7: true } });
  assert.ok(!error.html.includes(error.i18n.t('details.historyEmpty', { ns: 'games' })));
  await error.press('Tentar novamente');
  assert.ok(error.calls.some(c => c[0] === 'getHistoryByGame' && c[1] === 'game-id'));
});

test('Game campaigns retain create and detail destinations', async () => {
  const r = await renderNative(detailsScreen, 'default', {}, { states: {
    ...detailsStates('campaigns'), 2: [{ id: 'campaign-id', name: 'Test-only campaign', status: 'Active', memberCount: 2, matchCount: 3 }],
  } });
  assert.ok(r.html.includes('Test-only campaign'));
  await r.press('Nova campanha');
  await r.press('Test-only campaign');
  assert.deepEqual(r.routes, ['/(app)/games/campaigns/create?gameId=game-id&gameName=Test-only%20game', '/(app)/games/campaigns/campaign-id']);
});

test('Search preserves game detail navigation, refresh and guarded pagination', async () => {
  const r = await renderNative(searchScreen, 'default', {}, { states: { 0: 'Test' }, suggestions: [game], language: 'en' });
  assert.ok(r.html.includes('Test-only game'));
  await r.press(r.i18n.t('listItem.viewDetailsAccessibility', { ns: 'games', name: game.name }));
  assert.deepEqual(r.routes, [{ pathname: '/games/details/[id]', params: { id: 'game-id' } }]);
  const list = r.lists[0];
  await list.onEndReached();
  assert.equal(r.calls.filter(c => c[0] === 'fetchSuggestions').length, 0);
  list.onScrollBeginDrag(); await list.onEndReached();
  await list.onRefresh();
  assert.deepEqual(r.calls.filter(c => c[0] === 'fetchSuggestions'), [['fetchSuggestions', 'test'], ['fetchSuggestions', 'test', true]]);
});

test('Search translates offline and empty states; failed requests have a working retry', async () => {
  const offline = await renderNative(searchScreen, 'default', {}, { states: { 0: 'Test' }, online: false, language: 'en' });
  assert.ok(offline.html.includes('No internet connection'));
  const error = await renderNative(searchScreen, 'default', {}, { states: { 0: 'Test' }, error: 'Network error', language: 'en' });
  assert.ok(error.html.includes('Unable to communicate with the catalogue.'));
  assert.ok(!error.html.includes(error.i18n.t('search.empty', { ns: 'games' })));
  await error.press('Try again');
  assert.deepEqual(error.calls, [['fetchSuggestions', 'test', true]]);
});

test('Collection and catalogue filter sheets apply existing values and keep translated labels', async () => {
  for (const [file, name, filters, players, extra] of [
    ['src/features/library/components/CollectionFiltersSheet.tsx', 'CollectionFiltersSheet', { playerCount: 5, minBggRating: 8, modes: ['solo'], history: 'never' }, 'We are', { entries: [] }],
    ['src/features/games/catalog/components/GameSearchFiltersSheet.tsx', 'GameSearchFiltersSheet', { playerCount: 2, minBggRating: 7 }, 'Number of players', {}],
  ]) {
    let applied, closed = 0;
    const r = await renderNative(file, name, { visible: true, filters, onApply: v => applied = v, onClose: () => closed++, ...extra }, { language: 'en' });
    assert.ok(r.html.includes(players));
    assert.ok(r.html.includes('Minimum BGG rating'));
    assert.ok(!r.html.includes('ui.'));
    await r.press('Apply');
    assert.deepEqual(applied, filters); assert.equal(closed, 1);
  }
});

test('Library filters: a draft until Apply, cancel keeps the list, count of the draft, unknown data left out, no «competitive»', async () => {
  const sheet = 'src/features/library/components/CollectionFiltersSheet.tsx';
  const entries = [{ gameId: 'a', gameName: 'A', minPlayers: 1, maxPlayers: 4, isCooperative: true, timesPlayed: 0 },
    { gameId: 'b', gameName: 'B', minPlayers: 2, maxPlayers: 5, timesPlayed: 2 }, { gameId: 'c', gameName: 'C (no player data)', timesPlayed: 0 }];
  let applied = null, closed = 0;
  const r = await renderNative(sheet, 'CollectionFiltersSheet', { visible: true, filters: { playerCount: 3 }, entries, onApply: v => applied = v, onClose: () => closed++ }, { language: 'pt' });
  assert.ok(r.controls.some(c => c.accessibilityLabel === 'Ver 2 resultados'), 'count of the draft over all the games given');
  assert.ok(!r.html.includes('Competitivo'), '«competitive» is not deduced');
  await r.press('Cancelar');
  assert.equal(applied, null); assert.equal(closed, 1);
  const helpers = r.load('src/features/library/utils/collectionHelpers.ts');
  assert.deepEqual(helpers.applyFilters(entries, { playerCount: 3 }).map(e => e.gameId), ['a', 'b']);
  assert.equal(helpers.unknownForFilters(entries, { playerCount: 3 }), 1, 'the game without player data is left out and counted');
  assert.deepEqual(helpers.applyFilters(entries, { modes: ['cooperative', 'solo'] }).map(e => e.gameId), ['a'], 'at least one mode inside the group');
  assert.deepEqual(helpers.applyFilters(entries, { playerCount: 3, modes: ['cooperative'] }).map(e => e.gameId), ['a'], 'every group');
});

test('Collection and catalogue sort sheets preserve option values and close after selection', async () => {
  for (const [file, name, props] of [
    ['src/features/library/components/CollectionSortSheet.tsx', 'CollectionSortSheet', { options: ['name_asc', 'bgg_rating'] }],
    ['src/features/games/catalog/components/GameSearchSortSheet.tsx', 'GameSearchSortSheet', {}],
  ]) {
    let selected, closed = 0;
    const r = await renderNative(file, name, { ...props, visible: true, active: 'name_asc', onSelect: v => selected = v, onClose: () => closed++ }, { language: 'en' });
    await r.press('BGG rating');
    assert.equal(selected, 'bgg_rating'); assert.equal(closed, 1);
  }
});

test('Library management keeps zero, blank and invalid price behaviour after changing the dialog', async () => {
  for (const [priceText, expected] of [['0', 0], ['', null], ['-1', 'invalid'], ['invalid', 'invalid']]) {
    const entry = { ...library[0], status: 1 };
    const r = await renderNative('src/features/library/components/ManageLibraryEntryModal.tsx', 'default', { visible: true, game, entry, onClose() {} }, {
      language: 'en', library: [entry], states: { 1: priceText },
    });
    assert.ok(r.html.includes('Price paid (optional)'));
    await r.press('Save changes');
    if (expected === 'invalid') {
      assert.ok(!r.calls.some(c => c[0] === 'updateGame'));
      assert.ok(r.calls.some(c => c[0] === 'toast' && c[1].text1 === 'Invalid price'));
    } else assert.deepEqual(r.calls.find(c => c[0] === 'updateGame'), ['updateGame', 'game-id', 1, expected]);
  }
});

test('Add-to-library price dialog preserves confirmation and skipping without inventing a price', async () => {
  const file = 'src/features/library/components/AddToLibraryModal.tsx';
  let values = [], closed = 0;
  const props = { visible: true, game, onAddToLibrary: value => values.push(value), onClose: () => closed++ };
  // Status 1 = Tenho; an empty price means "not stated", never zero.
  const zero = await renderNative(file, 'default', props, { language: 'en', states: { 0: 1, 1: '0' } });
  await zero.press('Add');
  const skip = await renderNative(file, 'default', props, { language: 'en', states: { 0: 1 } });
  await skip.press('Add');
  assert.deepEqual(values, [0, undefined]); assert.equal(closed, 2);
  const wanted = [];
  const wish = await renderNative(file, 'default', { ...props, onAddToLibrary: (price, status) => wanted.push([price, status]) }, { language: 'en', states: { 0: 3, 1: '12' } });
  assert.equal(wish.inputs.length, 0, 'a wishlist entry has no price');
  await wish.press('Add'); assert.deepEqual(wanted, [[undefined, 3]]);
});

test('Library list: tab counts follow search and filters; no results says what is active and what was left out', async () => {
  // MyLibraryScreen state order: tab, search, refreshing, manageEntry, actionsEntry, filters, filtersVisible, sortVisible.
  const library = [{ id: 'e1', gameId: 'a', gameName: 'Alpha', status: 1, game: { id: 'a', name: 'Alpha', minPlayers: 1, maxPlayers: 4 } },
    { id: 'e2', gameId: 'b', gameName: 'Beta', status: 3, game: { id: 'b', name: 'Beta' } }];
  const r = await renderNative(libraryScreen, 'default', {}, { library, states: { 5: { playerCount: 3 } } });
  assert.ok(r.html.includes('Todos 1') && r.html.includes('Tenho 1') && r.html.includes('Quero 0'), 'counts with the filter applied');
  assert.ok(r.html.includes('1 de 2 jogos'));
  assert.ok(r.controls.some(c => c.accessibilityLabel === 'Retirar filtro: 3 jogadores'));
  const none = await renderNative(libraryScreen, 'default', {}, { library, states: { 0: 3, 5: { playerCount: 3 } } });
  assert.match(none.html, /Nenhum resultado com estes filtros/);
  assert.match(none.html, /Em «Quero»: 3 jogadores\. 1 sem esta informação ficou de fora\./);
  await none.press('Limpar filtros');
  assert.ok(none.updates.some(([index, value]) => index === 5 && Object.keys(value).length === 0));
  await none.press('Ajustar');
  assert.ok(none.updates.some(([index, value]) => index === 6 && value === true));
});
