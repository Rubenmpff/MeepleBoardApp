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
 const r=await renderNative('src/features/statistics/screens/CompanyScreen.tsx','default',{}, {params:{...query,friendId:'friend-id'},states:{0:'friend-id',9:true},stateModules:['src/ui/components.tsx'],statisticsReport:company,statisticsSummary:summary,width:320,fontScale:2});
 assert.match(r.html,/Eu: 0/);assert.match(r.html,/-5/);assert.match(r.html,/não uma classificação/);
 await r.press('Vitórias partilhadas entre nós: 1');
 const route=r.routes.at(-1);assert.equal(route.pathname,'/statistics/matches');assert.equal(route.params.friendId,'friend-id');assert.equal(route.params.metric,'shared-win');assert.equal(route.params.mode,'COMPETITIVE');assert.equal(route.params.start,query.start);assert.equal(route.params.gameId,query.gameId);
 await r.press('Venceu outro, nenhum de nós: 1');assert.equal(r.routes.at(-1).params.metric,'other-win');
});
test('Records and ratings retain zero, negative scores, known sample and links to the precise supporting scores',async()=>{
 const r=await renderNative('src/features/statistics/screens/ExploreScreen.tsx','default',{}, {params:{...query,section:'games'},states:{2:{'game-a':true}},statisticsReport:explore,statisticsSummary:summary});
 await r.press('Mínimo registado: -5');assert.equal(r.routes.at(-1).params.scoreValue,-5);assert.equal(r.routes.at(-1).params.metric,'scores');assert.equal(r.routes.at(-1).params.mode,'COMPETITIVE');
 await r.press('Máximo registado: 0');assert.equal(r.routes.at(-1).params.scoreValue,0);
 const ratings=await renderNative('src/features/statistics/screens/ExploreScreen.tsx','default',{}, {params:{...query,section:'ratings'},states:{2:{'game-a':true}},statisticsReport:explore});
 await ratings.press('Avaliação média (0–10): 0');assert.equal(ratings.routes.at(-1).params.metric,'ratings');assert.match(ratings.html,/2 de 5 partidas avaliadas/);
});
test('Collection uses own current entries added in the period, keeps price zero and never invents currency or purchases',async()=>{
 const r=await renderNative('src/features/statistics/screens/ExploreScreen.tsx','default',{}, {params:{...query,section:'collection'},statisticsReport:explore});
 assert.match(r.html,/0,00/);assert.match(r.html,/moeda não indicada/);assert.doesNotMatch(r.html,/€/);assert.match(r.html,/Sem partidas no teu histórico/);
 await r.press(game.name);assert.equal(r.routes.at(-1).pathname,'/games/details/[id]');
});
test('All annual card projections omit friend identities and arbitrary private DTO fields',async()=>{
 const r=await renderNative('src/features/statistics/components/YearCard.tsx','default',{report:year,id:'company'});
 const cards=r.load('src/features/statistics/utils/yearCards.ts');
 const malicious={...year,friendName:'SECRET_NAME',friendId:'SECRET_ID',notes:'SECRET_NOTE',summary:{...year.summary,notes:'SECRET_DIARY'}};
 for(const id of cards.YEAR_CARDS){const serialized=JSON.stringify(cards.publicYearCard(malicious,id));assert.doesNotMatch(serialized,/SECRET_|friendId|friendName|notes/);}
 assert.match(r.html,/não inclui nomes/);assert.match(r.html,/Modo: Competitivo/);assert.match(r.html,/Jogo: Um jogo/);assert.doesNotMatch(r.html,/Amigo visível/);
});
test('Year cards distinguish most wins from win rate sample, preserve no duration and zero, and link to filtered evidence',async()=>{
 const r=await renderNative('src/features/statistics/screens/YearScreen.tsx','default',{}, {params:{...query,year:'2024'},states:{0:2024,1:2},statisticsReport:year});
 assert.match(r.html,/2 vitórias/);assert.match(r.html,/4 resultados conhecidos/);await r.press(game.name+' · Consultar partidas');
 assert.equal(r.routes.at(-1).params.metric,'wins');assert.equal(r.routes.at(-1).params.start,'2024-01-01');assert.equal(r.routes.at(-1).params.gameId,'game-a');
 const rate=await renderNative('src/features/statistics/components/YearCard.tsx','default',{report:year,id:'rate'});assert.match(rate.html,/pelo menos 5 resultados/);assert.doesNotMatch(rate.html,/0%/);
 const time=await renderNative('src/features/statistics/components/YearCard.tsx','default',{report:{...year,summary:{...summary,recordedMinutes:null,matchesWithDuration:0}},id:'time'});assert.match(time.html,/Sem duração registada/);
});
test('Generic report cancels late responses and does not publish data after navigation',async()=>{
 let resolve,signal;
 const load=s=>{signal=s;return new Promise(r=>resolve=r);};
 const r=await renderNative('tests/helpers/ReportHookProbe.tsx','default',{scope:'company-friend-a',load},{realReportHook:true,captureEffects:true,stateModules:['src/features/statistics/hooks/useReport.ts']});
 const cleanup=r.effects.map(fn=>fn()).filter(fn=>typeof fn==='function');const n=r.updates.length;cleanup.forEach(fn=>fn());resolve(company);await new Promise(r=>setImmediate(r));
 assert.equal(signal.aborted,true);assert.equal(r.updates.length,n);
});

