const test=require('node:test'),assert=require('node:assert/strict');
const {renderNative}=require('./helpers/renderNative.cjs');
const query={start:'2024-01-01',endExclusive:'2025-01-01',timeZone:'Europe/Lisbon',gameId:'game-a',mode:'COMPETITIVE'};
const results={myWins:1,friendWins:2,sharedWins:1,myOnlyWins:0,friendOnlyWins:1,draws:1,drawsTogether:1,otherWins:1,otherSharedWins:0,otherDraws:0,teamWins:1,teamLosses:0,teamDraws:0,known:4,unknown:1};
const game={gameId:'game-a',name:'Um jogo com nome suficientemente longo para preservar',imageUrl:null,matches:5};
const company={friendId:'friend-id',friendName:'Amigo visível',matches:5,results,companions:[{friendId:'friend-id',name:'Amigo visível',matches:5}],games:[game],comparisons:[{...game,mode:'COMPETITIVE',results,completeScores:1,scores:[{matchId:'match-id',date:'2024-10-27T12:00:00Z',mine:0,friend:-5}]}],evolution:[{key:'2024-10',matches:5,results}]};
const known={wins:2,losses:1,draws:1,known:4,withoutResult:1,legacy:1,winRate:50};
const explore={games:[{...game,mode:'COMPETITIVE',results:known,scored:2,minimum:-5,maximum:0,averageScore:-2.5,rated:2,averageRating:0,firstRecorded:'2023-10-01T12:00:00Z'}],ratings:[{key:'2024-10',rated:2,average:0}],collection:[{entryId:'entry-id',gameId:'game-a',name:game.name,imageUrl:null,status:'Owned',pricePaid:0,addedAt:'2024-10-01T12:00:00Z',hasRecordedMatch:false,matchesInPeriod:0}]};
const summary={...query,matches:5,distinctGames:1,recordedMinutes:0,matchesWithDuration:1,matchesWithoutDuration:4,averagePersonalRating:0,ratedMatches:1,results:known,modes:[],bucketUnit:'month',evolution:[],games:[game],gameOptions:[game]};
const year={year:2024,timeZone:query.timeZone,summary,mostPlayed:[{...game,wins:0,known:0}],mostWins:[{...game,wins:2,known:4,mode:'COMPETITIVE'}],bestWinRate:[],rateMinimumSample:5,mostFrequentCompanyMatches:5,mostFrequentCompanyTies:1,activeMonths:[{key:'2024-10',matches:5}],firstRecordedGames:[]};
test('Company comparison drills down with friend, period, game and mode, preserving zero and negative paired scores',async()=>{
 const r=await renderNative('src/features/statistics/screens/CompanyScreen.tsx','default',{}, {params:{...query,friendId:'friend-id'},states:{0:'friend-id'},statisticsReport:company,statisticsSummary:summary,width:320,fontScale:2});
 assert.match(r.html,/Eu: 0/);assert.match(r.html,/-5/);assert.match(r.html,/não uma classificação/);
 await r.press('Vitórias partilhadas entre nós: 1');
 const route=r.routes.at(-1);assert.equal(route.pathname,'/statistics/matches');assert.equal(route.params.friendId,'friend-id');assert.equal(route.params.metric,'shared-win');assert.equal(route.params.mode,'COMPETITIVE');assert.equal(route.params.start,query.start);assert.equal(route.params.gameId,query.gameId);
 await r.press('Venceu outro, nenhum de nós: 1');assert.equal(r.routes.at(-1).params.metric,'other-win');
});
test('Records and ratings retain zero, negative scores, known sample and links to the precise supporting scores',async()=>{
 const r=await renderNative('src/features/statistics/screens/ExploreScreen.tsx','default',{}, {params:{...query,section:'games'},statisticsReport:explore,statisticsSummary:summary});
 await r.press('Mínimo registado: -5');assert.equal(r.routes.at(-1).params.scoreValue,-5);assert.equal(r.routes.at(-1).params.metric,'scores');assert.equal(r.routes.at(-1).params.mode,'COMPETITIVE');
 await r.press('Máximo registado: 0');assert.equal(r.routes.at(-1).params.scoreValue,0);
 const ratings=await renderNative('src/features/statistics/screens/ExploreScreen.tsx','default',{}, {params:{...query,section:'ratings'},statisticsReport:explore});
 await ratings.press('Avaliação média (0–10): 0');assert.equal(ratings.routes.at(-1).params.metric,'ratings');assert.match(ratings.html,/2 de 5 partidas avaliadas/);
});
test('Collection uses own current entries added in the period, keeps price zero and never invents currency or purchases',async()=>{
 const r=await renderNative('src/features/statistics/screens/ExploreScreen.tsx','default',{}, {params:{...query,section:'collection'},statisticsReport:explore});
 assert.match(r.html,/0,00/);assert.match(r.html,/moeda não indicada/);assert.doesNotMatch(r.html,/€/);assert.match(r.html,/Sem partidas no teu histórico/);
 await r.press(game.name);assert.equal(r.routes.at(-1).pathname,'/games/details/[id]');
});
test('All annual card projections omit friend identities and arbitrary private DTO fields',async()=>{
 const r=await renderNative('src/features/statistics/YearCard.tsx','default',{report:year,id:'company'});
 const cards=r.load('src/features/statistics/yearCards.ts');
 const malicious={...year,friendName:'SECRET_NAME',friendId:'SECRET_ID',notes:'SECRET_NOTE',summary:{...year.summary,notes:'SECRET_DIARY'}};
 for(const id of cards.YEAR_CARDS){const serialized=JSON.stringify(cards.publicYearCard(malicious,id));assert.doesNotMatch(serialized,/SECRET_|friendId|friendName|notes/);}
 assert.match(r.html,/não inclui nomes/);assert.match(r.html,/Modo: Competitivo/);assert.match(r.html,/Jogo: Um jogo/);assert.doesNotMatch(r.html,/Amigo visível/);
});
test('Year cards distinguish most wins from win rate sample, preserve no duration and zero, and link to filtered evidence',async()=>{
 const r=await renderNative('src/features/statistics/screens/YearScreen.tsx','default',{}, {params:{...query,year:'2024'},states:{0:2024,1:2},statisticsReport:year});
 assert.match(r.html,/2 vitórias/);assert.match(r.html,/4 resultados conhecidos/);await r.press(game.name+' · Consultar partidas ›');
 assert.equal(r.routes.at(-1).params.metric,'wins');assert.equal(r.routes.at(-1).params.start,'2024-01-01');assert.equal(r.routes.at(-1).params.gameId,'game-a');
 const rate=await renderNative('src/features/statistics/YearCard.tsx','default',{report:year,id:'rate'});assert.match(rate.html,/pelo menos 5 resultados/);assert.doesNotMatch(rate.html,/0%/);
 const time=await renderNative('src/features/statistics/YearCard.tsx','default',{report:{...year,summary:{...summary,recordedMinutes:null,matchesWithDuration:0}},id:'time'});assert.match(time.html,/Sem duração registada/);
});
test('Generic report cancels late responses and does not publish data after navigation',async()=>{
 let resolve,signal;
 const load=s=>{signal=s;return new Promise(r=>resolve=r);};
 const r=await renderNative('tests/helpers/ReportHookProbe.tsx','default',{scope:'company-friend-a',load},{realReportHook:true,captureEffects:true,stateModules:['src/features/statistics/hooks/useReport.ts']});
 const cleanup=r.effects.map(fn=>fn()).filter(fn=>typeof fn==='function');const n=r.updates.length;cleanup.forEach(fn=>fn());resolve(company);await new Promise(r=>setImmediate(r));
 assert.equal(signal.aborted,true);assert.equal(r.updates.length,n);
});
