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
const game = { id: 'game-id', bggId: 266192, name: 'Fixture game', description: 'Fixture description', averageRating: 7.9, usersRatedCount: 1234, bggRanking: 30, meepleBoardScore: 82, minPlayers: 1, maxPlayers: 5, yearPublished: 2019,
  minPlayTime: 40, maxPlayTime: 70, minAge: 10, averageWeight: 2.48 };
// GameDetailsScreen state order: game, matches, campaigns, userRating, loading, gameError, historyLoading, historyError,
// campaignsLoading, campaignsError, allMatches, allCampaigns, fullDescription, adding, managing, area, canManage,
// friendOwners, friendsLoading, friendsError, pinned (0 top, 1 name bar, 2 name bar with the areas).
const page = (extra = {}, options = {}) => renderNative(details, 'default', {}, { ...options, states: { 0: game, 3: 6.5, 4: false, 6: false, 8: false, 18: false, ...extra } });
const resource = (id, kind, language, extra = {}) => ({ id, gameId: 'game-id', kind, printCategory: null, language, title: `Title ${id}`, author: 'Author', platform: 'YouTube',
  url: `https://example.org/${id}`, compatibility: null, isOfficial: false, isFree: null, status: 'Approved', ...extra });
const list = { language: 'pt', total: 6,
  items: [resource('rules', 'Rules', null, { isOfficial: true, platform: 'Publisher' }), resource('model', 'PrintModel', null, { printCategory: 'Organizer', platform: 'Printables', isFree: true, compatibility: 'Base game' })],
  languages: [{ code: 'en', count: 4, kinds: { Rules: 1, HowToPlay: 3 } }, { code: null, count: 2, kinds: { PrintModel: 2 } }] };
const areaProps = (extra = {}) => ({ area: 'howToPlay', gameId: 'game-id', gameName: 'Fixture game', data: list, loading: false, error: false, onRetry() {}, language: 'pt', appLanguage: 'pt', onLanguage() {}, canManage: false, ...extra });
const played = [{ id: 'm2', matchDate: '2026-10-10', personalRating: null, journalStatus: 'Open', players: [{ userId: 'me', outcome: 'Win', isWinner: true, rankPosition: 1 }, { userId: 'x', outcome: 'Loss', isWinner: false }] },
  { id: 'm1', matchDate: '2026-10-01', personalRating: 6.5, journalStatus: 'Closed', players: [{ userId: 'me', outcome: 'Loss', isWinner: false }, { userId: 'x', outcome: 'Win', isWinner: true }] }];

test('game page top: cover, name, BGG and MeepleBoard ratings apart, facts with their BGG source, actions and «Combinar sessão»', async () => {
  for (const language of ['pt', 'en']) {
    const view = await page({ 1: played }, { language });
    const t = (key, o) => view.i18n.t(key, { ns: 'games', ...o });
    for (const label of [t('details.areas.about'), t('details.areas.howToPlay'), t('details.areas.resources'), t('details.registerMatch'), t('details.addToLibrary'), t('details.planSession')])
      assert.ok(view.controls.some(c => c.accessibilityLabel === label), label);
    const decimal = language === 'pt' ? ',' : '.';
    assert.ok(view.html.includes('Fixture game') && view.html.includes('2019'), 'name and year');
    assert.ok(view.controls.some(c => c.accessibilityLabel === `BoardGameGeek: ${t('details.ratings.outOf', { value: `7${decimal}9` })}. ${language === 'pt' ? '1234 avaliações · nº 30' : '1,234 ratings · #30'}`), 'BGG tile with its count and rank');
    assert.ok(view.html.includes(`8${decimal}2`) && view.html.includes(t('details.ratings.meepleBoard')), 'MeepleBoard apart');
    assert.equal((view.html.match(/ \/10/g) || []).length, 3, 'BGG, MeepleBoard and yours, each with its scale');
    for (const fact of ['1–5', '40–70', '10+', `2${decimal}5/5`]) assert.ok(view.html.includes(fact), fact);
    assert.ok(view.html.includes(t('details.facts.source')), 'the facts name their BGG source');
    assert.ok(view.html.includes(t('details.descriptionSource')) && view.html.includes(t('details.bggEntry')));
  }
  const view = await page();
  await view.press('BoardGameGeek: 7,9 em 10. 1234 avaliações · nº 30');
  assert.deepEqual(view.calls.find(c => c[0] === 'openURL'), ['openURL', 'https://boardgamegeek.com/boardgame/266192']);
  await view.press('Registar partida');
  assert.deepEqual(view.routes.at(-1), { pathname: '/games/register-match', params: { gameId: 'game-id' } });
  await view.press('Combinar sessão');
  assert.deepEqual(view.routes.at(-1), { pathname: '/games/sessions/create', params: { gameId: 'game-id', gameName: 'Fixture game' } });
  assert.ok(!view.calls.some(c => c[0] === 'gameResources'), 'resources load only when an area opens');
  // Scrolling: past the cover a bar with the name replaces the floating back button; past the areas the bar also holds them.
  const top = await page();
  assert.equal(top.controls.filter(c => c.accessibilityLabel === 'Sobre').length, 1);
  const named = await page({ 20: 1 });
  assert.ok(named.html.includes('Fixture game') && named.controls.filter(c => c.accessibilityLabel === 'Sobre').length === 1 && named.controls.some(c => c.accessibilityLabel === 'Voltar'));
  const withAreas = await page({ 20: 2 });
  assert.equal(withAreas.controls.filter(c => c.accessibilityLabel === 'Sobre').length, 2, 'the areas stay at hand in the bar');
  const large = await page({}, { fontScale: 1.3 });
  assert.ok(large.controls.some(c => c.accessibilityLabel === 'Adicionar à biblioteca') && large.html.includes('Adicionar à biblioteca'), 'large text keeps the full action label');
});

