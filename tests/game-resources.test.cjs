// Game page areas and the resource catalogue UI: BGG attribution, ratings, language choice and
// alternatives, 3D categories, suggestions, reports and administration. Isolated services only.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');

const details = 'src/features/games/catalog/screens/GameDetailsScreen.tsx';
const area = 'src/features/games/resources/components/ResourceArea.tsx';
const form = 'src/features/games/resources/screens/ResourceFormScreen.tsx';
const admin = 'src/features/games/resources/screens/ResourceAdminScreen.tsx';
const report = 'src/features/games/resources/components/ResourceActionsSheet.tsx';
const game = { id: 'game-id', bggId: 266192, name: 'Fixture game', description: 'Fixture description', averageRating: 7.9, usersRatedCount: 1234, bggRanking: 30, meepleBoardScore: 82, minPlayers: 1, maxPlayers: 5, yearPublished: 2019 };
// GameDetailsScreen state order: game, matches, campaigns, userRating, loading, gameError, historyLoading, historyError,
// campaignsLoading, campaignsError, allMatches, allCampaigns, fullDescription, adding, managing, area, canManage,
// friendOwners, friendsLoading, friendsError.
const page = (extra = {}, options = {}) => renderNative(details, 'default', {}, { ...options, states: { 0: game, 3: 6.5, 4: false, 6: false, 8: false, 18: false, ...extra } });
const resource = (id, kind, language, extra = {}) => ({ id, gameId: 'game-id', kind, printCategory: null, language, title: `Title ${id}`, author: 'Author', platform: 'YouTube',
  url: `https://example.org/${id}`, compatibility: null, isOfficial: false, isFree: null, status: 'Approved', ...extra });
const list = { language: 'pt', total: 6,
  items: [resource('rules', 'Rules', null, { isOfficial: true, platform: 'Publisher' }), resource('model', 'PrintModel', null, { printCategory: 'Organizer', platform: 'Printables', isFree: true, compatibility: 'Base game' })],
  languages: [{ code: 'en', count: 4, kinds: { Rules: 1, HowToPlay: 3 } }, { code: null, count: 2, kinds: { PrintModel: 2 } }] };
const areaProps = (extra = {}) => ({ area: 'howToPlay', gameId: 'game-id', gameName: 'Fixture game', data: list, loading: false, error: false, onRetry() {}, language: 'pt', appLanguage: 'pt', onLanguage() {}, canManage: false, ...extra });

test('game page keeps both actions above three areas; About separates BGG, MeepleBoard and personal ratings', async () => {
  for (const language of ['pt', 'en']) {
    const view = await page({}, { language });
    const t = key => view.i18n.t(key, { ns: 'games' });
    for (const label of [t('details.areas.about'), t('details.areas.howToPlay'), t('details.areas.resources')]) assert.ok(view.controls.some(c => c.accessibilityLabel === label), label);
    assert.ok(view.controls.some(c => c.accessibilityLabel === t('details.registerMatch')));
    assert.ok(view.controls.some(c => c.accessibilityLabel === t('details.addToLibrary')));
    const decimal = language === 'pt' ? ',' : '.';
    for (const label of [`${t('details.ratings.bgg')}: 7${decimal}9`, `${t('details.ratings.meepleBoard')}: 8${decimal}2`, `${t('details.ratings.personal')}: 6${decimal}5`])
      assert.ok(view.html.includes(label.split(': ')[0]) && view.html.includes(label.split(': ')[1]), label);
    assert.ok(view.html.includes('BoardGameGeek'));
    assert.ok(view.html.includes(t('details.descriptionSource')));
    // BGG and MeepleBoard side by side with their scale; yours apart, from your match ratings.
    assert.ok(view.html.includes(t('details.ratings.title')) && view.html.includes(t('details.ratings.personal')));
    assert.equal((view.html.match(/ \/10/g) || []).length, 3, 'each value shows its scale');
    assert.ok(view.html.includes(language === 'pt' ? '1234 avaliações' : '1,234 ratings'), 'BGG count');
  }
  const view = await page();
  await view.press('Abrir a página do jogo no BoardGameGeek');
  assert.deepEqual(view.calls.find(c => c[0] === 'openURL'), ['openURL', 'https://boardgamegeek.com/boardgame/266192']);
  await view.press('Registar partida');
  assert.deepEqual(view.routes.at(-1), { pathname: '/games/register-match', params: { gameId: 'game-id' } });
  assert.ok(!view.calls.some(c => c[0] === 'gameResources'), 'resources load only when an area opens');
});

