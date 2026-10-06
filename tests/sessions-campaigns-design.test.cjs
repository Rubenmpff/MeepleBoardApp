// Presentation/interaction checks with isolated services; see docs/pendencias-funcionais.md.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const S = 'src/features/games/sessions/screens/';
const C = 'src/features/games/campaigns/screens/';
const list = S + 'SessionsListScreen.tsx', create = S + 'CreateSessionScreen.tsx', detail = S + 'GameSessionDetailScreen.tsx';
const campaigns = C + 'CampaignListScreen.tsx', createCampaign = C + 'Createcampaignscreen.tsx', campaignDetail = C + 'Campaigndetailscreen.tsx', encounter = C + 'CreateCampaignEncounterScreen.tsx';
const future = new Date(Date.now() + 3 * 86400000), deadline = new Date(future.getTime() - 86400000);
const session = { id: 'session-test', name: 'Test-only session', organizerId: 'me', organizerUserName: 'Test player', status: 'Upcoming', scheduledStartDate: future.toISOString(), effectiveDeadline: deadline.toISOString(), acceptedGuestCount: 0,
  players: [{ userId: 'me', userName: 'Test player', isOrganizer: true, status: 'Accepted' }, { userId: 'other', userName: 'Other player', status: 0 }], matches: [] };
const campaign = { id: 'campaign-test', name: 'Test-only campaign', gameId: 'game-test', gameName: 'Test-only game', status: 'Active', creatorId: 'me', memberCount: 2, matchCount: 1, averagePersonalRating: 0, notes: 'Test-only notes',
  members: [{ userId: 'me', userName: 'Test player', isCreator: true, status: 'Accepted' }, { userId: 'other', userName: 'Other player', status: 'Accepted' }],
  matches: [{ canReadJournal: true, id: 'campaign-match', matchId: 'match-test', matchDate: '2026-09-01T12:00:00Z', gameName: 'Test-only game', sessionTitle: 'Test-only encounter' }] };
const params = { campaignId: campaign.id, gameId: campaign.gameId, gameName: campaign.gameName, memberIds: 'me,other', memberNames: 'Test player,Other player' };
const render = (file, options = {}) => renderNative(file, 'default', {}, options);
const confirm = async (view, style) => {
  const buttons = view.calls.filter(c => c[0] === 'alert').at(-1)[3];
  const action = style ? buttons.find(b => b.style === style) : buttons.find(b => b.onPress);
  await action.onPress();
};

test('session tabs preserve filters, numeric pending statuses and destinations in PT and EN', async () => {
  const invited = { ...session, id: 'invited', organizerId: 'other', players: [{ userId: 'me', status: 0 }] };
  const data = [session, invited, { ...invited, id: 'cancelled', status: 'Cancelled' }, { ...session, id: 'active', status: 'Active' }];
  for (const language of ['pt', 'en']) {
    const view = await render(list, { states: { 0: data, 1: false, 2: 'Invites' }, language });
    assert.deepEqual(view.lists[0].data.map(s => s.id), ['invited']);
    await view.press('Test-only session');
    assert.equal(view.routes[0], '/(app)/games/sessions/invited');
    await view.press(language === 'pt' ? 'Criar' : 'Create');
    assert.equal(view.routes[1], '/(app)/games/sessions/create');
    await view.press(language === 'pt' ? 'Ativas' : 'Active');
    assert.deepEqual(view.updates.find(c => c[0] === 2), [2, 'Active']);
  }
});

test('session loading and error do not masquerade as empty lists; retry uses getMine', async () => {
  const loading = await render(list);
  assert.doesNotMatch(loading.html, /Sem sessões ativas/);
  const error = await render(list, { states: { 1: false, 3: true }, services: { getMine: [] } });
  assert.match(error.html, /Não foi possível carregar/);
  assert.doesNotMatch(error.html, /Sem sessões ativas/);
  await error.press('Tentar novamente');
  assert.deepEqual(error.calls.find(c => c[0] === 'getMine'), ['getMine']);
  assert.deepEqual(error.updates.find(c => c[0] === 3), [3, false]);
});

test('session creation preserves trimmed fields, ISO dates, deadline, invitations and success destination', async () => {
  const view = await render(create, { states: { 0: ' Test session ', 1: ' Table ', 2: ['other'], 4: future, 5: deadline, 6: true }, createdSession: session });
  await view.press('Criar Sessão');
  assert.deepEqual(view.calls.find(c => c[0] === 'createSession')[1], { name: 'Test session', location: 'Table', scheduledStartDate: future.toISOString(), responseDeadline: deadline.toISOString(), playerIds: ['other'] });
  await confirm(view);
  assert.deepEqual(view.routes[0], ['replace', '/(app)/games/sessions/session-test']);
  const noDeadline = await render(create, { states: { 0: 'Test session', 2: ['other'], 4: future, 6: false } });
  await noDeadline.press('Criar Sessão');
  assert.equal(noDeadline.calls.find(c => c[0] === 'createSession')[1].responseDeadline, undefined);
});

