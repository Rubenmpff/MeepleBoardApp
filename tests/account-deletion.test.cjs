// «Eliminar conta» (docs/proposta-eliminacao-conta.md): what the screen shows, the campaign manager choice, the password
// and the final confirmation; what the device forgets; the «forgot password» detour. Services are isolated.
const test = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const screen = 'src/features/settings/screens/DeleteAccountScreen.tsx';
const user = { id: 'me', email: 'eu@example.test' };
const summary = { scheduledSessions: 2, runningSessions: 1, campaignsOnlyYours: 1, campaignsWithMembers: [
  { id: 'c1', name: 'Campanha longa', gameName: 'Wingspan', hasNotes: true, isAuthor: true, defaultManagerId: 'b', members: [{ id: 'b', userName: 'Bruno' }, { id: 'a', userName: 'Ana' }] },
  { id: 'c2', name: 'Outra campanha', gameName: 'Wingspan', hasNotes: false, isAuthor: false, defaultManagerId: 'b', members: [{ id: 'b', userName: 'Bruno' }] }] };
// useState order: summary, loadError, managers, choosing, password, error, resetSent, confirming, deleting.
const render = (states = {}, options = {}) => renderNative(screen, 'default', {}, { user, ...options, states: { 0: summary, ...states } });

test('the screen says what is deleted, kept and neutralised, and what happens to sessions and campaigns', async () => {
  const r = await render();
  for (const text of ['Perfil, e-mail, amigos, coleção, notas, avaliações, fotografias e publicações.', 'como «Conta eliminada»',
    '2 sessões agendadas serão canceladas', 'A sessão a decorrer termina agora', 'Campanhas que geres', 'Campanha longa', 'Wingspan · Novo gestor: Bruno (há mais tempo na campanha)',
    'Notas de «Campanha longa»', '1 campanha só tua será apagada.', 'Cada campanha continua com um gestor', 'continua a aparecer como «Criador»', 'Cópias de segurança e registos de fornecedores'])
    assert.ok(r.html.includes(text), text);
  assert.ok(!r.html.includes('Notas de «Outra campanha»'), 'notes only where there are some');
  assert.equal(r.controls.find(c => c.accessibilityLabel === 'Eliminar conta definitivamente').disabled, true, 'no password yet');
  await r.press('Notas de «Campanha longa»');
  assert.deepEqual(r.routes.at(-1), { pathname: '/(app)/games/campaigns/[id]', params: { id: 'c1' } });
});

test('the successor is the one chosen or, without a choice, the longest-standing active member; there is no «nobody»', async () => {
  const chosen = await render({ 2: { c1: 'a' } });
  assert.ok(chosen.html.includes('Wingspan · Novo gestor: Ana') && !chosen.html.includes('Novo gestor: Ana (há mais tempo'));
  const sheet = await render({ 3: summary.campaignsWithMembers[0] });
  assert.ok(sheet.html.includes('Escolher novo gestor') && sheet.html.includes('Ana') && sheet.html.includes('Bruno') && sheet.html.includes('Há mais tempo na campanha'));
  assert.ok(!sheet.html.includes('Ninguém'), 'a campaign always keeps a manager');
  await sheet.press('Ana');
  assert.deepEqual(sheet.updates.find(([i]) => i === 2), [2, { c1: 'a' }]);
});

test('with the password, the final confirmation deletes, forgets the account on the device and returns to the welcome', async () => {
  const ready = await render({ 4: 'segredo' });
  await ready.press('Eliminar conta definitivamente');
  assert.deepEqual(ready.updates.find(([i]) => i === 7), [7, true]);
  const r = await render({ 2: { c1: 'a' }, 4: 'segredo', 7: true }, { services: { deleteOwnAccount: undefined, forgetAccountOnDevice: undefined } });
  assert.ok(r.html.includes('Esta ação não pode ser desfeita.'));
  await r.press('Eliminar');
  // Every campaign carries the successor shown on screen (chosen or automatic), for the API to check again.
  assert.deepEqual(r.calls.find(c => c[0] === 'deleteOwnAccount'), ['deleteOwnAccount', 'segredo', [{ campaignId: 'c1', newManagerId: 'a' }, { campaignId: 'c2', newManagerId: 'b' }]]);
  assert.deepEqual(r.calls.find(c => c[0] === 'forgetAccountOnDevice'), ['forgetAccountOnDevice', 'me']);
  assert.equal(r.calls.find(c => c[0] === 'toast')[1].text2, 'A tua conta foi eliminada.');
  assert.deepEqual(r.routes.at(-1), ['replace', '/welcome']);
});

