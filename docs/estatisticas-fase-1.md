# Estatísticas — fase 1 funcional

Continuação da visão aprovada em `proposta-estatisticas-ano-a-mesa.md`. Nesta entrega: contratos/agregações e resumo funcional com partidas de suporte. As secções exploráveis completas, retrospetiva anual e export/partilha estão autorizadas como sequência; ainda não implementadas nesta fase. Na partilha futura os amigos permanecem sempre anónimos; apresentar informação fixa, sem opção de desativação. Jogar novamente com pré-seleção permanece pendente.

## Percurso e apresentação

Mais → Estatísticas. Paleta Clube Meeple opt-in, logótipo original centrado e Voltar independente; quando há pouco espaço, texto ampliado ou teclado, Voltar passa para linha própria e o logótipo recolhe com teclado. Não alterada autenticação, Início/Biblioteca, regras do formulário ou navegação existente. Sem comprimir tudo numa altura fixa: corpo 16/24, scroll, alvos 44+ pt, cartões de valores em duas colunas quando há espaço e numa com largura <360/texto ampliado.

Semana (segunda–domingo), Mês, Ano e intervalo personalizado com datas AAAA-MM-DD; fuso do dispositivo visível. Data final do formulário incluída, convertida no contrato para fim exclusivo local; aritmética de calendário, sem somar milissegundos de 24h em transições DST. Intervalo máximo de 3660 dias para limitar consultas; períodos normais ≤ano. Modo (Competitivo/Solo/Cooperativo/Modo não registado) e jogo por ID. Seleção de jogo apresenta opções do período/modo autorizado, não do catálogo de terceiros.

Resumo: partidas, jogos distintos, tempo registado/cobertura, vitórias/derrotas/empates e Taxa de vitória, ausência de resultado/legado, comparação entre modos, avaliação pessoal/cobertura, evolução com buckets vazios e jogos mais jogados (inclui empates no limite do destaque). Cada indicador/valor abre as partidas com os mesmos filtros e faceta; paginação de 25, com mais quando necessário. Detalhe da partida abre pelo ID existente; Voltar regressa à lista e depois ao resumo conservando os filtros. Resultados cooperativos rotulados como equipa; pontuações e avaliação mostradas apenas do próprio utilizador, preservando zero/negativos. Carregamento, falha/repetição, período vazio e indisponibilidade distintos.

Requests são cancelados/desativados ao mudar filtros/sair, com chave por consulta/conta para não publicar respostas atrasadas ou valores de outra conta. Atualizar estatísticas repete a consulta explicitamente; não se cria uma cache persistente de histórico.

## Contratos e regras

GET `/MeepleBoard/statistics/me` e `/MeepleBoard/statistics/me/matches`, ambos autorizados pelo token (sem userId arbitrário). `start`, `endExclusive` são datas locais, `timeZone` é identificador válido; `gameId`, `mode` opcionais. Lista acrescenta `metric`, `bucket`, `offset`, `limit` (1–100). Agregação usa universo completo do período, não uma página do histórico. Jogos agrupados por GameId, partidas únicas por MatchId.

Taxa = Win / (Win+Loss+Draw) do próprio participante; sem conhecidos → null. Campo Result explícito conhecido e Outcome guardado, sem inferências por WinnerId/IsWinner, catálogo, pontuação ou ausência de vencedor. Legado preservado no detalhe original e separado, não reconstruído. Sem modo explícito → Modo não registado. Vitória partilhada conta uma vitória para cada vencedor; empate parcial só dá empate aos selecionados; Solo/cooperativo respeitam os resultados explícitos existentes. Não alteradas as regras de gravação.

Duração: soma em minutos só das conhecidas, mais n com/sem duração; nenhuma conhecida → null; zero explícito é valor. Avaliação: só MatchJournalEntry do autenticado, não cópia Match.PersonalRating nem diário de outro participante; média inclui zero/meios pontos. Estes indicadores pessoais abrangem o histórico registado, incluindo partidas não oficiais: não alteram rankings nem médias oficiais existentes. Fonte das respostas não inclui IDs/nomes de amigos, emails, preços, notas, tags, localizações ou fotos privadas. Detalhes continuam a usar os filtros de privacidade existentes.

## Verificação realizada

- .NET SDK 9.0.318: build DeviceTests; modelo sem drift, sem migração nova. AutoMapper 14.0.0 continua registado para análise separada, sem atualização de dependências.
- `tools/StatisticsChecks`: verificações determinísticas de IDs com nomes iguais, empate parcial/vitória partilhada, conhecidos/desconhecidos/legado, filtros, durações nulas/zero, avaliações zero/7,5, série completa, vazio e dias DST de 23/25h.
- `tools/DeviceTestApi/verify-statistics.cjs`: escrita/releitura só em MeepleBoard_DeviceTests, health guardado e fixture local ignorada/idempotente. Não consultar/escrever base habitual. Casos reais HTTP/SQL: 8 partidas no dia local 27/10/2024, 3 jogos, 2 vitórias, 2 derrotas, 2 empates, 2 sem resultado conhecido (uma Undefined e uma Legacy); taxa 33,33% em 6 conhecidos. 90 min em 5/8; média própria 4,06 em 8/8. Dois casos adicionais fora do intervalo verificam início incluído e fim exclusivo. Peer sem diário não recebe avaliações do autor; não participante vê período vazio; sem token 401; filtros inválidos 400; total/lista/paginação coerentes.
- Node 22.14.0, TypeScript, 248 testes frontend aprovados (8 específicos desta fase), incluindo filtros/indicadores, origem de navegação, ausência versus zero, modos, texto ampliado/scroll, cancelamento de resposta e cabeçalho/teclado. Export iOS em `.expo/statistics-ios-export`, ignorado; bundle no Expo 8082.

Nenhuma simulação prova geometria ou interação nativa no iPhone. A API foi reiniciada para carregar os endpoints; pode ser necessário voltar a entrar com a conta fictícia porque a chave JWT efémera de DeviceTests muda. Credenciais mantidas exclusivamente nos ficheiros locais ignorados, sem exibição. API 5099/Expo 8082 permanecem ativos.

## Confirmação curta no iPhone

1. Recarregar Expo 8082, entrar com a conta fictícia autor e abrir Mais → Estatísticas. Alternar Ano/Mês/Semana e modos; confirmar leitura/scroll, sem atribuir derrota aos resultados ausentes.
2. Intervalo: início e fim `2024-10-27`, com fuso Europe/Lisbon visível. Aplicar: confirmar 8 partidas, 3 jogos, 90 min em 5/8 e Taxa de vitória 33,33% em 6 resultados conhecidos. O legado é subconjunto das partidas sem resultado conhecido, não uma terceira categoria para somar ao total.
3. Abrir Vitórias ou Taxa de vitória → partida → Voltar → Voltar. Confirmar filtros preservados; filtrar Solo/Cooperativo e um jogo; testar intervalo vazio e limpar filtros.
4. Abrir avaliação/lista e confirmar zero, 7,5, pontuação 0/−5; repetir com texto ampliado e teclado aberto no intervalo. A confirmação visual e funcional desta nova página permanece pendente.

Os testes nativos pendentes de Solo empate/não definido, cooperativo, campanhas/encontros e autenticação continuam registados: as fixtures desta entrega não substituem esses percursos no iPhone.
