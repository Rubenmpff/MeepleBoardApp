// Approved registration redesign (16/10/2026): game search and choice, entry at Jogadores, result by mode,
// clearing incompatible choices with «Desfazer», rating without dragging, required duration answer, review;
// game-page duration references, «Ver detalhes», the contribution preference and the duration correction.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const form = 'src/features/games/matches/components/RegisterMatchForm.tsx';
const picker = 'src/features/games/matches/components/GamePicker.tsx';
const durationField = 'src/features/games/matches/components/DurationField.tsx';
const rating = 'src/features/games/matches/components/RatingControl.tsx';
const section = 'src/features/games/durations/components/GameDurationsSection.tsx';
const details = 'src/features/games/durations/screens/GameDurationsScreen.tsx';
const settings = 'src/features/settings/screens/SettingsScreen.tsx';
const matchDetail = 'src/features/games/matches/screens/MatchDetailScreen.tsx';
const me = { id: 'me', userName: 'Author' };
const players = [{ id: 'me', username: 'Author', score: '', isWinner: false }, { id: 'peer', username: 'Peer', score: '', isWinner: false }];
const library = [
  { id: 'l1', gameId: 'wing', bggId: 266192, gameName: 'Wingspan', status: 1, game: { id: 'wing', name: 'Wingspan', yearPublished: 2019 } },
  { id: 'l2', gameId: 'eu', bggId: 234277, gameName: 'Wingspan: European Expansion', status: 1, isExpansion: true },
  { id: 'l3', gameId: 'wish', bggId: 1, gameName: 'Wishlist game', status: 3 }];
const asia = { bggId: 366161, name: 'Wingspan Asia', yearPublished: 2022, isExpansion: false };
const unknown = { hours: '', minutes: '', method: 'Unknown', confirmed: false };
const estimate = (minutes, hours = '') => ({ hours, minutes, method: 'Estimated', confirmed: false });

test('game choice: the library as a grid, then library and catalogue in groups; owned games are not repeated', async () => {
  const grid = await renderNative(picker, 'default', { value: null, onPick() {} }, { library });
  assert.match(grid.html, /Da tua biblioteca/); assert.match(grid.html, /Wingspan/); assert.match(grid.html, /JOGO BASE/); assert.match(grid.html, /EXPANSÃO/); assert.match(grid.html, /2019/);
  assert.doesNotMatch(grid.html, /Wishlist game/, 'only games you own');
  const picks = [];
  const search = await renderNative(picker, 'default', { value: null, onPick: p => picks.push(p) }, { library, states: { 0: 'wing' }, suggestions: [{ bggId: 266192, name: 'Wingspan', yearPublished: 2019 }, asia] });
  assert.match(search.html, /Da tua biblioteca.*Wingspan.*Tenho.*No catálogo.*Wingspan Asia/s);
  assert.equal((search.html.match(/>Wingspan</g) || []).length, 1, 'Wingspan only in the library group');
  await search.press('Wingspan Asia, Jogo base, 2022');
  assert.equal(picks[0].owned, false); assert.equal(picks[0].game.name, 'Wingspan Asia');
  const none = await renderNative(picker, 'default', { value: null, onPick() {} }, { library, states: { 0: 'wingspn' } });
  assert.match(none.html, /Nenhum jogo encontrado para «wingspn»/); assert.match(none.html, /nome original em inglês/);
});

test('a catalogue game is chosen without owning it: «Escolhido» bar, resolved on Continuar, library unchanged', async () => {
  const picked = { key: 'cat-366161', game: asia, owned: false };
  const view = await renderNative(form, 'default', { currentUser: me }, { library, states: { 31: picked }, searchResult: { id: 'asia', name: 'Wingspan Asia', minPlayers: 1, maxPlayers: 2 } });
  assert.match(view.html, /Escolhido:.*Wingspan Asia.*não está na tua biblioteca/s);
  await view.press('Continuar');
  assert.deepEqual(view.calls.find(c => c[0] === 'searchGame'), ['searchGame', 'Wingspan Asia']);
  assert.equal(view.updates.find(([i]) => i === 3)[1].id, 'asia');
  assert.equal(view.calls.some(c => c[0] === 'dispatch'), false, 'the library is not touched');
  const owned = await renderNative(form, 'default', { currentUser: me }, { library, states: { 31: { key: 'lib-wing', game: { id: 'wing', name: 'Wingspan' }, owned: true } } });
  await owned.press('Continuar');
  assert.equal(owned.calls.some(c => c[0] === 'searchGame'), false); assert.equal(owned.updates.find(([i]) => i === 3)[1].id, 'wing');
  const summary = await renderNative(form, 'default', { currentUser: me }, { library, states: { 3: { id: 'asia', name: 'Wingspan Asia', yearPublished: 2022, minPlayers: 1, maxPlayers: 2 }, 4: false } });
  assert.match(summary.html, /Não está na tua biblioteca\. Podes registar a partida na mesma/);
  assert.match(summary.html, /2022 · Jogo base · Competitivo/); assert.match(summary.html, /Mudar/);
});