test('without BGG data the page says so briefly; missing facts are left out and never attributed to BGG', async () => {
  const view = await page({ 0: { ...game, bggId: null, averageRating: null, meepleBoardScore: null, minPlayTime: null, maxPlayTime: null, minAge: null, averageWeight: null }, 3: null });
  assert.ok(view.html.includes('Ainda sem avaliações') && !view.html.includes('—'));
  assert.ok(!view.controls.some(c => c.accessibilityLabel === 'Abrir a página do jogo no BoardGameGeek'));
  for (const text of ['Texto original do BoardGameGeek', 'Ficha do BoardGameGeek', 'minutos', 'idade', 'complexidade']) assert.ok(!view.html.includes(text), text);
  assert.ok(view.html.includes('1–5') && view.html.includes('jogadores'), 'players stay');
  const onlyMeeple = await page({ 0: { ...game, averageRating: null } });
  assert.ok(onlyMeeple.html.includes('Sem avaliações') && onlyMeeple.html.includes('8,2'), 'a missing BGG rating next to an existing MeepleBoard one');
  // BGG without an age: that block is simply absent; one playing time shows once.
  const partial = await page({ 0: { ...game, minAge: null, minPlayTime: 30, maxPlayTime: 30, averageWeight: null } });
  assert.ok(partial.html.includes('Ficha do BoardGameGeek') && !partial.html.includes('idade') && !partial.html.includes('complexidade') && !partial.html.includes('30–30'));
  const noDescription = await page({ 0: { ...game, description: '' } });
  assert.ok(!noDescription.html.includes('Descrição') && !noDescription.html.includes('Sem descrição'), 'no empty description block');
});

test('«A tua experiência»: your rating is the average of your match ratings, with the journal; matches, wins and what waits for you', async () => {
  const view = await page({ 1: played });
  assert.ok(view.html.includes('A tua experiência') && view.html.includes('Média das tuas avaliações em 1 partida'));
  assert.match(view.html, /<span>2<\/span><span>partidas<\/span>/, 'two matches');
  assert.match(view.html, /<span>1<\/span><span>vitória<\/span>/, 'one win (yours, by your outcome)');
  assert.ok(view.html.includes('1 partida por avaliar'));
  await view.press('Avaliar a partida de 10 out. 2026');
  assert.deepEqual(view.routes.at(-1), { pathname: '/games/matches/[id]/journal', params: { id: 'm2' } });
  const done = await page({ 1: [played[1]] });
  await done.press('Ver o diário da partida de 1 out. 2026');
  assert.deepEqual(done.routes.at(-1), { pathname: '/games/matches/[id]/journal', params: { id: 'm1' } });
  assert.ok(!done.html.includes('por avaliar'));
  const loading = await page({ 6: true, 3: null });
  assert.ok(!loading.html.includes('Ainda não avaliaste') && !loading.html.includes('Ainda não jogaste'), 'no claim while loading');
  // Campaigns stay reachable, with and without matches.
  for (const matches of [played, []]) {
    const v = await page({ 1: matches });
    await v.press('Nova campanha');
    assert.equal(v.routes.at(-1), '/(app)/games/campaigns/create?gameId=game-id&gameName=Fixture%20game');
  }
});

