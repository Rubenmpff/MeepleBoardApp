// Approved 18/10/2026: the diary holds only your content; the match page holds the others. «Adicionar nota pessoal»
// («Só tu vês») opens the diary on the private note with the keyboard open; «Avaliações: 2 de 3 ↓» moves the
// match page down to «Experiências» (it does not open the diary), wherever that section is once photos and the
// rating card have loaded. Rows with something shared open «Experiência de {nome}» (rating, tags, photos — never notes);
// «Fotografias da partida» names each author («Tu» for yours) and only other people's photos can be reported.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const detail = 'src/features/games/matches/screens/MatchDetailScreen.tsx';
const journal = 'src/features/games/journal/screens/MatchJournalScreen.tsx';
const photo = (entry, n) => `/MeepleBoard/campaigns/matches/m/journal/photos/${entry}/` + String(n).repeat(64);
const match = (o = {}) => ({ id: 'm', gameId: 'g', gameName: 'Wingspan', matchDate: '2026-10-17T20:30:00Z', creatorId: 'carla', gameMode: 'COMPETITIVE',
  players: [{ userId: 'carla', userName: 'Teste-carla' }, { userId: 'me', userName: 'Teste-ana' }, { userId: 'bruno', userName: 'Teste-bruno' }], personalRating: 6.5, ...o });
const entry = (userId, userName, rating, o = {}) => ({ id: 'e-' + userId, userId, userName, personalRating: rating, notes: null, tags: '', photoUrls: [], createdAt: '2026-10-17T22:00:00Z', ...o });
const entries = () => [
  entry('me', 'Teste-ana', 6.5, { notes: 'A MINHA NOTA', photoUrls: [photo('e-me', 1)] }),
  entry('carla', 'Teste-carla', 8, { notes: 'NOTA DA CARLA', tags: 'pradaria, ovos', photoUrls: [photo('e-carla', 2), photo('e-carla', 3)] }),
];
const scroller = calls => ({ current: { scrollTo: options => calls.push(['scrollTo', options]) } });
const layout = (view, testID, y) => view.nativeViews.find(([kind, p]) => kind === 'layout' && p.testID === testID)[1].onLayout({ nativeEvent: { layout: { x: 0, y, width: 390, height: 300 } } });
const text = html => html.replace(/<[^>]+>/g, '\n');

test('my card: the note row says only «Só tu vês» and opens the diary on the note; no link to the diary for the others', async () => {
  const view = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: [entry('me', 'Teste-ana', 6.5), entries()[1]] }, params: { id: 'm' } });
  assert.match(text(view.html), /\nAdicionar nota pessoal\n+Só tu vês\n/); assert.doesNotMatch(view.html, /no teu diário/);
  assert.doesNotMatch(view.html, /Ver experiências dos participantes/);
  await view.press('Adicionar nota pessoal');
  assert.deepEqual(view.routes.at(-1), { pathname: '/games/matches/[id]/journal', params: { id: 'm', focus: 'note' } });
  const noted = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: entries() }, params: { id: 'm' } });
  assert.match(noted.html, /Só tu vês · A MINHA NOTA/, 'my own note, on my own card');
});

test('«Avaliações: 2 de 3 ↓» scrolls this page to «Experiências» at its latest position, and opens nothing', async () => {
  const calls = [];
  const view = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: entries() }, params: { id: 'm' }, refs: { 0: scroller(calls) } });
  assert.match(view.html, /Avaliações: 2 de 3</);
  layout(view, 'others-section', 980);
  layout(view, 'others-section', 1240); // the rating card and the photos arrived above: the section moved down
  await view.press('Avaliações: 2 de 3');
  assert.deepEqual(calls, [['scrollTo', { y: 1232, animated: true }]], 'to where the section is now, not where it was first');
  assert.equal(view.routes.length, 0, 'stays on the match page');
  const shortcut = view.controls.find(c => c.accessibilityLabel === 'Avaliações: 2 de 3');
  assert.equal(shortcut.accessibilityHint, 'Desloca esta página até Experiências.');
});

