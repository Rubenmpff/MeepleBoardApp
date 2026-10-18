// Approved 18/10/2026: photos published with an experience. Up to 3 of your own diary photos of the match, chosen only
// here; adding any needs the confirmation under «Antes de publicar fotografias» (the server strips metadata but cannot judge
// the image). The preview is exactly what others see. Each photo can be withdrawn, or everything; withdrawing keeps it in
// the diary with the players. Moderation decisions show their reason and cannot be undone by the author. On the game page,
// others' photos open larger and can be reported; the list loads again whenever the page comes back.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const publish = 'src/features/games/experiences/screens/PublishExperienceScreen.tsx';
const section = 'src/features/games/experiences/components/GameExperiencesSection.tsx';
const panels = 'src/features/friends/components/ModerationPanels.tsx';
const photoSource = 'src/features/games/journal/components/JournalPhoto.tsx';
const key = n => String(n).repeat(64);
const diary = n => `/MeepleBoard/campaigns/matches/m/journal/photos/e1/${key(n)}`;
const match = { id: 'm', gameId: 'g', gameName: 'Wingspan', matchDate: '2026-10-17T20:30:00Z', creatorId: 'me', gameMode: 'COMPETITIVE',
  players: [{ userId: 'me', userName: 'Teste-ana' }, { userId: 'carla', userName: 'Teste-carla' }, { userId: 'bruno', userName: 'Teste-bruno' }] };
const publication = (o = {}) => ({ rated: true, rating: 6.5, showRating: false, comment: null, commentPublished: false, edited: false, publishedAt: null, hidden: false, hiddenReason: null, photos: [], ...o });
const published = (n, o = {}) => ({ id: 'p' + n, key: key(n), diaryPath: diary(n), hidden: false, hiddenReason: null, removed: false, ...o });
// PublishExperienceScreen state: 0 publication · 1 match · 2 loading · 3 showRating · 4 publishComment · 5 comment · 6 saving · 7 loadError · 8 diary photos · 9 selected · 10 consent
const screen = (states, options = {}) => renderNative(publish, 'default', {}, { params: { id: 'm' }, user: { id: 'me', userName: 'Teste-ana' },
  states: { 0: publication(), 1: match, 2: false, 8: [diary(1), diary(2), diary(3), diary(4)], ...states }, ...options });

test('choosing photos: only my diary photos of this match, at most 3, with «1 de 3 no máximo»; none chosen by default', async () => {
  const view = await screen({});
  assert.match(view.html, />Fotografias</); assert.match(view.html, /0 de 3 no máximo/);
  assert.match(view.html, /Só as tuas fotografias desta partida\. Tocar escolhe ou retira\./);
  const boxes = view.controls.filter(c => c.accessibilityLabel === 'Publicar esta fotografia');
  assert.equal(boxes.length, 4); assert.ok(boxes.every(b => !b.accessibilityState.checked), 'nothing moves to the community by itself');
  const full = await screen({ 9: [key(1), key(2), key(3)] });
  const fourth = full.controls.filter(c => c.accessibilityLabel === 'Publicar esta fotografia')[3];
  assert.ok(fourth.disabled && fourth.accessibilityState.disabled, 'a fourth cannot be chosen');
  const nothing = view.controls.find(c => c.accessibilityLabel === 'Publicar na comunidade');
  assert.equal(nothing.disabled, true, 'nothing chosen yet: «Publicar na comunidade», inactive');
  const draft = await screen({ 5: 'Só um rascunho' });
  assert.ok(draft.controls.some(c => c.accessibilityLabel === 'Guardar sem publicar' && !c.disabled), 'a comment kept without publishing');
  const none = await screen({ 8: [] });
  assert.match(none.html, /Ainda não juntaste fotografias a esta partida/);
});

test('a new photo needs the warning and the checkbox: without it nothing is sent; with it, keys and the confirmation go', async () => {
  const view = await screen({ 9: [key(2)] });
  for (const text of ['Antes de publicar fotografias', 'autorização para partilhar, incluindo de outras pessoas', 'não mostram dados pessoais',
    'O servidor retira do ficheiro a localização e outros metadados, mas não consegue avaliar o que a própria imagem mostra.',
    'Tenho autorização e confirmo que não expõe dados pessoais.', 'Confirma a autorização para publicar as fotografias.']) assert.ok(view.html.includes(text), text);
  const send = view.controls.find(c => c.accessibilityLabel === 'Publicar na comunidade');
  assert.equal(send.disabled, true, 'the checkbox is mandatory');
  const box = view.controls.find(c => c.accessibilityLabel === 'Tenho autorização e confirmo que não expõe dados pessoais.');
  assert.equal(box.accessibilityRole, 'checkbox'); assert.equal(box.accessibilityState.checked, false);
  const ready = await screen({ 9: [key(2)], 10: true }, { services: { set: publication({ photos: [published(2)] }), getMine: publication(), getJournalEntries: [] } });
  await ready.press('Publicar na comunidade');
  assert.deepEqual(ready.calls.find(c => c[0] === 'set')[2], { showRating: false, comment: null, publishComment: false, photoKeys: [key(2)], photoConsent: true });
  const already = await screen({ 0: publication({ photos: [published(2)] }), 9: [key(2)] });
  assert.doesNotMatch(already.html, /Antes de publicar fotografias/, 'no warning when nothing new is added');
});

