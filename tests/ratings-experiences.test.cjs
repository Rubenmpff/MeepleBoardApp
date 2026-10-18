// Approved 16/10/2026: one closed rating per experience, the diary, the match detail card, the MeepleBoard tile
// with counts, publishing experiences (rating and comment apart), the game-page section, reports and moderation.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { renderNative } = require('./helpers/renderNative.cjs');
const journal = 'src/features/games/journal/screens/MatchJournalScreen.tsx';
const detail = 'src/features/games/matches/screens/MatchDetailScreen.tsx';
const publish = 'src/features/games/experiences/screens/PublishExperienceScreen.tsx';
const hero = 'src/features/games/catalog/components/GameHero.tsx';
const section = 'src/features/games/experiences/components/GameExperiencesSection.tsx';
const card = 'src/features/games/experiences/components/ExperienceCard.tsx';
const moderation = 'src/features/games/experiences/screens/ExperienceModerationScreen.tsx';
const rankings = 'src/features/games/catalog/screens/RankingsScreen.tsx';
const match = { id: 'm', gameId: 'g', gameName: 'Wingspan', matchDate: '2026-10-15T20:30:00Z', creatorId: 'me', gameMode: 'COMPETITIVE', players: [{ userId: 'me', userName: 'Author' }, { userId: 'peer', userName: 'Peer' }, { userId: 'third', userName: 'Third' }] };
const mine = (rating, notes = '') => ({ id: 'e1', userId: 'me', userName: 'Author', personalRating: rating, notes, tags: '', photoUrls: [], createdAt: '2026-10-15T21:00:00Z' });
const peer = { id: 'e2', userId: 'peer', userName: 'Peer', personalRating: 9, tags: 'épico', photoUrls: [], createdAt: '2026-10-15T21:00:00Z' };
const publication = (o = {}) => ({ rated: true, rating: 7.5, showRating: false, comment: null, commentPublished: false, edited: false, publishedAt: null, hidden: false, hiddenReason: null, ...o });

test('diary: a saved rating (zero included) is closed; the note and tags still save; the others are a discreet count', async () => {
  const view = await renderNative(journal, 'default', {}, { states: { 0: match, 1: [mine(0), peer], 2: false, 4: 0 } });
  assert.match(view.html, /2 de 3 participantes avaliaram/); assert.doesNotMatch(view.html, /Aberto|Fechado</, 'no open/closed status');
  assert.match(view.html, /Fechada/); assert.match(view.html, />0</); assert.match(view.html, /Não pode ser alterada/);
  assert.equal(view.controls.some(c => c.accessibilityLabel === 'Mais meio ponto'), false, 'no rating control once saved');
  assert.match(view.html, /Só tu vês/); assert.match(view.html, /Com os participantes/); assert.match(view.html, /Publicar a tua experiência/);
  const texts = await renderNative(journal, 'default', {}, { states: { 0: match, 1: [mine(0), peer], 2: false, 4: 0, 5: 'Nota nova' }, services: { upsertJournalEntry: undefined } });
  await texts.press('Guardar');
  assert.deepEqual(texts.calls.find(c => c[0] === 'upsertJournalEntry')[2], { personalRating: 0, notes: 'Nota nova', tags: null }, 'the saved rating is sent unchanged');
});

test('diary: before rating, the rule is explained, a confirmation is required and nothing is saved until then', async () => {
  const view = await renderNative(journal, 'default', {}, { states: { 0: match, 1: [peer], 2: false, 4: 8 } });
  assert.match(view.html, /Depois de guardada, esta avaliação fica fechada/); assert.match(view.html, /1 de 3 participantes avaliaram/);
  await view.press('Confirmar avaliação');
  assert.deepEqual(view.updates.find(([i]) => i === 9), [9, true]); assert.equal(view.calls.some(c => c[0] === 'upsertJournalEntry'), false);
  const sheet = await renderNative(journal, 'default', {}, { states: { 0: match, 1: [peer], 2: false, 4: 8, 9: true }, services: { upsertJournalEntry: undefined } });
  assert.match(sheet.html, /não pode ser alterada\. Uma nova avaliação só com outra partida/);
  await sheet.press('Voltar a ajustar'); assert.deepEqual(sheet.updates.find(([i]) => i === 9), [9, false]);
  await sheet.press('Guardar avaliação'); assert.equal(sheet.calls.find(c => c[0] === 'upsertJournalEntry')[2].personalRating, 8);
  const conflict = await renderNative(journal, 'default', {}, { states: { 0: match, 1: [peer], 2: false, 4: 8, 9: true }, services: { upsertJournalEntry: new Error('A tua avaliação desta partida já foi guardada e não pode ser alterada.') } });
  await conflict.press('Guardar avaliação'); assert.match(conflict.calls.find(c => c[0] === 'alert')[2], /não pode ser alterada/);
});

