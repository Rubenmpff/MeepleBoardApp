const test=require('node:test'),assert=require('node:assert/strict');
const {renderNative}=require('./helpers/renderNative.cjs');
const source='src/features/statistics/screens/StatisticsScreen.tsx';
const flat=style=>Array.isArray(style)?Object.assign({},...style.flat(Infinity).filter(Boolean)):(style||{});
const query={start:'2024-01-01',endExclusive:'2025-01-01',timeZone:'Europe/Lisbon'};
const game={gameId:'game-id',name:'Long game name preserved without invented results',imageUrl:null,matches:3};
const summary={...query,matches:3,distinctGames:1,recordedMinutes:0,matchesWithDuration:1,matchesWithoutDuration:2,averagePersonalRating:0,ratedMatches:1,
 results:{wins:1,losses:0,draws:1,known:2,withoutResult:1,legacy:1,winRate:50},modes:[{mode:'COMPETITIVE',matches:3,results:{wins:1,losses:0,draws:1,known:2,withoutResult:1,legacy:1,winRate:50}}],
 bucketUnit:'month',evolution:[{key:'2024-01',matches:3},{key:'2024-02',matches:0}],games:[game],gameOptions:[game]};
test('Every statistic navigates to supporting matches with the same period/game/mode filters',async()=>{
 const filtered={...query,gameId:'game-id',mode:'COMPETITIVE'};
 const r=await renderNative(source,'default',{}, {statisticsSummary:summary,states:{0:'Europe/Lisbon',3:filtered}});
 const labels={all:'Partidas: 3',games:'Jogo diferente: 1',duration:'Tempo registado: 0 min','missing-duration':'2 partidas sem duração',wins:'Vitórias: 1',losses:'Derrotas: 0',draws:'Empates: 1',known:'Taxa de vitória: 50%',undefined:'1 partida sem resultado conhecido',legacy:'1 registo antigo com resultado incompleto',ratings:'Avaliação média (0–10): 0'};
 for(const [metric,label]of Object.entries(labels)){
  await r.press(label);const route=r.routes.at(-1);assert.equal(route.pathname,'/statistics/matches');assert.equal(route.params.metric,metric);
  for(const [key,val]of Object.entries(filtered))assert.equal(route.params[key],val);
 }

});
test('Statistics keeps zero measurements, mode labels, scrolling and does not show unknown results as losses',async()=>{
 for(const language of ['pt','en']){
 const r=await renderNative(source,'default',{}, {language,statisticsSummary:summary,states:{0:'Europe/Lisbon',3:query,4:true,10:'mode'},stateModules:['src/features/statistics/components/ExploreFilters.tsx'],width:320,fontScale:2});
 assert.match(r.html,/0 min/);assert.match(r.html,/50%/);assert.match(r.html,/Long game name preserved/);
 assert.equal(r.nativeViews.find(v=>v[0]==='scroll')[1].keyboardShouldPersistTaps,'handled');
 assert.ok(r.html.includes(r.i18n.t('statistics:winRate')));assert.ok(r.html.includes(r.i18n.t('statistics:modes.SOLO')));assert.ok(r.html.includes(r.i18n.t('statistics:modes.COOPERATIVE')));
 assert.doesNotMatch(r.html,/statistics:|undefined%|NaN/);
 }
});
test('Evolution columns open their supporting period, including zero activity, without losing filters',async()=>{
 const filtered={...query,mode:'SOLO',gameId:'game-id'};
 const r=await renderNative(source,'default',{}, {statisticsSummary:summary,states:{0:'Europe/Lisbon',3:filtered,6:true},stateModules:['src/features/statistics/components/StatisticsEvolution.tsx'],width:320,fontScale:2});
 await r.press('janeiro de 2024: 3 partidas');
 assert.deepEqual(r.routes.at(-1),{pathname:'/statistics/matches',params:{...filtered,metric:'all',bucket:'2024-01'}});
 await r.press(`fevereiro de 2024: ${r.i18n.t('statistics:matchCount',{count:0})}`);
 assert.equal(r.routes.at(-1).params.bucket,'2024-02');
 // Only the enlarged area strip may scroll sideways; the chart itself never does.
 assert.ok(!r.nativeViews.some(([kind,props])=>kind==='scroll'&&props.horizontal&&props.accessibilityRole!=='tablist'));
 const selections=[];
 const daily=await renderNative('src/features/statistics/components/StatisticsEvolution.tsx','default',{
  buckets:[{key:'2024-10-27',matches:2}],unit:'day',language:'pt',title:'Evolução',
  countLabel:n=>`${n} partidas`,onSelect:key=>selections.push(key),
 });
 await daily.press('27 de outubro de 2024: 2 partidas');
 assert.deepEqual(selections,['2024-10-27']);
 assert.match(daily.html,/27/);
});
test('Statistics separates unavailable, empty, failed and loading states',async()=>{
 const empty={...summary,matches:0,distinctGames:0,recordedMinutes:null,averagePersonalRating:null,results:{wins:0,losses:0,draws:0,known:0,withoutResult:0,legacy:0,winRate:null},games:[],gameOptions:[],evolution:[],modes:[]};
 const r=await renderNative(source,'default',{}, {statisticsSummary:empty});assert.match(r.html,/Sem partidas em/);assert.doesNotMatch(r.html,/Sem duração registada|Partidas por mês|Jogos mais jogados|Resultados pessoais|0%/);
 assert.equal((r.html.match(/Sem partidas em/g)||[]).length,1);
 await r.press('Alterar filtros');assert.ok(r.updates.some(([i,v])=>i===4&&v===true));
 const error=await renderNative(source,'default',{}, {statisticsError:true});await error.press('Tentar novamente');assert.ok(error.calls.some(c=>c[0]==='refetchStatistics'));assert.doesNotMatch(error.html,/Sem partidas em/);
 const loading=await renderNative(source,'default',{}, {statisticsLoading:true});assert.match(loading.html,/A carregar estatísticas/);assert.doesNotMatch(loading.html,/Sem partidas em/);
});
test('Shared game and mode choices only update a draft, preserving the period',async()=>{
 const changes=[];
 const props={query,onChange:q=>changes.push(q),games:[game]};
 const modes=await renderNative('src/features/statistics/components/ExploreFilters.tsx','default',props,{states:{1:true,4:'mode'}});
 await modes.press('Solo');assert.ok(modes.updates.some(([i,v])=>i===2&&v.mode==='SOLO'&&v.start===query.start));assert.ok(modes.updates.some(([i,v])=>i===4&&v==='main'));
 const games=await renderNative('src/features/statistics/components/ExploreFilters.tsx','default',props,{states:{1:true,4:'game'}});
 await games.press('Selecionar jogo: '+game.name);assert.ok(games.updates.some(([i,v])=>i===2&&v.gameId===game.gameId&&v.start===query.start));
 assert.deepEqual(changes,[]);
});
test('Supporting list keeps own score/rating zero, negative values, legacy label and detail/back context',async()=>{
 const data={total:1,offset:0,limit:25,items:[{id:'match-id',gameId:'game-id',gameName:game.name,gameImageUrl:null,matchDate:'2024-01-03T12:00:00Z',gameMode:'SOLO',outcome:null,resultSource:'Legacy',durationInMinutes:0,score:-5,personalRating:0}]};
 const r=await renderNative('src/features/statistics/screens/StatisticsMatchesScreen.tsx','default',{}, {params:{...query,metric:'legacy'},states:{1:data,3:false},width:320,fontScale:2});
 assert.match(r.html,/-5/);assert.match(r.html,/0\/10/);assert.match(r.html,/0 min/);assert.match(r.html,/Registo antigo com resultado incompleto/);
 await r.press(game.name);assert.deepEqual(r.routes.at(-1),{pathname:'/games/matches/[id]',params:{id:'match-id'}});
 await r.press('Voltar');assert.equal(r.routes.at(-1),'back');
});
test('Calendar periods use local date arithmetic and inclusive custom end becomes exclusive',async()=>{
 const r=await renderNative(source,'default');const utils=r.load('src/features/statistics/utils/period.ts');
 assert.deepEqual(utils.periodQuery('week','2024-10-27','Europe/Lisbon'),{start:'2024-10-21',endExclusive:'2024-10-28',timeZone:'Europe/Lisbon'});
 assert.equal(utils.customQuery('2024-03-31','2024-03-31','Europe/Lisbon').endExclusive,'2024-04-01');
 assert.equal(utils.customQuery('2024-02-30','2024-03-01','UTC'),null);
 assert.equal(utils.shiftAnchor('2024-01-31','month',1),'2024-02-01');
 assert.equal(utils.inclusiveEnd('2025-01-01'),'2024-12-31');
});
test('A cancelled statistics request cannot publish a late response or another account cache',async()=>{
 let resolve;
 const r=await renderNative('tests/helpers/StatisticsHookProbe.tsx','default',query,{realStatisticsHook:true,captureEffects:true,stateModules:['src/features/statistics/hooks/useStatistics.ts'],services:{summary:()=>new Promise(r=>resolve=r)}});
 const cleanup=r.effects.map(fn=>fn()).filter(fn=>typeof fn==='function');
 const request=r.calls.find(c=>c[0]==='summary');assert.deepEqual(request[1],query);assert.equal(request[2].aborted,false);
 const before=r.updates.length;cleanup.forEach(fn=>fn());assert.equal(request[2].aborted,true);
 resolve(summary);await new Promise(r=>setImmediate(r));assert.equal(r.updates.length,before);
});
test('Statistics header puts Back in its own row when keyboard or enlarged text collapses the logo',async()=>{
 const props={title:'Estatísticas',backLabel:'Voltar',onBack(){}};
 const r=await renderNative('src/features/statistics/components/StatisticsHeader.tsx','default',props,{states:{0:true,1:true},stateModules:['src/features/statistics/components/ClubHeader.tsx'],width:390});
 assert.equal(r.images.length,0);assert.ok(r.controls.some(c=>c.accessibilityLabel==='Voltar'&&c.style.position!=='absolute'));assert.match(r.html,/Estatísticas/);
});
test('Selectors and calculation notes stay collapsed until requested, while filters and coverage remain available',async()=>{
 const r=await renderNative(source,'default',{}, {statisticsSummary:summary,states:{0:'Europe/Lisbon',3:query}});
 assert.doesNotMatch(r.html,/Vitórias ÷|Zero é uma avaliação|Europe\/Lisbon|Resultado da equipa/);
 assert.match(r.html,/0 min registados/);assert.match(r.html,/em 1 de 3/);
 assert.equal(r.controls.filter(c=>c.accessibilityLabel==='Vitórias: 1').length,1);
 await r.press('Filtros');
 assert.ok(r.updates.some(([i,v])=>i===4&&v===true));
 const sheet=await renderNative(source,'default',{}, {statisticsSummary:summary,states:{0:'Europe/Lisbon',3:query,4:true},stateModules:['src/features/statistics/components/ExploreFilters.tsx']});
 await sheet.press('Modo de jogo: Todos os modos');
 assert.ok(sheet.updates.some(([i,v])=>i===10&&v==='mode'));
 const disclosure=await renderNative(source,'default',{}, {statisticsSummary:summary,states:{0:'Europe/Lisbon',3:query},stateModules:['src/ui/components.tsx']});
 await disclosure.press('Como calculamos');
 assert.ok(disclosure.updates.some(([i,v])=>i===6&&v===true));
 const notes=await renderNative(source,'default',{}, {statisticsSummary:summary,states:{0:'Europe/Lisbon',3:query,6:true},stateModules:['src/ui/components.tsx']});
 assert.match(notes.html,/Europe\/Lisbon/);assert.match(notes.html,/Vitórias ÷/);
 assert.match(notes.html,/Zero é uma avaliação/);
 const noDuration=await renderNative(source,'default',{}, {statisticsSummary:{...summary,recordedMinutes:null,matchesWithDuration:0,matchesWithoutDuration:3},states:{0:'Europe/Lisbon',3:query}});
 await noDuration.press('Tempo registado: Sem duração registada');
 assert.equal(noDuration.routes.at(-1).params.metric,'missing-duration');
});
test('Zero activity renders no bar; all real bars share an explicit integer scale',async()=>{
 const props={buckets:[{key:'2024-01',matches:3},{key:'2024-02',matches:0}],unit:'month',language:'pt',title:'Evolução',countLabel:n=>`${n} partidas`,onSelect(){}};
 const chart=await renderNative('src/features/statistics/components/StatisticsEvolution.tsx','default',props,{captureStatisticsPlot:true});
 const bars=chart.calls.filter(c=>c[0]==='statisticsBar');
 assert.equal(bars.length,1);assert.equal(bars[0][1].testID,'statistics-bar-2024-01');
 assert.equal(bars[0][1].style[1].height,78);assert.match(chart.html,/<span>4<\/span>/);assert.match(chart.html,/<span>2<\/span>/);
 const empty=await renderNative('src/features/statistics/components/StatisticsEvolution.tsx','default',{...props,buckets:[{key:'2024-01',matches:0}]},{captureStatisticsPlot:true});
 assert.equal(empty.calls.filter(c=>c[0]==='statisticsBar').length,0);
 assert.match(empty.html,/Sem partidas neste período/);assert.doesNotMatch(empty.html,/NaN|Infinity/);
});