test('Company starts with directly searchable authorized friends and keeps details collapsed',async()=>{
 const r=await renderNative('src/features/statistics/screens/CompanyScreen.tsx','default',{}, {params:query,statisticsReport:{...company,friendId:null},statisticsSummary:summary});
 assert.match(r.html,/Com quem jogaste/);assert.ok(r.inputs.some(i=>i.accessibilityLabel==='Procurar amigo'));
 await r.press(r.i18n.t('statistics:selectFriend',{name:'Amigo visível'}));assert.ok(r.updates.some(([i,v])=>i===0&&v==='friend-id'));
 assert.doesNotMatch(r.html,/Eu: 0/);
});
test('Explore categories have a selected tab and games reveal their evidence only on request',async()=>{
 const r=await renderNative('src/features/statistics/screens/ExploreScreen.tsx','default',{}, {params:query,statisticsReport:explore,statisticsSummary:summary});
 assert.doesNotMatch(r.html,/Mínimo registado/);await r.press(game.name);assert.ok(r.updates.some(([i,v])=>i===2&&v['game-a']));
 await r.press('Avaliações');assert.ok(r.updates.some(([i,v])=>i===0&&v==='ratings'));
 await r.press('Coleção');assert.ok(r.updates.some(([i,v])=>i===0&&v==='collection'));
});
test('Current annual reader and shared card mark To date, while completed years do not',async()=>{
 const current=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:query.timeZone}).format(new Date()));
 const currentReport={...year,year:current};
 const reader=await renderNative('src/features/statistics/screens/YearScreen.tsx','default',{}, {params:{...query,year:String(current)},statisticsReport:currentReport});
 assert.match(reader.html,/Até à data/);assert.doesNotMatch(reader.html,/Ano inteiro/);
 const shared=await renderNative('src/features/statistics/components/YearCard.tsx','default',{report:currentReport,id:'overview'});assert.match(shared.html,/Até à data/);assert.match(shared.html,/1 jogo diferente/);
 const past=await renderNative('src/features/statistics/components/YearCard.tsx','default',{report:{...year,year:current-1},id:'overview'});assert.doesNotMatch(past.html,/Até à data/);
});