test('«Companhia neste jogo» opens Companhia filtered by the game, from your first match to today; capped at 10 years and said so', async () => {
  const view = await page({ 1: played });
  await view.press('Companhia neste jogo');
  const route = view.routes.at(-1);
  assert.equal(route.pathname, '/statistics/company');
  assert.equal(route.params.gameId, 'game-id'); assert.equal(route.params.period, 'custom'); assert.equal(route.params.start, '2026-10-01');
  assert.ok(!route.params.historyFrom, 'not limited');
  const none = await page({ 1: [] });
  assert.ok(!none.html.includes('Companhia neste jogo'), 'without matches there is nothing to open');
  const { companyPeriod } = view.load(details);
  const today = new Date(2026, 9, 14, 12);
  assert.deepEqual(companyPeriod([{ matchDate: '2025-03-03T20:00:00Z' }, { matchDate: '2026-01-01' }], today), { start: '2025-03-03', endExclusive: '2026-10-15', first: '2025-03-03', limited: false });
  const old = companyPeriod([{ matchDate: '2012-05-12' }], today);
  assert.deepEqual(old, { start: '2016-10-07', endExclusive: '2026-10-15', first: '2012-05-12', limited: true }, '3660 days at most');
  const oldView = await page({ 1: [{ ...played[1], matchDate: '2012-05-12' }] });
  assert.ok(oldView.html.includes('Últimos 10 anos de Fixture game'));
  await oldView.press('Companhia neste jogo');
  assert.equal(oldView.routes.at(-1).params.historyFrom, '2012-05-12');
  // Companhia states it instead of presenting a partial history as complete.
  const company = await renderNative('src/features/statistics/screens/CompanyScreen.tsx', 'default', {}, { params: { start: '2016-10-07', endExclusive: '2026-10-15', timeZone: 'UTC', gameId: 'game-id', period: 'custom', historyFrom: '2012-05-12', gameName: 'Fixture game' } });
  assert.ok(company.html.includes('A tua 1.ª partida de Fixture game é de 12 de mai. de 2012. As estatísticas cobrem no máximo 10 anos: as partidas anteriores a 7 de out. de 2016 não estão incluídas.'));
  assert.ok(company.html.includes('7 out. 2016 – 14 out. 2026'), 'the period itself is shown in the selector');
  const plain = await renderNative('src/features/statistics/screens/CompanyScreen.tsx', 'default', {}, { params: { start: '2025-03-03', endExclusive: '2026-10-15', timeZone: 'UTC', gameId: 'game-id', period: 'custom' } });
  assert.ok(!plain.html.includes('no máximo 10 anos'));
});

