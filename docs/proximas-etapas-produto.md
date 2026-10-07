# Próximas etapas — proposta antes de implementação

**Estado mais recente:** visão de Estatísticas/retrospetiva aprovada para implementação por fases. Fase 1 (contratos + resumo e suporte) implementada; ver `estatisticas-fase-1.md`. Secções exploráveis, retrospetiva e partilha são trabalho autorizado por concluir. Na partilha, amigos sempre anónimos e proteção informativa, sem controlo para desativar.

Estado atual: Início e Biblioteca e controlos testados aprovados no iPhone; Estatísticas e «O teu ano à mesa» em proposta antes de implementação. Ver [estrutura, contratos, indicadores, privacidade e fases](proposta-estatisticas-ano-a-mesa.md). Jogar novamente permanece pendente. Os parágrafos seguintes conservam a sequência histórica.

Pedidos registados pelo utilizador. Não implementar todos em conjunto. A tarefa atual ajusta estrelas, confirma avaliação zero e propõe modos/resultados; ver [proposta atual](proposta-modos-resultados.md). A melhoria do formulário foi reconhecida no iPhone; isso não fecha todos os casos de calendário/teclado/texto ampliado nem o novo dourado/zero.

## 1. Autenticação — comparar duas propostas visuais

Apresentar **dois mockups comparáveis**, usando `assets/MeepleBoardLogo.png` e apenas assets confirmados (a indicação histórica de `ghost.json` como mascote estava errada: é um placeholder, excluído da decoração), antes de alterar ecrãs. Não substituir a mascote nem inventar outro logótipo.

Explorar duas direções: «Um lugar à mesa» (superfícies creme, ilustração acolhedora com mascote e pequenos detalhes de tabuleiro) e «Vamos jogar?» (cor suave mais presente, mascote expressiva e composição lúdica). Estas são direções para os mockups futuros, não propostas visuais já aprovadas. Mostrar entrada, registo, recuperação/reset de password e estados de validação/carregamento pertinentes. Comparar teclado aberto e texto ampliado; logo/mascote não podem ocupar o espaço dos campos e ação principal. Manter contraste, etiquetas persistentes, áreas de toque, foco e anúncios acessíveis. Conservar todos os fluxos, validações, autenticação, recuperação e acessos existentes. Analisar AuthLayout centrado dentro de cartão e o impacto do teclado, sem redesenhar nesta etapa.

## 2. Estatísticas para consultar

Estrutura a propor antes de implementar: resumo compacto + filtro Semana/Mês/Ano/Intervalo personalizado; secções exploráveis **À mesa**, **Resultados**, **Jogos e recordes**, **Companhia**, **Avaliações** e **Coleção**. Evitar colocar todos os gráficos no primeiro ecrã. Definir períodos no fuso escolhido, semana de segunda a domingo e intervalos locais convertidos para UTC com limite final exclusivo. Filtros por jogo/modo e ligações de cada indicador às partidas que o sustentam.

Prioridade alta: partidas, jogos diferentes, tempo conhecido e cobertura; jogos mais jogados; vitórias/derrotas/empates por jogo/modo com resultados conhecidos e desconhecidos explícitos; evolução temporal. Depois: companhia habitual/resultados em conjunto, avaliações próprias, recordes comparáveis e coleção. Complementares úteis: frequência média de jogo, variedade, jogos voltados a jogar, percentagem da coleção explorada e cobertura dos dados. Evitar streaks/rankings sociais artificiais e comparações que pressionem a jogar.

| Indicador | O que os dados permitem | Novos dados/limites a resolver |
|---|---|---|
| Partidas/jogos/frequência | MatchDate + GameId + participação | Endpoint de agregação autorizado e períodos/fuso; listas paginadas não são universo completo. Histórico registado não representa toda a vida do jogador. |
| Tempo e evolução | Duração nullable por partida | Soma parcial, n com duração/n total; média só entre conhecidas; sem durações mostrar indisponível. Não usar estimativa do catálogo para preencher. |
| Jogos mais jogados | Contar GameId em partidas autorizadas | Identidade canónica/expansões/variantes precisam de regras; não agrupar só por nome. |
| Vitórias e taxas | Há WinnerId/IsWinner legados | Novo modo/resultado explícito; desconhecido não é derrota/empate. Mais vitórias ≠ maior taxa. Indicar n e cobertura, separar modos e resultados legados incertos. |
| Recordes | Scores individuais inteiros, incluindo zero/negativos | Guardar sentido maior/menor, unidade e variante/versão comparável; scores ausentes ficam ausentes. Hoje Math.max no histórico partilhado não serve todos os jogos. |
| Companhia | IDs de coparticipantes por partida | Contar cada par uma vez por partida; resultado conjunto só quando conhecido; permissões antes da agregação. Não expor notas/fotos privadas nem criar perfis públicos. |
| Avaliações | MatchJournalEntry pessoal nullable 0–10/0,5 | Cada pessoa avalia a própria experiência; zero entra na média, ausência não. Legado antes do fix pode ter arredondamento irreversível. Mostrar n de avaliações por jogo. |
| Coleção/despesas | Status Owned, AddedAt e PricePaid nullable | AddedAt é entrada na coleção, não data comprovada de compra. Sem data de aquisição/moeda/transações não há despesa anual fiável nem soma segura entre moedas. Propor esses campos antes de novos indicadores; não preencher antigos por suposição. |
| Tenho mas ainda não joguei | Owned sem partida própria registada | Texto «Sem partidas registadas», não «Nunca jogaste»; usar partidas como fonte, validar contadores desnormalizados de biblioteca antes de os usar. |