test('Pair context filters advertise counts and propagate selected context to every supporting route',async()=>{
 const data={...company,contextCounts:{all:5,onlyTwo:2,group:3,unclassified:0},groupContext:'group'};
 const r=await renderNative('src/features/statistics/screens/CompanyScreen.tsx','default',{}, {params:{...query,friendId:'friend-id',groupContext:'group'},states:{0:'friend-id'},statisticsReport:data,statisticsSummary:summary});
 const contexts=r.controls.filter(c=>['Todas','Só vocês','Em grupo'].includes(c.accessibilityLabel));assert.equal(contexts.length,3);assert.equal(contexts.find(c=>c.accessibilityLabel==='Em grupo').accessibilityState.selected,true);
 await r.press('Só vocês');assert.ok(r.updates.some(([i,v])=>i===4&&v==='only-two'));
 await r.press('Vitórias partilhadas entre nós: 1');assert.equal(r.routes.at(-1).params.groupContext,'group');assert.equal(r.routes.at(-1).params.friendId,'friend-id');
 assert.doesNotMatch(r.html,/participantes registados/);assert.match(r.html,/4 de 5 com resultado conhecido/);
});

test('Most played has one row per GameId, sums all filtered modes and retains mode-specific evidence',async()=>{
 const multi={...explore,games:[explore.games[0],{...explore.games[0],mode:'SOLO',matches:2,minimum:-9,maximum:0}, {...explore.games[0],gameId:'another-id',matches:6}]};
 const r=await renderNative('src/features/statistics/screens/ExploreScreen.tsx','default',{}, {statisticsReport:multi});
 const rows=r.controls.filter(c=>c.accessibilityLabel===game.name);assert.equal(rows.length,2);assert.match(r.html,/7 partidas/);
 await r.press(game.name);assert.ok(r.updates.some(([i,v])=>i===2&&v['game-a']));
 const open=await renderNative('src/features/statistics/screens/ExploreScreen.tsx','default',{}, {statisticsReport:multi,states:{2:{'game-a':true}}});
 assert.match(open.html,/Solo · 2 partidas/);assert.match(open.html,/Competitivo · 5 partidas/);
 await open.press('Mínimo registado: -9');assert.equal(open.routes.at(-1).params.mode,'SOLO');assert.equal(open.routes.at(-1).params.gameId,'game-a');
});
test('Friend search pins placeholder contrast to the actual white field in light and dark',async()=>{
 for(const colorScheme of ['light','dark']){
  const r=await renderNative('src/features/statistics/screens/CompanyScreen.tsx','default',{}, {statisticsReport:company,colorScheme});
  const search=r.inputs.find(i=>i.accessibilityLabel==='Procurar amigo');assert.equal(search.placeholderTextColor,'#58616A');assert.equal(search.style[1].color,'#30283D');assert.equal(search.keyboardAppearance,'light');
  assert.equal(r.load('src/ui/theme.ts').colors.card,'#FFFFFF');
 }
});
test('Annual cards retain relevant coverage and put extensive explanations outside the captured image',async()=>{
 const card=await renderNative('src/features/statistics/components/YearCard.tsx','default',{report:year,id:'time'});
 assert.match(card.html,/Duração em 1 de 5/);assert.match(card.html,/4 resultados conhecidos/);assert.doesNotMatch(card.html,/Fuso horário|Segundo o teu histórico/);
 const reader=await renderNative('src/features/statistics/screens/YearScreen.tsx','default',{}, {params:{...query,year:'2024'},statisticsReport:year,states:{6:true},stateModules:['src/ui/components.tsx']});
 assert.match(reader.html,/Fuso horário: Europe\/Lisbon/);assert.match(reader.html,/Segundo o teu histórico/);
});
test('Statistics uses mounted native tabs without animation and one shared header outside the scenes',async()=>{
 const r=await renderNative('tests/helpers/StatisticsAreasProbe.tsx','default',{}, {params:query,pathname:'/statistics/company'});
 const tabs=r.calls.find(c=>c[0]==='tabs')[1];assert.equal(tabs.screenOptions.animation,'none');assert.equal(tabs.screenOptions.lazy,true);assert.equal(tabs.screenOptions.freezeOnBlur,true);assert.equal(tabs.detachInactiveScreens,false);
 assert.equal(r.controls.filter(c=>c.accessibilityRole==='tab').length,4);assert.equal(r.controls.filter(c=>c.accessibilityLabel==='Voltar').length,1);
 await r.press('Explorar');assert.equal(r.routes.at(-1).pathname,'/statistics/explore');assert.equal(r.routes.at(-1).params.gameId,query.gameId);
});