test('regression: match history answered 204 No Content (data "") is no matches; any other non-list is an error', async () => {
  // The real DeviceTests answer for a game without matches (participante, Wingspan): HTTP 204 and an empty body,
  // which axios hands over as data "". Before the fix the service returned "" and matches.filter crashed the page.
  const responses = { history: { status: 204, data: '' } };
  const host = await renderNative(area, 'default', areaProps(), { services: { get: async url => responses[url.includes('pending') ? 'pending' : 'history'] } });
  const service = host.load('src/features/games/matches/services/matchService.ts').default;
  assert.deepEqual(await service.getHistoryByGame('game-id'), []);
  responses.pending = { status: 204, data: '' };
  assert.deepEqual(await service.getPendingJournalMatches(), []);
  const list = [{ id: 'm1', matchDate: '2026-10-01', personalRating: 7.5, journalStatus: 'Closed' }];
  responses.history = { status: 200, data: list };
  assert.deepEqual(await service.getHistoryByGame('game-id'), list);
  for (const invalid of [{ status: 200, data: '' }, { status: 200, data: { items: list } }, { status: 200, data: null }]) {
    responses.history = invalid;
    await assert.rejects(service.getHistoryByGame('game-id'), /Resposta inválida ao carregar o histórico/, JSON.stringify(invalid));
  }
  // The page in each state: loading, error (with retry), no matches, rated matches.
  const none = await page({ 1: [], 3: null });
  assert.ok(none.html.includes('Ainda não jogaste. Regista a primeira partida e avalia-a no diário.'));
  const failed = await page({ 7: true, 3: null });
  assert.ok(failed.html.includes('Não foi possível carregar os dados.') && !failed.html.includes('Ainda não avaliaste'));
  await failed.press('Tentar novamente');
  assert.ok(failed.calls.some(c => c[0] === 'getHistoryByGame'));
  const rated = await page({ 1: list });
  assert.ok(rated.html.includes('Média das tuas avaliações em 1 partida') && rated.controls.some(c => c.accessibilityLabel === 'Ver o diário da partida de 1 out. 2026'));
});

test('friends who own the game: avatar and name with profile access, «Ver todos (n)» opens the full list, quiet empty and error states', async () => {
  const friends = 'src/features/games/catalog/components/FriendOwners.tsx';
  const owners = ['Ana', 'Teste-amigo-com-um-nome-de-utilizador-bastante-comprido', 'Bruno', 'Carla', 'Duarte'].map((userName, i) => ({ userId: 'u' + i, userName, profilePictureUrl: i === 0 ? 'https://example.org/a.jpg' : null }));
  const opened = [];
  for (const language of ['pt', 'en']) {
    const view = await renderNative(friends, 'default', { owners, loading: false, error: false, onRetry() {}, onOpen: id => opened.push(id) }, { language });
    const t = (key, o) => view.i18n.t(key, { ns: 'games', ...o });
    assert.ok(view.html.includes(t('details.friends.title')));
    assert.ok(view.html.includes('Teste-amigo-com-um-nome-de-utilizador-bastante-comprido'));
    assert.ok(!view.html.includes('Carla') && !view.html.includes('Duarte'), 'three at first, then «+2»');
    assert.ok(view.html.includes('+2'));
    assert.equal(view.controls.filter(c => c.accessibilityLabel === t('details.friends.showAll', { count: 5 })).length, 2, '«Ver todos (5)» in the heading and on the «+2» tile');
    assert.equal(view.images.length, 1, 'the photo when there is one, the initial otherwise');
    assert.ok(view.html.includes(t('details.friends.note')));
    await view.press('Ana');
    await view.press(t('details.friends.showAll', { count: 5 }));
    assert.ok(view.updates.some(([index, value]) => index === 0 && value === true), 'opens the full list');
  }
  assert.deepEqual(opened, ['u0', 'u0']);
  const all = await renderNative(friends, 'default', { owners, loading: false, error: false, onRetry() {}, onOpen: id => opened.push(id) }, { states: { 0: true } });
  assert.ok(all.html.includes('Duarte') && all.html.includes('Carla'), 'the full list');
  await all.press('Duarte');
  assert.equal(opened.at(-1), 'u4');
  const four = await renderNative(friends, 'default', { owners: owners.slice(0, 4), loading: false, error: false, onRetry() {}, onOpen() {} });
  assert.ok(four.html.includes('Carla') && !four.controls.some(c => /Ver todos/.test(c.accessibilityLabel || '')), 'four fit without «Ver todos»');
  const none = await renderNative(friends, 'default', { owners: [], loading: false, error: false, onRetry() {}, onOpen() {} });
  assert.ok(none.html.includes('Sem amigos com este jogo visível na biblioteca.'));
  assert.ok(!/Nenhum amigo/.test(none.html), 'never claims that no friend owns it');
  let retried = 0;
  const failed = await renderNative(friends, 'default', { owners: null, loading: false, error: true, onRetry: () => retried++, onOpen() {} });
  await failed.press('Não foi possível carregar os amigos.');
  assert.equal(retried, 1);
  const pageView = await page({ 17: owners.slice(0, 2) });
  assert.ok(pageView.html.includes('Amigos que têm este jogo') && pageView.html.includes('Ana'));
  await pageView.press('Ana');
  assert.deepEqual(pageView.routes.at(-1), { pathname: '/friends/[id]', params: { id: 'u0' } });
});

