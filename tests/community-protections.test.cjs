// Approved 18/10/2026 (docs/proposta-bloqueio-comunidade.md): block and report from a profile or search, blocked people
// in Definições, the photo report, the neutral state of an invitation a block made unavailable, moderation of people and
// photos, and the sign-in message of a suspended account. The server applies the rules (verify-community.cjs).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const axios = require('axios');
const { renderNative } = require('./helpers/renderNative.cjs');
const menu = 'src/features/friends/components/FriendActionsMenu.tsx';
const blocked = 'src/features/friends/screens/BlockedPeopleScreen.tsx';
const panels = 'src/features/friends/components/ModerationPanels.tsx';
const sessionDetail = 'src/features/games/sessions/screens/GameSessionDetailScreen.tsx';
const journal = 'src/features/games/journal/screens/MatchJournalScreen.tsx';
const detail = 'src/features/games/matches/screens/MatchDetailScreen.tsx';

test('person menu: «Denunciar» and «Bloquear» for anyone; «Remover amigo» only for friends; PT/EN', async () => {
  const stranger = await renderNative(menu, 'FriendActionsMenu', { onReport() {}, onBlock() {} }, { states: { 0: true } });
  assert.match(stranger.html, /Denunciar/); assert.match(stranger.html, /Bloquear/); assert.doesNotMatch(stranger.html, /Remover/);
  const calls = [];
  const friend = await renderNative(menu, 'FriendActionsMenu', { onRemove: () => calls.push('remove'), onReport: () => calls.push('report'), onBlock: () => calls.push('block') }, { states: { 0: true } });
  assert.match(friend.html, /Remover/);
  await friend.press('Bloquear'); await friend.press('Denunciar');
  assert.deepEqual(calls, ['block', 'report']);
  const en = await renderNative(menu, 'FriendActionsMenu', { onReport() {}, onBlock() {} }, { states: { 0: true }, language: 'en' });
  assert.match(en.html, /Report/); assert.match(en.html, /Block/);
});

test('blocked people: empty state; each row unblocks only after confirming; the friendship does not come back', async () => {
  const empty = await renderNative(blocked, 'default', {}, { states: { 0: [], 1: false, 2: false } });
  assert.match(empty.html, /Não bloqueaste ninguém/);
  const list = await renderNative(blocked, 'default', {}, { states: { 0: [{ id: 'x', userName: 'Rita', blockedAt: '2026-10-18T09:00:00Z' }], 1: false, 2: false } });
  assert.match(list.html, /Rita/); assert.match(list.html, /Desbloquear não restaura a amizade/);
  await list.press('Desbloquear Rita');
  const alert = list.calls.find(c => c[0] === 'alert');
  assert.equal(alert[1], 'Desbloquear Rita?'); assert.match(alert[2], /A amizade não volta automaticamente/);
  assert.equal(list.calls.some(c => c[0] === 'unblock'), false, 'nothing until confirmed');
});

test('session: a pending invitation a block made unavailable shows a neutral text and no «Aceitar»', async () => {
  const session = { id: 's', name: 'Noite de jogos', organizerId: 'other', status: 'Upcoming', scheduledStartDate: '2026-10-20T20:00:00Z', inviteAvailable: false,
    players: [{ userId: 'other', userName: 'Org', isOrganizer: true, status: 1 }, { userId: 'me', userName: 'Me', isOrganizer: false, status: 0 }], matches: [] };
  const view = await renderNative(sessionDetail, 'default', {}, { states: { 0: session, 1: false }, params: { id: 's' } });
  assert.match(view.html, /Este convite já não está disponível/);
  assert.equal(view.controls.some(c => /^Aceitar/.test(c.accessibilityLabel ?? c.title ?? '')), false);
  assert.doesNotMatch(view.html, />Aceitar</);
  const available = await renderNative(sessionDetail, 'default', {}, { states: { 0: { ...session, inviteAvailable: true }, 1: false }, params: { id: 's' } });
  assert.match(available.html, /Aceitar/); assert.doesNotMatch(available.html, /já não está disponível/);
});

test('match page: another participant\'s photo opens larger with «Denunciar fotografia», and its reasons sheet', async () => {
  const match = { id: 'm', gameId: 'g', gameName: 'Wingspan', matchDate: '2026-10-15T20:30:00Z', creatorId: 'me', players: [{ userId: 'me', userName: 'Me' }, { userId: 'peer', userName: 'Peer' }] };
  const photo = '/MeepleBoard/campaigns/matches/m/journal/photos/e2/' + 'a'.repeat(64);
  const peer = { id: 'e2', userId: 'peer', userName: 'Peer', personalRating: 9, tags: '', photoUrls: [photo], createdAt: '2026-10-15T21:00:00Z' };
  const view = await renderNative(detail, 'default', {}, { states: { 0: match, 1: false, 8: [peer] }, params: { id: 'm' } });
  await view.press('Abrir fotografia de Peer');
  assert.ok(view.updates.some(([, value]) => value?.url === photo && value?.name === 'Peer' && value?.mine === false), 'opens the viewer with the author');
  const viewer = await renderNative(detail, 'default', {}, { states: { 0: match, 1: false, 8: [peer], 11: { url: photo, name: 'Peer', mine: false } }, params: { id: 'm' } });
  assert.match(viewer.html, /Denunciar fotografia/); assert.match(viewer.html, /Fotografia de Peer/);
  const sheet = await renderNative(detail, 'default', {}, { states: { 0: match, 1: false, 8: [peer], 12: photo }, params: { id: 'm' } });
  for (const reason of ['Imprópria', 'Dados pessoais', 'Assédio', 'Spam', 'Outro']) assert.match(sheet.html, new RegExp(reason));
  assert.match(sheet.html, /nada é apagado automaticamente/);
});

