# Companhia, Explorar e Ano — acabamento segundo a A

O Resumo continua na base IMG_3377/IMG_3378, com período acionável e 8 pt de intervalo exterior. Aprovação visual e texto ampliado do Resumo pendentes. Nenhuma alteração da sua organização nesta revisão.

## Composição e reutilização

Cabeçalho e navegação persistentes continuam a ser SummaryHeader/AreaNavigation, com o logótipo original. As áreas usam AreaHeader, ExploreFilters, FilterTrigger, FilterSheet, GameCover e YearCard existentes. Não foram criadas versões alternativas de ecrãs. Resumo, Companhia e Explorar reutilizam agora ExploreFilters: período acionável, um botão Filtros e escolhas ativas visíveis; superfície mínima 34 pt dentro de toque mínimo 44 pt. FilterSheet conserva o calendário em português e um único Aplicar filtros. Alterações ficam em rascunho até aplicar; fechar preserva a consulta anterior. Retirada a implementação duplicada do Resumo e o editor antigo com campos de datas manuais. Intervalos semanais são formatados pela mesma função portuguesa já utilizada no Resumo. Texto ampliado permite reorganização e crescimento sem limite de linhas nos nomes.

Companhia: título/filtros agrupados; pesquisa 14/20 pt; amigos em cartões discretos, avatar 44 pt, linhas mínimas 56 pt, nomes 14/20 e contagem 12/18. Detalhe: contextos com toque 44 pt, cartão lavanda compacto, vitórias com ícones e números 22/26, resultados e cobertura em escala secundária. Acesso direto Consultar partidas conserva amigo, período, jogo, modo e contexto. Jogos, evolução, pontuações e explicações continuam disponíveis nos acessos existentes.

Explorar: categorias em segmentos compactos; um cartão por jogo, preservando agregação de modos e contagens. Capas 48 × 48, títulos 14/20 e dados secundários 12/18. Expansão conserva mínimos/máximos, amostras, avaliação e ligações específicas. Coleção preserva entradas próprias, zero nos preços e a ausência de moeda quando não indicada. Ordenações não foram alteradas.

Ano: título 22/28, navegação anual e progresso existentes; YearCard com cantos 10 pt, padding 12 pt, gap 6 pt, marca 12/18, título 18/24, destaque 28/34, nomes 16/22, secundários 12/18. Capas quadradas, sem imagens inventadas. Todos os cartões, líderes empatados, amostras e ligações mantidos. Tempo usa o formatador h/min existente, sem alterar o valor calculado.

Pré-visualização: mesmo SummaryHeader e logo, mesmo YearCard com variante de partilha, aviso de anonimato junto ao ícone de privacidade, botão de partilha existente em tamanho compacto e acesso explícito Voltar ao cartão. A captura continua limitada ao YearCard e à projeção publicYearCard, sem identidades de amigos. A ação de voltar conserva ano, índice e filtros; bloqueada durante a preparação de partilha, tal como o fecho existente. Nenhuma partilha externa foi efetuada para validar.

Removidos apenas os overrides locais de capa/lista/nome que deixaram de ter consumidores; os estilos originais usados nas partidas de apoio continuam. StatisticsHeader permanece porque as partidas de apoio o usam. Retirada a propriedade compact redundante de YearCard; o mesmo cartão atende leitura e partilha. ClubPrimaryButton mantém o comportamento original por defeito e recebe apenas a opção compact para os acessos anuais.

## Evidência e limites

TypeScript e os testes de estatísticas verificam comportamentos, filtros, privacidade, zero/negativos, texto longo e ações. Não validam a composição visual. A exportação iOS valida o bundle. O comparador `mockups/estatisticas/areas-a/comparar-areas.html` apresenta cada painel da A a 370 pt e aceita apenas capturas reais, sem simulação. Ainda não contém capturas da revisão.

O inspetor do Metro não tinha um iPhone ligado durante as verificações; não há Xcode/simulador nem browser automatizado nesta sessão. Verificação renderizada pendente. Foi pedido que a app ficasse aberta para tentar observação direta antes de pedir imagens. Se continuar indisponível, usar uma única ronda por área:

- Companhia: lista e detalhe de um amigo em Competitivo/Em grupo; numa mesma sessão, abrir evolução/pontuações e confirmar regresso das partidas com filtros mantidos.
- Explorar: Jogos (topo e um jogo expandido), Avaliações e Coleção; confirmar regresso do detalhe com os mesmos filtros.
- Ano: cartão de jogo mais jogado e respetiva pré-visualização; confirmar Voltar ao cartão mantém posição, sem executar partilha externa.

