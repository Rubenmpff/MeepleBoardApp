# Proposta medida — Resumo e Companhia

Estado: proposta para aprovação, sem alterações ao código da app. Desenhos à escala 1 unidade = 1 pt, não capturas nativas. A linguagem mantém logo original, verde, lavanda, contornos finos, navegação em quatro áreas e cartões da A. O Resumo mantém o gráfico sempre aberto quando há partidas.

## Hierarquia e conteúdo

Resumo: título → filtros/seleção ativa → atividade → gráfico → resultados pessoais → jogos → avaliação e cálculos. No primeiro viewport, atividade, gráfico e resultados; os jogos aparecem na continuação. Companhia: título e troca de amigo → filtros → contextos → partidas → vitórias competitivas → resultados cooperativos → consulta e expansões. Nenhum cartão contém toda a página. O cartão Cooperativo começa no limite inferior do primeiro viewport; a continuação mostra as três colunas completas e os acessos. As partes cortadas pelo viewport não mudam de composição.

A repetição no topo/scroll é intencional: são recortes do mesmo conteúdo com navegação persistente, não duas versões da página. Offsets ilustrados: Resumo 368 pt; Companhia 556 pt; Companhia sem resultados 200 pt. O utilizador pode parar o scroll em qualquer posição.

## Geometria comum, em pt

| Elemento | Medida |
|---|---:|
| Ecrã | 402 × 874 |
| Área superior do sistema, nesta referência | 62 |
| Área inferior do sistema | 34, y = 840–874 |
| Cabeçalho original | y = 62–124, altura 62 |
| Logo, sem deformação | recorte 94 × 62, centrado x = 201 |
| Navegação persistente | y = 126–170, toque 44; cápsula visual 32 |
| Conteúdo com scroll | y = 172–840, altura 668 |
| Margens exteriores | 16; largura de conteúdo 370 |
| Distância entre cartões/grupos principais | 12 |
| Padding de cartão | 12; alinhamento interior x = 28 |
| Distância título → métricas | 8 |
| Distância dentro de explicações/linhas de texto | 4 |
| Raio cartões / controlos | 12 / 8 |
| Contorno / separador | 1 / 1, #EAE5EF |
| Área mínima de qualquer ação | 44 × 44; cresce com texto |
| Linha compacta acionável | mínimo 44, nunca altura máxima |
| Campo período | largura 270; visual 34, toque 44 |
| Botão Filtros | largura 88; visual 34, toque 44 |
| Espaço período → Filtros | 12 |
| Setas de linhas | centro x = 369; ícone 16, dentro do toque de toda a linha |
| Coluna de contagens nas linhas | termina em x = 346, alinhada à direita |

Os insets são os da referência 402 × 874. Na app, usar SafeAreaInsets reais, sem desenhar relógio, bateria ou indicador inferior. O cabeçalho/navegação ficam dentro da área segura; o conteúdo não passa por baixo do indicador inferior. A 402 pt, 16 + 370 + 16 = 402.

## Tipografia de sistema iOS

| Uso | Tamanho / entrelinha | Peso |
|---|---|---|
| Estatísticas | 24 / 30 | 700 |
| Tu e [nome] | 22 / 28 | 700 |
| Título de cartão | 16 / 22 | 600 |
| Total principal | 30 / 36 | 700 |
| Comparação de vitórias | 28 / 34 | 700 |
| Resultados pessoais/equipa | 24 / 30 | 700 |
| Contagem de linha | 18 / 24 | 600 |
| Corpo e ação principal | 14 / 20 | 400; ação 500 |
| Filtros, rótulos de resultados | 13 / 18 | 400–500 |
| Explicações secundárias | 12 / 18 | 400 |
| Meses do gráfico | 12 / 18 | 400 |

Nunca usar tamanho da fonte para compensar nomes longos. Preto #30283F, verde #275E50, secundário #626D75; superfície #FBFBF8, lavanda #F1EAFB, cabeçalho #F6F2FA. Ícones: métricas 24; filtros 18; informação/setas 16. Na implementação reutilizar os ícones MaterialCommunityIcons existentes: os vetores do desenho são representativos, não novos assets a introduzir na app.

## Resumo: medidas normais

| Bloco | y inicial | Altura |
|---|---:|---:|
| Título | 176 | 30 |
| Filtros + seleção ativa | 214 | 66 |
| Atividade | 296 | 120 |
| Gráfico e acesso mensal | 428 | 216 |
| Resultados | 656 | 196 |
| Jogos | 864 | 232 |
| Avaliação e cálculos | 1108 | 88 |

Atividade: duas colunas de 167 pt separadas por 12; ícone e número na mesma linha, rótulos alinhados. Rodapé da duração com toque 44; informação com alvo independente 44 dentro da mesma linha. Valor 288 min apresentado como 4 h 48 min, cobertura 7 de 14.