test('the shortcut pressed before the section is measured scrolls as soon as it is laid out', async () => {
  const calls = [];
  const view = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: entries() }, params: { id: 'm' }, refs: { 0: scroller(calls) } });
  await view.press('Avaliações: 2 de 3');
  assert.deepEqual(calls, []);
  layout(view, 'others-section', 1100);
  assert.deepEqual(calls, [['scrollTo', { y: 1092, animated: true }]]);
  layout(view, 'others-section', 1180);
  assert.equal(calls.length, 1, 'a later layout alone does not move the page');
});

test('«Experiências»: only the others; what they share, with an arrow only when there is something to open', async () => {
  const view = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: entries() }, params: { id: 'm' } });
  const t = text(view.html);
  assert.match(t, /\nExperiências\n+Avaliações: 2 de 3, incluindo a tua\n/);
  assert.match(t, /\nTeste-carla\n+2 etiquetas · 2 fotografias\n+8 \/ 10\n/);
  assert.match(t, /\nTeste-bruno\n+Ainda sem avaliação · nada partilhado\n/);
  assert.ok(view.controls.some(c => c.accessibilityLabel === 'Teste-carla, 8 de 10, 2 etiquetas · 2 fotografias'));
  assert.equal(view.controls.some(c => /Teste-bruno/.test(c.accessibilityLabel ?? '')), false, 'nothing shared: no arrow, not a button');
  assert.doesNotMatch(view.html, /NOTA DA CARLA/);
  await view.press('Teste-carla, 8 de 10, 2 etiquetas · 2 fotografias');
  assert.deepEqual(view.updates.at(-1), [10, 'carla']);
  const unrated = await renderNative(detail, 'default', {}, { states: { 0: match({ personalRating: null }), 1: false, 8: [entries()[1]] }, params: { id: 'm' } });
  assert.match(unrated.html, /Avaliações: 1 de 3</); assert.doesNotMatch(unrated.html, /incluindo a tua/);
  const ratingOnly = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: [entry('bruno', 'Teste-bruno', 7)] }, params: { id: 'm' } });
  assert.match(text(ratingOnly.html), /\nTeste-bruno\n+Nada partilhado\n+7 \/ 10\n/);
});

test('«Experiência de {nome}»: rating, tags and photos; never notes; the photos there can be reported', async () => {
  const view = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: entries(), 10: 'carla' }, params: { id: 'm' } });
  assert.match(view.html, /Experiência de Teste-carla/); assert.match(view.html, /8 \/ 10 · partilhada com os jogadores/);
  assert.match(view.html, /#pradaria/); assert.match(view.html, /#ovos/);
  assert.doesNotMatch(view.html, /NOTA DA CARLA/);
  const opens = view.controls.filter(c => c.accessibilityLabel === 'Abrir fotografia de Teste-carla');
  assert.equal(opens.length, 4, 'two in the gallery, two in the sheet');
  await opens.at(-1).onPress();
  assert.deepEqual(view.updates.slice(-2), [[10, null], [11, { url: photo('e-carla', 3), name: 'Teste-carla', mine: false }]]);
});