test('a game chosen beforehand with one catalogue mode and none of your expansions opens at Jogadores', async () => {
  const single = { id: 'g', name: 'Two only', minPlayers: 2, maxPlayers: 4 };
  const view = await renderNative(form, 'default', { currentUser: me, initialGame: single }, { library, states: { 37: [] }, captureEffects: true });
  for (const effect of view.effects) { try { effect(); } catch { /* effects needing services are not part of this check */ } }
  assert.ok(view.updates.some(([i, v]) => i === 2 && v === 1), 'starts at Jogadores');
  const several = await renderNative(form, 'default', { currentUser: me, initialGame: { id: 'w', name: 'Wingspan', minPlayers: 1, maxPlayers: 5 } }, { library, states: { 37: [] }, captureEffects: true });
  for (const effect of several.effects) { try { effect(); } catch { } }
  assert.equal(several.updates.some(([i, v]) => i === 2 && v === 1), false, 'solo and competitive: configuration first');
  assert.match(several.html, /o catálogo indica mais de um/);
  const withExpansion = await renderNative(form, 'default', { currentUser: me, initialGame: single }, { library, states: { 37: [{ bggId: 234277, name: 'Wingspan: European Expansion' }] }, captureEffects: true });
  for (const effect of withExpansion.effects) { try { effect(); } catch { } }
  assert.equal(withExpansion.updates.some(([i, v]) => i === 2 && v === 1), false, 'your expansions are asked first');
  assert.match(withExpansion.html, /Tens Wingspan: European Expansion\. Usaste-a\?/);
});

test('changing mode clears the result choices at once with a notice; «Desfazer» puts them back', async () => {
  const game = { id: 'c', name: 'Coop', minPlayers: 1, maxPlayers: 4, isCooperative: true };
  const winners = [{ ...players[0], isWinner: true }, players[1]];
  const view = await renderNative(form, 'default', { currentUser: me }, { states: { 3: game, 4: false, 8: winners } });
  await view.press('Cooperativo');
  const notice = view.updates.find(([i]) => i === 35)[1];
  assert.equal(notice.kind, 'mode'); assert.deepEqual(notice.snapshot.winners, ['me']);
  assert.deepEqual(view.updates.find(([i]) => i === 8)[1].map(p => p.isWinner), [false, false], 'winners cleared now, not kept hidden');
  assert.deepEqual(view.updates.find(([i]) => i === 6), [6, 'cooperative']);
  const shown = await renderNative(form, 'default', { currentUser: me }, { states: { 2: 2, 3: game, 4: false, 6: 'cooperative', 8: players, 35: notice } });
  assert.match(shown.html, /Mudaste para Cooperativo/);
  await shown.press('Desfazer');
  assert.deepEqual(shown.updates.find(([i]) => i === 6), [6, 'multiplayer']); assert.deepEqual(shown.updates.find(([i]) => i === 8)[1].map(p => p.isWinner), [true, false]);
  assert.deepEqual(shown.updates.find(([i]) => i === 35), [35, null]);
  const answer = await renderNative(form, 'default', { currentUser: me }, { states: { 2: 2, 3: game, 4: false, 8: winners } });
  await answer.press('Empate no 1.º lugar. Dois ou mais partilham o 1.º; os restantes perdem');
  assert.equal(answer.updates.find(([i]) => i === 35)[1].kind, 'result');
});

test('result by mode: solo «Ganhei / Perdi / Empate / Não definido», team result, one explanation', async () => {
  const solo = await renderNative(form, 'default', { currentUser: me }, { states: { 2: 2, 3: { id: 's', name: 'Solo game' }, 4: false, 6: 'solo', 8: [players[0]] } });
  for (const label of ['Ganhei', 'Perdi', 'Empate', 'Não definido']) assert.ok(solo.controls.some(c => c.accessibilityLabel === label), label);
  assert.match(solo.html, /O teu resultado contra o jogo/);
  const coop = await renderNative(form, 'default', { currentUser: me }, { states: { 2: 2, 3: { id: 'c', name: 'Coop' }, 4: false, 6: 'cooperative', 8: players } });
  for (const label of ['Ganhámos', 'Perdemos']) assert.ok(coop.controls.some(c => c.accessibilityLabel === label), label);
  const comp = await renderNative(form, 'default', { currentUser: me }, { states: { 2: 2, 3: { id: 'g', name: 'G' }, 4: false, 8: [{ ...players[0], isWinner: true }, { ...players[1], isWinner: true }] } });
  assert.match(comp.html, /Vitória partilhada/); assert.ok(comp.controls.some(c => c.accessibilityLabel === undefined && c.accessibilityRole === 'checkbox'));
  assert.equal((comp.html.match(/não decidem quem ganha/g) || []).length, 1, 'the explanation appears once');
});

