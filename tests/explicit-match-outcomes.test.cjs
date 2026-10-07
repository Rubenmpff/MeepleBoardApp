const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNative } = require('./helpers/renderNative.cjs');
const form = 'src/features/games/matches/components/RegisterMatchForm.tsx';
const me = { id: 'me', userName: 'Author' };
const players = [{ id: 'me', username: 'Author', score: '-17', isWinner: true }, { id: 'peer', username: 'Peer', score: '0', isWinner: true }, { id: 'third', username: 'Third', score: '100', isWinner: false }];
const base = { 2: 3, 3: { id: 'game', name: 'Game' }, 4: false, 8: players, 12: 0, 23: true };
const render = (overrides = {}) => renderNative(form, 'default', { currentUser: me }, { states: { ...base, ...overrides } });
const submit = async overrides => { const view = await render(overrides); await view.press('Guardar partida'); return view; };
test('shared win requires rules confirmation, and sends every selected winner without picking the first', async () => {
  const blocked = await submit({ 29: 'Win', 30: false });
  assert.equal(blocked.calls.some(c => c[0] === 'submitMatch'), false);
  const view = await submit({ 29: 'Win', 30: true });
  const payload = view.calls.find(c => c[0] === 'submitMatch')[1];
  const request = view.load('src/features/games/matches/utils/mapMatchFormToRequest.ts').mapMatchFormToRequest(payload);
  assert.deepEqual(request.resultPlayerIds, ['me', 'peer']); assert.equal(request.winnerId, undefined);
  assert.equal(request.sharedVictoryAllowed, true); assert.equal(request.gameMode, 'COMPETITIVE');
  assert.deepEqual(payload.players.map(p => p.outcome), ['Win', 'Win', 'Loss']);
  assert.deepEqual(request.playerScores.map(p => p.score), [-17, 0, 100]);
  assert.throws(() => view.load('src/features/games/matches/utils/mapMatchFormToRequest.ts').mapMatchFormToRequest({ ...payload, resultPlayerIds: ['outsider'] }), /participantes da partida/);
});
test('partial draw explicitly assigns tied-first players Draw and all others Loss, never from their scores', async () => {
  const view = await submit({ 29: 'Draw' }); const payload = view.calls.find(c => c[0] === 'submitMatch')[1];
  assert.deepEqual(payload.resultPlayerIds, ['me', 'peer']); assert.deepEqual(payload.players.map(p => p.outcome), ['Draw', 'Draw', 'Loss']);
  assert.ok(payload.players.every(p => !p.isWinner)); assert.equal(payload.winnerId, undefined);
  assert.match(view.html, /Third.*Derrota.*100/);
  const blocked = await submit({ 29: 'Draw', 8: players.map((p, i) => ({ ...p, isWinner: i === 0 })) });
  assert.equal(blocked.calls.some(c => c[0] === 'submitMatch'), false);
});
test('undefined result is available with scores, does not preserve stale winners, and passes review', async () => {
  const view = await submit({ 29: 'Undefined' }); const payload = view.calls.find(c => c[0] === 'submitMatch')[1];
  assert.equal(payload.result, 'Undefined'); assert.deepEqual(payload.resultPlayerIds, []);
  assert.equal(payload.winnerId, undefined); assert.ok(payload.players.every(p => p.outcome === 'Undefined' && !p.isWinner));
  assert.equal(payload.personalRating, 0);
});
test('Solo stores four outcomes for one actual person and never invents a game participant', async () => {
  for (const [choice, result] of [['player_win', 'Win'], ['game_win', 'Loss'], ['draw', 'Draw'], ['none', 'Undefined']]) {
    const view = await submit({ 6: 'solo', 7: choice, 8: [players[0]] }); const payload = view.calls.find(c => c[0] === 'submitMatch')[1];
    const request = view.load('src/features/games/matches/utils/mapMatchFormToRequest.ts').mapMatchFormToRequest(payload);
    assert.equal(request.gameMode, 'SOLO'); assert.equal(request.result, result); assert.deepEqual(request.playerIds, ['me']);
    assert.equal(request.winnerId, result === 'Win' ? 'me' : undefined); assert.equal(payload.players[0].outcome, result);
  }
});
test('cooperative outcomes apply to everyone, with no individual winner ID', async () => {
  for (const [choice, result] of [['win','Win'], ['loss','Loss'], ['draw','Draw'], [null,'Undefined']]) {
    const view = await submit({ 6: 'cooperative', 28: choice }); const payload = view.calls.find(c => c[0] === 'submitMatch')[1];
    assert.equal(payload.gameMode, 'COOPERATIVE'); assert.equal(payload.result, result);
    assert.ok(payload.players.every(p => p.outcome === result)); assert.equal(payload.winnerId, undefined); assert.deepEqual(payload.resultPlayerIds, []);
  }
});
test('result selectors toggle people for a draw while preserving raw signed scores', async () => {
  const view = await renderNative('src/features/games/matches/components/MatchResultFields.tsx', 'default', { players, competitive: true, multiple: true, selectionKind: 'draw', scoresEnabled: true, onScoresEnabled() {}, onChange: next => changes.push(next), showErrors: false });
  const changes = []; await view.press('Empatado em primeiro: Peer');
  assert.deepEqual(changes[0].map(p => p.score), [-17, 0, 100].map(String)); assert.equal(changes[0][1].isWinner, false);
});
test('summary distinguishes explicit team/draw/undefined from legacy, with named zero scores', async () => {
  const summary = 'src/features/games/matches/components/MatchSummary.tsx';
  const match = { gameName: 'Game', players: [{ userId: 'me', userName: 'Author', score: 0, outcome: 'Win' }, { userId: 'peer', userName: 'Peer', score: -17, outcome: 'Win' }], gameMode: 'COMPETITIVE', result: 'Win', winnerIds: ['me','peer'] };
  const win = await renderNative(summary,'default',{match}); assert.match(win.html,/Vencedores: Author, Peer/);
  const team = await renderNative(summary,'default',{match:{...match,gameMode:'COOPERATIVE'}}); assert.match(team.html,/Equipa venceu/); assert.doesNotMatch(team.html,/Vencedores:/);
  const undefinedResult = await renderNative(summary,'default',{match:{...match,result:'Undefined',winnerIds:[],players:match.players.map(p=>({...p,outcome:'Undefined'}))}}); assert.match(undefinedResult.html,/Resultado não definido/);
  const legacy = await renderNative(summary,'default',{match:{gameName:'Old',winnerId:'me',winnerName:'Author',isSoloGame:false,players:[{userId:'me',userName:'Author',isWinner:true}]}}); assert.match(legacy.html,/Vencedor registado: Author/); assert.match(legacy.html,/resultado antigo por confirmar/);
});
test('existing shared statistics exclude unknowns and use the viewer outcome including shared wins and draws', async () => {
  const common = { gameMode: 'COMPETITIVE', resultSource:'Explicit', matchDate:'2026-10-01', gameName:'Game', currentUserScore:0 };
  const rows = [{...common,matchId:'win',result:'sharedWin',currentOutcome:'Win',otherOutcome:'Win'}, {...common,matchId:'draw',result:'currentUserDraw',currentOutcome:'Draw',otherOutcome:'Loss'}, {...common,matchId:'loss',result:'bothLost',currentOutcome:'Loss',otherOutcome:'Loss'}, {...common,matchId:'undefined',result:'undefined',currentOutcome:'Undefined',otherOutcome:'Undefined'}, {matchId:'old',result:'legacyUnknown',matchDate:common.matchDate,gameName:'Game'}];
  const view = await renderNative('src/features/friends/screens/SharedGameHistoryScreen.tsx','default',{}, { states:{0:'stats',1:rows,2:false} });
  assert.match(view.html,/33% · n=3/); assert.match(view.html,/2 partidas sem resultado definido/); assert.match(view.html,/1 partidas antigas por confirmar/);
});