test('«Fotografias da partida»: every author named («Tu» for mine), report only on others\' photos; empty state', async () => {
  const view = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: entries() }, params: { id: 'm' } });
  const t = text(view.html);
  assert.match(t, /\nFotografias da partida\n+3\n/); assert.match(t, /\nTeste-carla\n+Teste-carla\n+Tu\n/, 'match order: Carla, Carla, me');
  assert.match(view.html, /Partilhadas só com os jogadores desta partida\./);
  await view.press('Abrir a tua fotografia');
  assert.deepEqual(view.updates.at(-1), [11, { url: photo('e-me', 1), name: 'Teste-ana', mine: true }]);
  const mine = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: entries(), 11: { url: photo('e-me', 1), name: 'Teste-ana', mine: true } }, params: { id: 'm' } });
  assert.match(mine.html, /A tua fotografia/); assert.doesNotMatch(mine.html, /Denunciar fotografia/);
  const empty = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: [entry('me', 'Teste-ana', 6.5), entry('carla', 'Teste-carla', 8)] }, params: { id: 'm' } });
  assert.match(empty.html, /Ainda não há fotografias\. Cada jogador pode juntar as suas no próprio diário\./);
  assert.doesNotMatch(empty.html, /Partilhadas só com os jogadores/);
});

test('large text: the match count is its own line under «Experiências», never squeezed beside the title', async () => {
  const view = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: entries() }, params: { id: 'm' }, fontScale: 2 });
  assert.match(view.html, /<span>Experiências<\/span><\/div><span>Avaliações: 2 de 3, incluindo a tua<\/span>/,
    'the section head holds only the title; the count follows as a separate line');
  assert.match(view.html, /<span>Avaliações: 2 de 3<\/span><span>ver as experiências nesta página<\/span>/, 'the shortcut wraps as a row title; «2 de 3» stays together (no-break spaces)');
});

test('diary: only my content — no «O que os outros acharam», no other person\'s tags, photos or rating', async () => {
  const view = await renderNative(journal, 'default', {}, { states: { 0: match(), 1: entries(), 2: false, 4: 6.5, 5: 'A MINHA NOTA' } });
  for (const absent of [/O que os outros acharam/, /pradaria/, /Teste-carla/, /8 \/ 10/, /Abrir fotografia de/]) assert.doesNotMatch(view.html, absent);
  assert.match(view.html, /Só tu vês/); assert.match(view.html, /Com os participantes/); assert.match(view.html, /Os participantes desta partida veem a tua avaliação/);
  assert.match(view.html, /Publicar a tua experiência/);
});

test('diary opened from the note: scrolls to the private note and opens the keyboard, once; leaving unchanged asks nothing', async () => {
  const calls = [], focused = [];
  const refs = { 0: { current: JSON.stringify([6.5, 'A MINHA NOTA', '']) }, 1: scroller(calls), 2: { current: { focus: () => focused.push('note') } } };
  const view = await renderNative(journal, 'default', {}, { states: { 0: match(), 1: entries(), 2: false, 4: 6.5, 5: 'A MINHA NOTA' }, params: { id: 'm', focus: 'note' }, refs });
  assert.ok(view.nativeViews.some(([kind, p]) => kind === 'keyboard' && p.behavior === 'padding'), 'the content moves above the keyboard');
  layout(view, 'diary-note', 260);
  assert.deepEqual(calls, [['scrollTo', { y: 244, animated: false }]]); assert.deepEqual(focused, ['note']);
  layout(view, 'diary-note', 300);
  assert.equal(focused.length, 1, 'opened once');
  assert.deepEqual(view.guards.map(g => g.enabled), [false], 'opening and focusing changed nothing');
  await view.press('Cancelar');
  assert.deepEqual(view.routes, ['back']); assert.equal(view.calls.some(c => c[0] === 'alert'), false, 'no «discard changes?» question');
  const typed = await renderNative(journal, 'default', {}, { states: { 0: match(), 1: entries(), 2: false, 4: 6.5, 5: 'A MINHA NOTA e mais' }, params: { id: 'm', focus: 'note' },
    refs: { 0: { current: JSON.stringify([6.5, 'A MINHA NOTA', '']) } } });
  assert.deepEqual(typed.guards.map(g => g.enabled), [true], 'a typed note is protected');
  const plain = await renderNative(journal, 'default', {}, { states: { 0: match(), 1: entries(), 2: false, 4: 6.5 }, params: { id: 'm' }, refs: { 1: scroller(calls), 2: { current: { focus: () => focused.push('plain') } } } });
  layout(plain, 'diary-note', 260);
  assert.equal(focused.includes('plain'), false, 'opened normally: no keyboard');
});

