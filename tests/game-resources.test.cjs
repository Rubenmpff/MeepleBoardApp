// Game page areas and the resource catalogue UI: BGG attribution, ratings, language choice and
// alternatives, 3D categories, suggestions, reports and administration. Isolated services only.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');

const details = 'src/features/games/catalog/screens/GameDetailsScreen.tsx';
const area = 'src/features/games/resources/components/ResourceArea.tsx';
const form = 'src/features/games/resources/screens/ResourceFormScreen.tsx';
const admin = 'src/features/games/resources/screens/ResourceAdminScreen.tsx';
const report = 'src/features/games/resources/components/ReportResourceSheet.tsx';
const game = { id: 'game-id', bggId: 266192, name: 'Fixture game', description: 'Fixture description', averageRating: 7.9, usersRatedCount: 1234, bggRanking: 30, meepleBoardScore: 82, minPlayers: 1, maxPlayers: 5, yearPublished: 2019 };
// GameDetailsScreen state order: game, matches, campaigns, userRating, loading, gameError, historyLoading, historyError,
// campaignsLoading, campaignsError, allMatches, allCampaigns, fullDescription, adding, managing, area, canManage.
const page = (extra = {}, options = {}) => renderNative(details, 'default', {}, { ...options, states: { 0: game, 3: 6.5, 4: false, 6: false, 8: false, ...extra } });
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
  for (const text of ['Sem avaliação no BoardGameGeek', 'Ainda sem avaliações no MeepleBoard', 'Ainda não avaliaste este jogo']) assert.ok(view.html.includes(text), text);
  assert.ok(!view.controls.some(c => c.accessibilityLabel === 'Abrir a página do jogo no BoardGameGeek'));
  assert.ok(!view.html.includes('Texto original do BoardGameGeek'));
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
  assert.match(view.html, /Independente do idioma da app/);
  // Rules exist (official, language-independent here); videos only in English: one compact line per empty group.
  assert.match(view.html, /Nada em Português\./);
  await view.press('Ver em Inglês (3)');
  assert.deepEqual(chosen, ['en']);
  assert.match(view.html, /Partidas completas/);
  assert.match(view.html, /Ainda não há nenhum para este jogo/, 'no playthrough in any language');
  // Nothing at all in Portuguese for the area: a single notice with the alternatives.
  const none = await renderNative(area, 'default', areaProps({ onLanguage: value => chosen.push(value), data: { ...list, items: [] } }));
  assert.equal((none.html.match(/Nada em Português\./g) || []).length, 1);
  assert.match(none.html, /Há regras e vídeos noutros idiomas/);
  await none.press('Ver em Inglês (4)');
  await none.press('Ver todos os idiomas');
  assert.deepEqual(chosen, ['en', 'en', 'all']);
});

test('3D models are grouped by category, show confirmed price only, and name the empty categories', async () => {
  const view = await renderNative(area, 'default', areaProps({ area: 'resources' }));
  assert.match(view.html, /Organizadores e inserts/);
  assert.match(view.html, /Gratuito/);
  assert.match(view.html, /Compatível: Base game/);
  assert.match(view.html, /Ainda sem: Acessórios, Peças de substituição, Melhorias decorativas\./);
  assert.ok(!view.html.includes('Pago'));
  await view.press('Title model, Author · Printables, Gratuito');
  assert.deepEqual(view.calls.find(c => c[0] === 'openURL'), ['openURL', 'https://example.org/model']);
  const official = await renderNative(area, 'default', areaProps());
  assert.match(official.html, /Da editora/);
  const same = await renderNative('src/features/games/resources/components/ResourceRow.tsx', 'default', { resource: resource('pub', 'Rules', 'en', { author: 'Publisher', platform: 'Publisher' }) });
  assert.ok(same.html.includes('Publisher') && !same.html.includes('Publisher · Publisher'), 'author equal to platform is shown once');
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
  const view = await renderNative(report, 'default', { resource: target, onClose() {} }, { states: { 0: 'WrongLanguage', 1: '  Is in Spanish  ' }, services: { report: undefined } });
  await view.press('Enviar');
  assert.deepEqual(view.calls.find(c => c[0] === 'report'), ['report', 'rules', 'WrongLanguage', 'Is in Spanish']);
  const other = await renderNative(report, 'default', { resource: target, onClose() {} }, { states: { 0: 'Other', 1: '' }, services: { report: undefined } });
  await other.press('Enviar');
  assert.ok(!other.calls.some(c => c[0] === 'report'), 'Other without details is not sent');
});

test('suggestion form: validates, sends unknown price as null, and is pending; administrators save directly', async () => {
  // ResourceFormScreen state order: kind, category, language, title, author, platform, url, compatibility, official, price, saving, loading, submitted.
  const filled = { 0: 'PrintModel', 1: 'Accessory', 2: null, 3: 'Dice tower', 5: 'Printables', 6: 'https://www.printables.com/model/1' };
  const user = await renderNative(form, 'default', {}, { params: { gameId: 'game-id', gameName: 'Fixture game' }, states: filled, services: { suggest: {} } });
  assert.match(user.html, /A sugestão fica pendente/);
  await user.press('Enviar sugestão');
  assert.deepEqual(user.calls.find(c => c[0] === 'suggest'), ['suggest', 'game-id', { kind: 'PrintModel', printCategory: 'Accessory', language: null, title: 'Dice tower', author: null,
    platform: 'Printables', url: 'https://www.printables.com/model/1', compatibility: null, isOfficial: false, isFree: null }]);
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