test('Friend detail retains a direct supporting access with the selected context and filters',async()=>{
 const r=await renderNative('src/features/statistics/screens/CompanyScreen.tsx','default',{}, {params:{...query,friendId:'friend-id',groupContext:'group'},states:{0:'friend-id'},statisticsReport:company,statisticsSummary:summary});
 await r.press('Consultar partidas');const route=r.routes.at(-1);
 assert.equal(route.params.friendId,'friend-id');assert.equal(route.params.groupContext,'group');assert.equal(route.params.metric,'pair-all');
 for(const [key,value]of Object.entries(query))assert.equal(route.params[key],value);
});
test('Annual preview returns to the same card without changing its filters or exposing friends',async()=>{
 const r=await renderNative('src/features/statistics/screens/YearScreen.tsx','default',{}, {params:{...query,year:'2024'},states:{0:2024,1:1,2:true},statisticsReport:year});
 assert.match(r.html,/Amigos sempre anónimos/);assert.doesNotMatch(r.html,/Amigo visível/);
 await r.press('Voltar ao cartão');assert.ok(r.updates.some(([i,v])=>i===2&&v===false));
 assert.ok(!r.updates.some(([i])=>i===0||i===1));assert.equal(r.routes.length,0);
 const busy=await renderNative('src/features/statistics/screens/YearScreen.tsx','default',{}, {params:query,states:{2:true,3:true},statisticsReport:year});
 assert.equal(busy.controls.find(c=>c.accessibilityLabel==='Voltar ao cartão').disabled,true);
});

test('Company and Explore reuse the Summary filter toolbar and one apply sheet',async()=>{
 for(const area of ['Company','Explore']){
 const file=`src/features/statistics/screens/${area}Screen.tsx`;
 const closed=await renderNative(file,'default',{}, {params:query,statisticsReport:{...company,friendId:null},statisticsSummary:summary});
 assert.equal(closed.controls.filter(c=>c.accessibilityLabel==='Filtros').length,1);
 assert.ok(closed.controls.some(c=>c.accessibilityHint==='Filtros'&&c.accessibilityRole==='button'));
 assert.ok(!closed.controls.some(c=>c.accessibilityLabel==='Jogo'||c.accessibilityLabel==='Modo de jogo'));
 const open=await renderNative(file,'default',{}, {params:query,statisticsReport:{...company,friendId:null},statisticsSummary:summary,stateModules:['src/features/statistics/components/ExploreFilters.tsx'],states:{[area==='Company'?7:6]:true}});
 assert.equal(open.controls.filter(c=>c.accessibilityLabel==='Aplicar filtros').length,1);
 }
});

test('Company replaces the zero grid with a confirmation message and filtered pending matches',async()=>{
 const zero=Object.fromEntries(Object.keys(results).map(k=>[k,k==='unknown'?76:0]));
 const r=await renderNative('src/features/statistics/screens/CompanyScreen.tsx','default',{}, {params:{...query,mode:undefined,friendId:'friend-id',groupContext:'only-two'},statisticsSummary:summary,statisticsReport:{...company,friendName:'Um nome de amigo muito longo que permanece completo',matches:76,results:zero},width:320,fontScale:2});
 assert.match(r.html,/Nenhuma destas 76 partidas tem resultado conhecido: foram guardadas como «Não definido» ou são registos antigos com resultado incompleto/);
 assert.doesNotMatch(r.html,/As tuas vitórias|Resultado da equipa|Empates e vitórias partilhadas/);
 assert.match(r.html,/Um nome de amigo muito longo que permanece completo/);
 await r.press('Partidas sem resultado conhecido: 76');assert.equal(r.routes.at(-1).params.metric,'unknown-pair');assert.equal(r.routes.at(-1).params.mode,undefined);
 for(const key of ['start','endExclusive','timeZone'])assert.equal(r.routes.at(-1).params[key],query[key]);
 assert.equal(r.routes.at(-1).params.groupContext,'only-two');assert.equal(r.routes.at(-1).params.friendId,'friend-id');
});