test('preview: exactly what others see — name, rating, comment, photos and «Competitivo · 3 jogadores · out. 2026»; never the match', async () => {
  const view = await screen({ 3: true, 4: true, 5: 'Partida apertada até ao fim.', 9: [key(1)] });
  assert.match(view.html, /Como os outros veem/); assert.doesNotMatch(view.html, /A tua</, 'no personal marker in the preview');
  assert.match(view.html, /Teste-ana/); assert.match(view.html, /6,5/); assert.match(view.html, /Partida apertada até ao fim\./);
  assert.match(view.html, /Competitivo · 3 jogadores · out\. 2026/);
  assert.match(view.html, /Não publica a partida, os outros jogadores, o local nem as tuas notas\./);
  assert.doesNotMatch(view.html, /Teste-carla|Teste-bruno/);
});

test('already published: «Guardar alterações», inactive until something changes; moderation notices show the reason and stay blocked', async () => {
  const pub = publication({ showRating: true, publishedAt: '2026-10-18T10:00:00Z', photos: [published(1), published(2, { hidden: true, hiddenReason: 'AutoReports' }),
    published(3, { hidden: true, hiddenReason: 'PersonalData' }), published(4, { hidden: true, hiddenReason: 'Inappropriate', removed: true, diaryPath: null })] });
  const view = await screen({ 0: pub, 3: true, 9: [key(1), key(2)] });
  assert.match(view.html, /Publicação/); assert.match(view.html, /Publicada · 18 out\. 2026/);
  const save = view.controls.find(c => c.accessibilityLabel === 'Guardar alterações');
  assert.equal(save.disabled, true); assert.match(view.html, /Sem alterações por guardar\./);
  assert.doesNotMatch(view.html, /alteração por guardar/);
  assert.match(view.html, />Publicada</); assert.match(view.html, />Oculta até revisão</);
  assert.match(view.html, /Retirada da comunidade pela moderação · Motivo: Dados pessoais/);
  assert.match(view.html, /Removida da partida pela moderação · Motivo: Imprópria/);
  const boxes = view.controls.filter(c => c.accessibilityLabel === 'Publicar esta fotografia');
  assert.ok(boxes[2].disabled, 'a photo withdrawn by moderation cannot be chosen again');
  assert.equal(view.controls.some(c => c.accessibilityLabel === 'Retirar'), false, 'one control per content');
  assert.deepEqual(view.guards.map(g => g.enabled), [false], 'nothing to protect when leaving');
});

test('withdrawing a part is a draft: the badge, the count and the preview say so, nothing is sent until saving', async () => {
  const pub = publication({ showRating: true, publishedAt: '2026-10-18T10:00:00Z', photos: [published(1)] });
  const view = await screen({ 0: pub, 3: true, 9: [] }, { services: { set: publication({ showRating: true }) } });
  assert.match(view.html, /1 alteração por guardar/); assert.match(view.html, />Sai ao guardar</);
  assert.match(view.html, /Depois de guardar, os outros verão/);
  assert.match(view.html, /Ao guardar: a fotografia sai da comunidade e continua partilhada com os jogadores\./);
  assert.equal(view.calls.some(c => c[0] === 'set' || c[0] === 'change'), false, 'nothing changed in the community yet');
  assert.deepEqual(view.guards.map(g => g.enabled), [true], 'leaving asks first (the existing «Descartar alterações?»)');
  await view.press('Guardar alterações');
  assert.deepEqual(view.calls.find(c => c[0] === 'set')[2], { showRating: true, comment: null, publishComment: false, photoKeys: [], photoConsent: false });
  const ratingOff = await screen({ 0: pub, 3: false, 9: [key(1)] });
  assert.match(ratingOff.html, /Ao guardar: a avaliação deixa de aparecer com o teu nome\./);
});

test('«Retirar tudo da comunidade» keeps its own confirmation; withdrawn photos stay with the players', async () => {
  const view = await screen({ 0: publication({ showRating: true, publishedAt: '2026-10-18T10:00:00Z', photos: [published(1)] }), 3: true, 9: [key(1)] }, { services: { change: publication() } });
  await view.press('Retirar tudo da comunidade');
  const [, title, text, buttons] = view.calls.find(c => c[0] === 'alert');
  assert.equal(title, 'Retirar tudo da comunidade?');
  assert.match(text, /as fotografias continuam no diário, partilhadas com os jogadores/); assert.match(text, /Cópias que alguém já tenha guardado ficam fora do alcance da app/);
  assert.equal(view.calls.some(c => c[0] === 'change'), false, 'nothing before confirming');
  await buttons.find(b => b.style === 'destructive').onPress();
  assert.deepEqual(view.calls.find(c => c[0] === 'change').slice(1), ['m', 'withdraw-all']);
});

