// Approved 18/10/2026: the rating and tags shown as «yours» are always the signed-in person's (their diary, or an old
// rating on a match they registered, as the API returns it) — never those of whoever registered the match. Zero is a
// rating; «Ainda não avaliaste» even when the others rated. The detail gives a way into the participants' experiences
// (the diary), the rating card says the players see it, and the photo viewer names its author.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const detail = 'src/features/games/matches/screens/MatchDetailScreen.tsx';
const journal = 'src/features/games/journal/screens/MatchJournalScreen.tsx';
const gamePage = 'src/features/games/catalog/components/GameExperience.tsx';
const match = (o = {}) => ({ id: 'm', gameId: 'g', gameName: 'Wingspan', matchDate: '2026-10-15T20:30:00Z', creatorId: 'carla', gameMode: 'COMPETITIVE',
  players: [{ userId: 'me', userName: 'Ana' }, { userId: 'carla', userName: 'Carla' }, { userId: 'bruno', userName: 'Bruno' }], personalRating: null, ...o });
const entry = (userId, userName, rating) => ({ id: 'e-' + userId, userId, userName, personalRating: rating, notes: null, tags: '', photoUrls: [], createdAt: '2026-10-15T21:00:00Z' });

test('detail: not yet rated by me shows «Ainda não avaliaste» even when the others rated 8 and 9', async () => {
  const view = await renderNative(detail, 'default', {}, { states: { 0: match(), 1: false, 8: [entry('carla', 'Carla', 8), entry('bruno', 'Bruno', 9)] }, params: { id: 'm' } });
  assert.match(view.html, /Ainda não avaliaste esta partida/);
  assert.doesNotMatch(view.html, />8<|>9</, 'no other person\'s rating as mine');
  assert.match(view.html, /Os participantes desta partida veem a tua avaliação/);
  await view.press('Ver experiências dos participantes');
  assert.ok(view.routes.some(r => r?.pathname === '/games/matches/[id]/journal'), 'opens the diary with the participants\' blocks');
  assert.match(view.html, /2 de 3 participantes avaliaram/);
});

test('detail: my own rating (zero included) is the one shown; another person\'s 8 never replaces it', async () => {
  const zero = await renderNative(detail, 'default', {}, { states: { 0: match({ personalRating: 0 }), 1: false, 8: [entry('me', 'Ana', 0), entry('carla', 'Carla', 8)] }, params: { id: 'm' } });
  assert.match(zero.html, />0</); assert.match(zero.html, /Guardada/); assert.doesNotMatch(zero.html, /Ainda não avaliaste/);
  const mine = await renderNative(detail, 'default', {}, { states: { 0: match({ personalRating: 6.5 }), 1: false, 8: [entry('me', 'Ana', 6.5), entry('carla', 'Carla', 8)] }, params: { id: 'm' } });
  assert.match(mine.html, /6,5/); assert.doesNotMatch(mine.html, />8</);
});

test('old match without any diary: the rating on it counts as mine only when the API returns it (I registered it)', async () => {
  const author = await renderNative(detail, 'default', {}, { states: { 0: match({ creatorId: 'me', personalRating: 8 }), 1: false, 8: [] }, params: { id: 'm' } });
  assert.match(author.html, />8</); assert.match(author.html, /Guardada/);
  const other = await renderNative(detail, 'default', {}, { states: { 0: match({ creatorId: 'carla', personalRating: null }), 1: false, 8: [] }, params: { id: 'm' } });
  assert.match(other.html, /Ainda não avaliaste/);
  const diary = await renderNative(journal, 'default', {}, { states: { 0: match({ creatorId: 'me', personalRating: 8 }), 1: [], 2: false } });
  assert.match(diary.html, /Registada com a partida\. Não pode ser alterada/); assert.match(diary.html, /Os participantes desta partida veem a tua avaliação/);
});

test('game page: each match shows my rating, «Ainda não avaliaste» when I have none, and zero as ★ 0', async () => {
  const base = { gameName: 'Wingspan', language: 'pt', userId: 'me', historyLoading: false, historyError: false, onRetryHistory() {}, userRating: 0, allMatches: true, onToggleMatches() {},
    campaigns: [], campaignsLoading: false, campaignsError: false, onRetryCampaigns() {}, allCampaigns: false, onToggleCampaigns() {}, onOpenMatch() {}, onOpenJournal() {}, onOpenCampaign() {}, onNewCampaign() {} };
  const view = await renderNative(gamePage, 'default', { ...base, matches: [match({ id: 'a', personalRating: null }), match({ id: 'b', personalRating: 0, matchDate: '2026-10-14T20:30:00Z' })] });
  assert.match(view.html, /Ainda não avaliaste/); assert.match(view.html, /★ 0/);
});