test('Company list → friend → back restores search, filters and saved list scroll',async()=>{
 const refs=[{current:{scrollTo:args=>scrolls.push(args)}},{current:0},{current:false}],scrolls=[];
 const options={params:query,statisticsSummary:summary,statisticsReport:{...company,friendId:null},refs};
 const file='src/features/statistics/screens/CompanyScreen.tsx';
 const list=await renderNative(file,'default',{},options);
 list.inputs.find(i=>i.accessibilityLabel==='Procurar amigo').onChangeText('Amigo');
 assert.ok(list.updates.some(([i,v])=>i===2&&v==='Amigo'));
 list.nativeViews.find(([kind])=>kind==='scroll')[1].onScroll({nativeEvent:{contentOffset:{y:435}}});
 await list.press(list.i18n.t('statistics:selectFriend',{name:'Amigo visível'}));
 assert.deepEqual(scrolls.at(-1),{y:0,animated:false});
 const detail=await renderNative(file,'default',{}, {...options,states:{0:'friend-id',2:'Amigo'},statisticsReport:company});
 await detail.press('Voltar');assert.ok(detail.updates.some(([i,v])=>i===0&&v===undefined));assert.deepEqual(detail.routes,[]);
 assert.ok(!detail.updates.some(([i])=>i===2));
 const restored=await renderNative(file,'default',{}, {...options,states:{2:'Amigo'}});
 assert.equal(restored.inputs.find(i=>i.accessibilityLabel==='Procurar amigo').value,'Amigo');
 restored.nativeViews.find(([kind])=>kind==='scroll')[1].onContentSizeChange(390,1100);
 assert.deepEqual(scrolls.at(-1),{y:435,animated:false});
 await restored.press('Voltar');assert.equal(restored.routes.at(-1),'back');
});

test('Persistent workspace header returns from friend to Company list instead of leaving statistics',async()=>{
 const r=await renderNative('tests/helpers/StatisticsAreasProbe.tsx','default',{includeCompany:true},{pathname:'/statistics/company',params:{...query,friendId:'friend-id'},statisticsReport:company,statisticsSummary:summary,captureFocusEffects:true,stateModules:['src/features/statistics/screens/CompanyScreen.tsx']});
 const cleanups=r.effects.map(effect=>effect()).filter(c=>typeof c==='function');
 await r.press('Voltar');assert.ok(r.updates.some(([i,v])=>i===0&&v===undefined));assert.deepEqual(r.routes,[]);
 cleanups.forEach(cleanup=>cleanup());
 await r.press('Voltar');assert.equal(r.routes.at(-1),'back');
});

test('Company clarifies competitive draws and retains their distinct evidence and team results',async()=>{
 const file='src/features/statistics/screens/CompanyScreen.tsx',report={...company,results:{...results,draws:3,drawsTogether:1}};
 const r=await renderNative(file,'default',{}, {params:{...query,mode:undefined,friendId:'friend-id'},statisticsSummary:summary,statisticsReport:report,states:{6:true},stateModules:['src/ui/components.tsx'],width:320,fontScale:2});
 assert.match(r.html,/Não inclui empates apenas entre outros participantes/);
 assert.ok(r.controls.some(c=>c.accessibilityLabel==='Empates e vitórias partilhadas'));
 await r.press('Empates com um de nós em primeiro: 3');assert.equal(r.routes.at(-1).params.metric,'pair-draw');assert.equal(r.routes.at(-1).params.mode,'COMPETITIVE');
 await r.press('Um de nós empatou com outro: 2');assert.equal(r.routes.at(-1).params.metric,'draw-with-other');
 await r.press('Empatámos ambos no primeiro lugar: 1');assert.equal(r.routes.at(-1).params.metric,'draw-together');
 for(const [label,metric] of [['Vitórias da equipa: 1','team-win'],['Derrotas da equipa: 0','team-loss'],['Empates da equipa: 0','team-draw']]) {
  await r.press(label);assert.equal(r.routes.at(-1).params.metric,metric);assert.equal(r.routes.at(-1).params.mode,'COOPERATIVE');assert.equal(r.routes.at(-1).params.friendId,'friend-id');
 }
 assert.match(r.html,/Jogos mais frequentes em conjunto/);assert.match(r.html,/Evolução dos resultados/);assert.match(r.html,/Pontuações em conjunto/);
});