test('session creation keeps minimum name and chronological validation', async () => {
  for (const states of [{ 0: 'ab', 4: future }, { 0: 'Valid', 4: new Date(0) }, { 0: 'Valid', 4: future, 5: future, 6: true }, { 0: 'Valid', 4: future, 5: new Date(0), 6: true }]) {
    const view = await render(create, { states });
    assert.equal(view.controls.find(c => c.accessibilityLabel === 'Criar Sessão').disabled, true);
    assert.equal(view.calls.some(c => c[0] === 'createSession'), false);
  }
});

test('session creation exposes the hook failure instead of silently retaining the form', async () => {
  const view = await render(create, { createSessionError: 'Não foi possível guardar a sessão.' });
  assert.ok(view.html.includes('Não foi possível guardar a sessão.'));
  assert.ok(!view.routes.length);
});

test('friend invitation and native date/time controls retain selection and merging', async () => {
  const view = await render(create, { states: { 4: future, 7: 'session_time' }, friends: [{ id: 'other', userName: 'Other player' }], language: 'en' });
  await view.press('Select Other player for invitation');
  assert.deepEqual(view.updates.find(c => c[0] === 2), [2, ['other']]);
  assert.equal(view.datePickers[0].locale, 'en-GB');
  assert.equal(view.datePickers[0].themeVariant, 'light');
  assert.ok(view.datePickers[0].textColor);
  assert.equal(view.datePickers[0].style.width, '100%');
  const time = new Date(future); time.setHours(19, 15, 0, 0);
  view.datePickers[0].onChange({}, time);
  assert.equal(view.updates.find(c => c[0] === 4)[1].toISOString(), time.toISOString());
  await view.press('Done');
  assert.deepEqual(view.updates.find(c => c[0] === 7), [7, null]);
});

test('session friend load failure is distinct from empty results and retries the API', async () => {
  const view = await render(create, { friendsError: 'Falha ao carregar amigos' });
  assert.match(view.html, /Falha ao carregar amigos/);
  assert.doesNotMatch(view.html, /Ainda não tens amigos/);
  await view.press('Tentar novamente');
  assert.deepEqual(view.calls.find(c => c[0] === 'refetchFriends'), ['refetchFriends', true]);
});

test('automatic response limit is distinguished from a custom deadline in both locales', async () => {
  for (const language of ['pt', 'en']) {
    const automatic = await render(detail, { language, states: { 0: { ...session, responseDeadline: null, effectiveDeadline: session.scheduledStartDate }, 1: false } });
    assert.ok(automatic.html.includes(language === 'pt' ? 'Respostas até ao início:' : 'Reply before the session starts:'));
    const custom = await render(detail, { language, states: { 0: { ...session, responseDeadline: deadline.toISOString() }, 1: false } });
    assert.ok(custom.html.includes(language === 'pt' ? 'Prazo de resposta:' : 'Reply by:'));
    const form = await render(create, { language });
    assert.ok(form.html.includes(language === 'pt' ? 'Até ao início' : 'Until start'));
  }
});

test('session invitations still call respondInvite with true or false', async () => {
  const invited = { ...session, organizerId: 'other', players: [{ userId: 'me', userName: 'Test player', status: 0 }] };
  for (const accept of [true, false]) {
    const view = await render(detail, { states: { 0: invited, 1: false }, services: { respondInvite: undefined, getById: invited } });
    await view.press(accept ? '✅ Aceitar' : '❌ Recusar');
    assert.deepEqual(view.calls.find(c => c[0] === 'respondInvite'), ['respondInvite', 'game-id', accept]);
  }
});

test('organiser cancel/close actions require confirmation and remain status-specific', async () => {
  for (const [status, label, service] of [['Upcoming', 'Cancelar sessão', 'cancel'], ['Active', 'Encerrar sessão', 'close']]) {
    const data = { ...session, status };
    const view = await render(detail, { states: { 0: data, 1: false }, stubRegisterForm: true, services: { [service]: undefined, getById: data } });
    await view.press(label);
    assert.equal(view.calls.some(c => c[0] === service), false);
    await confirm(view, 'destructive');
    assert.deepEqual(view.calls.find(c => c[0] === service), [service, 'game-id']);
  }
});