test('expansions: each with your library state and a way to its page; «Tens n de m»; nothing when the catalogue has none', async () => {
  const expansions = [{ id: 'eu', name: 'Wingspan: European Expansion', isExpansion: true }, { id: 'oc', name: 'Wingspan: Oceania Expansion', isExpansion: true }];
  const view = await page({ 0: { ...game, expansions } }, { library: [{ gameId: 'eu', status: 1, gameName: 'Wingspan: European Expansion' }] });
  assert.ok(view.html.includes('Expansões') && view.html.includes('Tens 1 de 2'));
  assert.ok(view.controls.some(c => c.accessibilityLabel === 'Wingspan: European Expansion, Expansão, Tenho'));
  await view.press('Wingspan: Oceania Expansion, Expansão');
  assert.deepEqual(view.routes.at(-1), { pathname: '/games/details/[id]', params: { id: 'oc' } });
  const en = await page({ 0: { ...game, expansions } }, { language: 'en', library: [{ gameId: 'eu', status: 1 }] });
  assert.ok(en.html.includes('You own 1 of 2'));
  const none = await page();
  assert.ok(!none.html.includes('Expansões'));
});

test('opening How to play loads resources in the preferred language and keeps the actions at hand', async () => {
  const view = await page({ 15: 'howToPlay' }, { resources: list });
  assert.ok(view.calls.some(c => c[0] === 'gameResources' && c[1] === 'game-id' && c[2] === 'pt'));
  assert.ok(view.html.includes('Regras oficiais') && view.html.includes('Title rules'));
  assert.ok(view.controls.some(c => c.accessibilityLabel === 'Registar partida'));
});

test('resource language: one button; the user language first, then languages with resources, then All; nothing in Portuguese offers English', async () => {
  const chosen = [];
  const view = await renderNative(area, 'default', areaProps({ onLanguage: value => chosen.push(value) }));
  assert.ok(view.controls.some(c => c.accessibilityLabel === 'Idioma dos recursos: Português'));
  await view.press('Idioma dos recursos: Português');
  assert.ok(view.updates.some(([index, value]) => index === 1 && value === true), 'opens the choice');
  const sheet = await renderNative(area, 'default', areaProps({ onLanguage: value => chosen.push(value) }), { states: { 1: true } });
  const options = sheet.controls.filter(c => ['Português', 'Inglês', 'Todos'].includes(c.accessibilityLabel)).map(c => c.accessibilityLabel);
  assert.deepEqual(options, ['Português', 'Inglês', 'Todos']);
  assert.match(sheet.html, /não muda o idioma da app/);
  await sheet.press('Inglês');
  // Rules exist (language-independent here); videos only in English: empty kinds are hidden, one line offers English.
  assert.ok(view.html.includes('Regras oficiais') && !view.html.includes('Vídeos de explicação'));
  assert.ok(view.html.includes('Ainda sem partidas completas.'), 'only what exists in no language is called missing');
  await view.press('Também em Inglês (4)');
  assert.deepEqual(chosen, ['en', 'en']);
  // Nothing at all in Portuguese for the area: a single notice with the alternatives.
  const none = await renderNative(area, 'default', areaProps({ onLanguage: value => chosen.push(value), data: { ...list, items: [] } }));
  assert.equal((none.html.match(/Nada em Português\./g) || []).length, 1);
  assert.match(none.html, /Há regras e vídeos noutros idiomas/);
  await none.press('Ver em Inglês (4)');
  await none.press('Ver todos os idiomas');
  assert.deepEqual(chosen, ['en', 'en', 'en', 'all']);
});