test('rating: «— / 10» until chosen, ±0,5, tap on the bar, adjustable with VoiceOver, zero is a value, «Limpar»', async () => {
  const changes = [];
  const empty = await renderNative(rating, 'default', { value: undefined, onChange: v => changes.push(v) });
  assert.match(empty.html, /—/); assert.match(empty.html, /Ainda sem avaliação/); assert.match(empty.html, /OBRIGATÓRIA/);
  await empty.press('Mais meio ponto'); assert.equal(changes.at(-1), 0.5);
  const bar = empty.controls.find(c => c.accessibilityRole === 'adjustable');
  bar.onLayout({ nativeEvent: { layout: { width: 200 } } });
  const set = await renderNative(rating, 'default', { value: 7.5, onChange: v => changes.push(v) }, { states: { 0: 200 } });
  const track = set.controls.find(c => c.accessibilityRole === 'adjustable');
  assert.equal(track.accessibilityValue.text, '7,5 de 10'); assert.equal(track.accessibilityValue.now, 7.5);
  track.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } }); assert.equal(changes.at(-1), 8);
  track.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } }); assert.equal(changes.at(-1), 7);
  track.onPress({ nativeEvent: { locationX: 0 } }); assert.equal(changes.at(-1), 0, 'the start of the bar is zero');
  track.onPress({ nativeEvent: { locationX: 151 } }); assert.equal(changes.at(-1), 7.5, 'nearest half point');
  await set.press('Limpar a avaliação'); assert.equal(changes.at(-1), undefined);
  const zero = await renderNative(rating, 'default', { value: 0, onChange() {} });
  assert.equal(zero.controls.find(c => c.accessibilityLabel === 'Menos meio ponto').disabled, true); assert.doesNotMatch(zero.html, /Ainda sem avaliação/);
});

test('duration field: never prefilled, estimate by default, «Medida» on request, «Não sei», unusual values confirmed, zero refused', async () => {
  const changes = [];
  const blank = await renderNative(durationField, 'default', { value: { hours: '', minutes: '', method: null, confirmed: false }, onChange: v => changes.push(v), showError: true });
  assert.equal(blank.inputs.find(p => p.accessibilityLabel === 'Minutos da partida').value, '', 'empty, no BGG or elapsed time');
  assert.match(blank.html, /Indica a duração ou escolhe «Não sei»/);
  blank.inputs.find(p => p.accessibilityLabel === 'Minutos da partida').onChangeText('48');
  assert.deepEqual(changes.at(-1), { hours: '', minutes: '48', method: 'Estimated', confirmed: false });
  await blank.press('Não sei'); assert.equal(changes.at(-1).method, 'Unknown');
  const valued = await renderNative(durationField, 'default', { value: estimate('48'), onChange: v => changes.push(v) });
  assert.match(valued.html, /Só o tempo a jogar, sem preparação nem pausas longas/);
  await valued.press('Medida'); assert.equal(changes.at(-1).method, 'Measured');
  const long = await renderNative(durationField, 'default', { value: estimate('30', '9'), onChange: v => changes.push(v) });
  assert.match(long.html, /9 h 30 min é mais do que 6 h/); await long.press('Confirmar'); assert.equal(changes.at(-1).confirmed, true);
  const short = await renderNative(durationField, 'default', { value: estimate('3'), onChange() {} });
  assert.match(short.html, /3 min é menos de 5 min/);
  const zero = await renderNative(durationField, 'default', { value: estimate('0'), onChange() {} });
  assert.match(zero.html, /superior a zero/);
});