test('Annual overview includes activity beyond June and exposes month details without hiding the second half of the year',async()=>{
 const buckets=Array.from({length:12},(_,i)=>({key:`2026-${String(i+1).padStart(2,'0')}`,matches:i===9?158:0}));
 const props={buckets,unit:'month',language:'pt',title:'Evolução',countLabel:n=>`${n} partidas`,onSelect(){}};
 const r=await renderNative('src/features/statistics/components/StatisticsEvolution.tsx','default',props,{captureStatisticsPlot:true});
 assert.equal(r.calls.filter(c=>c[0]==='statisticsBar').length,1);
 assert.equal(r.calls.find(c=>c[0]==='statisticsBar')[1].testID,'statistics-bar-2026-10');
 assert.equal(r.calls.find(c=>c[0]==='statisticsBar')[1].style[1].height,104);
 assert.ok(r.controls.some(c=>c.accessibilityLabel?.includes('outubro de 2026: 158 partidas')));
 assert.ok(!r.nativeViews.some(([kind,props])=>kind==='scroll'&&props.horizontal));
 await r.press('Consultar meses');assert.ok(r.updates.some(([i,v])=>i===0&&v===true));
 const selected=[];
 const details=await renderNative('src/features/statistics/components/StatisticsEvolution.tsx','default',{...props,onSelect:key=>selected.push(key)},{states:{0:true},fontScale:2});
 await details.press('outubro de 2026: 158 partidas');assert.deepEqual(selected,['2026-10']);
 assert.ok(!details.nativeViews.some(([kind,props])=>kind==='scroll'&&props.horizontal));
});

