from pathlib import Path
import base64,html,json
out=Path(__file__).resolve().parent
logo=base64.b64encode((out.parents[3]/'assets/MeepleBoardLogo.png').read_bytes()).decode()
BG='#FBFBF8';INK='#30283F';GREEN='#275E50';MUTED='#626D75';LINE='#EAE5EF';LILAC='#F1EAFB'
def rect(x,y,w,h,fill='white',r=12,stroke=None):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="1"' if stroke else '')+'/>'
def txt(x,y,s,size=14,weight=400,color=INK,anchor='start'):return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{html.escape(str(s))}</text>'
def line(x,y,x2,y2):return f'<path d="M{x} {y}H{x2}" stroke="{LINE}"/>'
def arrow(x,y,down=False):return f'<path d="M{x-3} {y-4}l4 4-4 4" fill="none" stroke="{GREEN}" stroke-width="1.5"'+(f' transform="rotate(90 {x} {y})"' if down else '')+'/>'
def dice(x,y):return rect(x,y,24,24,'#BBA5DA',5)+''.join(f'<circle cx="{x+a}" cy="{y+b}" r="2.2" fill="white"/>' for a,b in [(6,6),(18,6),(12,12),(6,18),(18,18)])
def trophy(x,y,color=GREEN):return f'<path d="M{x+6} {y+2}h12v10q0 7-6 7t-6-7z M{x+6} {y+5}H{x+2}v6q0 5 5 5 M{x+18} {y+5}h4v6q0 5-5 5 M{x+12} {y+19}v5m-5 0h10" fill="{color}" stroke="{color}" stroke-width="2"/>'
def row(y,label,value=None,down=False):
 return txt(28,y+27,label,14,400,GREEN if value is None else INK)+(txt(346,y+28,value,18,600,anchor='end') if value is not None else '')+arrow(369,y+22,down)
def card(y,h,fill='white'):return rect(16,y,370,h,fill,12,LINE if fill=='white' else None)
def header(area):
 a=rect(0,0,402,874,BG,0)+txt(34,37,'13:41',17,600)+txt(354,37,'30%',12,600,anchor='end')
 a+=rect(16,62,370,62,'#F6F2FA',0)+txt(24,90,'‹ Voltar',14,400,GREEN)
 a+=f'<svg x="154" y="62" width="94" height="62" viewBox="0 0 94 62"><image x="-36" y="-49" width="162" height="162" href="data:image/png;base64,{logo}"/></svg>'
 for x,w,label in [(16,82,'Resumo'),(98,116,'Companhia'),(214,102,'Explorar'),(316,70,'Ano')]:
  if label==area:a+=rect(x+4,132,w-8,32,GREEN,16)
  a+=txt(x+w/2,153,label,13,400,'white' if label==area else GREEN,'middle')
 return a
def filters(y,year):
 a=rect(16,y+5,270,34,'#FEFDFE',8,LINE)+txt(28,y+27,f'{year} · Ano',14,500)
 a+=rect(298,y+5,88,34,'white',8,GREEN)+f'<path d="M310 {y+15}h12l-5 6v8l-3-2v-6z" fill="none" stroke="{GREEN}" stroke-width="1.5"/>'+txt(330,y+27,'Filtros',14,500,GREEN)
 a+=txt(201,y+63,'Todos os jogos · Todos os modos',13,400,MUTED,'middle')
 return a
def games(y):
 a=card(y,232)+txt(28,y+30,'Jogos mais jogados',16,600)
 for off,name,n in [(44,'Meeple Teste Competitivo',5),(104,'Meeple Teste Solo',5),(164,'Meeple Teste Cooperativo',4)]:
  a+=rect(28,y+off,44,44,LILAC,8)+dice(38,y+off+10)+txt(84,y+off+26,name,14,500)+txt(346,y+off+20,n,22,600,anchor='end')+txt(346,y+off+38,'partidas',12,400,MUTED,'end')+arrow(369,y+off+24)
  if off!=164:a+=line(28,y+off+52,374,y+off+52)
 return a
def summary():
 a=txt(201,202,'Estatísticas',24,700,anchor='middle')+filters(214,2024)
 a+=card(296,120,LILAC)+dice(30,318)+txt(66,338,'14',30,700)+txt(66,361,'Partidas',14)+txt(240,338,'3',30,700)+txt(240,361,'Jogos',14)+line(28,368,374,368)+txt(28,397,'4 h 48 min · duração em 7 de 14',13,400,MUTED)+txt(364,397,'ⓘ',14,400,MUTED,'end')
 a+=card(428,216)+txt(28,458,'Evolução das partidas',16,600)
 for yy,n in [(482,14),(526,7),(570,0)]:a+=txt(38,yy+4,n,12,400,MUTED,'end')+line(50,yy,374,yy)
 a+=rect(308,482,16,88,GREEN,5)+txt(316,476,14,12,500,anchor='middle')
 for i,lab in [(0,'jan.'),(2,'mar.'),(4,'mai.'),(6,'jul.'),(8,'set.'),(10,'nov.')]:a+=txt(63+i*27,591,lab,12,400,MUTED,'middle')
 a+=line(28,600,374,600)+row(600,'Consultar meses')
 a+=card(656,196)+txt(28,686,'Resultados pessoais',16,600)
 for x,n,label in [(28,5,'Vitórias'),(148,3,'Derrotas'),(268,3,'Empates')]:a+=txt(x+48,716,n,24,700)+txt(x+48,737,label,13)+ (trophy(x+6,699) if label=='Vitórias' else txt(x+10,721,'×' if label=='Derrotas' else '↔',25,600,'#DF6D75' if label=='Derrotas' else MUTED))
 a+=txt(201,764,'Taxa de vitória 45,45% · 11 confirmados',13,400,MUTED,'middle')+line(28,778,374,778)+txt(42,806,'ⓘ',14,400,MUTED,'middle')+txt(72,806,'3 sem resultado confirmado',13,400,GREEN)+arrow(369,800)
 a+=games(864)+card(1108,88)+row(1108,'A tua avaliação',down=True)+line(28,1152,374,1152)+row(1152,'Como calculamos',down=True)
 return a,1212

