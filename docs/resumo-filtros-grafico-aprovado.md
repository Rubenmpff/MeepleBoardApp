# Resumo aprovado: Filtros e atividade visível

Esta referência substitui os objetivos anteriores do Resumo. O desenho foi aprovado; a implementação continua por validar visualmente no iPhone.

Referência: [proposta aprovada](mockups/estatisticas/resumo-filtros-grafico/referencia-aprovada.png).

## Composição inicial

- Cabeçalho e navegação persistentes existentes, com o logótipo original.
- Título, período em texto e um único botão Filtros; escolhas de jogo e modo visíveis abaixo. Até à data identifica o ano em curso.
- Atividade numa superfície lavanda: dois indicadores e uma linha discreta de duração. Cobertura adicional em detalhes.
- Evolução das partidas sempre visível, seguida de Consultar meses; reutiliza StatisticsEvolution e a lista mensal existente.
- Resultados numa superfície leve: vitórias, derrotas e empates; taxa/amostra discretas; desconhecidos numa linha. Antigos por confirmar em detalhes, preservando a relação com desconhecidos e o acesso às partidas.
- Jogos mais frequentes abaixo, com capas disponíveis, nomes completos e contagens reais.

## Medidas de implementação

Conteúdo com margens de 16 pt e intervalos de 4 pt; superfícies com raio de 14 pt e preenchimento de 8–12 pt. Título de página 20/26 pt; títulos de secção 16/22 pt; valores da atividade 28/34 pt; resultados 20/24 pt; informação secundária 12/18 pt. O gráfico anual usa uma área de barras de 96 pt, com margem superior para valores e eixo alinhado por posição de cada mês. Controlos interativos têm pelo menos 44 pt. Não há alturas fixas nos cartões nem supressão da ampliação do texto. Valores sobre as barras cedem espaço com texto ampliado; os valores completos continuam no acesso acessível e na lista.

## Dados e validação

Nenhuma alteração aos cálculos ou à autorização. O gráfico usa todos os buckets devolvidos pela API, incluindo zeros; não inventa barras mínimas. Datas usam o calendário do período e as etiquetas são alinhadas com o respetivo bucket. Os exemplos de 2025 do desenho não entram nos dados da app.

35 testes de Estatísticas e TypeScript passaram. Verificação na API DeviceTests: ano 2026, mês de outubro, semana de 5–12 de outubro e intervalo de 27 de outubro de 2024; soma dos buckets = total e resultados conhecidos + desconhecidos = total. O ano de 2026 tem 158 partidas, 12 buckets e 11 meses sem partidas.

A comparação final exige a captura atual do iPhone. Os testes funcionais não constituem aprovação visual.


## Acabamento solicitado após a captura

- Intervalos do Resumo reduzidos para 4 pt; controlos mantêm 44 pt.
- Valores nas barras apenas quando há partidas; todos os meses e zeros permanecem acessíveis no gráfico e na lista.
- Duração apresentada em horas e minutos; 288 minutos = 4 h 48 min.
- Informação de duração e desconhecidos integrada em linhas sem quebra do ícone para uma linha isolada.
- Calendário nativo existente para início/fim; datas localizadas e um único Aplicar filtros. Edição em rascunho, incluindo jogo/modo/período; fechar a folha não aplica mudanças. Fim continua incluído na seleção e exclusivo na consulta.
- Intervalo semanal abreviado, com datas completas na etiqueta acessível.

38 testes de Estatísticas, TypeScript e exportação iOS passaram. Validação visual ainda pendente no iPhone.


## Revisão do conjunto após a captura de 2024