test('3D models in a grid by category, with confirmed price only; empty categories hidden and missing kinds in one line', async () => {
  const view = await renderNative(area, 'default', areaProps({ area: 'resources' }));
  assert.match(view.html, /Organizadores e inserts/);
  assert.match(view.html, /Gratuito/);
  assert.match(view.html, /Compatível: Base game/);
  for (const empty of ['Acessórios', 'Peças de substituição', 'Melhorias decorativas', 'Pago']) assert.ok(!view.html.includes(empty), empty);
  assert.ok(view.html.includes('Ainda sem unboxings nem materiais adicionais.'));
  await view.press('Title model, Author · Printables, Gratuito, Base game');
  assert.deepEqual(view.calls.find(c => c[0] === 'openURL'), ['openURL', 'https://example.org/model']);
  const official = await renderNative(area, 'default', areaProps());
  assert.match(official.html, /Da editora/);
  const same = await renderNative('src/features/games/resources/components/ResourceRow.tsx', 'default', { resource: resource('pub', 'Rules', 'en', { author: 'Publisher', platform: 'Publisher' }) });
  assert.ok(same.html.includes('Publisher') && !same.html.includes('Publisher · Publisher'), 'author equal to platform is shown once');
  const large = await renderNative(area, 'default', areaProps({ area: 'resources', data: { ...list, items: [list.items[1], { ...list.items[1], id: 'model2', title: 'Title model2' }] } }), { fontScale: 1.3 });
  assert.ok(large.html.includes('Title model2'), 'large text: one model per row');
});

test('base game first, each expansion apart; the main video large with its real image; neutral fallback; report sits in each resource menu', async () => {
  const grouped = { language: 'all', total: 3, languages: [{ code: 'en', count: 3, kinds: { HowToPlay: 3 } }], items: [
    resource('base', 'HowToPlay', 'en', { url: 'https://www.youtube.com/watch?v=lgDgcLI2B0U' }),
    resource('eu', 'HowToPlay', 'en', { expansion: 'European Expansion', thumbnailUrl: 'https://example.org/eu.jpg' }),
    resource('oc', 'HowToPlay', 'en', { expansion: 'Oceania Expansion', url: 'https://example.org/no-image' })] };
  const view = await renderNative(area, 'default', areaProps({ data: grouped, language: 'all' }));
  const order = ['Jogo base', 'Title base', 'European Expansion', 'Title eu', 'Oceania Expansion', 'Title oc'].map(text => view.html.indexOf(text));
  assert.ok(order.every((at, i) => at >= 0 && (i === 0 || at > order[i - 1])), 'base game first, then each expansion: ' + order);
  assert.equal((view.html.match(/>Expansão</g) || []).length, 2);
  assert.deepEqual(view.images.map(i => i.source.uri), ['https://i.ytimg.com/vi/lgDgcLI2B0U/hqdefault.jpg', 'https://example.org/eu.jpg'], 'no invented image for the third');
  const single = await renderNative(area, 'default', areaProps({ data: { ...grouped, items: [grouped.items[0]] }, language: 'all' }));
  assert.ok(!single.html.includes('Jogo base'), 'no group heading without expansions');
  for (const id of ['base', 'eu']) {
    await view.press(`Mais opções: Title ${id}`);
    assert.ok(view.updates.some(([, value]) => value?.id === id), 'the menu opens for that resource: ' + id);
  }
  const menu = await renderNative(report, 'default', { resource: grouped.items[1], onClose() {} });
  assert.ok(menu.controls.some(c => c.accessibilityLabel === 'Abrir em YouTube') && menu.controls.some(c => c.accessibilityLabel === 'Reportar problema'));
  await menu.press('Reportar problema');
  assert.ok(menu.updates.some(([, value]) => value === 'report'));
});

test('suggest is always offered; manage only for administrators; an empty area is one quiet line and a suggestion', async () => {
  const user = await renderNative(area, 'default', areaProps());
  assert.ok(!user.controls.some(c => c.accessibilityLabel === 'Gerir recursos'));
  await user.press('Sugerir recurso');
  assert.deepEqual(user.routes, [{ pathname: '/games/resources/form', params: { gameId: 'game-id', gameName: 'Fixture game' } }]);
  const manager = await renderNative(area, 'default', areaProps({ canManage: true }));
  await manager.press('Gerir recursos');
  assert.deepEqual(manager.routes, [{ pathname: '/games/resources/admin', params: { gameId: 'game-id', gameName: 'Fixture game' } }]);
  const empty = await renderNative(area, 'default', areaProps({ data: { language: 'pt', items: [], languages: [], total: 0 } }));
  assert.match(empty.html, /Ainda sem regras nem vídeos\./);
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