def cooperative_card(y):
 a=card(y,140)+txt(28,y+30,'Cooperativo',16,600)+txt(28,y+50,'Resultado da equipa',12,400,MUTED)
 # 346 pt useful width: three 107 1/3 pt columns, separated by 12 pt.
 col=(346-24)/3
 for i,(label,n) in enumerate([('Vitórias',6),('Derrotas',6),('Empates',6)]):
  x=28+col/2+i*(col+12)
  a+=txt(x,y+84,n,24,700,anchor='middle')+txt(x,y+107,label,13,400,anchor='middle')
 return a

def company(empty=False,group=False):
 a=txt(16,198,'Tu e',22,700)+txt(16,226,'Teste-participante',22,700)+rect(274,182,112,34,'white',8,LINE)+txt(286,204,'Trocar amigo',13,500,GREEN)
 a+=filters(238,2026)+txt(16,321,'Até à data',12,400,MUTED)
 a+=rect(16,336,370,52,'#EFEFF0',12)
 for i,(label,n) in enumerate([('Todas',129),('Só vocês',76),('Em grupo',53)]):
  w=362/3; x=20+i*w
  sel=(label=='Só vocês') if empty else label==('Em grupo' if group else 'Todas')
  if sel:a+=rect(x,340,w,44,GREEN,8)
  a+=txt(x+w/2,358,label,13,500,'white' if sel else INK,'middle')+txt(x+w/2,376,n,13,400,'white' if sel else MUTED,'middle')
 a+=card(400,80,LILAC)+txt(28,434,'Partidas em conjunto',14,500)+txt(348,437,76 if empty else (53 if group else 129),30,700,anchor='end')+arrow(369,426)+txt(28,463,'0 resultados confirmados' if empty else '39 resultados confirmados',12,400,MUTED)
 if empty:
  a+=card(492,140)+txt(28,524,'Resultados por confirmar',16,600)+txt(28,552,'Há 76 partidas registadas, mas ainda',14)+txt(28,572,'nenhum resultado confirmado.',14)+line(28,584,374,584)+row(584,'Consultar as 76 partidas por confirmar')
  y=644
 else:
  a+=card(492,280)+txt(28,521,'Competitivo',16,600)
  for x,n,color in [(28,14,GREEN),(208,8,'#D6A12B')]:a+=trophy(x,536,color)+txt(x+34,562,n,28,700)
  a+=txt(28,588,'As tuas vitórias',13)+txt(208,588,'Vitórias de',13)+txt(208,606,'Teste-participante',13)
  a+=line(28,612,374,612)+row(612,'Vitórias partilhadas',8)+line(28,656,374,656)+row(656,'Empates com um de nós em 1.º',7)+line(28,700,374,700)+row(700,'Venceu outro',0)+txt(28,760,'As 8 partilhadas contam nas vitórias de ambos.',12,400,MUTED)
  a+=cooperative_card(784)
  y=936
 a+=card(y,44 if empty else 88)+row(y,'Consultar partidas')+(line(28,y+44,374,y+44)+row(y+44,'14 partidas por confirmar' if group else '90 partidas por confirmar') if not empty else '')
 y+=56 if empty else 100
 if not empty:
  a+=card(y,44)+row(y,'Empates e vitórias partilhadas',down=True);y+=56
 a+=card(y,176)
 for i,label in enumerate(['Jogos mais frequentes em conjunto','Evolução dos resultados','Pontuações em conjunto','Como calculamos']):
  a+=row(y+44*i,label,down=True)
  if i<3:a+=line(28,y+44*(i+1),374,y+44*(i+1))
 return a,y+192

def screen(name,body,area,offset):
 # Scrollable content clipped between persistent navigation and bottom safe area.
 s=f'<svg xmlns="http://www.w3.org/2000/svg" width="402" height="874" viewBox="0 0 402 874" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif"><title>{name} — proposta, não captura da app</title><defs><clipPath id="{name}-content"><rect x="0" y="172" width="402" height="668"/></clipPath></defs>'+header(area)+f'<g clip-path="url(#{name}-content)"><g transform="translate(0 {-offset})">'+body+'</g></g>'+rect(0,840,402,34,BG,0)+rect(129,862,144,5,'#141414',3)+'</svg>'
 (out/(name+'.svg')).write_text(s)
 return s