Só depois da observação renderizada atualizar diferenças e aprovação visual; não tratar os testes como aprovação.

Na tentativa posterior, o iPhone apareceu em /json/list. A ligação ao inspetor abriu, mas Runtime.enable/Runtime.evaluate não tiveram resposta durante a janela de 12 segundos. Não foi possível obter uma captura nem avaliar componentes no dispositivo; a presença na lista não confirma renderização. TypeScript e 41 testes de estatísticas passaram na versão final (incluindo os testes novos de contexto/filtros do amigo e regresso da pré-visualização). O bundle servido contém os estilos e acessos desta revisão. Não foi afirmada aprovação visual.

Nesta unificação, TypeScript e 281 testes passaram, incluindo escolhas em rascunho, cancelamento, calendário, intervalo inválido, fim inclusivo e a mesma barra/folha nas duas áreas. O bundle iOS servido pelo Metro contém o componente partilhado; /json/list devolveu lista vazia na tentativa direta. As capturas das 12:10 mostram o componente anterior de três campos. Não há prova de cache nem de renderização desta nova revisão no iPhone.

## Companhia — detalhe compacto, revisão das capturas 13:41

Mantidos os filtros partilhados e a lista. No detalhe, o total e a cobertura precedem as métricas; quando há partidas e zero resultados confirmados, a explicação fica imediatamente junto do total, sem inferir derrotas. Vitórias têm ícone/número na mesma linha e o nome por baixo, permitindo nomes completos sem deslocar os números. Competitivo tem linhas mínimas 44 pt com separadores suaves; Cooperativo tem superfície clara própria e três acessos compactos lado a lado, conservando os rótulos e métricas de equipa. Detalhes e desconhecidos, jogos, evolução, pontuações e Consultar partidas continuam disponíveis e mantêm amigo/contexto/filtros.

TypeScript, 42 testes de estatísticas e exportação iOS passaram. Verificado o caso de 76 partidas sem resultados, nomes longos, contexto Só vocês e navegação competitiva/cooperativa. São verificações estruturais e funcionais: não provam ausência de sobreposições nativas. API confirmou DeviceTests/MeepleBoard_DeviceTests, sem entregas externas. O inspetor devolveu lista vazia; validação visual da revisão no iPhone permanece pendente, numa única ronda de Companhia (Todas, Só vocês, Em grupo, topo e continuação do cartão).

## Regresso do detalhe de Companhia

O cabeçalho persistente consulta agora a ação de regresso de Companhia, registada apenas enquanto a área está focada e há um amigo aberto. Voltar limpa a seleção do amigo e o seletor, sem navegar para fora da área; na lista continua a ação habitual. O fallback AreaHeader recebe a mesma ação. Pesquisa e filtros permanecem no ecrã montado; o offset da lista é guardado apenas enquanto a lista está visível e restaurado após o conteúdo voltar, sem animação. Trocar amigo continua disponível. Testes percorrem lista → amigo → voltar → lista, incluindo pesquisa, offset 435, regresso habitual e integração com o cabeçalho real do Workspace. Não equivalem a uma observação visual nativa.

## Companhia — hierarquia completa após revisão

O cartão separa agora grupos por 10 pt, sem espaçar excessivamente as linhas internas (toque mínimo 44 pt). Total em escala principal; cobertura em texto secundário; duas vitórias alinhadas na linha dos números, com nomes completos abaixo. Competitivo usa linhas com rótulos 13/18 e valores 18/24; Cooperativo tem superfície clara própria, título e explicação de equipa separados, e três colunas com rótulos e números alinhados. Acessos a jogos, evolução e pontuações usam os cartões brancos existentes, distinguindo ações das métricas lilás. Filtros e regresso à lista permanecem.

Quando known = 0, não são renderizadas as métricas competitivas/cooperativas. Há total, mensagem simples e ligação unknown-pair com a contagem original de partidas por confirmar; nenhum resultado é inferido. Confirmado em StatisticsExploreContracts.cs: pair-draw agrega draw-together e draw-with-other, excluindo other-draw. Rótulo explícito e expansão “Empates e vitórias partilhadas” descrevem essa divisão; a ligação draw-with-other reutiliza a métrica existente e a contagem draws − drawsTogether, sem alterar o cálculo no servidor. Os detalhes continuam a preservar vitórias partilhadas e empates de outros.

A revisão estrutural abrange topo/filtros, contextos, total/cobertura, ambos os grupos e acessos secundários; renderização de teste inclui nomes longos e fontScale 2. Essa renderização não mede geometria nativa. Aprovação visual permanece pendente, sem exigir nova captura antes da verificação possível no ambiente.