test('without BGG data the page says so instead of inventing a rating or a link', async () => {
  const view = await page({ 0: { ...game, bggId: null, averageRating: null, meepleBoardScore: null }, 3: null });
  // One simple line for the public ratings, one for yours; no dashes.
  for (const text of ['Ainda sem avaliações do BoardGameGeek nem do MeepleBoard.', 'Avalias cada partida no diário, depois de a registares.']) assert.ok(view.html.includes(text), text);
  assert.ok(!view.html.includes('—'));
  const onlyMeeple = await page({ 0: { ...game, averageRating: null } });
  assert.ok(onlyMeeple.html.includes('Sem avaliações') && onlyMeeple.html.includes('8,2'), 'a missing BGG rating next to an existing MeepleBoard one');
  assert.ok(!view.controls.some(c => c.accessibilityLabel === 'Abrir a página do jogo no BoardGameGeek'));
  assert.ok(!view.html.includes('Texto original do BoardGameGeek'));
});

test('your rating is the average of your match ratings, with a way into the journal; it never pretends to rate the game', async () => {
  const matches = [{ id: 'm2', matchDate: '2026-10-10', personalRating: null, journalStatus: 'Open' }, { id: 'm1', matchDate: '2026-10-01', personalRating: 6.5, journalStatus: 'Closed' }];
  const view = await page({ 1: matches });
  assert.ok(view.html.includes('Média das tuas avaliações em 1 partida'));
  await view.press('Avaliar a partida de 10 out. 2026');
  assert.deepEqual(view.routes.at(-1), { pathname: '/games/matches/[id]/journal', params: { id: 'm2' } });
  const done = await page({ 1: [matches[1]] });
  await done.press('Ver o diário da partida de 1 out. 2026');
  assert.deepEqual(done.routes.at(-1), { pathname: '/games/matches/[id]/journal', params: { id: 'm1' } });
  const loading = await page({ 6: true, 3: null });
  assert.ok(!loading.html.includes('Ainda não avaliaste') && !loading.html.includes('Avalias cada partida'), 'no claim while loading');
});

test('friends who have the game: a few with avatar and name, «Ver todos», profile access, simple empty and error states', async () => {
  const friends = 'src/features/games/catalog/components/FriendOwners.tsx';
  const owners = ['Ana', 'Teste-amigo-com-um-nome-de-utilizador-bastante-comprido', 'Bruno', 'Carla', 'Duarte'].map((userName, i) => ({ userId: 'u' + i, userName, profilePictureUrl: i === 0 ? 'https://example.org/a.jpg' : null }));
  const opened = [];
  for (const language of ['pt', 'en']) {
    const view = await renderNative(friends, 'default', { owners, loading: false, error: false, onRetry() {}, onOpen: id => opened.push(id) }, { language });
    const t = (key, o) => view.i18n.t(key, { ns: 'games', ...o });
    assert.ok(view.html.includes(t('details.friends.title')));
    assert.ok(view.html.includes('Teste-amigo-com-um-nome-de-utilizador-bastante-comprido'));
    assert.ok(!view.html.includes('Duarte'), 'only a few at first');
    assert.ok(view.controls.some(c => c.accessibilityLabel === t('details.friends.showAll', { count: 5 })));
    assert.equal(view.images.length, 1, 'the photo when there is one, the initial otherwise');
    await view.press('Ana');
  }
  assert.deepEqual(opened, ['u0', 'u0']);
  const all = await renderNative(friends, 'default', { owners, loading: false, error: false, onRetry() {}, onOpen() {} }, { states: { 0: true } });
  assert.ok(all.html.includes('Duarte') && all.html.includes('Mostrar menos'));
  const none = await renderNative(friends, 'default', { owners: [], loading: false, error: false, onRetry() {}, onOpen() {} });
  assert.ok(none.html.includes('Nenhum amigo tem este jogo na biblioteca.'));
  let retried = 0;
  const failed = await renderNative(friends, 'default', { owners: null, loading: false, error: true, onRetry: () => retried++, onOpen() {} });
  await failed.press('Não foi possível carregar os amigos.');
  assert.equal(retried, 1);
  const pageView = await page({ 17: owners.slice(0, 2) });
  assert.ok(pageView.html.includes('Amigos que têm este jogo') && pageView.html.includes('Ana'));
  await pageView.press('Ana');
  assert.deepEqual(pageView.routes.at(-1), { pathname: '/friends/[id]', params: { id: 'u0' } });
});