// Refinement approved 18/10/2026 (proposal v2): compact card, «Na comunidade» state, «Avaliações: 2 de 3», «Adicionar».
test('compact card: «Guardada» and who sees it; the rule stays explicit in the diary; the community row says what is published', async () => {
  const pub = { rated: true, rating: 6.5, showRating: true, comment: null, commentPublished: false, edited: false, publishedAt: '2026-10-18T10:00:00Z', hidden: false, hiddenReason: null,
    photos: [{ id: 'p', key: 'k', diaryPath: null, hidden: false, hiddenReason: null, removed: false }] };
  const view = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: entries(), 9: pub }, params: { id: 'm' } });
  const t = text(view.html);
  assert.match(view.html, /Guardada/); assert.match(view.html, /Os jogadores desta partida veem-na\./);
  assert.doesNotMatch(view.html, /Cada partida tem uma avaliação tua/, 'the repeated rule leaves the card');
  assert.match(t, /\nNa comunidade\n+Avaliação com o teu nome · 1 fotografia\n/);
  const none = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: entries(), 9: { ...pub, showRating: false, photos: [] } }, params: { id: 'm' } });
  assert.match(text(none.html), /\nPublicar na comunidade\n+Opcional · só com a tua confirmação\n/);
  const diary = await renderNative(journal, 'default', {}, { states: { 0: match(), 1: entries(), 2: false, 4: 6.5 } });
  assert.match(diary.html, /Guardada a .*\. Não pode ser alterada\./, 'the rule, in the diary');
  const rating = await renderNative(journal, 'default', {}, { states: { 0: match(), 1: [], 2: false, 4: 7.5, 9: true } });
  assert.match(rating.html, /Depois de guardada, esta avaliação não pode ser alterada/, 'and before confirming');
});

test('diary photos: «Fotografias · 1 de 5» and a camera tile that says «Adicionar», announced as «Adicionar fotografia»', async () => {
  const view = await renderNative(journal, 'default', {}, { states: { 0: match(), 1: entries(), 2: false, 4: 6.5 } });
  assert.match(text(view.html), /\nFotografias\n+1 de 5\n/);
  const add = view.controls.find(c => c.accessibilityLabel === 'Adicionar fotografia');
  assert.ok(add, 'the accessible label stays complete');
  assert.match(view.html, />Adicionar</); assert.doesNotMatch(view.html, />Adicionar fotografia</, 'the tile shows the short word');
});

test('coming back to the match page refreshes the note, ratings and publication (no stale «Nota pessoal» after editing in the diary)', async () => {
  const calls = [];
  const view = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: entries() }, params: { id: 'm' }, captureFocusEffects: true, refs: { 0: scroller(calls) },
    services: { getById: match(), getJournalEntries: [entry('me', 'Teste-ana', 6.5, { notes: null })], getMine: { rated: true, rating: 6.5, showRating: true, photos: [] } } });
  assert.equal(view.effects.length, 1);
  view.effects[0]();
  assert.equal(view.calls.filter(c => ['getById', 'getJournalEntries', 'getMine'].includes(c[0])).length, 0, 'the first focus is the first load');
  view.effects[0](); await new Promise(r => setTimeout(r, 0));
  assert.deepEqual(view.calls.filter(c => ['getById', 'getJournalEntries', 'getMine'].includes(c[0])).map(c => c[0]).sort(), ['getById', 'getJournalEntries', 'getMine']);
  assert.ok(view.updates.some(([i, v]) => i === 8 && Array.isArray(v) && v[0].notes === null), 'entries replaced with what the server has now');
  assert.equal(view.updates.some(([i, v]) => i === 1 && v === true), false, 'no loading state: the page keeps its place');
});