Gráfico: plot x = 50–374, largura 324; 12 posições de 27 pt, altura útil 88; barra de outubro 14 partidas. Três linhas de escala 0, 7 e 14. Todos os meses continuam; zeros não recebem rótulos de valor. Seis rótulos visíveis em 12/18: jan., mar., mai., jul., set., nov.; os 12 buckets mantêm as mesmas posições e valores. Cada bucket tem acesso equivalente em Consultar meses (linha de 44), incluindo zero; a coluna de 27 pt não será falsamente declarada como alvo tátil de 44. Reutilizar StatisticsEvolution, com equivalência acessível a todos os buckets. Para semana/mês/intervalo, reutilizar os buckets do período selecionado, sem trocar a unidade nem somar dados fora do período.

Resultados: três colunas iguais, ícones à esquerda dos números, baselines consistentes; 5 vitórias, 3 derrotas, 3 empates. Taxa 45,45% e 11 confirmados em linha com toque 44. Rodapé tem duas ações: informação (44) e 3 sem resultado confirmado (lista filtrada). Não há ícone numa linha vazia separada.

Jogos: capa/fallback quadrado 44; x = 28–72; nome x = 84, largura 218; contagem x = 314–346; seta x = 369. Linha 60 pt em texto normal, cresce se necessário. Nomes e valores reais: Meeple Teste Competitivo 5, Meeple Teste Solo 5, Meeple Teste Cooperativo 4. Não inventar capas; usar os fallbacks existentes destas capturas.

## Companhia: medidas normais

| Bloco | y inicial | Altura |
|---|---:|---:|
| Título com nome + Trocar amigo | 176 | 56 |
| Filtros/seleção/Até à data | 238 | 86 |
| Contextos | 336 | 52 |
| Partidas conjuntas | 400 | 80 |
| Competitivo | 492 | 280 |
| Cooperativo | 784 | 140 |
| Consultar partidas + por confirmar | 936 | 88 |
| Explicações de resultados | 1036 | 44 |
| Jogos, evolução, pontuações, cálculos | 1092 | 176 |

Título: nome Teste-participante completo, sem reticências. Espaço disponível à esquerda 246 pt; Trocar amigo 112 pt à direita com alvo 112 × 44. Nesta proposta o título tem duas linhas; nunca fazer o nome ocupar a zona da ação.

Contextos: Todas 129 / Só vocês 76 / Em grupo 53. Três colunas flexíveis, largura igual de 120⅔ pt após padding 4, sem gap; toque mínimo 44. A cápsula é seleção de contexto, não um resultado.

Total: rótulo, número 129 e seta ocupam a mesma linha ótica. Rótulo x=28, número termina em x=348, seta centrada em x=369; centro vertical y=426, área de toque y=412–456. A cobertura dos resultados fica em texto secundário na linha seguinte, baseline y=463, sem deslocar o total. A linha principal mantém o acesso pair-all. Competitivo: duas colunas interiores de 167 pt com gap 12, topo/baseline iguais. Cada uma tem ícone+número e zona de rótulo com mínimo de duas linhas (36), alinhada ao topo. As tuas vitórias 14 e Vitórias de Teste-participante 8. Ambas as colunas crescem à altura do maior rótulo; os números nunca descem para acomodar o nome de uma só coluna. Linhas de 44: partilhadas 8; empates com um de nós em primeiro 7; Venceu outro 0, sempre visível e acionável (other-win). Nota discreta esclarece que as 8 partilhadas contam em ambos. Cooperativo é cartão separado com título/nota de equipa; três colunas exatamente iguais: (346−24)/3 = 107⅓ pt, gap 12; centros x=81⅔, 201, 320⅓. Os valores 6/6/6 têm baseline y=868 e os rótulos y=891. O cartão é gerado uma única vez; topo e scroll reutilizam esse mesmo conteúdo, sem redistribuição. Todas as métricas mantêm os acessos filtrados às partidas.

Empates competitivos correspondem a pair-draw = draw-together + draw-with-other: primeiro lugar empatado com ambos ou um de nós; não é apenas “empates entre vocês”. Empates de equipa são team-draw. A expansão Empates e vitórias partilhadas contém a explicação e as divisões existentes: ambos em primeiro; um de nós com outro; vitórias partilhadas com outros; empates apenas de outros, quando aplicáveis. Não preencher valores não visíveis nas capturas.

## Com partidas, sem resultados confirmados

Só vocês: total 76; cartão separado em y = 492, altura normal 140: título, mensagem “Há 76 partidas registadas, mas ainda nenhum resultado confirmado.” e ação de 44 “Consultar as 76 partidas por confirmar”, métrica unknown-pair. Sem grelha competitiva/cooperativa de zeros, sem taxa fictícia e sem indicação de derrota. Mantém Consultar partidas, jogos, evolução, pontuações, cálculos, troca de amigo e contextos. O acesso por confirmar não é repetido no bloco seguinte.

