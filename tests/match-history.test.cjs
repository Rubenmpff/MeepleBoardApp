// Jogar → Partidas: every match, with filters, pagination, details and the way back.
// Services are isolated fixtures; nothing reaches the API or a database.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');

const source = 'src/features/games/matches/screens/MatchHistoryScreen.tsx';
const play = 'src/features/navigation/screens/PlayScreen.tsx';
const flush = () => new Promise(resolve => setImmediate(resolve));
// State order in MatchHistoryScreen: filters, page, loading, loadingMore, error, refreshing, games, years, sheet.
const ALL = { result: 'all', range: 'all' };
const match = (id, extra = {}) => ({ id, gameId: 'g1', gameName: `Game ${id}`, gameImageUrl: null, matchDate: '2026-10-07T20:00:00Z', gameMode: 'COMPETITIVE',
  outcome: 'Win', resultSource: 'Explicit', durationInMinutes: 30, score: null, personalRating: null, ...extra });
const page = (items, total = items.length) => ({ total, offset: 0, limit: 25, items });
const render = (states, options = {}) => renderNative(source, 'default', {}, { states: { 2: false, ...states }, ...options });

test('lists every match with date, mode, result and rating, and opens its details', async () => {
  const ui = await render({ 1: page([match('a', { personalRating: 7.5 }), match('b', { outcome: null, gameMode: 'SOLO' }), match('c', { outcome: null, resultSource: 'Legacy' })]) });
  for (const text of ['Game a', '7 out. 2026 · Competitivo', 'Vitória · avaliação 7,5', '7 out. 2026 · Solo', 'Resultado não definido', 'Registo antigo com resultado incompleto', '3 partidas · últimos 10 anos'])
    assert.ok(ui.html.includes(text), text);
  await ui.press('Game b, 7 out. 2026, Resultado não definido');
  assert.deepEqual(ui.routes, [{ pathname: '/games/matches/[id]', params: { id: 'b' } }]);
});

test('more pages load from the current length; the button disappears at the end', async () => {
  const more = await render({ 1: page([match('a'), match('b')], 30) }, { services: { matches: () => page([]) } });
  await more.press('Mostrar mais partidas'); await flush();
  const [name, query, metric, offset] = more.calls.find(c => c[0] === 'matches');
  assert.deepEqual([name, metric, offset], ['matches', 'all', 2]);
  assert.ok(query.start && query.endExclusive);
  const done = await render({ 1: page([match('a')], 1) });
  assert.ok(!done.controls.some(c => c.accessibilityLabel === 'Mostrar mais partidas'));
});

test('result chips and the period, game and mode filters change the request without a new contract', async () => {
  const ui = await render({ 1: page([match('a')]) }, { captureEffects: true, services: { matches: () => page([]), summary: { gameOptions: [], games: [], evolution: [] } } });
  await ui.press('Vitórias');
  assert.deepEqual(ui.updates.find(([i]) => i === 0)[1], { ...ALL, result: 'wins' });
  ui.effects.forEach(effect => effect()); await flush();
  const [, query, metric, offset] = ui.calls.find(c => c[0] === 'matches');
  assert.deepEqual([metric, offset], ['all', 0]);
  const days = (Date.parse(query.endExclusive) - Date.parse(query.start)) / 86400000;
  assert.equal(Math.round(days), 3660, 'all dates use the widest window the API accepts');

  // Period, game and mode go to a draft (state 9); «Aplicar» applies it, «Cancelar» discards it.
  const years = await render({ 1: page([match('a')]), 7: ['2026', '2025'], 8: 'range' });
  for (const label of ['Todas as datas', 'Este mês', '2026', '2025']) assert.ok(years.controls.some(c => c.accessibilityLabel === label), label);
  await years.press('2025');
  assert.deepEqual(years.updates.find(([i]) => i === 9)[1], { ...ALL, range: '2025' });
  assert.ok(!years.updates.some(([i]) => i === 0), 'nothing applied yet');
  assert.ok(years.updates.some(([i, v]) => i === 8 && v === 'main'), 'back to the filter summary');

  const games = await render({ 1: page([match('a')]), 6: [{ gameId: 'g9', name: 'Fixture game', imageUrl: null, matches: 3 }], 8: 'game' });
  await games.press('Fixture game');
  assert.deepEqual(games.updates.find(([i]) => i === 9)[1], { ...ALL, gameId: 'g9' });
  const modes = await render({ 1: page([match('a')]), 8: 'mode' });
  await modes.press('Cooperativo');
  assert.deepEqual(modes.updates.find(([i]) => i === 9)[1], { ...ALL, mode: 'COOPERATIVE' });

  const apply = await render({ 1: page([match('a')]), 8: 'main', 9: { ...ALL, mode: 'SOLO' } });
  await apply.press('Aplicar');
  assert.deepEqual(apply.updates.find(([i]) => i === 0)[1], { ...ALL, mode: 'SOLO' });
  const cancel = await render({ 1: page([match('a')]), 8: 'main', 9: { ...ALL, mode: 'SOLO' } });
  await cancel.press('Cancelar');
  assert.ok(!cancel.updates.some(([i]) => i === 0) && cancel.updates.some(([i, v]) => i === 8 && v === null), 'cancel keeps the list');
});