Atualização: estes leitores já foram alinhados aos resultados explícitos. Antes dos novos gráficos, acrescentar agregações por período, cobertura e privacidade; não voltar a inferir resultados. Não construir Estatísticas em cima de projeções que já perderam desconhecidos. Proposta visual futura: números principais grandes, pequenas capas reais, um gráfico temporal simples e secções com “Ver mais”; cobertura/indisponibilidade próximas do valor.

## 3. «O teu ano à mesa»

Experiência futura com cartões percorríveis e partilháveis: abertura com ano → atividade → jogo mais jogado → jogo com mais vitórias → companhia → tempo conhecido → mês mais ativo → primeiras experiências segundo o histórico → encerramento. Usar identidade MeepleBoard, logo/mascote, capas reais com fallback e pequenos detalhes de dados/meeples/tabuleiro. Preparar proposta visual antes da implementação; sem números, nomes, capas ou resultados inventados para preencher dados em falta.

Regra de cada destaque: nome do indicador, valor, número de partidas que o sustenta e cobertura. «Mais vitórias» por contagem; eventual «Maior taxa» em cartão separado, com denominador conhecido e mínimo de amostra proposto. Mostrar líderes empatados ou um resumo conjunto, sem desempate silencioso. Mês mais ativo pelo n de partidas, no fuso selecionado. Tempo parcial identificado quando faltarem durações. Primeira experiência = primeira partida **no histórico registado**, não primeira vez na vida; precisar de consultar o histórico anterior ao ano, não só os resultados filtrados.

Partilha tem pré-visualização e opção predefinida sem nomes/avatares de amigos: «A tua companhia mais frequente · n partidas» ou rótulo neutro. Não mostrar IDs, usernames escondidos, notas privadas, localização, fotografias privadas nem resultados pessoais de terceiros. Respeitar privacidade antes da agregação; exportação não pode revelar dados que a consulta normal não autoriza. Cards acessíveis com alternativa textual, navegação por botões e movimento reduzido, sem depender de animação/swipe.

## 4. Ecrãs existentes — auditoria futura de utilização e personalidade

Sugestões a validar por ecrã antes de mudar código:

- **Início:** ação contextual de continuar sessão/registar partida e hierarquia de novidades; resolver dificuldade em encontrar a próxima ação, mantendo os atalhos atuais.
- **Sessões:** separar visualmente estado, participantes confirmados e ação disponível; resolver ambiguidades de sessão ativa/convites. Conservar gestão, acessos e contadores; corrigir S-LIST02 antes de destacar números.
- **Biblioteca:** filtros com estado persistente, capas proporcionais e estados Owned/Wishlist claros; facilitar procurar um jogo e distinguir coleção de desejos. Ação principal não deve substituir editar/remover/privacidade.
- **Pesquisa e detalhe do jogo:** melhorar estados sem resultados/carregamento, mostrar modo suportado com origem e limitar metadados iniciais; reduzir ruído sem confundir capacidade do catálogo com modo de uma partida.
- **Amigos e histórico conjunto:** resultado desconhecido explícito e estatísticas com amostra; corrigir falsos empates/derrotas e evitar chamar máximo de pontuação “melhor”. Preservar pesquisa, pedidos, convites e filtros de privacidade.
- **Diário/detalhes de partidas:** avaliação zero legível, clareza entre resultado/pontuação/avaliação, estados sem dados e capa; reduzir repetição mantendo notas, fotos próprias, correções autorizadas e acessos existentes.
- **Campanhas:** próxima sessão/encontro e progresso do historial com menos blocos repetidos; testar separadamente o formulário legado, sem presumir que partilha todas as regras do registo rápido/sessão.
- **Perfil/Definições/Mais:** agrupar por intenção, apresentar privacidade e preferências com rótulos e confirmação clara; manter todos os acessos e testar texto ampliado.

Esta lista é um ponto de partida, não uma afirmação de que a auditoria visual completa já ocorreu. Cada etapa deve apresentar problema observado, mockup/proposta, impacto, regras preservadas e percurso de validação no iPhone. Dados reais significam contratos e resultados efetivamente guardados; desenvolvimento continua exclusivamente com dados fictícios no ambiente de testes até autorização para outros ambientes.
