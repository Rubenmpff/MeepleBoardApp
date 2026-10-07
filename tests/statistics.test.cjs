const test=require('node:test'),assert=require('node:assert/strict');
const {renderNative}=require('./helpers/renderNative.cjs');
const source='src/features/statistics/screens/StatisticsScreen.tsx';
const query={start:'2024-01-01',endExclusive:'2025-01-01',timeZone:'Europe/Lisbon'};
const game={gameId:'game-id',name:'Long game name preserved without invented results',imageUrl:null,matches:3};
const summary={...query,matches:3,distinctGames:1,recordedMinutes:0,matchesWithDuration:1,matchesWithoutDuration:2,averagePersonalRating:0,ratedMatches:1,
 results:{wins:1,losses:0,draws:1,known:2,withoutResult:1,legacy:1,winRate:50},modes:[{mode:'COMPETITIVE',matches:3,results:{wins:1,losses:0,draws:1,known:2,withoutResult:1,legacy:1,winRate:50}}],
 bucketUnit:'month',evolution:[{key:'2024-01',matches:3},{key:'2024-02',matches:0}],games:[game],gameOptions:[game]};
test('Every statistic navigates to supporting matches with the same period/game/mode filters',async()=>{
 const filtered={...query,gameId:'game-id',mode:'COMPETITIVE'};
 const r=await renderNative(source,'default',{}, {statisticsSummary:summary,states:{0:'Europe/Lisbon',3:filtered}});
 const labels={all:'Partidas: 3',games:'Jogos diferentes: 1',duration:'Tempo registado: 0 min','missing-duration':'2 partidas sem duração',wins:'Vitórias: 1',losses:'Derrotas: 0',draws:'Empates: 1',known:'Taxa de vitória: 50%',undefined:'1 partida sem resultado conhecido',legacy:'1 partida antiga por confirmar',ratings:'Avaliação média (0–10): 0'};
 for(const [metric,label]of Object.entries(labels)){
  await r.press(label);const route=r.routes.at(-1);assert.equal(route.pathname,'/statistics/matches');assert.equal(route.params.metric,metric);
  for(const [key,val]of Object.entries(filtered))assert.equal(route.params[key],val);
 }

});
test('Statistics keeps zero measurements, mode labels, scrolling and does not show unknown results as losses',async()=>{
 for(const language of ['pt','en']){
 const r=await renderNative(source,'default',{}, {language,statisticsSummary:summary,states:{0:'Europe/Lisbon',3:query,8:true},width:320,fontScale:2});
 assert.match(r.html,/0 min/);assert.match(r.html,/50%/);assert.match(r.html,/Long game name preserved/);
 assert.equal(r.nativeViews.find(v=>v[0]==='scroll')[1].keyboardShouldPersistTaps,'handled');
 assert.ok(r.html.includes(r.i18n.t('statistics:winRate')));assert.ok(r.html.includes(r.i18n.t('statistics:modes.SOLO')));assert.ok(r.html.includes(r.i18n.t('statistics:modes.COOPERATIVE')));
 assert.doesNotMatch(r.html,/statistics:|undefined%|NaN/);
 }
});
test('Evolution columns open their supporting period, including zero activity, without losing filters',async()=>{
 const filtered={...query,mode:'SOLO',gameId:'game-id'};
 const r=await renderNative(source,'default',{}, {statisticsSummary:summary,states:{0:'Europe/Lisbon',3:filtered,10:true},stateModules:['src/features/statistics/StatisticsEvolution.tsx'],width:320,fontScale:2});
 await r.press('janeiro de 2024: 3 partidas');
 assert.deepEqual(r.routes.at(-1),{pathname:'/statistics/matches',params:{...filtered,metric:'all',bucket:'2024-01'}});
 await r.press(`fevereiro de 2024: ${r.i18n.t('statistics:matchCount',{count:0})}`);
 assert.equal(r.routes.at(-1).params.bucket,'2024-02');
 assert.ok(r.nativeViews.some(([kind,props])=>kind==='scroll'&&props.horizontal));
 const selections=[];
 const daily=await renderNative('src/features/statistics/StatisticsEvolution.tsx','default',{
  buckets:[{key:'2024-10-27',matches:2}],unit:'day',language:'pt',title:'Evolução',
  countLabel:n=>`${n} partidas`,onSelect:key=>selections.push(key),
 });
 await daily.press('27 de outubro de 2024: 2 partidas');
 assert.deepEqual(selections,['2024-10-27']);
 assert.match(daily.html,/27/);
});
test('Statistics separates unavailable, empty, failed and loading states',async()=>{
 const empty={...summary,matches:0,distinctGames:0,recordedMinutes:null,averagePersonalRating:null,results:{wins:0,losses:0,draws:0,known:0,withoutResult:0,legacy:0,winRate:null},games:[],gameOptions:[],evolution:[],modes:[]};
 const r=await renderNative(source,'default',{}, {statisticsSummary:empty});assert.match(r.html,/Sem partidas registadas/);assert.match(r.html,/Sem duração registada/);assert.doesNotMatch(r.html,/0%/);
 const error=await renderNative(source,'default',{}, {statisticsError:true});await error.press('Tentar novamente');assert.ok(error.calls.some(c=>c[0]==='refetchStatistics'));assert.doesNotMatch(error.html,/Sem partidas registadas/);
 const loading=await renderNative(source,'default',{}, {statisticsLoading:true});assert.match(loading.html,/A carregar estatísticas/);assert.doesNotMatch(loading.html,/Sem partidas registadas/);
});
test('Game and mode changes retain period; custom date input is validated before applying',async()=>{
 const r=await renderNative(source,'default',{}, {statisticsSummary:summary,states:{0:'Europe/Lisbon',3:query,7:true,8:true}});
 await r.press('Solo');assert.ok(r.updates.some(([i,v])=>i===3&&v.mode==='SOLO'&&v.start===query.start));
 await r.press('Selecionar jogo: '+game.name);assert.ok(r.updates.some(([i,v])=>i===3&&v.gameId===game.gameId&&v.start===query.start));
 const invalid=await renderNative(source,'default',{}, {states:{0:'Europe/Lisbon',2:'custom',3:query,4:'2024-02-30',5:'2024-03-01'}});
 await invalid.press('Aplicar intervalo');assert.ok(invalid.updates.some(([i,v])=>i===6&&v===true));assert.ok(!invalid.updates.some(([i])=>i===3));
});
test('Supporting list keeps own score/rating zero, negative values, legacy label and detail/back context',async()=>{
 const data={total:1,offset:0,limit:25,items:[{id:'match-id',gameId:'game-id',gameName:game.name,gameImageUrl:null,matchDate:'2024-01-03T12:00:00Z',gameMode:'SOLO',outcome:null,resultSource:'Legacy',durationInMinutes:0,score:-5,personalRating:0}]};
 const r=await renderNative('src/features/statistics/screens/StatisticsMatchesScreen.tsx','default',{}, {params:{...query,metric:'legacy'},states:{1:data,3:false},width:320,fontScale:2});
 assert.match(r.html,/-5/);assert.match(r.html,/0\/10/);assert.match(r.html,/0 min/);assert.match(r.html,/Resultado antigo por confirmar/);
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
 const r=await renderNative('src/features/statistics/StatisticsHeader.tsx','default',props,{states:{0:true,1:true},stateModules:['src/components/ui/ClubHeader.tsx'],width:390});
 assert.equal(r.images.length,0);assert.ok(r.controls.some(c=>c.accessibilityLabel==='Voltar'&&c.style.position!=='absolute'));assert.match(r.html,/Estatísticas/);
});
test('Selectors and calculation notes stay collapsed until requested, while filters and coverage remain available',async()=>{
 const r=await renderNative(source,'default',{}, {statisticsSummary:summary,states:{0:'Europe/Lisbon',3:query}});
 assert.doesNotMatch(r.html,/Vitórias ÷|Zero é uma avaliação|Europe\/Lisbon|Resultado da equipa/);
 assert.match(r.html,/Duração em 1 de 3 partidas/);
 assert.equal(r.controls.filter(c=>c.accessibilityLabel==='Vitórias: 1').length,1);
 await r.press('Modo de jogo: Todos os modos');
 assert.ok(r.updates.some(([i,v])=>i===8&&v===true));
 assert.ok(r.updates.some(([i,v])=>i===7&&v===false));
 await r.press('Como calculamos');
 assert.ok(r.updates.some(([i,v])=>i===9&&v===true));
 const notes=await renderNative(source,'default',{}, {statisticsSummary:summary,states:{0:'Europe/Lisbon',3:query,9:true}});
 assert.match(notes.html,/Europe\/Lisbon/);assert.match(notes.html,/Vitórias ÷/);
 assert.match(notes.html,/Zero é uma avaliação/);
 const noDuration=await renderNative(source,'default',{}, {statisticsSummary:{...summary,recordedMinutes:null,matchesWithDuration:0,matchesWithoutDuration:3},states:{0:'Europe/Lisbon',3:query}});
 await noDuration.press('Tempo registado: Sem duração registada');
 assert.equal(noDuration.routes.at(-1).params.metric,'missing-duration');
});
test('Zero activity renders no bar; all real bars share an explicit integer scale',async()=>{
 const props={buckets:[{key:'2024-01',matches:3},{key:'2024-02',matches:0}],unit:'month',language:'pt',title:'Evolução',countLabel:n=>`${n} partidas`,onSelect(){}};
 const chart=await renderNative('src/features/statistics/StatisticsEvolution.tsx','default',props,{captureStatisticsPlot:true});
 const bars=chart.calls.filter(c=>c[0]==='statisticsBar');
 assert.equal(bars.length,1);assert.equal(bars[0][1].testID,'statistics-bar-2024-01');
 assert.equal(bars[0][1].style[1].height,63);assert.match(chart.html,/Escala: 0–4 partidas/);
 const empty=await renderNative('src/features/statistics/StatisticsEvolution.tsx','default',{...props,buckets:[{key:'2024-01',matches:0}]},{captureStatisticsPlot:true});
 assert.equal(empty.calls.filter(c=>c[0]==='statisticsBar').length,0);
 assert.match(empty.html,/Sem partidas neste período/);assert.doesNotMatch(empty.html,/NaN|Infinity/);
});