test('the filter summary names the active choices and clearing keeps the result chip', async () => {
  const filters = { result: 'losses', range: '2025', gameId: 'g9', mode: 'SOLO' };
  const ui = await render({ 0: filters, 1: page([match('a')]), 6: [{ gameId: 'g9', name: 'Fixture game', imageUrl: null, matches: 3 }], 8: 'main', 9: filters });
  assert.ok(ui.controls.some(c => c.accessibilityLabel === 'Período: 2025 · Fixture game · Solo'));
  assert.ok(!ui.html.includes('últimos 10 anos'), 'the 10-year note only applies to all dates');
  await ui.press('Limpar filtros');
  assert.deepEqual(ui.updates.find(([i]) => i === 9)[1], { result: 'losses', range: 'all' }, 'clears the draft');
});

test('empty history offers registration; empty filters offer clearing; errors retry', async () => {
  const empty = await render({ 1: page([]) });
  assert.ok(empty.html.includes('Ainda não tens partidas'));
  await empty.press('Registar partida');
  assert.deepEqual(empty.routes, ['/games/register-match']);
  const none = await render({ 0: { ...ALL, result: 'draws' }, 1: page([]) });
  assert.ok(none.html.includes('Nenhuma partida corresponde a estes filtros.'));
  await none.press('Limpar filtros');
  assert.deepEqual(none.updates.find(([i]) => i === 0)[1], ALL);
  const error = await render({ 1: null, 4: true }, { services: { matches: () => page([]) } });
  assert.ok(error.html.includes('Não foi possível carregar as partidas.'));
  await error.press('Tentar novamente'); await flush();
  assert.equal(error.calls.filter(c => c[0] === 'matches').length, 1);
});

test('coming back from a match keeps the list unless the total changed', async () => {
  const same = await render({ 1: page([match('a')], 1) }, { captureFocusEffects: true, services: { matches: () => page([match('a')], 1) } });
  same.effects.at(-1)(); same.effects.at(-1)(); await flush();
  assert.equal(same.calls.filter(c => c[0] === 'matches').length, 1, 'only the second focus checks');
  assert.ok(!same.updates.some(([i]) => i === 1), 'unchanged total keeps loaded pages and position');
  const changed = await render({ 1: page([match('a')], 1) }, { captureFocusEffects: true, services: { matches: () => page([match('new'), match('a')], 2), summary: { gameOptions: [], evolution: [] } } });
  changed.effects.at(-1)(); changed.effects.at(-1)(); await flush();
  assert.equal(changed.updates.find(([i]) => i === 1)[1].total, 2);
});

test('labels are translated in English', async () => {
  const ui = await render({ 1: page([match('a', { outcome: 'Loss' })]) }, { language: 'en' });
  for (const text of ['All', 'Wins', 'All dates', 'All games · All modes', 'Loss', '1 match · last 10 years']) assert.ok(ui.html.includes(text), text);
});

test('Jogar shows Partidas beside Sessões and Campanhas, and ＋ there registers a match', async () => {
  const ui = await renderNative(play, 'default', {}, {});
  await ui.press('Partidas');
  assert.ok(ui.updates.some(([i, v]) => i === 0 && v === 'matches'));
  const matches = await renderNative(play, 'default', {}, { params: { area: 'matches' } });
  await matches.press('Registar partida');
  assert.deepEqual(matches.routes, ['/games/register-match']);
});