test('opening How to play loads resources in the preferred language and keeps the actions at hand', async () => {
  const view = await page({ 15: 'howToPlay' }, { resources: list });
  assert.ok(view.calls.some(c => c[0] === 'gameResources' && c[1] === 'game-id' && c[2] === 'pt'));
  assert.ok(view.html.includes('Regras oficiais') && view.html.includes('Title rules'));
  assert.ok(view.controls.some(c => c.accessibilityLabel === 'Registar partida'));
});

test('language chips: the user language first, then languages with resources, then All; nothing in Portuguese offers English', async () => {
  const chosen = [];
  const view = await renderNative(area, 'default', areaProps({ onLanguage: value => chosen.push(value) }));
  const chips = view.controls.filter(c => ['Português', 'Inglês', 'Todos'].includes(c.accessibilityLabel)).map(c => c.accessibilityLabel);
  assert.deepEqual(chips, ['Português', 'Inglês', 'Todos']);
  assert.match(view.html, /não muda o idioma da app/);
  // Rules exist (language-independent here); videos only in English: empty kinds are hidden, one line offers English.
  assert.ok(view.html.includes('Regras oficiais') && !view.html.includes('Vídeos de explicação') && !view.html.includes('Partidas completas'));
  await view.press('Também em Inglês (4)');
  assert.deepEqual(chosen, ['en']);
  // Nothing at all in Portuguese for the area: a single notice with the alternatives.
  const none = await renderNative(area, 'default', areaProps({ onLanguage: value => chosen.push(value), data: { ...list, items: [] } }));
  assert.equal((none.html.match(/Nada em Português\./g) || []).length, 1);
  assert.match(none.html, /Há regras e vídeos noutros idiomas/);
  await none.press('Ver em Inglês (4)');
  await none.press('Ver todos os idiomas');
  assert.deepEqual(chosen, ['en', 'en', 'all']);
});

test('3D models are grouped by category, show confirmed price only, and hide the empty categories', async () => {
  const view = await renderNative(area, 'default', areaProps({ area: 'resources' }));
  assert.match(view.html, /Organizadores e inserts/);
  assert.match(view.html, /Gratuito/);
  assert.match(view.html, /Compatível: Base game/);
  for (const empty of ['Acessórios', 'Peças de substituição', 'Melhorias decorativas', 'Unboxings', 'Materiais adicionais', 'Ainda sem']) assert.ok(!view.html.includes(empty), empty);
  assert.ok(!view.html.includes('Pago'));
  await view.press('Title model, Author · Printables, Gratuito, Base game');
  assert.deepEqual(view.calls.find(c => c[0] === 'openURL'), ['openURL', 'https://example.org/model']);
  const official = await renderNative(area, 'default', areaProps());
  assert.match(official.html, /Da editora/);
  const same = await renderNative('src/features/games/resources/components/ResourceRow.tsx', 'default', { resource: resource('pub', 'Rules', 'en', { author: 'Publisher', platform: 'Publisher' }) });
  assert.ok(same.html.includes('Publisher') && !same.html.includes('Publisher · Publisher'), 'author equal to platform is shown once');
});

