const test = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const journal = 'src/features/games/journal/screens/MatchJournalScreen.tsx';
const campaignScreen = 'src/features/games/campaigns/screens/Campaigndetailscreen.tsx';
const match = { id: 'match-test', gameId: 'game-test', gameName: 'Isolated game', players: [{ userId: 'me' }, { userId: 'other' }], journalStatus: 'Open' };
const entries = [{ id: 'own', userId: 'me', userName: 'Me', personalRating: 0, notes: 'OWN_PRIVATE', tags: 'own-tag', photoUrls: [] }, { id: 'other', userId: 'other', userName: 'Other', personalRating: 7, notes: 'FOREIGN_PRIVATE', tags: 'shared-tag', photoUrls: [] }];
for (const language of ['pt', 'en']) test(`Journal keeps own notes private and exposes participant ratings/tags including zero (${language})`, async () => {
  const ui = await renderNative(journal, 'default', {}, { language, states: { 0: match, 1: entries, 2: false, 4: 0, 5: 'OWN_PRIVATE' } });
  assert.ok(!ui.html.includes('FOREIGN_PRIVATE'));
  assert.ok(ui.html.includes('shared-tag'));
  assert.ok(ui.inputs.some(input => input.value === 'OWN_PRIVATE'));
  assert.ok(ui.controls.some(control => control.accessibilityLabel === ui.i18n.t('journal.update', { ns: 'matches' })));
  assert.ok(ui.inputs.some(input => input.accessibilityLabel === ui.i18n.t('journal.notes', { ns: 'matches' })));
});

const campaign = { id: 'campaign-test', name: 'Isolated campaign', gameId: 'game-test', status: 'Active', creatorId: 'me', members: [{ userId: 'me', userName: 'Me', status: 'Accepted' }], matches: [{ id: 'encounter', matchId: 'match-test', matchDate: '2026-10-06T12:00:00Z', sessionTitle: 'Encounter', canReadJournal: true }] };
test('Campaign membership alone never enables the journal editor', async () => {
  const data = { ...campaign, matches: campaign.matches.map(match => ({ ...match, canReadJournal: false })) };
  const ui = await renderNative(campaignScreen, 'default', {}, { states: { 0: data, 1: false, 5: { 'match-test': entries }, 6: 'match-test' } });
  assert.ok(ui.controls.find(control => control.accessibilityLabel === 'Encounter').disabled);
  assert.ok(!ui.controls.some(control => control.accessibilityLabel === 'Guardar avaliação'));
  assert.ok(!ui.html.includes('FOREIGN_PRIVATE'));
  assert.ok(ui.html.includes('Apenas participantes'));
});
test('Campaign participant reads shared entries but only own notes; cached drafts follow selected match', async () => {
  const ui = await renderNative(campaignScreen, 'default', {}, { states: { 0: campaign, 1: false, 5: { 'match-test': entries }, 6: 'match-test', 7: { notes: 'OWN_PRIVATE', tags: '' } } });
  assert.ok(ui.html.includes('OWN_PRIVATE') && !ui.html.includes('FOREIGN_PRIVATE'));
  assert.ok(ui.html.includes('shared-tag'));
  const next = await renderNative(campaignScreen, 'default', {}, { states: { 0: campaign, 1: false, 5: { 'match-test': entries }, 7: { notes: 'Previous draft', tags: '' } } });
  await next.press('Encounter');
  assert.deepEqual(next.updates.find(update => update[0] === 7)[1], { personalRating: 0, notes: 'OWN_PRIVATE', tags: 'own-tag' });
});
test('Preserved legacy photos count toward the upload cap without exposing public URLs', async () => {
  const ui = await renderNative(journal, 'default', {}, { states: { 0: match, 1: [{ ...entries[0], unavailablePhotoCount: 5 }], 2: false } });
  assert.ok(ui.html.includes('5/5'));
  assert.ok(ui.html.includes('fotografias antigas preservadas'));
  assert.ok(!ui.controls.some(control => control.accessibilityLabel === 'Adicionar fotografia'));
});
test('Photo source sends authentication only to the API and rejects public/external URLs', async () => {
  const ui = await renderNative(journal, 'default', {}, { states: { 0: match, 2: false } });
  const source = ui.load('src/features/games/journal/components/JournalPhoto.tsx').journalPhotoSource;
  const path = '/MeepleBoard/campaigns/matches/12345678-1234-1234-1234-123456789012/journal/photos/12345678-1234-1234-1234-123456789013/' + 'a'.repeat(64);
  const result = source(path, 'https://api.isolated.invalid/MeepleBoard', 'isolated-fixture-token');
  assert.equal(result.uri, 'https://api.isolated.invalid' + path);
  assert.equal(result.headers.Authorization, 'Bearer isolated-fixture-token');
  assert.equal(result.cache, 'reload');
  for (const uri of ['https://res.cloudinary.com/public.jpg', '//evil.invalid/image', '/MeepleBoard/auth/login', path + '?token=secret']) assert.equal(source(uri, 'https://api.isolated.invalid', 'fixture'), undefined);
  assert.equal(source(path, 'https://api.isolated.invalid', ''), undefined);
});
test('A delayed encounter response cannot overwrite the active private draft', async () => {
  let firstResolve, secondResolve;
  const first = new Promise(resolve => { firstResolve = resolve; });
  const second = new Promise(resolve => { secondResolve = resolve; });
  const data = { ...campaign, matches: [...campaign.matches, { ...campaign.matches[0], id: 'second', matchId: 'second-match', sessionTitle: 'Second encounter' }] };
  const ui = await renderNative(campaignScreen, 'default', {}, { states: { 0: data, 1: false }, services: { getJournalEntries: id => id === 'match-test' ? first : second } });
  await ui.press('Encounter');
  await ui.press('Second encounter');
  secondResolve([{ ...entries[0], notes: 'ACTIVE_PRIVATE' }]);
  await new Promise(resolve => setImmediate(resolve));
  firstResolve([{ ...entries[0], notes: 'STALE_PRIVATE' }]);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(ui.updates.filter(update => update[0] === 7).map(update => update[1].notes), ['ACTIVE_PRIVATE']);
});