test('Real area tabs select their screen and carry the active filters without overlay menus',async()=>{
 const filtered={...query,gameId:'game-id',mode:'COOPERATIVE'};
 const r=await renderNative(source,'default',{}, {statisticsSummary:summary,states:{0:'Europe/Lisbon',3:filtered}});
 assert.ok(r.html.indexOf('Companhia')<r.html.indexOf('Resultados pessoais'));
 assert.doesNotMatch(r.html,/Escala:|Vitórias ÷|Aplicar intervalo/);
 for(const [label,path] of [['Companhia','/statistics/company'],['Explorar','/statistics/explore'],['Ano','/statistics/year']]){
  await r.press(label);const route=r.routes.at(-1);assert.equal(route.pathname,path);
  for(const [key,value] of Object.entries(filtered))assert.equal(route.params[key],value);
 }
 await r.press('Filtros');assert.ok(r.updates.some(([i,v])=>i===4&&v===true));
 assert.match(r.html,/Partidas por mês/);
 assert.ok(r.html.indexOf('Partidas por mês')<r.html.indexOf('Resultados pessoais'));
 assert.ok(!r.controls.some(c=>c.accessibilityLabel==='Atividade por mês'));
 for(const area of ['summary','company','explore','year']){
  const header=await renderNative('src/features/statistics/components/AreaHeader.tsx','default',{area,title:'Test',query:filtered,period:'month'});
  const tabs=header.controls.filter(c=>c.accessibilityRole==='tab');assert.equal(tabs.length,4);assert.equal(tabs.filter(c=>c.accessibilityState.selected).length,1);
  const labels={summary:'Resumo',company:'Companhia',explore:'Explorar',year:'Ano'};await header.press(labels[area]);assert.equal(header.routes.length,0);
 }
});
test('Frequent games group by ID, retain ties at third place and offer every remaining game',async()=>{
 const games=Array.from({length:6},(_,i)=>({...game,gameId:`game-${i}`,name:`Long game ${i}`,matches:[10,8,5,5,2,1][i]}));
 const collapsed=await renderNative(source,'default',{}, {statisticsSummary:{...summary,games}});
 for(let i=0;i<4;i++)assert.ok(collapsed.controls.some(c=>c.accessibilityLabel===games[i].name));
 assert.ok(!collapsed.controls.some(c=>c.accessibilityLabel===games[4].name));
 await collapsed.press('Ver todos os jogos');assert.ok(collapsed.updates.some(([i,v])=>i===5&&v===true));
 const expanded=await renderNative(source,'default',{}, {statisticsSummary:{...summary,games},states:{5:true}});
 await expanded.press(games[5].name);assert.equal(expanded.routes.at(-1).params.gameId,'game-5');
});