test('match detail: «A tua avaliação» in prominence — closed once given, «Avaliar» before; note and publishing are secondary', async () => {
  const rated = await renderNative(detail, 'default', {}, { states: { 0: match, 1: false, 8: [mine(7.5), peer], 9: publication({ showRating: true, comment: 'x', commentPublished: true }) }, params: { id: 'm' } });
  assert.match(rated.html, /A tua avaliação/i); assert.match(rated.html, /7,5/); assert.match(rated.html, /Guardada/); assert.doesNotMatch(rated.html, /Editar avaliação/);
  assert.match(rated.html, /Adicionar nota pessoal/); assert.match(rated.html, /Na comunidade/); assert.match(rated.html, /Avaliação com o teu nome · Comentário/); assert.match(rated.html, /Avaliações: 2 de 3/);
  const unrated = await renderNative(detail, 'default', {}, { states: { 0: match, 1: false, 8: [peer] }, params: { id: 'm' } });
  assert.match(unrated.html, /É a única coisa que o diário pede/);
  await unrated.press('Avaliar'); assert.equal(unrated.routes.at(-1).pathname, '/games/matches/[id]/journal');
});

test('publishing: rating and comment are separate explicit choices; the preview shows only what is published', async () => {
  const both = await renderNative(publish, 'default', {}, { states: { 0: publication(), 1: match, 2: false, 3: true, 4: true, 5: 'Partida equilibrada.' }, params: { id: 'm' }, user: { id: 'me', userName: 'Author' }, services: { set: publication({ showRating: true, comment: 'Partida equilibrada.', commentPublished: true }) } });
  assert.match(both.html, /Assim vai aparecer/); assert.match(both.html, /Author/); assert.match(both.html, /7,5/); assert.match(both.html, /Competitivo · 3 jogadores/);
  assert.doesNotMatch(both.html, /Peer|Third/, 'no other participants in the preview');
  await both.press('Publicar na comunidade');
  assert.deepEqual(both.calls.find(c => c[0] === 'set')[2], { showRating: true, comment: 'Partida equilibrada.', publishComment: true, photoKeys: [], photoConsent: false }, 'no photo unless chosen');
  const commentOnly = await renderNative(publish, 'default', {}, { states: { 0: publication(), 1: match, 2: false, 3: false, 4: true, 5: 'Só o texto' }, params: { id: 'm' }, user: { id: 'me', userName: 'Author' } });
  assert.doesNotMatch(commentOnly.html, />7,5</, 'the rating is not shown when not chosen');
  const nothing = await renderNative(publish, 'default', {}, { states: { 0: publication(), 1: match, 2: false } , params: { id: 'm' } });
  assert.equal(nothing.controls.find(c => c.accessibilityLabel === 'Guardar sem publicar').disabled, true, 'nothing published by default');
  const unrated = await renderNative(publish, 'default', {}, { states: { 0: publication({ rated: false, rating: null }), 1: match, 2: false }, params: { id: 'm' } });
  assert.match(unrated.html, /Avalia a partida antes de publicar/);
});

test('publishing: withdrawing the rating or the comment, or deleting it, never changes the saved rating', async () => {
  const pub = publication({ showRating: true, comment: 'Texto', commentPublished: true, publishedAt: '2026-10-16T10:00:00Z' });
  const view = await renderNative(publish, 'default', {}, { states: { 0: pub, 1: match, 2: false, 3: true, 4: true, 5: 'Texto' }, params: { id: 'm' }, services: { change: publication() } });
  assert.match(view.html, /Retirar ou apagar não muda a tua avaliação guardada \(7,5\)/);
  const withdraws = view.controls.filter(c => c.accessibilityLabel === undefined && c.accessibilityRole === 'button');
  assert.ok(withdraws.length >= 2);
  await view.press('Apagar comentário');
  const alert = view.calls.find(c => c[0] === 'alert'); assert.match(alert[2], /A tua avaliação e a tua nota pessoal ficam/);
  await alert[3].find(b => b.style === 'destructive').onPress();
  assert.deepEqual(view.calls.find(c => c[0] === 'change'), ['change', 'm', 'delete-comment']);
  const hidden = await renderNative(publish, 'default', {}, { states: { 0: publication({ comment: 'x', hidden: true, hiddenReason: 'PersonalData' }), 1: match, 2: false }, params: { id: 'm' } });
  assert.match(hidden.html, /Oculto pela moderação/); assert.match(hidden.html, /Dados pessoais de alguém/); assert.match(hidden.html, /A tua avaliação continua a contar/);
});

test('MeepleBoard tile: from the first rating, with counts; «Poucas avaliações» below 5; «Como se calcula» without promising anonymity', async () => {
  const game = { id: 'g', name: 'Wingspan', meepleBoardScore: 74, meepleBoardRatingsCount: 28, meepleBoardRaters: 9, averageRating: 8, bggId: 1 };
  const many = await renderNative(hero, 'default', { game, language: 'pt', onOpenBgg() {}, topInset: 0 });
  assert.match(many.html, /7,4/); assert.match(many.html, /28 avaliações/); assert.match(many.html, /9 jogadores/); assert.doesNotMatch(many.html, /Poucas avaliações/);
  const few = await renderNative(hero, 'default', { game: { ...game, meepleBoardScore: 60, meepleBoardRatingsCount: 1, meepleBoardRaters: 1 }, language: 'pt', onOpenBgg() {}, topInset: 0 });
  assert.match(few.html, /1 avaliação/); assert.match(few.html, /1 jogador/); assert.match(few.html, /Poucas avaliações/);
  await few.press('MeepleBoard: 6,0 em 10, 1 avaliação, 1 jogador. Poucas avaliações');
  assert.deepEqual(few.updates.find(([i]) => i === 0), [0, true]);
  const sheet = await renderNative(hero, 'default', { game, language: 'pt', onOpenBgg() {}, topInset: 0 }, { states: { 0: true } });
  assert.match(sheet.html, /não mostra nomes nem partidas/); assert.match(sheet.html, /pode deduzir notas/); assert.match(sheet.html, /não oficiais/);
  assert.doesNotMatch(sheet.html, /impossível|anónima garantida/, 'no promise of anonymity');
});