test('Annual overview includes activity beyond June and exposes month details without hiding the second half of the year',async()=>{
 const buckets=Array.from({length:12},(_,i)=>({key:`2026-${String(i+1).padStart(2,'0')}`,matches:i===9?158:0}));
 const props={buckets,unit:'month',language:'pt',title:'Evolução',countLabel:n=>`${n} partidas`,onSelect(){}};
 const r=await renderNative('src/features/statistics/StatisticsEvolution.tsx','default',props,{captureStatisticsPlot:true});
 assert.equal(r.calls.filter(c=>c[0]==='statisticsBar').length,1);
 assert.equal(r.calls.find(c=>c[0]==='statisticsBar')[1].testID,'statistics-bar-2026-10');
 assert.equal(r.calls.find(c=>c[0]==='statisticsBar')[1].style[1].height,84);
 assert.ok(r.controls.some(c=>c.accessibilityLabel?.includes('outubro de 2026: 158 partidas')));
 assert.ok(!r.nativeViews.some(([kind,props])=>kind==='scroll'&&props.horizontal));
 await r.press('Consultar meses');assert.ok(r.updates.some(([i,v])=>i===0&&v===true));
 const selected=[];
 const details=await renderNative('src/features/statistics/StatisticsEvolution.tsx','default',{...props,onSelect:key=>selected.push(key)},{states:{0:true},fontScale:2});
 await details.press('outubro de 2026: 158 partidas');assert.deepEqual(selected,['2026-10']);
 assert.ok(details.nativeViews.some(([kind,props])=>kind==='scroll'&&props.horizontal));
});