test('Summary header keeps the real logo independent of Back and removes decoration with keyboard',async()=>{
 const source='src/features/statistics/components/SummaryHeader.tsx';
 const normal=await renderNative(source,'default',{backLabel:'Voltar',onBack(){}},{width:402});
 assert.equal(normal.images.length,1);assert.equal(flat(normal.controls.find(c=>c.accessibilityLabel==='Voltar').style).position,'absolute');
 const compact=await renderNative(source,'default',{backLabel:'Voltar',onBack(){}},{width:320,fontScale:2,states:{0:true}});
 assert.equal(compact.images.length,0);assert.notEqual(flat(compact.controls.find(c=>c.accessibilityLabel==='Voltar').style).position,'absolute');
});

test('Summary restores the incoming period, timezone and filters after switching real areas',async()=>{
 const incoming={start:'2024-05-01',endExclusive:'2024-06-01',timeZone:'America/New_York',mode:'SOLO',gameId:'game-id',period:'month'};
 const r=await renderNative(source,'default',{}, {params:incoming,statisticsSummary:summary});
 await r.press('Partidas: 3');const route=r.routes.at(-1);for(const key of ['start','endExclusive','timeZone','mode','gameId'])assert.equal(route.params[key],incoming[key]);
 await r.press('Companhia');const target=r.routes.at(-1);assert.equal(target.params.period,'month');assert.equal(target.params.timeZone,incoming.timeZone);
});
test('Shared filters defer period changes until one apply action',async()=>{
 const changes=[],periods=[],props={query,onChange:q=>changes.push(q),games:[],initialPeriod:'year',onPeriodChange:p=>periods.push(p)};
 const r=await renderNative('src/features/statistics/components/ExploreFilters.tsx','default',props);
 assert.equal(r.controls.filter(c=>c.accessibilityLabel==='Filtros').length,1);
 await r.press('Filtros');assert.ok(r.updates.some(([i,v])=>i===1&&v===true));
 const editor=await renderNative('src/features/statistics/components/ExploreFilters.tsx','default',props,{states:{1:true}});
 await editor.press('Mês');assert.deepEqual(changes,[]);assert.deepEqual(periods,[]);
 assert.ok(editor.updates.some(([i,v])=>i===2&&v.endExclusive==='2024-02-01'));
 const ready=await renderNative('src/features/statistics/components/ExploreFilters.tsx','default',props,{states:{1:true,2:{...query,endExclusive:'2024-02-01'},3:'month'}});
 await ready.press('Aplicar filtros');assert.equal(changes[0].endExclusive,'2024-02-01');assert.deepEqual(periods,['month']);
});
test('Closing the shared sheet leaves the applied query untouched',async()=>{
 const changes=[];
 const r=await renderNative('src/features/statistics/components/ExploreFilters.tsx','default',{query,onChange:q=>changes.push(q),games:[game],initialPeriod:'custom'},{states:{1:true},width:320,fontScale:2});
 assert.equal(r.nativeViews.find(([kind])=>kind==='modal')[1].visible,true);
 assert.equal(r.inputs.length,0);
 await r.press('Fechar filtros');assert.deepEqual(changes,[]);
 assert.ok(r.updates.some(([i,v])=>i===1&&v===false));
 assert.ok(r.calls.some(([kind])=>kind==='dismissKeyboard'));
});