test('a refused deletion changes nothing on the device and says why', async () => {
  // As the API client hands it over: the message is already the one for people.
  const refusal = { isAxiosError: true, message: 'Palavra-passe incorreta.', response: { status: 400, data: { message: 'Palavra-passe incorreta.' } } };
  const r = await render({ 4: 'errada', 7: true }, { services: { deleteOwnAccount: () => { throw refusal; }, forgetAccountOnDevice: undefined, getDeletionSummary: summary } });
  await r.press('Eliminar');
  assert.ok(r.calls.some(c => c[0] === 'getDeletionSummary'), 'a refusal reloads the campaigns (a successor may have left)');
  assert.deepEqual(r.updates.filter(([i]) => i === 5).at(-1), [5, 'Palavra-passe incorreta.']);
  assert.ok(!r.calls.some(c => c[0] === 'forgetAccountOnDevice') && !r.routes.length, 'nothing forgotten, no navigation');
  const shown = await render({ 4: 'errada', 5: 'Palavra-passe incorreta.' });
  assert.ok(shown.html.includes('Palavra-passe incorreta.'));
});

test('a forgotten password: the reset link is sent and the reset comes back to this screen', async () => {
  const r = await render({}, { services: { forgotPassword: { success: true }, rememberDeletionResume: undefined } });
  await r.press('Esqueceste-te da palavra-passe?');
  assert.ok(r.calls.some(c => c[0] === 'rememberDeletionResume'));
  assert.deepEqual(r.calls.find(c => c[0] === 'forgotPassword'), ['forgotPassword', 'eu@example.test']);
  assert.deepEqual(r.updates.find(([i]) => i === 6), [6, true]);
  const sent = await render({ 6: true });
  assert.ok(sent.html.includes('Enviámos uma ligação para eu@example.test'));
});

test('Settings: «Eliminar conta» sits under «Terminar sessão» and opens the screen', async () => {
  const r = await renderNative('src/features/settings/screens/SettingsScreen.tsx', 'default', {}, { services: { getCurrentUser: { id: 'me', libraryPrivacy: 'Public' } } });
  assert.ok(r.html.indexOf('Terminar sessão') < r.html.indexOf('Eliminar conta'));
  await r.press('Eliminar conta');
  assert.equal(r.routes.at(-1), '/settings/delete-account');
});

test('campaign members: «Criador» stays with who wrote it, also a deleted account; «Gestor» marks the successor; only the manager removes', async () => {
  const campaignScreen = 'src/features/games/campaigns/screens/CampaignDetailScreen.tsx';
  const campaign = { id: 'c', name: 'Campanha sem título', gameId: 'g', status: 'Active', creatorId: 'ana', memberCount: 3, matchCount: 0, matches: [], members: [
    { userId: 'gone', userName: 'Conta eliminada', isCreator: true, status: 'Accepted' }, { userId: 'ana', userName: 'Ana', isCreator: false, status: 'Accepted' },
    { userId: 'bruno', userName: 'Bruno', isCreator: false, status: 'Accepted' }] };
  // useState order: campaign, loading, refreshing, tab…
  const asManager = await renderNative(campaignScreen, 'default', {}, { user: { id: 'ana' }, states: { 0: campaign, 1: false, 3: 'members' } });
  assert.ok(/Conta eliminada.*Criador/.test(asManager.html), 'the deleted author keeps «Criador»');
  assert.ok(/Ana.*Gestor/.test(asManager.html) && !/Bruno<\/span><span>Gestor/.test(asManager.html), 'the successor is shown as manager');
  assert.ok(asManager.controls.some(c => c.accessibilityLabel === 'Remover Bruno'), 'the manager removes a member');
  assert.ok(!asManager.controls.some(c => c.accessibilityLabel === 'Remover Conta eliminada'), 'nobody removes the author');
  assert.ok(asManager.html.includes('Concluir campanha'), 'the manager completes');
  const asMember = await renderNative(campaignScreen, 'default', {}, { user: { id: 'bruno' }, states: { 0: campaign, 1: false, 3: 'members' } });
  assert.ok(!asMember.controls.some(c => /^Remover /.test(c.accessibilityLabel || '')), 'members do not remove others');
  assert.ok(!asMember.html.includes('Concluir campanha'), 'members do not complete');
  assert.ok(asMember.html.includes('Sair da campanha'), 'members may leave');
  assert.ok(!asManager.html.includes('Sair da campanha'), 'the manager may not leave');
});