summ,sh=summary();comp,ch=company();empty,eh=company(True);group,gh=company(group=True)
pages=[]
for name,b,area,offset in [('resumo-topo',summ,'Resumo',0),('resumo-scroll',summ,'Resumo',368),('companhia-topo',comp,'Companhia',0),('companhia-scroll',comp,'Companhia',556),('companhia-por-confirmar',empty,'Companhia',0),('companhia-por-confirmar-scroll',empty,'Companhia',200),('companhia-grupo-topo',group,'Companhia',0),('companhia-grupo-scroll',group,'Companhia',556)]:pages.append((name,screen(name,b,area,offset)))
(out/'dados.json').write_text(json.dumps({'source':'Capturas do utilizador: Resumo Ano 2024 e Companhia 13:41','summary':{'matches':14,'games':3,'minutes':288,'durationKnown':7,'wins':5,'losses':3,'draws':3,'known':11,'unknown':3,'rate':'45,45%','months':[0,0,0,0,0,0,0,0,0,14,0,0],'gamesList':[['Meeple Teste Competitivo',5],['Meeple Teste Solo',5],['Meeple Teste Cooperativo',4]]},'company':{'friend':'Teste-participante','all':129,'onlyTwo':76,'group':53,'myWins':14,'friendWins':8,'sharedWins':8,'draws':7,'otherWins':0,'teamWins':6,'teamLosses':6,'teamDraws':6,'confirmed':39,'pending':90,'onlyTwoConfirmed':0,'onlyTwoPending':76,'groupConfirmed':39,'groupPending':14},'notVisible':'Confirmados/por confirmar de Companhia fornecidos pelo utilizador nesta revisão; jogos conjuntos, evolução e pontuações sem valores inventados.'},ensure_ascii=False,indent=2))
# Full content exports are generated from exactly the same canonical body.
for name,b,h in [('resumo',summ,sh),('companhia',comp,ch),('companhia-por-confirmar',empty,eh),('companhia-grupo',group,gh)]:
 (out/(name+'-conteudo.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="402" height="{h-172}" viewBox="0 172 402 {h-172}" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif">'+rect(0,172,402,h-172,BG,0)+b+'</svg>')
# Browser document uses the same full drawing and the same scroll offset previews, no duplicate implementation.
blocks=''.join(f'<figure><figcaption>{name.replace("-"," ").capitalize()} · 402 × 874 pt</figcaption>{svg}</figure>' for name,svg in pages)
(out/'mockup.html').write_text('''<!doctype html><html lang="pt"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Resumo e Companhia — proposta medida</title><style>body{margin:24px;background:#e8e8e5;color:#30283f;font:16px system-ui}h1{font-size:24px}main{display:flex;flex-wrap:wrap;gap:24px}figure{margin:0}figure svg{display:block;width:402px;height:874px;border:1px solid #c9c5cf;border-radius:20px}figcaption{margin:12px 0}a{color:#275e50}.note{max-width:1000px;line-height:1.6}@media(max-width:450px){body{margin:12px}figure svg{width:100%;height:auto}figure{width:100%}}</style><h1>Resumo e Companhia — proposta para aprovação</h1><p class="note">Desenho em pontos, sem alteração da app. Topo e continuação são recortes do mesmo conteúdo, com cabeçalho persistente. Dados das capturas; os acessos sem contagens visíveis não recebem números inventados. <a href="especificacao.md">Especificação de medidas e acessos</a>.</p><main>'''+blocks+'</main><p class="note">Tipografia de sistema: esta visualização usa a fonte do dispositivo onde é aberta. Na implementação iOS: fonte de sistema, Dynamic Type ativo. Nenhum ecrã é apresentado como captura real.</p></html>')

# Paired boards and square wrappers for deterministic QuickLook export.
for title,left,right,name in [('Resumo','resumo-topo','resumo-scroll','resumo-completo'),('Companhia','companhia-topo','companhia-scroll','companhia-completa'),('Sem confirmados','companhia-por-confirmar','companhia-por-confirmar-scroll','companhia-sem-confirmados'),('Em grupo','companhia-grupo-topo','companhia-grupo-scroll','companhia-grupo-completa')]:
 l=(out/(left+'.svg')).read_text();r=(out/(right+'.svg')).read_text()
 board='<svg xmlns="http://www.w3.org/2000/svg" width="828" height="908" viewBox="0 0 828 908">'+rect(0,0,828,908,'#E8E8E5',0)+txt(12,24,title+' · topo',14,600)+txt(438,24,'Mesmo ecrã · após scroll',14,600)+'<g transform="translate(0 34)">'+l+'</g><g transform="translate(426 34)">'+r+'</g></svg>'
 (out/(name+'.svg')).write_text(board)
 Path('/private/tmp/'+name+'-preview.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="908" height="908"><g transform="translate(40 0)">'+board+'</g></svg>')