test('Friend switch uses the shared sheet, independent search and selection without resetting filters or context',async()=>{
 const file='src/features/statistics/screens/CompanyScreen.tsx';
 const alternate={friendId:'second-friend',name:'Outro amigo com um nome muito longo',matches:12};
 const options={params:{...query,friendId:'friend-id',groupContext:'group'},statisticsSummary:summary,statisticsReport:{...company,companions:[...company.companions,alternate]},width:320,fontScale:1.6};
 const closed=await renderNative(file,'default',{},options);
 assert.ok(!closed.controls.some(c=>c.accessibilityLabel===closed.i18n.t('statistics:selectFriend',{name:alternate.name})));
 await closed.press('Trocar amigo');assert.ok(closed.updates.some(([i,v])=>i===1&&v===true));
 const open=await renderNative(file,'default',{}, {...options,states:{1:true,2:'Pesquisa da lista'}});
 assert.ok(open.nativeViews.some(([kind,p])=>kind==='modal'&&p.visible));
 const current=open.controls.find(c=>c.accessibilityLabel===open.i18n.t('statistics:selectFriend',{name:company.friendName}));assert.equal(current.accessibilityState.selected,true);
 assert.equal(open.inputs.find(i=>i.accessibilityLabel==='Procurar amigo').value,'');
 open.inputs.find(i=>i.accessibilityLabel==='Procurar amigo').onChangeText('Outro');assert.ok(open.updates.some(([i,v])=>i===5&&v==='Outro'));assert.ok(!open.updates.some(([i])=>i===2));
 const filtered=await renderNative(file,'default',{}, {...options,states:{1:true,5:'Outro'}});
 assert.ok(!filtered.controls.some(c=>c.accessibilityLabel===filtered.i18n.t('statistics:selectFriend',{name:company.friendName})));
 await filtered.press(filtered.i18n.t('statistics:selectFriend',{name:alternate.name}));
 assert.ok(filtered.updates.some(([i,v])=>i===0&&v===alternate.friendId));assert.ok(filtered.updates.some(([i,v])=>i===1&&v===false));assert.ok(!filtered.updates.some(([i])=>i===2||i===4));assert.deepEqual(filtered.routes,[]);
 const changed=await renderNative(file,'default',{}, {...options,states:{0:alternate.friendId,4:'group'}});
 await changed.press('Consultar partidas');const route=changed.routes.at(-1);assert.equal(route.params.friendId,alternate.friendId);assert.equal(route.params.groupContext,'group');for(const key of ['start','endExclusive','timeZone','gameId','mode'])assert.equal(route.params[key],query[key]);
 await open.press('Fechar troca de amigo');assert.ok(!open.updates.some(([i])=>i===0||i===4));assert.ok(open.updates.some(([i,v])=>i===1&&v===false));
 const dismiss=await renderNative(file,'default',{}, {...options,states:{1:true}});dismiss.nativeViews.find(([kind,p])=>kind==='modal'&&p.visible)[1].onRequestClose();assert.ok(!dismiss.updates.some(([i])=>i===0));assert.ok(dismiss.updates.some(([i,v])=>i===1&&v===false));
});
