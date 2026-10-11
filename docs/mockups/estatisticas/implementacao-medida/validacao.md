# Implementação da proposta aprovada

Aprovação autorizou implementação, não aprovação visual final. Alterações em Resumo, Companhia, filtros/cabeçalho partilhados e estilos existentes. Mantidos SummaryHeader, AreaHeader, AreaNavigation, ExploreFilters/FilterSheet, StatisticsEvolution, GameCover e os acessos às listas supporting matches. Não foi criada uma segunda implementação de cartão para topo/scroll ou para cada contexto.

## Verificações

- TypeScript sem erros; 45 testes específicos passaram na revisão final.
- A suite geral de 285 testes passou antes dos últimos ajustes de tipografia e alinhamento; a revisão final repetiu os específicos.
- Testado o percurso lista → amigo → voltar: conserva pesquisa, filtros e offset 435 pt, sem abandonar Estatísticas. Testado também o cabeçalho persistente do Workspace.
- Valores continuam provenientes de `useStatistics`/`useReport`: nenhuma contagem 129/39/90/76/53/14 foi introduzida como constante da implementação.
- Mantidos modos, contextos, privacidade, métricas competitivas/cooperativas, todos os drill-downs, detalhes de empates/vitórias partilhadas, jogos, evolução, pontuações, cálculos e atualização.
- Sem confirmados: cobertura 0 no total, mensagem simples e acesso à contagem real de partidas por confirmar. Sem grelha de zeros.
- Gráfico mensal sempre aberto nos períodos com partidas. Plot 88 pt; seis rótulos em texto normal, densidade inferior com ampliação; todos os buckets e zeros no acesso mensal.
- Metro em 8082 ativo, raiz MeepleBoardApp; módulos Resumo/Companhia consultados diretamente com `transform.routerRoot=src/app`, contendo as chaves e os componentes atuais. O entry bundle sem esse parâmetro não prova o conteúdo servido ao iPhone.
- API: DeviceTests, MeepleBoard_DeviceTests, externalDelivery=false. Base habitual e dados não foram alterados.

## Comparação local

`comparacao.html` contém mockup aprovado vs componentes atuais a 402×874, no topo e após scroll. O renderer carrega os TSX e estilos atuais com serviços isolados e dados fornecidos pelo utilizador. Os PNG foram observados no WebKit. As três colunas cooperativas medem 107⅓ pt; comparação de vitórias tem duas colunas de 167 pt. Todas usam o mesmo componente/função por contexto. Nomes longos quebram após o rótulo, sem deslocar os números; as linhas crescem com o texto.

Limitação: esta pré-visualização é DOM/WebKit, não React Native no iPhone. Usa substitutos dos ícones, não representa as capas expo-image e coloca o cabeçalho fora do scroll para reproduzir o Workspace; a app usa o cabeçalho persistente e os assets existentes. A fonte real, VoiceOver, Dynamic Type e a geometria nativa permanecem por confirmar.

## Diferenças medidas, sem reformulação

| Cartão | Mockup | Pré-visualização dos componentes |
|---|---:|---:|
| Atividade do Resumo | 120 pt | 125 pt |
| Gráfico do Resumo | 216 pt | 216 pt |
| Resultados do Resumo | 196 pt | 196 pt |
| Jogos do Resumo (3 linhas) | 232 pt | 226 pt, altura pelo conteúdo |
| Partidas em conjunto | 80 pt | 86 pt |
| Competitivo | 280 pt | 280 pt |
| Cooperativo | 140 pt | 140 pt |

Os 5/6 pt adicionais acomodam entrelinhas e alvos de toque de 44 pt. Não foram impostas alturas máximas nem reduzidos os textos para encaixar. Isto desloca os cartões seguintes nessa quantidade. Nos acessos, o contorno pode adicionar 1–2 pt face ao desenho de linhas de 44. Os intervalos exteriores entre cartões continuam 12 pt. O padding dos cartões com contorno é 11 + 1 pt de contorno, mantendo o alinhamento interior a 12 pt do limite exterior.

As áreas do sistema usam SafeAreaInsets reais na app. Na pré-visualização são 62/34 pt e aparecem em branco. Não há validação nativa conclusiva sem o iPhone: o inspetor devolveu lista vazia e este Mac não tem simulador iOS instalado.

## Uma ronda final no iPhone

Reload no ambiente de testes `exp://192.168.1.116:8082`. Comparar Resumo 2024 e Companhia (Todas e Só vocês), topo e continuação. No mesmo teste, voltar à lista com pesquisa e scroll ativos e experimentar texto ampliado. Aprovação final continua pendente até observar a app.

## Correções limitadas às capturas de 17:15

- Jogos: removido `minHeight:232`; altura natural medida 106 pt com uma linha e 226 pt com três. Mantidos padding e espaçamento exterior, sem nova altura fixa. O mockup com três linhas não define uma reserva de espaço para estados com uma linha.
- Blocos expansíveis: o estilo herdado usava `flexWrap:wrap`, cujo alinhamento das linhas deixa o conteúdo no início da área mínima no React Native. O estilo local usa agora `nowrap` e `alignItems:center`; o texto dentro da coluna flexível continua a quebrar e aumentar a altura. Mantidos padding simétrico e mínimo de toque 44 pt.
- Cooperativo: preservados os três handlers existentes (`team-win`, `team-loss`, `team-draw`), modo COOPERATIVE, amigo e filtros. Rótulos verdes com seta indicam os acessos; as três colunas continuam iguais, números e rótulos alinhados. A mesma função renderiza todas.
- TypeScript e 45 testes específicos passaram. A pré-visualização local foi atualizada e observada; não substitui a confirmação do layout nativo no iPhone, nem conclui a aprovação visual ou a validação de texto ampliado do Resumo.

## Troca de amigo em folha inferior

Reutiliza FilterSheet e as mesmas linhas de amigos da lista, com avatar, nome completo, contagem secundária e indicação da seleção. A pesquisa da folha é independente; selecionar fecha a folha e mantém query e groupContext. Fechar ou escolher o amigo atual mantém a seleção. Botão discreto sem contorno, alinhado no cabeçalho e mínimo de toque 44 pt. Os testes cobrem seleção, pesquisa, fecho pelo controlo e pedido de fecho do Modal, filtros/contexto e o percurso de regresso à lista com pesquisa/scroll. 46 testes específicos e TypeScript passaram. A pré-visualização local trocar-amigo.png foi observada; teclado e apresentação nativa continuam por confirmar no iPhone.