test('active sessions preserve the inline registration boundary; closed sessions hide it', async () => {
  const active = await render(detail, { states: { 0: { ...session, status: 'Active' }, 1: false }, params: { id: session.id }, stubRegisterForm: true });
  const props = active.calls.find(c => c[0] === 'registerForm')[1];
  assert.equal(props.sessionId, session.id);
  assert.equal(props.disableScroll, true);
  assert.equal(props.currentUser.id, 'me');
  await props.onRegistered();
  assert.ok(active.calls.some(c => c[0] === 'getById' && c[1] === session.id));
  const closed = await render(detail, { states: { 0: { ...session, status: 'Closed' }, 1: false }, stubRegisterForm: true });
  assert.equal(closed.calls.some(c => c[0] === 'registerForm'), false);
});

test('campaign list retains status sections, zero ratings and existing destinations', async () => {
  const view = await render(campaigns, { states: { 0: [campaign], 1: false }, language: 'en' });
  assert.match(view.html, /0.0/);
  await view.press(campaign.name);
  assert.equal(view.routes[0], '/(app)/games/campaigns/campaign-test');
  await view.press('New');
  assert.equal(view.routes[1], '/(app)/games/campaigns/create');
});

test('campaign list failure has a working retry and is not an empty campaign list', async () => {
  const view = await render(campaigns, { states: { 1: false, 3: true }, services: { getMine: [] } });
  assert.doesNotMatch(view.html, /Cria uma campanha/);
  await view.press('Tentar novamente');
  assert.equal(view.calls.some(c => c[0] === 'getMine'), true);
});

test('campaign creation keeps game lock, name minimum, request and success navigation', async () => {
  const game = { id: 'game-test', name: 'Test-only game', supportsCampaign: true };
  const view = await render(createCampaign, { params: { gameId: game.id, gameName: game.name }, states: { 0: game, 1: ' Test campaign ', 2: ' Notes ' }, services: { create: campaign } });
  assert.equal(view.controls.find(c => c.accessibilityLabel === 'Mudar jogo').disabled, true);
  await view.press('Criar campanha');
  assert.deepEqual(view.calls.find(c => c[0] === 'create')[1], { name: 'Test campaign', gameId: game.id, notes: 'Notes' });
  await confirm(view);
  assert.equal(view.routes[0][1].params.id, campaign.id);
  const invalid = await render(createCampaign, { states: { 0: game, 1: 'a' } });
  assert.equal(invalid.controls.find(c => c.accessibilityLabel === 'Criar campanha').disabled, true);
});

test('campaign invitation response and member removal preserve requests and confirmation', async () => {
  const invited = { ...campaign, creatorId: 'other', members: [{ userId: 'me', userName: 'Test player', status: 'Pending' }] };
  const view = await render(campaignDetail, { states: { 0: invited, 1: false }, services: { respondInvite: undefined, getById: invited } });
  await view.press('Aceitar');
  assert.deepEqual(view.calls.find(c => c[0] === 'respondInvite'), ['respondInvite', 'game-id', true]);
  const members = await render(campaignDetail, { states: { 0: campaign, 1: false, 3: 'members' }, services: { removeMember: undefined, getById: campaign } });
  await members.press('Remover Other player');
  assert.equal(members.calls.some(c => c[0] === 'removeMember'), false);
  await confirm(members, 'destructive');
  assert.deepEqual(members.calls.find(c => c[0] === 'removeMember'), ['removeMember', 'game-id', 'other']);
});

test('campaign new encounter retains accepted member parameters on narrow screens', async () => {
  const view = await render(campaignDetail, { states: { 0: campaign, 1: false }, width: 320, fontScale: 1.6 });
  await view.press('Novo encontro');
  assert.deepEqual(view.routes[0].params, params);
});

test('campaign completion, abandonment and leaving retain confirmation and existing service calls', async () => {
  for (const [label, method] of [['Concluir', 'complete'], ['Abandonar', 'abandon']]) {
    const view = await render(campaignDetail, { states: { 0: campaign, 1: false }, services: { [method]: undefined, getById: campaign } });
    await view.press(label);
    assert.equal(view.calls.some(c => c[0] === method), false);
    await confirm(view);
    assert.deepEqual(view.calls.find(c => c[0] === method), [method, 'game-id']);
  }
  const member = { ...campaign, creatorId: 'other' };
  const view = await render(campaignDetail, { states: { 0: member, 1: false, 3: 'members' }, services: { leave: undefined } });
  await view.press('Sair da campanha');
  assert.equal(view.calls.some(c => c[0] === 'leave'), false);
  await confirm(view, 'destructive');
  assert.deepEqual(view.calls.find(c => c[0] === 'leave'), ['leave', 'game-id']);
  assert.equal(view.routes.at(-1), 'back');
});

test('session and campaign detail failures have translated retry actions using existing services', async () => {
  const sessions = await render(detail, { states: { 1: false, 4: true }, services: { getById: session } });
  assert.match(sessions.html, /Não foi possível carregar/);
  await sessions.press('Tentar novamente');
  assert.deepEqual(sessions.calls.find(c => c[0] === 'getById'), ['getById', 'game-id']);
  const campaigns = await render(campaignDetail, { states: { 1: false, 11: true }, services: { getById: campaign } });
  assert.match(campaigns.html, /Não foi possível carregar/);
  await campaigns.press('Tentar novamente');
  assert.deepEqual(campaigns.calls.find(c => c[0] === 'getById'), ['getById', 'game-id']);
});

