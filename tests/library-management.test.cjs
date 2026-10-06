const test = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const modal = 'src/features/library/components/AddToLibraryModal.tsx';
const game = { id: 'game-id', name: 'Fixture game', bggId: 42 };

for (const language of ['pt', 'en']) test(`Catalogue access in More and explicit collection action (${language})`, async () => {
  const more = await renderNative('src/features/navigation/screens/MoreScreen.tsx', 'default', {}, { language, isolateAuth: true });
  await more.press(more.i18n.t('gameSearch', { ns: 'navigation' }));
  assert.deepEqual(more.routes, ['/games/search']);
  const library = await renderNative('src/features/library/screens/MyLibraryScreen.tsx', 'default', {}, { language });
  assert.ok(library.html.includes(library.i18n.t('ui.catalogHint', { ns: 'library' })));
  assert.equal(library.inputs[0].placeholder, library.i18n.t('ui.searchPlaceholder', { ns: 'library' }));
  await library.press(library.i18n.t('ui.add', { ns: 'library' }));
  assert.deepEqual(library.routes, ['/games/search']);
});

test('Both price forms distinguish empty, free, comma decimals and invalid input', async () => {
  for (const [text, value] of [['', null], ['0', 0], [' 35,50 ', 35.5], ['.50', .5], ['2.75', 2.75], ['oops', 'invalid'], ['12oops', 'invalid'], ['-1', 'invalid'], ['Infinity', 'invalid'], ['1,2,3', 'invalid'], ['1.234', 'invalid']]) {
    const values = [];
    const add = await renderNative(modal, 'default', { visible: true, game, onClose() {}, onAddToLibrary: v => values.push(v) }, { language: 'en', states: { 0: 'price', 1: text } });
    await add.press('Confirm');
    const entry = { id: 'entry-id', gameId: game.id, status: 1, pricePaid: 50, game };
    const edit = await renderNative('src/features/library/components/ManageLibraryEntryModal.tsx', 'default', { visible: true, game, entry, onClose() {} }, { language: 'en', states: { 1: text } });
    await edit.press('Save changes');
    if (value === 'invalid') {
      assert.deepEqual(values, []);
      assert.ok(!edit.calls.some(c => c[0] === 'updateGame'));
      for (const view of [add, edit]) assert.ok(view.calls.some(c => c[0] === 'toast' && c[1].text1 === 'Invalid price'));
    } else {
      assert.deepEqual(values, [value ?? undefined]);
      assert.deepEqual(edit.calls.find(c => c[0] === 'updateGame'), ['updateGame', game.id, 1, value]);
    }
  }
});

test('Addition failure keeps the entered price and cancel respects the discard guard', async () => {
  let closed = 0;
  const ui = await renderNative(modal, 'default', { visible: true, game, onClose: () => closed++, onAddToLibrary: async () => { throw new Error('Isolated failure'); } }, { language: 'en', states: { 0: 'price', 1: '4,50' } });
  await ui.press('Confirm'); assert.equal(closed, 0);
  assert.equal(ui.inputs[0].value, '4,50');
  await ui.press('Cancel'); assert.equal(closed, 0);
  ui.calls.find(c => c[0] === 'alert')[3][1].onPress(); assert.equal(closed, 1);
});

test('Catalogue screen passes zero and comma decimals through the real addition dialog', async () => {
  for (const [price, expected] of [['0', 0], ['8,50', 8.5], ['', undefined]]) {
    const ui = await renderNative('src/features/games/catalog/screens/GameSearchScreen.tsx', 'default', {}, {
      language: 'en', stateModules: [modal], states: { 7: game, 8: true, 13: 'price', 14: price },
    });
    await ui.press('Confirm');
    assert.equal(ui.calls.find(c => c[0] === 'addGame')[3], expected);
    assert.ok(ui.calls.some(c => c[0] === 'toast' && c[1].text1 === 'You now own Fixture game'));
  }
});

test('Reducer reflects persisted prices, reload, totals and removal without losing played history', async () => {
  const ui = await renderNative('src/features/library/components/CollectionSearchBar.tsx', 'CollectionSearchBar', { value: '', onChangeText() {} });
  const { default: reducer, fetchUserLibrary, updateGameInLibrary, removeGameFromLibrary } = ui.load('src/features/library/store/librarySlice.ts');
  const entry = { id: 'entry-id', gameId: game.id, status: 1, pricePaid: 50, game };
  let state = { ...reducer(undefined, { type: '@@init' }), items: [entry], playedGames: [{ gameId: game.id, timesPlayed: 3, inLibrary: true, pricePaid: 50 }] };
  for (const value of [35.5, 0, null]) {
    state = reducer(state, updateGameInLibrary.fulfilled({ gameId: game.id, status: 1, pricePaid: value }, 'request', {}));
    assert.equal(state.items[0].pricePaid, value ?? undefined);
    assert.equal(state.items.reduce((sum, e) => sum + (e.pricePaid ?? 0), 0), value ?? 0);
    state = reducer(state, fetchUserLibrary.fulfilled([{ ...entry, pricePaid: value ?? undefined }], 'reload', 'me'));
    const reopened = await renderNative('src/features/library/components/ManageLibraryEntryModal.tsx', 'default', { visible: true, game, entry: state.items[0], onClose() {} });
    assert.equal(reopened.inputs[0].value, value == null ? '' : String(value));
  }
  state = reducer(state, removeGameFromLibrary.fulfilled(game.id, 'request', {}));
  assert.deepEqual(state.items, []); assert.equal(state.playedGames[0].timesPlayed, 3);
  assert.equal(state.playedGames[0].inLibrary, false); assert.equal(state.playedGames[0].pricePaid, undefined);
});

test('HTTP client serializes null for removal, zero unchanged and only deletes the library association', async () => {
  const ui = await renderNative('src/features/library/components/CollectionSearchBar.tsx', 'CollectionSearchBar', { value: '', onChangeText() {} }, { services: { patch: undefined, post: undefined, delete: undefined } });
  const service = ui.load('src/features/library/services/libraryService.ts').default;
  await service.updateGameInLibrary('me', game.id, 1, null);
  await service.addGameToLibrary('me', game.id, game.name, 1, 0);
  await service.removeGameFromLibrary('me', game.id);
  assert.deepEqual(ui.calls.find(c => c[0] === 'patch'), ['patch', '/users/me/games/game-id', { status: 1, pricePaid: null }]);
  assert.equal(ui.calls.find(c => c[0] === 'post')[2].pricePaid, 0);
  assert.deepEqual(ui.calls.find(c => c[0] === 'delete'), ['delete', '/users/me/games/game-id']);
});

test('Manage removal resolves the existing library ID for a catalogue suggestion without local ID', async () => {
  const entry = { id: 'entry-id', gameId: game.id, bggId: 42, status: 1, game };
  let closed = 0;
  const ui = await renderNative('src/features/library/components/ManageLibraryEntryModal.tsx', 'default', {
    visible: true, game: { name: game.name, bggId: 42 }, onClose: () => closed++,
  }, { language: 'en', library: [entry] });
  await ui.press('Remove');
  await ui.calls.find(c => c[0] === 'alert')[3][1].onPress();
  assert.deepEqual(ui.calls.find(c => c[0] === 'removeGame'), ['removeGame', game.id]);
  assert.equal(closed, 1);
});