test('game page: experiences with rating and/or comment, discreet empty state, «Ver todas» above 3; no match, participants or place', async () => {
  const items = [{ id: 'x1', authorName: 'Teste-amiga', isMine: false, rating: 9, comment: 'Adoro', mode: 'COMPETITIVE', players: 3, month: '2026-10', edited: false, canReport: true, ownMatchId: null },
    { id: 'x2', authorName: 'Teste-dados', isMine: false, rating: null, comment: 'Só texto', mode: 'SOLO', players: 1, month: '2026-09', edited: true, canReport: true, ownMatchId: null },
    { id: 'x3', authorName: 'Author', isMine: true, rating: 7.5, comment: null, mode: 'COOPERATIVE', players: 4, month: '2026-08', edited: false, canReport: false, ownMatchId: 'm' }];
  const view = await renderNative(section, 'default', { gameId: 'g' }, { experiences: { items, total: 12 } });
  for (const text of ['Experiências da comunidade', 'Adoro', 'Só texto', 'Competitivo · 3 jogadores', 'Editado', 'A tua', 'Ver todas (12)', 'Não mostram com quem jogaram nem onde']) assert.ok(view.html.includes(text), text);
  const empty = await renderNative(section, 'default', { gameId: 'g' }, { experiences: { items: [], total: 0 } });
  assert.match(empty.html, /Ainda sem experiências publicadas/); assert.doesNotMatch(empty.html, /Ver todas/);
  const one = await renderNative(card, 'default', { item: items[1] });
  assert.doesNotMatch(one.html, /\/10/, 'no rating when not published');
});

test('moderation: reasons and counts; keep, hide with a reason, restore; ratings untouched', async () => {
  const reported = [{ id: 'p1', authorName: 'Teste-alheio', gameName: 'Wingspan', rating: null, comment: '[texto]', reasons: { PersonalData: 3 }, hidden: true, hiddenReason: 'AutoReports' },
    { id: 'p2', authorName: 'Teste-dados', gameName: 'Wingspan', rating: 6.5, comment: 'Fora do tema', reasons: { OffTopic: 1 }, hidden: false, hiddenReason: null }];
  const view = await renderNative(moderation, 'default', {}, { states: { 0: reported, 1: false }, services: { moderate: undefined } });
  for (const text of ['2 comentários com denúncias abertas', 'Dados pessoais de alguém · 3', 'Oculto até revisão', 'Não é sobre o jogo · 1']) assert.ok(view.html.includes(text), text);
  await view.press('Repor'); await view.press('Manter');
  assert.deepEqual(view.calls.filter(c => c[0] === 'moderate').map(c => c.slice(1, 3)), [['p1', 'restore'], ['p2', 'keep']]);
});

test('rankings: equal means share the position from the API; the entry rule is explained', async () => {
  const data = [{ id: 'a', name: 'A', meepleBoardScore: 80, meepleBoardRatingsCount: 9, meepleBoardRank: 1 }, { id: 'b', name: 'B', meepleBoardScore: 80, meepleBoardRatingsCount: 6, meepleBoardRank: 1 }, { id: 'c', name: 'C', meepleBoardScore: 70, meepleBoardRatingsCount: 5, meepleBoardRank: 3 }];
  const view = await renderNative(rankings, 'default', {}, { states: { 1: data, 4: false } });
  assert.match(view.html, /pelo menos 5 avaliações de 3 jogadores/);
  const badges = [...view.html.matchAll(/>(\d)<\/span>/g)].map(m => m[1]);
  assert.ok(badges.join(',').startsWith('1,1,3'), 'positions 1, 1, 3: ' + badges.join(','));
});

test('the new texts exist in Portuguese and English with the same keys', () => {
  const keys = (v, p = '') => Object.entries(v).flatMap(([k, c]) => typeof c === 'object' ? keys(c, p + k + '.') : [p + k]);
  for (const [ns, roots] of [['matches', ['diary', 'detailCard', 'publish']], ['games', ['ratingsInfo', 'experiences', 'moderation']]]) {
    const read = lang => JSON.parse(fs.readFileSync(`src/i18n/locales/${lang}/${ns}.json`, 'utf8'));
    for (const root of roots) assert.deepEqual(keys(read('pt')[root]).sort(), keys(read('en')[root]).sort(), `${ns}.${root}`);
  }
});