// Requested 18/10/2026: the private note through the diary and back to the match page (the server side, with disposable
// people and real SQL: tools/DeviceTestApi/verify-journal-note.cjs in the API).
test('note: save → back on the match page it shows; erase → save → the page shows none; cancel without saving keeps the previous note', async () => {
  const draft = note => ({ 0: { current: JSON.stringify([6.5, note, '']) } });
  // 1. Write and save in the diary: the note goes, as typed (trimmed).
  const write = await renderNative(journal, 'default', {}, { states: { 0: match(), 1: [entry('me', 'Teste-ana', 6.5)], 2: false, 4: 6.5, 5: ' Nova nota ' }, refs: draft(''), params: { id: 'm' },
    services: { upsertJournalEntry: undefined, getById: match(), getJournalEntries: [entry('me', 'Teste-ana', 6.5, { notes: 'Nova nota' })] } });
  await write.press('Guardar');
  assert.deepEqual(write.calls.find(c => c[0] === 'upsertJournalEntry').slice(1), ['m', { personalRating: 6.5, notes: 'Nova nota', tags: null }]);
  // 2. Back on the match page (refreshed on return): the card shows it.
  const back = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: [entry('me', 'Teste-ana', 6.5, { notes: 'Nova nota' })] }, params: { id: 'm' } });
  assert.match(text(back.html), /\nNota pessoal\n+Só tu vês · Nova nota\n/);
  // 3. Erase and save: the note goes as null.
  const erase = await renderNative(journal, 'default', {}, { states: { 0: match(), 1: [entry('me', 'Teste-ana', 6.5, { notes: 'Nova nota' })], 2: false, 4: 6.5, 5: '' }, refs: draft('Nova nota'), params: { id: 'm' },
    services: { upsertJournalEntry: undefined, getById: match(), getJournalEntries: [entry('me', 'Teste-ana', 6.5)] } });
  await erase.press('Guardar');
  assert.deepEqual(erase.calls.find(c => c[0] === 'upsertJournalEntry')[2], { personalRating: 6.5, notes: null, tags: null });
  // 4. Back on the match page: no note any more.
  const none = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: [entry('me', 'Teste-ana', 6.5)] }, params: { id: 'm' } });
  assert.match(text(none.html), /\nAdicionar nota pessoal\n+Só tu vês\n/); assert.doesNotMatch(none.html, /Nova nota/);
  // 5. Cancel after typing: «Descartar alterações?» and nothing is sent; the previous note stays on the server.
  const typed = await renderNative(journal, 'default', {}, { states: { 0: match(), 1: [entry('me', 'Teste-ana', 6.5, { notes: 'Nova nota' })], 2: false, 4: 6.5, 5: 'Nova nota e mais' }, refs: draft('Nova nota'), params: { id: 'm' },
    canGoBack: false, services: { upsertJournalEntry: undefined } });
  await typed.press('Cancelar');
  const [, title, , buttons] = typed.calls.find(c => c[0] === 'alert');
  assert.equal(title, 'Descartar alterações?'); await buttons.find(b => b.style === 'destructive').onPress();
  assert.equal(typed.calls.some(c => c[0] === 'upsertJournalEntry'), false, 'nothing saved: the previous note stays');
  // 6. Cancel without changes: straight back, nothing sent.
  const clean = await renderNative(journal, 'default', {}, { states: { 0: match(), 1: [entry('me', 'Teste-ana', 6.5, { notes: 'Nova nota' })], 2: false, 4: 6.5, 5: 'Nova nota' }, refs: draft('Nova nota'), params: { id: 'm' },
    services: { upsertJournalEntry: undefined } });
  await clean.press('Cancelar');
  assert.deepEqual(clean.routes, ['back']); assert.equal(clean.calls.some(c => c[0] === 'alert' || c[0] === 'upsertJournalEntry'), false);
});