test('moderation: people with reasons, «Arquivar» and «Suspender…»; a suspended person only «Levantar suspensão»; photos keep or remove', async () => {
  const person = { userId: 'p', userName: 'Pessoa', reasons: { Harassment: 2 }, details: ['Mensagens insistentes'], lastReportAt: '2026-10-18T09:00:00Z', suspended: false, suspendedAt: null, suspendedUntil: null, suspensionReason: null };
  const people = await renderNative(panels, 'ModerationPeoplePanel', {}, { states: { 0: [person], 1: false, 2: false } });
  assert.match(people.html, /Assédio ou ameaça · 2/); assert.match(people.html, /Arquivar/); assert.match(people.html, /Suspender…/);
  const suspended = await renderNative(panels, 'ModerationPeoplePanel', {}, { states: { 0: [{ ...person, reasons: {}, details: [], suspended: true, suspendedAt: '2026-10-18T09:00:00Z' }], 1: false, 2: false } });
  assert.match(suspended.html, /Suspensa até revisão/); assert.match(suspended.html, /Levantar suspensão/); assert.doesNotMatch(suspended.html, /Arquivar/);
  const sheet = await renderNative(panels, 'ModerationPeoplePanel', {}, { states: { 0: [person], 1: false, 2: false, 3: person } });
  for (const text of ['7 dias', '30 dias', 'Até revisão', 'A conta, as partidas e o histórico ficam']) assert.match(sheet.html, new RegExp(text.replace(/[()]/g, '\\$&')));
  const photo = { journalEntryId: 'e', matchId: 'm', photoKey: 'k', imagePath: '/MeepleBoard/admin/moderation/photos/e/k', ownerName: 'Dona', reasons: { PersonalData: 1 }, details: [], lastReportAt: '2026-10-18T09:00:00Z', present: true };
  const photos = await renderNative(panels, 'ModerationPhotosPanel', {}, { states: { 0: [photo], 1: false, 2: false } });
  assert.match(photos.html, /Diário de Dona/); assert.match(photos.html, /Dados pessoais · 1/); assert.match(photos.html, /Manter/); assert.match(photos.html, /Remover da partida…/); assert.doesNotMatch(photos.html, /Retirar da comunidade/, "not published: nothing to withdraw");
  const gone = await renderNative(panels, 'ModerationPhotosPanel', {}, { states: { 0: [{ ...photo, present: false }], 1: false, 2: false } });
  assert.match(gone.html, /já foi retirada/); assert.doesNotMatch(gone.html, /Remover da partida/);
});

test('sign-in of a suspended account: a stable code with the end date (or until review), never the reason', async () => {
  const filename = path.resolve('src/features/auth/services/authService.ts');
  const load = response => {
    const module = new Module(filename);
    module.require = id => {
      if (id.endsWith('/services/api')) return { __esModule: true, default: { post: async () => { const error = new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST'); error.response = { status: 403, data: response }; throw error; } }, isTechnicalText: () => false };
      if (id === 'i18next') return { __esModule: true, default: { language: 'pt', t: key => key } };
      if (id === 'axios') return axios;
      if (id === 'expo-secure-store') return {};
      if (id === '@/src/services/tokenService') return { tokenService: {} };
      if (id === '@/src/store/store') return { store: { dispatch() {} } };
      if (id === '@/src/features/auth/store/authSlice') return { setToken: () => ({}) };
      throw new Error('Unexpected dependency: ' + id);
    };
    module._compile('const __DEV__ = false;\n' + ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
    return module.exports.authService;
  };
  const until = await load({ success: false, code: 'account_suspended', message: 'A tua conta está suspensa até 2026-10-25 09:00 (UTC).', suspendedUntil: '2026-10-25T09:00:00Z' }).login({ email: 'a@b.pt', password: 'x' }, false);
  assert.equal(until.code, 'account_suspended'); assert.equal(until.suspendedUntil, '2026-10-25T09:00:00Z');
  const review = await load({ success: false, code: 'account_suspended', message: 'A tua conta está suspensa até revisão.', suspendedUntil: null }).login({ email: 'a@b.pt', password: 'x' }, false);
  assert.equal(review.suspendedUntil, null);
  const pt = JSON.parse(fs.readFileSync('src/i18n/locales/pt/auth.json', 'utf8')).signInValidation, en = JSON.parse(fs.readFileSync('src/i18n/locales/en/auth.json', 'utf8')).signInValidation;
  assert.match(pt.suspendedUntil, /suspensa até \{\{date\}\}/); assert.match(en.suspendedReview, /until review/);
  // No support address is invented while the real contact is pending.
  assert.doesNotMatch(pt.suspendedHelp + en.suspendedHelp, /@|https?:/);
});