test('base game first, each expansion apart; real thumbnails with a neutral fallback; report sits in each resource menu', async () => {
  const grouped = { language: 'all', total: 3, languages: [{ code: 'en', count: 3, kinds: { HowToPlay: 3 } }], items: [
    resource('base', 'HowToPlay', 'en', { url: 'https://www.youtube.com/watch?v=lgDgcLI2B0U' }),
    resource('eu', 'HowToPlay', 'en', { expansion: 'European Expansion', thumbnailUrl: 'https://example.org/eu.jpg' }),
    resource('oc', 'HowToPlay', 'en', { expansion: 'Oceania Expansion', url: 'https://example.org/no-image' })] };
  const view = await renderNative(area, 'default', areaProps({ data: grouped, language: 'all' }));
  const order = ['Jogo base', 'Title base', 'European Expansion', 'Title eu', 'Oceania Expansion', 'Title oc'].map(text => view.html.indexOf(text));
  assert.ok(order.every((at, i) => at >= 0 && (i === 0 || at > order[i - 1])), 'base game first, then each expansion: ' + order);
  assert.equal((view.html.match(/Expansão/g) || []).length, 2);
  assert.deepEqual(view.images.map(i => i.source.uri), ['https://i.ytimg.com/vi/lgDgcLI2B0U/hqdefault.jpg', 'https://example.org/eu.jpg'], 'no invented image for the third');
  const single = await renderNative(area, 'default', areaProps({ data: { ...grouped, items: [grouped.items[0]] }, language: 'all' }));
  assert.ok(!single.html.includes('Jogo base'), 'no group heading without expansions');
  await view.press('Mais opções: Title eu');
  assert.ok(view.updates.some(([, value]) => value?.id === 'eu'), 'the menu opens for that resource');
  const menu = await renderNative(report, 'default', { resource: grouped.items[1], onClose() {} });
  assert.ok(menu.controls.some(c => c.accessibilityLabel === 'Abrir em YouTube') && menu.controls.some(c => c.accessibilityLabel === 'Reportar problema'));
  await menu.press('Reportar problema');
  assert.ok(menu.updates.some(([, value]) => value === 'report'));
});

test('suggest is always offered; manage only for administrators; an empty area invites a suggestion', async () => {
  const user = await renderNative(area, 'default', areaProps());
  assert.ok(!user.controls.some(c => c.accessibilityLabel === 'Gerir recursos'));
  await user.press('Sugerir recurso');
  assert.deepEqual(user.routes, [{ pathname: '/games/resources/form', params: { gameId: 'game-id', gameName: 'Fixture game' } }]);
  const manager = await renderNative(area, 'default', areaProps({ canManage: true }));
  await manager.press('Gerir recursos');
  assert.deepEqual(manager.routes, [{ pathname: '/games/resources/admin', params: { gameId: 'game-id', gameName: 'Fixture game' } }]);
  const empty = await renderNative(area, 'default', areaProps({ data: { language: 'pt', items: [], languages: [], total: 0 } }));
  assert.match(empty.html, /Ainda sem regras nem vídeos/);
  assert.ok(empty.controls.some(c => c.accessibilityLabel === 'Sugerir recurso'));
  const failed = await renderNative(area, 'default', areaProps({ data: null, error: true }));
  assert.match(failed.html, /Não foi possível carregar os recursos/);
});

test('report a problem: reason, required details for Other, and the API call', async () => {
  const target = resource('rules', 'Rules', 'en');
  const view = await renderNative(report, 'default', { resource: target, onClose() {} }, { states: { 0: 'WrongLanguage', 1: '  Is in Spanish  ', 3: 'report' }, services: { report: undefined } });
  await view.press('Enviar');
  assert.deepEqual(view.calls.find(c => c[0] === 'report'), ['report', 'rules', 'WrongLanguage', 'Is in Spanish']);
  const other = await renderNative(report, 'default', { resource: target, onClose() {} }, { states: { 0: 'Other', 1: '', 3: 'report' }, services: { report: undefined } });
  await other.press('Enviar');
  assert.ok(!other.calls.some(c => c[0] === 'report'), 'Other without details is not sent');
});