test('leaving the screen: back with unsaved changes uses the existing «Descartar alterações?»; without changes it just goes back', async () => {
  const clean = await screen({});
  await clean.press('Voltar');
  assert.deepEqual(clean.routes, ['back']); assert.equal(clean.calls.some(c => c[0] === 'alert'), false);
  const dirty = await screen({ 9: [key(1)] }, { canGoBack: false });
  await dirty.press('Voltar');
  const [, title, message, buttons] = dirty.calls.find(c => c[0] === 'alert');
  assert.equal(title, 'Descartar alterações?'); assert.match(message, /Existem alterações por guardar/);
  assert.deepEqual(buttons.map(b => b.text), ['Continuar a editar', 'Descartar e sair']);
});

test('game page: photos on an experience open larger; someone else\'s can be reported, mine cannot', async () => {
  const pub = '/MeepleBoard/experiences/11111111-1111-1111-1111-111111111111/photos/22222222-2222-2222-2222-222222222222';
  const item = { id: '11111111-1111-1111-1111-111111111111', authorName: 'Teste-carla', isMine: false, rating: 8, comment: null, mode: 'COMPETITIVE', players: 3, month: '2026-10', edited: false, canReport: false, ownMatchId: null, photos: [pub] };
  const view = await renderNative(section, 'default', { gameId: 'g' }, { experiences: { items: [item], total: 1 } });
  await view.press('Abrir fotografia de Teste-carla');
  assert.deepEqual(view.updates.at(-1)[1], { url: pub, name: 'Teste-carla', mine: false });
  const open = await renderNative(section, 'default', { gameId: 'g' }, { experiences: { items: [item], total: 1 }, stateModules: ['src/features/games/experiences/components/PublicPhotoViewer.tsx'] });
  assert.ok(open.html.includes('Teste-carla'));
  const source = open.load(photoSource).journalPhotoSource;
  assert.ok(source(pub, 'https://api.example', 't'), 'a community path loads, with the session');
  assert.equal(source('/MeepleBoard/experiences/x/photos/y', 'https://api.example', 't'), undefined, 'anything else does not');
});

test('moderation of a public photo: «Manter», «Retirar da comunidade» and «Remover da partida…», each needing a reason before deciding', async () => {
  const photo = { journalEntryId: 'e', matchId: 'm', photoKey: 'k', imagePath: '/MeepleBoard/admin/moderation/photos/e/k', ownerName: 'Teste-ana', reasons: { PersonalData: 3 }, details: [],
    lastReportAt: '2026-10-18T09:00:00Z', present: true, published: true, autoHidden: true };
  const view = await renderNative(panels, 'ModerationPhotosPanel', {}, { states: { 0: [photo], 1: false, 2: false }, services: { moderatePhoto: undefined } });
  for (const text of ['Pública', 'Dados pessoais · 3', 'Oculta da comunidade até revisão', 'Manter', 'Retirar da comunidade', 'Remover da partida…',
    '«Retirar da comunidade» deixa-a partilhada com os jogadores. «Remover da partida» apaga-a do diário (pede confirmação).']) assert.ok(view.html.includes(text), text);
  await view.press('Manter');
  assert.deepEqual(view.calls.find(c => c[0] === 'moderatePhoto').slice(2), ['keep', undefined]);
  await view.press('Retirar da comunidade');
  assert.deepEqual(view.updates.slice(-2), [[4, null], [3, { photo, decision: 'withdraw' }]], 'the reason sheet opens with no reason chosen');
  assert.equal(view.calls.filter(c => c[0] === 'moderatePhoto').length, 1, 'nothing withdrawn before a reason');
  // useList: 0 items · 1 loading · 2 error; panel: 3 deciding · 4 reason
  const sheet = await renderNative(panels, 'ModerationPhotosPanel', {}, { states: { 0: [photo], 1: false, 2: false, 3: { photo, decision: 'remove' }, 4: 'PersonalData' }, services: { moderatePhoto: undefined } });
  assert.match(sheet.html, /Escolhe o motivo\. Quem a publicou vê-o\./);
  await sheet.press('Confirmar');
  const [, title, , buttons] = sheet.calls.find(c => c[0] === 'alert');
  assert.equal(title, 'Remover fotografia?'); assert.equal(sheet.calls.some(c => c[0] === 'moderatePhoto'), false, 'removing asks first');
  await buttons[1].onPress();
  assert.deepEqual(sheet.calls.find(c => c[0] === 'moderatePhoto').slice(2), ['remove', 'PersonalData']);
});