Se não há partidas, conservar o estado vazio já corrigido: uma mensagem + Alterar filtros, sem gráfico ou cartões vazios. Esta proposta não muda cálculos nem transforma ausência em zero confirmado.

## Nomes longos e texto ampliado

O nome real já é demonstrado na comparação e no título. As alturas acima são do texto normal: não serão maxHeight. AllowFontScaling ativo; sem maximumFontSizeMultiplier e sem numberOfLines que trunque dados. A 160%: títulos/nomes podem crescer; Trocar amigo passa para uma linha própria; período e Filtros podem ficar em linhas separadas; seleções ativas quebram naturalmente. Comparação de vitórias mantém duas colunas apenas se ambas tiverem pelo menos 140 pt de largura útil e rótulos legíveis; caso contrário empilha, mantendo sempre número antes do rótulo. Resultados pessoais podem empilhar a partir de fontScale > 1,3. Cooperativo conserva três colunas iguais em todos os recortes; os rótulos quebram e a altura cresce uniformemente, sem passar a uma composição diferente após scroll. Jogos: nome ocupa a largura restante, contagem desce para uma segunda linha quando necessário; capa permanece quadrada. Setas ficam numa coluna de 24 pt, nunca sobre o texto. O header pode crescer, e a navegação pode passar a 2 × 2 mantendo ordem e alvos 44. O scroll recalcula a altura disponível dentro dos insets.

O gráfico continua aberto; com ampliação, reduzir novamente a densidade dos seis rótulos se necessário, preservando 12 buckets, nomes completos e zeros em Consultar meses. Isto adapta rótulos, não elimina dados. O contraste/VoiceOver e o texto ampliado têm validação nativa pendente: o mockup prevê o comportamento, não afirma ter validado Dynamic Type no iPhone.

## Acessos conservados para implementação posterior

| Visível ou detalhe | Componente / acesso existente a reutilizar |
|---|---|
| Cabeçalho e 4 áreas | SummaryHeader, AreaNavigation, AreaHeader, Workspace |
| Período e Filtros | ExploreFilters + FilterSheet; rascunho, calendário PT, aplicar/cancelar; fuso horário na folha |
| Partidas, jogos, duração, vitórias/derrotas/empates, confirmados | atuais listas supporting matches com a mesma query |
| Cobertura de duração | expansão inline + partidas sem duração; não perder a ação de informação |
| Sem resultado/antigos por confirmar | informação inline e acesso legacy/undefined; nota original |
| Gráfico e meses | StatisticsEvolution; buckets completos e listas por bucket |
| Todos os jogos / avaliação / cálculos / atualizar | expansões existentes; mostrar todos quando houver mais de 3 sem ocultar empates no ranking |
| Comparação / contextos do amigo | CompanyScreen e métricas pair-all, my-win, friend-win, shared-win, pair-draw |
| Equipa | team-win, team-loss, team-draw; modo COOPERATIVE explícito |
| Divisões competitivas | detalhes atuais + draw-with-other existente; sem novos cálculos de resultados |
| Jogos conjuntos / evolução / pontuações | as expansões e acessos existentes, sem inventar dados ausentes nas capturas |
| Voltar / Trocar amigo | percurso corrigido; conservar filtros, pesquisa e offset da lista |
| Privacidade | só dados autorizados; sem notas/avaliações privadas do amigo |

Fonte dos dados: capturas fornecidas pelo utilizador; dados.json regista os valores usados. Não houve consulta/mutação de base de dados nem alteração de src/, assets/ ou tests/ nesta etapa.

## Cobertura dos resultados e fidelidade dos dados

No contexto Só vocês: **0 confirmados e 76 por confirmar**, visíveis junto às métricas e no acesso acionável. No Resumo: **11 confirmados e 3 por confirmar**. Em Todas: **39 confirmados e 90 por confirmar**, valores confirmados pelo utilizador. Em grupo: **39 confirmados e 14 por confirmar**, em 53 partidas. A cobertura fica no cartão Partidas em conjunto, e a contagem por confirmar acompanha o acesso acionável. As vitórias dos dois jogadores não podem ser somadas diretamente porque incluem vitórias partilhadas. Na implementação, estes valores continuam calculados pela API; os números do mockup não são constantes da app.

## Fonte única do desenho

`gerar_mockup.py` gera o conteúdo completo e os dois recortes de cada estado. Os ficheiros `*-conteudo.svg` mostram o fluxo integral sem corte. Os recortes usam offsets fixos e clip IDs únicos; nenhum cartão é recomposto após scroll. O mesmo componente Cooperativo fornece título, nota, três números e três rótulos. As imagens PNG são exportações dos SVG emparelhados, à escala 2×; o HTML apresenta os viewports à largura exata de 402 CSS px.