test('More details keeps legacy and missing duration one tap away and separate from the pending total',async()=>{
 const options={statisticsSummary:summary,states:{0:'Europe/Lisbon',3:query}};
 const initial=await renderNative(source,'default',{},options);
 assert.doesNotMatch(initial.html,/Vitórias ÷/);
 assert.match(initial.html,/1 sem resultado conhecido/);assert.match(initial.html,/Incluídos nos 1 sem resultado conhecido/);
 assert.ok(initial.html.indexOf('Resultados pessoais')<initial.html.indexOf('Registos antigos com resultado incompleto'));
 const expanded=await renderNative(source,'default',{}, {...options,width:320,fontScale:2});
 await expanded.press('1 registo antigo com resultado incompleto');
 assert.equal(expanded.routes.at(-1).params.metric,'legacy');
 await expanded.press('2 partidas sem duração');
 assert.equal(expanded.routes.at(-1).params.metric,'missing-duration');
 for(const [key,val]of Object.entries(query))assert.equal(expanded.routes.at(-1).params[key],val);
});

 test('Approved Summary keeps activity visible and twelve calendar buckets, including zero months, coherent with total',async()=>{
 const counts=[2,4,5,3,8,6,9,7,4,10,0,6];
 const buckets=counts.map((matches,i)=>({key:`2025-${String(i+1).padStart(2,'0')}`,matches}));
 const r=await renderNative(source,'default',{}, {statisticsSummary:{...summary,matches:64,evolution:buckets},states:{3:query},captureStatisticsPlot:true});
 assert.equal(counts.reduce((a,b)=>a+b,0),64);
 assert.equal(r.calls.filter(c=>c[0]==='statisticsBar').length,11);
 assert.ok(!r.calls.some(c=>c[0]==='statisticsBar'&&c[1].testID==='statistics-bar-2025-11'));
 assert.ok(r.controls.some(c=>c.accessibilityLabel?.includes(`novembro de 2025: ${r.i18n.t('statistics:matchCount',{count:0})}`)));
 assert.ok(r.html.indexOf('Partidas por mês')<r.html.indexOf('Resultados pessoais'));
 assert.equal(r.controls.filter(c=>c.accessibilityLabel==='Filtros').length,1);
 const periodButton=r.controls.find(c=>c.accessibilityRole==='button'&&c.accessibilityHint==='Filtros');
 assert.ok(periodButton);await periodButton.onPress();
 assert.ok(r.updates.some(([i,v])=>i===4&&v===true));
 assert.ok(!r.updates.some(([i])=>i===3));
 assert.match(r.html,/Todos os jogos · Todos os modos/);
 });

 test('Duration and week labels are concise without changing their underlying dates',async()=>{
 const r=await renderNative(source,'default',{}, {statisticsSummary:{...summary,recordedMinutes:288},states:{0:'Europe/Lisbon',2:'week',3:{...query,start:'2025-12-29',endExclusive:'2026-01-05'}}});
 assert.match(r.html,/4 h 48 min registados/);
 assert.match(r.html,/29 dez\. 2025 – 4 jan\. 2026/);
 const presentation=r.load('src/features/statistics/utils/presentation.ts');
 assert.equal(presentation.formatPeriodLabel('week',{...query,start:'2025-12-29',endExclusive:'2026-01-05'},'pt',true),'29 de dezembro de 2025 – 4 de janeiro de 2026');
 assert.equal(presentation.formatDuration(0,'pt'), '0 min');
 assert.equal(presentation.formatDuration(60,'pt'), '1 h');
 });
 test('Shared custom calendar applies an inclusive end and preserves game, mode and timezone',async()=>{
 const changes=[],draft={...query,gameId:'game-id',mode:'SOLO'},props={query,onChange:q=>changes.push(q),games:[game],initialPeriod:'custom'};
 const r=await renderNative('src/features/statistics/components/ExploreFilters.tsx','default',props,{states:{1:true,2:draft,3:'custom',5:'2024-10-27',6:'2024-10-28',8:'start'}});
 assert.equal(r.inputs.length,0);assert.doesNotMatch(r.html,/AAAA-MM-DD/);
 assert.match(r.html,/27 de outubro de 2024/);
 assert.equal(r.controls.filter(c=>c.accessibilityLabel==='Aplicar filtros').length,1);
 assert.equal(r.datePickers[0].locale,'pt-PT');
 r.datePickers[0].onChange({type:'set'},new Date(2024,9,26,12));
 assert.ok(r.updates.some(([i,v])=>i===5&&v==='2024-10-26'));assert.deepEqual(changes,[]);
 await r.press('Aplicar filtros');assert.deepEqual(changes,[{...draft,start:'2024-10-27',endExclusive:'2024-10-29'}]);
 for(const [start,end]of [['2024-10-29','2024-10-27'],['2024-02-30','2024-03-01']]){
 const invalid=await renderNative('src/features/statistics/components/ExploreFilters.tsx','default',props,{states:{1:true,2:draft,3:'custom',5:start,6:end}});
 const before=changes.length;await invalid.press('Aplicar filtros');assert.equal(changes.length,before);assert.ok(invalid.updates.some(([i,v])=>i===7&&v===true));
 }
 });
 test('Compact annual chart only labels populated bars while zero months remain in the accessible monthly details',async()=>{
 const r=await renderNative('src/features/statistics/components/StatisticsEvolution.tsx','default',{compact:true,buckets:[{key:'2024-01',matches:3},{key:'2024-02',matches:0}],unit:'month',language:'pt',title:'Evolução',countLabel:n=>`${n} partidas`,onSelect(){}},{captureStatisticsPlot:true});
 assert.equal(r.calls.filter(c=>c[0]==='statisticsBar').length,1);
 assert.equal(r.calls.find(c=>c[0]==='statisticsBar')[1].style[1].height,104 * 3 / 4); // Same data ratio at the shared 104 pt plot height.
 assert.ok(r.controls.some(c=>c.accessibilityLabel?.includes('fevereiro de 2024: 0 partidas')));
 await r.press('Consultar meses');assert.ok(r.updates.some(([i,v])=>i===0&&v===true));
 });

 test('Empty weekly or annual periods show one recovery message without zero charts or empty statistics cards',async()=>{
 for(const [bucketUnit,key]of [['month','2025-01'],['day','2025-12-29']]){
 const r=await renderNative(source,'default',{}, {statisticsSummary:{...summary,matches:0,games:[],evolution:[{key,matches:0}],bucketUnit},width:320,fontScale:2});
 assert.equal((r.html.match(/Sem partidas em/g)||[]).length,1);
 assert.doesNotMatch(r.html,/Partidas por mês|Partidas por dia|Jogos mais jogados|Resultados pessoais|Sem duração registada/);
 assert.equal(r.controls.filter(c=>c.accessibilityLabel==='Alterar filtros').length,1);
 await r.press('Alterar filtros');assert.ok(r.updates.some(([i,v])=>i===4&&v===true));
 assert.ok(!r.updates.some(([i])=>i===3));
 }
 });