test('campaign notes and journal requests preserve trimmed text, optional rating and zero', async () => {
  const view = await render(campaignDetail, { states: { 0: campaign, 1: false, 3: 'notes', 9: true, 10: ' New notes ' }, services: { update: undefined, getById: campaign } });
  await view.press('Guardar');
  assert.deepEqual(view.calls.find(c => c[0] === 'update')[2], { name: campaign.name, notes: 'New notes' });
  const diary = await render(campaignDetail, { states: { 0: campaign, 1: false, 5: { 'match-test': [] }, 6: 'match-test', 7: { personalRating: 0, notes: ' Notes ', tags: ' tag ' } }, services: { upsertJournalEntry: undefined, getJournalEntries: [] } });
  await diary.press('Guardar avaliação');
  assert.deepEqual(diary.calls.find(c => c[0] === 'upsertJournalEntry'), ['upsertJournalEntry', 'match-test', { personalRating: 0, notes: 'Notes', tags: 'tag' }]);
});

test('encounter submission preserves score-less request, association and photo order', async () => {
  const view = await render(encounter, { params, states: { 0: ['me', 'other'], 6: ' Encounter ', 7: ' Outcome ', 8: '90', 9: ' Table ', 10: 0, 13: ['test-only-photo'] }, services: { registerMatch: { id: 'created-match' }, addMatch: undefined, uploadJournalPhoto: undefined } });
  await view.press('Registar encontro');
  const payload = view.calls.find(c => c[0] === 'registerMatch')[1];
  assert.deepEqual(payload.players, [{ userId: 'me', isWinner: false }, { userId: 'other', isWinner: false }]);
  assert.equal(payload.personalRating, 0);
  assert.equal(payload.durationInMinutes, 90);
  assert.equal(payload.scoreSummary, 'Outcome');
  assert.equal('playerScores' in payload, false);
  assert.deepEqual(view.calls.find(c => c[0] === 'addMatch'), ['addMatch', campaign.id, { matchId: 'created-match', sessionTitle: 'Encounter' }]);
  assert.ok(view.calls.findIndex(c => c[0] === 'addMatch') < view.calls.findIndex(c => c[0] === 'uploadJournalPhoto'));
});

test('encounter preserves optional mode controls and competitive winner validation', async () => {
  const view = await render(encounter, { params, states: { 1: true, 2: 'competitive' } });
  await view.press('Registar encontro');
  assert.equal(view.calls.some(c => c[0] === 'registerMatch'), false);
  assert.equal(view.calls.some(c => c[0] === 'alert'), true);
  await view.press('Cooperativo');
  assert.deepEqual(view.updates.find(c => c[0] === 2), [2, 'cooperative']);
  const coop = await render(encounter, { params, states: { 2: 'cooperative', 5: true }, services: { registerMatch: { id: 'created' }, addMatch: undefined } });
  await coop.press('Registar encontro');
  // C03 is deliberately still open: the existing request does not encode coopWin.
  assert.equal('gameMode' in coop.calls.find(c => c[0] === 'registerMatch')[1], false);
});

test('encounter photos keep pending selection, permission guard and existing five-photo cap', async () => {
  const denied = await render(encounter, { params, photoPermission: false });
  await denied.press('Adicionar fotografia');
  assert.equal(denied.calls.some(c => c[0] === 'pickPhoto'), false);
  const full = await render(encounter, { params, states: { 13: ['1', '2', '3', '4', '5'] } });
  assert.equal(full.controls.some(c => c.accessibilityLabel === 'Adicionar fotografia'), false);
  await full.press('Remover fotografia');
  assert.deepEqual(full.updates.find(c => c[0] === 13), [13, ['2', '3', '4', '5']]);
});

test('all seven screens translate headings and existing actions in English', async () => {
  for (const [file, states] of [[list, { 1: false }], [create, {}], [detail, { 0: session, 1: false }], [campaigns, { 0: [campaign], 1: false }], [createCampaign, {}], [campaignDetail, { 0: campaign, 1: false }], [encounter, {}]]) {
    const view = await render(file, { states, language: 'en', params, stubRegisterForm: true });
    assert.doesNotMatch(view.html, /Criar Sessão|Sessões|Prazo de resposta|Quem jogou hoje|Registar encontro|Não definido|A tua avaliação/);
    assert.doesNotMatch(view.html, /sessions\.(?:title|tabs|deadline)|encounter\.(?:title|submit)|ui\.detailTitle/);
  }
});