test('suggestion form: validates, sends unknown price as null, and is pending; administrators save directly', async () => {
  // ResourceFormScreen state order: kind, category, language, title, author, platform, url, compatibility, official, price, saving, loading, submitted, expansion, thumbnail.
  const filled = { 0: 'PrintModel', 1: 'Accessory', 2: null, 3: 'Dice tower', 5: 'Printables', 6: 'https://www.printables.com/model/1' };
  const user = await renderNative(form, 'default', {}, { params: { gameId: 'game-id', gameName: 'Fixture game' }, states: filled, services: { suggest: {} } });
  assert.match(user.html, /A sugestão fica pendente/);
  await user.press('Enviar sugestão');
  assert.deepEqual(user.calls.find(c => c[0] === 'suggest'), ['suggest', 'game-id', { kind: 'PrintModel', printCategory: 'Accessory', language: null, title: 'Dice tower', author: null,
    platform: 'Printables', url: 'https://www.printables.com/model/1', compatibility: null, isOfficial: false, isFree: null, expansion: null, thumbnailUrl: null }]);
  const extras = await renderNative(form, 'default', {}, { params: { gameId: 'game-id' }, states: { ...filled, 13: ' Oceania Expansion ', 14: 'https://example.org/t.jpg' }, services: { suggest: {} } });
  await extras.press('Enviar sugestão');
  assert.deepEqual([extras.calls[0][2].expansion, extras.calls[0][2].thumbnailUrl], ['Oceania Expansion', 'https://example.org/t.jpg']);
  const badImage = await renderNative(form, 'default', {}, { params: { gameId: 'game-id' }, states: { ...filled, 14: 'http://example.org/t.jpg' }, services: { suggest: {} } });
  await badImage.press('Enviar sugestão');
  assert.ok(!badImage.calls.some(c => c[0] === 'suggest'), 'an http image is refused');
  const invalid = await renderNative(form, 'default', {}, { params: { gameId: 'game-id' }, states: { ...filled, 6: 'http://insecure.example' }, services: { suggest: {} } });
  await invalid.press('Enviar sugestão');
  assert.ok(!invalid.calls.some(c => c[0] === 'suggest'), 'http is refused before sending');
  const missingCategory = await renderNative(form, 'default', {}, { params: { gameId: 'game-id' }, states: { ...filled, 1: null }, services: { suggest: {} } });
  await missingCategory.press('Enviar sugestão');
  assert.ok(!missingCategory.calls.some(c => c[0] === 'suggest'));
  const create = await renderNative(form, 'default', {}, { params: { gameId: 'game-id', admin: '1' }, states: { ...filled, 9: 'free' }, services: { create: {} } });
  assert.ok(!create.html.includes('pendente'));
  await create.press('Guardar');
  assert.equal(create.calls.find(c => c[0] === 'create')[2].isFree, true);
});

test('administration: approve, withdraw with a note, remove only after confirmation, resolve reports', async () => {
  const pending = { resource: resource('p1', 'HowToPlay', 'pt', { status: 'Pending' }), gameName: 'Fixture game', suggestedBy: 'Teste-participante', createdAt: '2026-10-12T08:00:00Z', reviewedAt: null, reviewNote: null, openReports: 0 };
  const approved = { ...pending, resource: { ...pending.resource, id: 'a1', status: 'Approved' }, suggestedBy: null, openReports: 2 };
  const reports = [{ id: 'r1', resourceId: 'a1', resourceTitle: 'Title a1', gameName: 'Fixture game', gameId: 'game-id', url: 'https://example.org/a1', reason: 'BrokenLink', comment: 'Dead', reportedBy: 'Teste-autor', createdAt: '2026-10-12T08:00:00Z' }];
  // ResourceAdminScreen state order: tab, items, reports, loading, error, busy, rejecting, note.
  const base = { 1: [pending, approved], 2: reports, 3: false };
  const queue = await renderNative(admin, 'default', {}, { params: { gameId: 'game-id', gameName: 'Fixture game' }, states: base, services: { approve: {}, review: [], reports: [] } });
  assert.match(queue.html, /Sugerido por Teste-participante/);
  await queue.press('Aprovar');
  assert.ok(queue.calls.some(c => c[0] === 'approve' && c[1] === 'p1'));
  const live = await renderNative(admin, 'default', {}, { params: { gameId: 'game-id' }, states: { ...base, 0: 'Approved' }, services: { remove: undefined, review: [], reports: [] } });
  assert.match(live.html, /2 relatos por resolver/);
  await live.press('Remover');
  assert.ok(!live.calls.some(c => c[0] === 'remove'), 'removal waits for confirmation');
  const alert = live.calls.filter(c => c[0] === 'alert').at(-1);
  await alert[3].find(b => b.style === 'destructive').onPress();
  assert.ok(live.calls.some(c => c[0] === 'remove' && c[1] === 'a1'));
  const withdraw = await renderNative(admin, 'default', {}, { params: { gameId: 'game-id' }, states: { ...base, 0: 'Approved', 6: approved, 7: ' Outdated ' }, services: { reject: {}, review: [], reports: [] } });
  await withdraw.press('Confirmar');
  assert.ok(withdraw.calls.some(c => c[0] === 'reject' && c[1] === 'a1' && c[2] === 'Outdated'));
  const open = await renderNative(admin, 'default', {}, { states: { ...base, 0: 'Reports' }, services: { resolveReport: undefined, review: [], reports: [] } });
  assert.match(open.html, /Teste-autor · O link não funciona/);
  await open.press('Marcar como resolvido');
  assert.ok(open.calls.some(c => c[0] === 'resolveReport' && c[1] === 'r1'));
});