test('the rating step needs a duration answer; «Não sei» and estimates are saved as such', async () => {
  const base = { 3: { id: 'g', name: 'G' }, 4: false, 8: [{ ...players[0], isWinner: true }, players[1]], 12: 7 };
  const missing = await renderNative(form, 'default', { currentUser: me }, { states: { ...base, 2: 3 } });
  await missing.press('Rever partida');
  assert.equal(missing.updates.some(([i]) => i === 2), false); assert.match(missing.calls.find(c => c[0] === 'alert')[2], /Indica a duração/);
  const unusual = await renderNative(form, 'default', { currentUser: me }, { states: { ...base, 2: 3, 10: estimate('30', '9') } });
  await unusual.press('Rever partida'); assert.equal(unusual.updates.some(([i]) => i === 2), false, 'unconfirmed unusual value');
  const answered = await renderNative(form, 'default', { currentUser: me }, { states: { ...base, 2: 3, 10: unknown } });
  await answered.press('Rever partida'); assert.deepEqual(answered.updates.find(([i]) => i === 2), [2, 4]);
  const saveUnknown = await renderNative(form, 'default', { currentUser: me }, { states: { ...base, 2: 4, 10: unknown } });
  assert.match(saveUnknown.html, /Duração.*Não sei/s);
  await saveUnknown.press('Guardar partida');
  const p1 = saveUnknown.calls.find(c => c[0] === 'submitMatch')[1];
  assert.equal(p1.durationMethod, 'Unknown'); assert.equal(p1.durationInMinutes, undefined);
  const saveEstimate = await renderNative(form, 'default', { currentUser: me }, { states: { ...base, 2: 4, 10: estimate('05', '1') } });
  assert.match(saveEstimate.html, /1 h 05 min · estimativa/);
  await saveEstimate.press('Guardar partida');
  const p2 = saveEstimate.calls.find(c => c[0] === 'submitMatch')[1];
  assert.equal(p2.durationMethod, 'Estimated'); assert.equal(p2.durationInMinutes, 65);
  assert.equal(saveEstimate.inputs.some(p => p.accessibilityLabel?.includes('Duração (minutos)')), false, 'no duration among optional details');
});

const stats = (o = {}) => ({ available: true, count: 6, measured: 2, estimated: 3, notStated: 1, mean: 62, median: 58, q1: 48, q3: 70, distant: 1, distantValues: [160], excludedUnknown: 1, excludedMissing: 0, excludedZero: 0, ...o });
const none = { available: false, count: 0, measured: 0, estimated: 0, notStated: 0, distant: 0 };
const side = (multi, solo = none) => ({ solo, multiplayer: multi, byPlayers: [2, 3, 4, 5].map(players => ({ players, stats: players === 2 ? multi : none })) });
const durations = { personal: side(stats()), community: side(stats({ count: 41, mean: 55, measured: 15, estimated: 12, notStated: 14, distantValues: null, excludedUnknown: null })), viewerContributes: false };

test('game page: your average, the MeepleBoard average and the BGG duration stay apart; BGG never fills a gap', async () => {
  const wingspan = { id: 'w', name: 'Wingspan', bggId: 266192, minPlayTime: 40, maxPlayTime: 70 };
  const opened = [];
  const view = await renderNative(section, 'default', { game: wingspan, onOpenDetails: () => opened.push(1) }, { durations });
  assert.match(view.html, /A tua média.*1 h 02 min.*6 partidas.*métodos mistos/s);
  assert.match(view.html, /Média MeepleBoard.*55 min.*41 partidas/s);
  assert.match(view.html, /Indicada pelo BGG.*40–70 min/s);
  assert.doesNotMatch(view.html, /Mediana|Metade central/, 'details stay in «Ver detalhes»');
  await view.press('Ver detalhes'); assert.equal(opened.length, 1);
  const thin = await renderNative(section, 'default', { game: wingspan, onOpenDetails() {} }, { durations: { ...durations, community: side(none) } });
  assert.match(thin.html, /Ainda sem dados suficientes/); assert.match(thin.html, /partidas partilhadas suficientes/);
  assert.equal((thin.html.match(/40–70 min/g) || []).length, 1, 'the BGG value is not used for the missing community average');
  const old = await renderNative(section, 'default', { game: { id: 'x', name: 'X' }, onOpenDetails() {} }, { durations: { ...durations, personal: side(stats({ count: 1, measured: 0, estimated: 0, notStated: 1, mean: 50 })) } });
  assert.match(old.html, /A tua partida.*50 min.*1 partida.*método não indicado/s); assert.doesNotMatch(old.html, /estimad/i, 'old durations are never called estimates');
  assert.doesNotMatch(old.html, /Indicada pelo BGG/, 'no BGG data, no BGG row');
});