Título e filtros agrupados sem intervalo exterior, escolhas com intervalo de 2 pt, blocos com 4 pt. Atividade com padding de 10 pt. Gráfico, resultados e jogos usam a mesma superfície (padding 8 pt, raio 14 pt, contorno #EAE5EE). Ícones dos indicadores 28 pt / resultados 24 pt. Jogos: capa 48 × 48 pt, nome 14/20 pt, contagem 18/22 pt, linha mínima de 60 pt. Alturas crescem com texto/conteúdo; controlos mantêm 44 pt. Estado vazio não foi alterado.

[Comparador com a última proposta](mockups/estatisticas/resumo-filtros-grafico/comparar-resumo.html): normalização pela largura de conteúdo, sem comparar dois telemóveis com uma captura individual. Captura de 2024 analisada visualmente na conversa; ficheiro não disponível no workspace. DevTools devolveu lista vazia de dispositivos, impedindo captura nova. O comparador exige selecionar o ficheiro local da captura e não contém uma simulação.

Persistem por validar: fontes/alinhamentos e alturas reais no iPhone. Capas em falta continuam com o placeholder existente; três jogos e nomes longos podem exigir mais linhas que os dois exemplos do desenho. A composição e a cobertura não são alteradas para imitar valores fictícios.


## Capturas 2024 atuais: verificação da divergência

As imagens da conversa mostram molduras de capa aproximadamente 48 × 60 pt e informação dos desconhecidos abaixo da linha. O Metro devolveu HTTP 200 para o ecrã e estilos contendo summaryCover 48 × 48 e nowrap; essa resposta não prova o que o iPhone renderizou. DevTools continua sem dispositivos. Não atribuímos a divergência à cache sem evidência.

O acesso a informação passa para o início da mesma linha dos desconhecidos, como no desenho; a linha tem direção horizontal explícita, sem quebra, e ambos os acessos preservam 44 pt. A moldura das capas explicita proporção 1, largura/altura 48 pt e ausência de encolhimento; cantos 8 pt. GameCover existente recebe opcionalmente onLayout, sem alterar os restantes usos. Diagnósticos __DEV__ [Summary visual], revisão summary-square-inline-2024, registam as dimensões nativas da linha e das molduras sem nomes ou dados pessoais.

Comparador suporta topo e scroll, carregando automaticamente captura-2024-topo.png e captura-2024-scroll.png quando estes ficheiros reais estiverem disponíveis. Os anexos da conversa não estão acessíveis pelo filesystem; caminhos locais pedidos ao utilizador. Não existe captura simulada nem coluna declarada preenchida sem os ficheiros.

### Verificação do runtime do iPhone — 9 outubro 2026

Após Reload acompanhado nesta sessão, o Metro 8082 registou o iPhone em Expo Go e a revisão `summary-square-inline-2024`. A rota `(areas)/index.tsx` reexporta `StatisticsScreen`; este importa `summary/styles.ts` e reutiliza `GameCover`. Não foi encontrada uma segunda implementação do Resumo.

Medições nativas efetivamente registadas: `unknown-row` x=9, y=119, largura=352, altura=45; três `game-cover` com largura=48 e altura=48. O bundle iOS completo servido pelo mesmo processo contém estes estilos e a revisão. API confirmada em `DeviceTests`, base de dados `MeepleBoard_DeviceTests`, externalDelivery=false.

Os PNG de 10:19 já inseridos no comparador mostram uma geometria diferente. Não documentam o runtime acabado de medir. A causa histórica da discrepância entre Reloads anteriores e ficheiros locais não está demonstrada; não atribuir à cache. As medições atuais confirmam a execução da revisão, mas não substituem a nova captura para validar a composição visual.


### Acabamento integrado — revisão summary-finish-2024

Capturas de 11:06: IMG_3359.PNG (topo) e IMG_3360.PNG (scroll), carregadas no comparador. Confirmam capas quadradas e informação sem linha extra. Acabamento posterior: atividade com padding vertical 5 pt e horizontal 10; cartões brancos 3/8 pt, cantos 10 pt e contorno #EFEAF2; linhas dos jogos mínimas 56 pt e capas 48 pt; números dos resultados 22/26 e rótulos 12/18; separadores entre métricas. Linha dos desconhecidos centrada como um grupo, mantendo botões distintos de informação e consulta e áreas de toque de 44 pt. Gráfico existente com barras de 86 pt, reserva superior 18 pt e Consultar meses com ícone, separador e seta direita.

Estas medidas procuram retirar cerca de 10 pt de atividade/resultados e 14 pt do cartão do gráfico (padding vertical de 8 pt preservado no gráfico), aproximando o conjunto da referência. Não são uma confirmação visual da nova renderização. A imagem aprovada é uma ilustração: preservam-se fontes nativas, logótipo original, pictogramas existentes e dados reais. Estado vazio, filtros, calendários, cobertura, detalhes, contagens e privacidade mantidos. Verificação final única no iPhone: 2024 topo e scroll; texto ampliado para confirmar ausência de cortes; período vazio para confirmar recuperação. Não há simulador nem ferramenta de captura nativa ligada disponível nesta sessão.

### Topo e hierarquia — summary-light-top-2024

Aprovação visual pendente. Intervenção autorizada após comparação: fundo do cabeçalho #F6F2FA, sem os 6 pt de padding vertical anteriores, preservando integralmente o asset e dimensões do logótipo. Voltar 14/20 regular; navegação 12/18 regular, mantendo alvos de toque de 44 pt. Estatísticas 22/28 bold; títulos dos cartões do Resumo 15/20 semibold. Filtros reutiliza o mesmo TouchableOpacity, com alvo mínimo 44 pt e superfície interna mínima 34 pt, texto 13/20 e ícone 18. A superfície cresce com texto ampliado. Período em fundo #FEFDFE, contorno #EEE9F3, cantos 8 pt, altura mínima 34 pt, texto 13/20 e intervalo completo acessível. Separadores de métricas/duração #E9E2F0; grelha do gráfico #F0ECF4. Organização, cálculos, filtros, gráficos, acessos e estado vazio preservados; nenhum componente paralelo criado.

TypeScript e 39 testes de estatísticas passaram. Estes checks não confirmam fidelidade visual nem aprovação do utilizador. Capturas de 11:15 anteriores à revisão continuam a ser a base, não o resultado destas mudanças. Texto ampliado pendente separadamente.


### Base IMG_3377 e IMG_3378 — período e intervalos entre cartões

Estas capturas, fornecidas na conversa às 11:51, são a base visual mantida; aprovação visual e texto ampliado pendentes. Apenas dois ajustes: período abre o mesmo painel de filtros através de openFilters, com intervalo completo no rótulo acessível e alvo de toque de 44 pt à volta da superfície de 34 pt; intervalo exterior uniforme entre blocos aumenta de 4 para 8 pt. Padding interno, restantes estilos, gráfico, dados e funções preservados. O teste existente confirma que tocar no período abre o painel com uma cópia dos filtros ativos.