test('«Ver detalhes»: median, middle half, far values, what was left out, by players, protection and the preference', async () => {
  const view = await renderNative(details, 'default', {}, { durations, params: { id: 'w', name: 'Wingspan', bgg: '40–70 min' } });
  for (const text of ['Duração · Wingspan', 'Mediana', '58 min', 'Metade central', '48 min – 1 h 10 min', 'Muito afastadas', '2 h 40 min', '1 «Não sei»', 'Por número de jogadores', 'Sem dados suficientes', 'proteção mínima, não uma garantia', 'Como se calcula', 'Desligado · Alterar em Definições', '40–70 min'])
    assert.ok(view.html.includes(text), text);
  assert.match(view.html, /Medidas · estimadas · não indicado.*2 · 3 · 1/s);
  await view.press('As tuas partidas na média MeepleBoard'); assert.equal(view.routes[0], '/settings');
});

test('settings: contribution off by default, explained, changed only through this account, reverted on failure', async () => {
  const view = await renderNative(settings, 'default', {}, { states: { 4: false }, services: { updateDurationSharing: undefined } });
  for (const text of ['Privacidade das estatísticas', 'Contribuir para a duração da comunidade', 'Desligado', 'O que é utilizado', 'O que nunca é utilizado', 'Inclui partidas anteriores', 'A tua média pessoal não muda'])
    assert.ok(view.html.includes(text), text);
  assert.equal(view.switches[0].value, false);
  const row = view.controls.find(c => c.accessibilityRole === 'switch');
  assert.equal(row.accessibilityLabel, 'Contribuir para a duração da comunidade'); assert.equal(row.accessibilityState.checked, false);
  await row.onPress();
  assert.deepEqual(view.calls.find(c => c[0] === 'updateDurationSharing'), ['updateDurationSharing', true]);
  const failing = await renderNative(settings, 'default', {}, { states: { 4: false }, services: { updateDurationSharing: new Error('offline') } });
  await failing.controls.find(c => c.accessibilityRole === 'switch').onPress();
  assert.deepEqual(failing.updates.filter(([i]) => i === 4).map(([, v]) => v), [true, false]);
});

test('match detail: the duration with its method; the creator corrects it, others cannot', async () => {
  const match = { id: 'm', gameId: 'g', gameName: 'G', matchDate: '2026-10-15T20:00:00Z', creatorId: 'me', players: [{ userId: 'me', userName: 'Author' }], durationInMinutes: 48, durationMethod: 'Measured' };
  const mine = await renderNative(matchDetail, 'default', {}, { states: { 0: match, 1: false }, params: { id: 'm' } });
  assert.match(mine.html, /48 min · medida/); await mine.press('48 min · medida. Corrigir duração'); assert.deepEqual(mine.updates.find(([i]) => i === 4), [4, true]);
  const editing = await renderNative(matchDetail, 'default', {}, { states: { 0: match, 1: false, 4: true, 5: { hours: '', minutes: '50', method: 'Measured', confirmed: true } }, params: { id: 'm' }, services: { updateDuration: undefined } });
  await editing.press('Guardar');
  assert.deepEqual(editing.calls.find(c => c[0] === 'updateDuration'), ['updateDuration', 'm', 50, 'Measured']);
  const theirs = await renderNative(matchDetail, 'default', {}, { states: { 0: { ...match, creatorId: 'someone' }, 1: false }, params: { id: 'm' } });
  assert.equal(theirs.html.includes('Corrigir duração'), false);
  for (const [m, text] of [[{ durationInMinutes: 50, durationMethod: null }, '50 min · método não indicado'], [{ durationInMinutes: null, durationMethod: 'Unknown' }, 'Não sei'], [{ durationInMinutes: 0, durationMethod: null }, '0 min · método não indicado'], [{ durationInMinutes: null, durationMethod: null }, 'Sem duração']]) {
    const view = await renderNative(matchDetail, 'default', {}, { states: { 0: { ...match, ...m }, 1: false }, params: { id: 'm' } });
    assert.ok(view.html.includes(text), text);
  }
});

test('the new texts exist in Portuguese and English with the same keys', () => {
  const fs = require('node:fs');
  const keys = (v, p = '') => Object.entries(v).flatMap(([k, c]) => typeof c === 'object' ? keys(c, p + k + '.') : [p + k]);
  for (const [ns, roots] of [['matches', ['picker', 'result', 'rating', 'duration', 'when', 'review', 'modeNotice']], ['games', ['details.durations']], ['settings', ['durationSharing']]]) {
    const read = lang => JSON.parse(fs.readFileSync(`src/i18n/locales/${lang}/${ns}.json`, 'utf8'));
    for (const root of roots) {
      const pick = d => root.split('.').reduce((o, k) => o[k], d);
      assert.deepEqual(keys(pick(read('pt'))).sort(), keys(pick(read('en'))).sort(), `${ns}.${root}`);
    }
  }
});
