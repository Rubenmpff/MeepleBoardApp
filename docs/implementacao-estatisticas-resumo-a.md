# Resumo — referência A aprovada

Implementação limitada ao Resumo. Referência: primeiro ecrã de `mockups/estatisticas/navegacao-v2/a-areas.png`. A aprovação da composição real continua pendente; não aplicar às restantes áreas antes da comparação no iPhone.

## Componentes e medidas

Base de comparação: 402 × 874 pt (capturas anteriores 1206 × 2622 px, escala 3). Conteúdo com scroll, margens 16 pt, largura máxima 680 pt; grelha de espaços 4/8/12/16/24 pt. Nenhuma altura total fixa.

| Componente | Medidas e composição |
|---|---|
| Cabeçalho | Logótipo real centrado, janela 88 × 58 pt, curva lavanda; Voltar independente. Navegação Resumo/Companhia/Explorar/Ano, mínimo 44 pt; título 22/30 pt abaixo. |
| Filtros | Uma linha: período, jogo, modo; borda 1 pt, raio 12 pt, mínimo 44 pt. Editor de período recolhido, preserva semana/mês/ano/intervalo e deslocação. Valores ativos visíveis. |
| Atividade | Única superfície lavanda, raio 16 pt, padding 12 pt. Duas métricas alinhadas 28/36 pt; tempo e cobertura em linha própria. |
| Resultados pessoais | Título 18/25 pt, três métricas 20/28 pt, sem contornos individuais; taxa e amostra juntas; desconhecidos e antigos por confirmar acessíveis. |
| Jogos frequentes | Três posições e empates na última posição; capas reais 48 × 60 pt, contain e fallback existente; nome 16/24 pt, contagem à direita; linha ≥72 pt. Ver todos quando necessário. |
| Informação secundária | Atividade mensal, avaliação própria e fórmulas recolhidas; todos os suportes continuam acessíveis. |

Paleta partilhada existente: lavanda #F1EBFA, verde #27594B, branco quente #FBFBF8, texto #30283D, dourado nos ícones apropriados. Corpo 16/24 pt, informação secundária 14/20 pt. Não reduzir o corpo para caber no ecrã.

Em largura inferior a 360 pt ou texto ampliado, filtros/métricas adaptam-se a várias linhas; nomes nunca truncados. Voltar ocupa linha própria quando necessário. Decoração recolhe com teclado, campos personalizados mantêm scroll.

## Desvios intencionais

Voltar conserva a navegação existente. Avaliação própria fica num acesso expansível para preservar o indicador atual sem competir com o resumo. Explorar oferece os três acessos existentes antes da migração visual dos seus ecrãs. Capas e números vêm exclusivamente da API configurada de testes, sem reproduzir os valores fictícios do mockup.

## Comparação e limites

Este Mac tem Command Line Tools, sem Xcode/simctl ou simulador iOS. Não foi possível produzir uma captura nativa; testes de componentes e exportação não equivalem a validação visual. Comparar a próxima captura do iPhone com o primeiro ecrã A, lado a lado à mesma largura de viewport, sem deformar proporções. Verificar ordem, altura do cabeçalho, espaço dos filtros, densidade das métricas e capas antes de estender o padrão. Base habitual e backend não são alterados nesta fase.

## Verificação desta fase

- Node 22.14.0 explícito; TypeScript e exportação Expo para iOS concluídos.
- Suite frontend: 260 testes passaram antes do último ajuste de espaçamento; suite Estatísticas/Explorar repetida após esse ajuste, incluindo suportes, filtros, zero, negativos, dados ausentes e partilha anónima. Teste adicional do cabeçalho incluído na verificação final.
- Endpoint `/device-test/health`: DeviceTests, MeepleBoard_DeviceTests, externalDelivery false. Não se alteraram contratos, migrações ou dados; backend permanece limpo.
- Não verificado visualmente: proporções finais no iPhone, layout real com teclado/texto ampliado e comparação lado a lado. Aguardam captura do utilizador.

Percurso: abrir Estatísticas/Resumo → capturar o topo com filtros recolhidos → tocar numa métrica e regressar (filtros preservados) → abrir Atividade por mês. Enviar primeiro a captura do Resumo para comparação com A; não avançar com o padrão noutras áreas antes desta avaliação.

## Afinação e extensão às áreas — 08/10/2026

O utilizador autorizou aplicar A às restantes áreas após a correção, mantendo a fidelidade visual por aprovar. A fase seguinte substitui o menu sobreposto por um cabeçalho comum com quatro separadores reais. Cada área tem seleção própria; mudar de área transporta o intervalo, jogo, modo e fuso. Voltar das partidas conserva o estado do ecrã de origem. Não há mudança dos cálculos ou contratos.

Comparação estrutural com A (não é uma captura renderizada):

- Resumo: filtros fechados com mínimo 44 pt, padding horizontal 8/vertical 6, espaço entre secções 12 pt, entre linhas 4 pt. Sem filtro, os rótulos Jogo/Modo evitam aumentar a altura; seleção ativa mostra o nome/modo completo. Texto longo e ampliação continuam a expandir o controlo. Desvio intencional de rótulo em relação a «Todos os jogos/modos» do mockup.
- Companhia: pesquisa e escolha direta dos amigos autorizados, título «Tu e [nome]», vitórias principais alinhadas; detalhes, jogos, evolução e pontuações expansíveis. Os contratos atuais não sustentam a divisão exata «Só vocês/Em grupo»; não se inventaram essas contagens nem se alteraram os cálculos. Não mostrar seletores com números fictícios.
- Explorar: separadores Jogos/Avaliações/Coleção; listagem por jogo/modo com capa e nome, dados e suportes em expansão por jogo; ordenação recolhida. Coleção conserva preço zero, moeda ausente, estados e acessos. Capas reais ou fallback existente.
- Ano: setas 44 pt, progressão discreta, Anterior/Seguinte compactos; capa/nome/resultado no cartão, consulta dos suportes e preview preservados. O ano corrente mostra «Até à data» no leitor e na imagem pública. Nomes/avatares/IDs dos amigos continuam excluídos da partilha.
- Plurais corrigidos no Resumo e cartão anual: «1 jogo diferente»; zero/vários continuam «jogos diferentes».

Não chegaram capturas novas nesta mensagem. O Mac continua sem captura nativa; comparar no iPhone com A, à mesma largura e escala, continua pendente. Testes funcionais não aprovam a composição visual. Base habitual e backend intactos.

Verificação final da extensão: Node 22.14.0, TypeScript, 266 testes gerais e 26 testes específicos finais passaram; exportação iOS concluída. A última afinação acrescentou «Até à data» também aos filtros anuais das áreas de consulta e centrou o título do leitor. Endpoint DeviceTests confirmado; Metro ativo em 8082. Nenhuma destas verificações substitui a comparação visual no iPhone.

## Contextos concluídos e composição afinada

A extensão principal do backend fornece agora Todas/Só vocês/Em grupo e a distribuição correspondente ao período/jogo/modo. A Companhia seleciona o contexto e passa-o a todos os suportes; dados e resultados desconhecidos permanecem na amostra. Usa participantes distintos registados, sem inferir participantes históricos ausentes. O bloqueio anterior do contrato está resolvido; não é necessária migração.

Afinação estrutural face à A: ícone ao lado do conjunto número/rótulo (não por cima do rótulo), atividade 32/40 pt, resultados 20/28 pt; taxa e amostra numa linha flexível; Trocar amigo junto ao título, com posição adaptada em largura estreita/texto ampliado. Comparação da Companhia numa única superfície lavanda, contagens de contexto em seletores compactos, detalhes extensos recolhidos. Texto corpo preservado em 16/24 pt e alvos ≥44 pt.

As mensagens desta etapa não incluem novas imagens anexadas; não foi possível a comparação de capturas à mesma dimensão. Estas são correções estruturais guiadas pela referência A, não aprovação da apresentação renderizada. Solicitar capturas Resumo e Companhia e comparar a largura real antes de declarar fidelidade visual concluída.

## Separadores persistentes e afinação dos cinco pontos

Causa confirmada: AreaHeader usava router.replace numa Stack; removia a área anterior, repetia cabeçalho dentro de cada ScrollView e voltava a carregar os relatórios. A solução usa uma subárea de Tabs sem animação, mount inicial lazy e cenas conservadas/freezeOnBlur. O cabeçalho e navegação ficam num layout único fora das cenas. Os percursos públicos /statistics, /company, /explore e /year mantêm os endereços anteriores; matches fica na Stack de suporte.

Query/período comuns vivem em memória num provider com chave de conta. Sair/trocar conta elimina estado e áreas; os hooks continuam a cancelar respostas antigas. Amigo/contexto, categoria/expansões, ano/cartão e scroll permanecem nos componentes montados. Primeiro acesso ou mudança explícita dos filtros ainda exige carregamento; não se conserva um relatório de outro filtro para esconder esse carregamento. O relatório anual só recarrega por ano/jogo/modo/fuso, não por alterações irrelevantes de datas da consulta pessoal.

- Placeholder Procurar amigo: #58616A sobre campo #FFFFFF, texto #30283D e aparência do teclado clara, explícitos também quando o sistema está escuro (paleta clara aprovada permanece intacta).
- Taxa de vitória: título e percentagem na primeira linha flexível; amostra em linha secundária. Nada comprimido num único texto.
- Mais jogados: uma linha por GameId, frequência somada dos modos filtrados; ao abrir, divisão e suportes por modo preservam mínimos, máximos, resultados e avaliações. Nomes iguais com IDs diferentes permanecem jogos diferentes.
- Filtros exibem Todos os jogos/Todos os modos/seleção real, não placeholders genéricos. Ano sem crescimento adicional deixa mais largura aos nomes. Sem truncar nem impor altura fixa ao texto ampliado.
- Cartões anuais conservam cobertura/duração/amostras e identidade dos filtros; destaque com capa proporcional maior, nome 18/26, valor 36/44. Histórico, primeira experiência e fuso num acesso Como calculamos fora do cartão capturado. Preview captura exatamente o seu próprio YearCard; nomes e IDs de amigos continuam fora da imagem.

Verificação funcional: TypeScript, 271 testes gerais, 31 específicos e exportação iOS; API DeviceTests/MeepleBoard_DeviceTests/externalDelivery false e Metro 8082 confirmados. Configuração de permanência e ausência de animação testada; não equivale a observar a navegação nativa. Aprovação visual, contraste real claro/escuro, continuidade do scroll, teclado e texto ampliado permanecem para iPhone.

Percurso: recarregar uma vez após a alteração de rotas; selecionar amigo/contexto → Explorar → abrir jogo → Ano → escolher cartão → regressar às áreas. Confirmar seleções/scroll conservados e ausência de flashes. Comparar Resumo/taxa, filtros e cartão anual com A usando capturas à mesma largura.


## Comparação concreta com as capturas de 8 de outubro

A largura do conteúdo da captura redimensionada é aproximadamente 866 px (x=38…904), equivalente a 370 pt se o ecrã lógico tiver 402 pt. O Resumo da referência local A ocupa aproximadamente x=38…328 (290 px); comparar estes recortes, não o quadro completo. Estas medidas são estimativas sobre as imagens recebidas, não medições de layout nativo.

| Elemento | Antes | Correção local às Estatísticas |
|---|---|---|
| Cabeçalho habitual | 72 pt; logótipo 88×58 | 52 pt; logótipo 66×44, centrado |
| Separadores | seleção preenchia 44 pt | seleção visual 28 pt, toque mínimo 44 pt |
| Filtros | rótulos 16 pt e período largo | rótulos 14/20; período base 68; altura mínima 44 |
| Resultados | linhas isoladas no fundo | superfície branca leve, contorno discreto, intervalos 2 pt |
| Listas | mínimo 72 pt, intervalos maiores | mínimo 64 pt, capas 48×60, divisórias leves |
| Hierarquia | títulos 22/30; métricas 32/40 | títulos 20/26; métricas 28/34; corpo mantém 16 pt |

Texto nativo continua escalável: sem allowFontScaling=false nem maxFontSizeMultiplier. Acima de fontScale 1,25 ou em largura <360, os cabeçalhos/filtros usam adaptação própria existente, sem impor altura fixa ao texto. O layout persistente regista em desenvolvimento [Statistics layout] com width/height/scale/fontScale, sem dados pessoais. Não é possível deduzir a opção Zoom do ecrã apenas da captura; falta ler o log de um iPhone ligado e confirmar as definições no dispositivo.

Ano: comparar o cartão `played` com o painel 5, não o resumo `overview` da captura. Capas reais com proporções preservadas e fallback existente; decoração não interativa com ícones reais de dados, peão e estrelas. Não foi criada mascote. Preview usa a mesma árvore capturada para partilha, com superfície dourada; privacidade/anonymização preservadas.

Diferenças intencionais: Voltar continua acessível; alvos de 44 pt são maiores que alguns controlos desenhados; cobertura de duração e resultados antigos reais acrescenta linhas que o mockup ilustrativo não contém. Empates nos destaques mantêm todos os jogos empatados. Não retirar informação nem inventar capas para forçar igualdade de altura.

Não há simulador iOS/Xcode neste Mac nem dispositivo ligado ao inspector Metro para capturar ou ler a escala efetiva. As imagens inline são visíveis para análise, mas não estão disponíveis como ficheiros locais para compor um artefacto pixel a pixel. `docs/mockups/estatisticas/navegacao-v2/comparar-resumo.html` prepara as colunas normalizadas: a coluna real fica explicitamente pendente até escolher uma captura local, sem a simular. Não declarar fidelidade visual concluída.

Verificação desta composição: Node 22.14.0; TypeScript sem erros; 271 testes gerais passados, incluindo 31 testes das Estatísticas; exportação iOS concluída em /private/tmp/meepleboard-a-density-export. Os testes incluem largura 320 e fontScale 2, mas o harness não mede o layout nativo. Cálculos/API/base habitual não alterados nesta correção visual. A escala efetiva do iPhone e a comparação visual da versão nova continuam pendentes.


## Capturas atuais: ano partido e editores em linha

As seis capturas mostram: (1) Resumo fechado, (2) editor de período, (3) lista de jogos, (4) Companhia, (5) Explorar, (6) Ano/overview. O ano ocupa cerca de 68 pt mas divide 2026 em 202 + 6: a base reservada incluía padding, gap e seta. Corrigido para 96 pt e uma linha apenas no ano. Com texto ampliado ou ecrã estreito, o período usa largura total; os outros valores longos continuam a poder quebrar sem reduzir o texto.

Os editores antes estavam dentro do fluxo do ScrollView e por isso empurravam métricas e resultados. Os mesmos controlos passam para FilterSheet (Modal transparente, folha inferior com título, seleção atual, Concluir, fecho exterior e scroll/KeyboardAvoidingView). Fechar não modifica o filtro nem apaga o intervalo em edição; aplicar intervalo continua a validar antes de atualizar. Jogo/Modo fecham após escolher. Cabeçalho/separadores/resumo não são remontados.

Resultados desconhecidos e antigos por confirmar: dois acessos de mínimo 44 pt lado a lado à escala habitual (cerca de 44 pt menos de altura que dois acessos consecutivos); texto curto mantém contagem e “Destes” para indicar que os antigos são subconjunto. Amostra permanece sob taxa de vitória. Em ampliação, os acessos passam para coluna e crescem com o texto. Rótulos de acessibilidade completos e filtros dos registos mantidos.

Ano: Consultar partidas deixa de usar o botão grande preenchido e passa a linha secundária de 44 pt. Pré-visualizar partilha passa a contorno compacto de 44 pt, para não competir com Anterior/Seguinte. O cartão mantém destaque, cobertura e dados reais. A sexta captura é overview; não comparar a sua composição com played do painel 5 da A.

Inspector /json/list voltou a devolver [] enquanto o utilizador tinha Estatísticas aberta; não foi possível recolher fontScale. Nenhuma escala foi inferida como medição efetiva. Anexos inline são visíveis mas não aparecem como ficheiros locais: o comparador não contém estas capturas automaticamente. Não declarar uma comparação lado a lado executada, nem capturar HTML do harness como app nativa. As observações acima usam as capturas fornecidas, com conteúdo normalizado, e não a imagem de seis telefones inteira.

Verificação desta correção: 273 testes passados (33 específicos de Estatísticas), TypeScript sem erros, exportação iOS concluída em /private/tmp/meepleboard-overlay-ios. Node 22.14.0. Nenhuma alteração ao backend, migrações ou bases. Confirmação visual nativa continua pendente; comparador ajustado ao início vertical aproximado de 7,32% nas capturas atuais, aguardando os ficheiros locais.


## Ajuste limitado: distribuição dos filtros e desconhecidos em coluna

Mantida a versão aprovada como base e as folhas inferiores. O período anual reserva 84 pt (uma linha, sem reduzir fonte); as opções dividem igualmente o restante espaço com flexBasis 0/flexGrow 1, padding horizontal 6 e gap interno 4. A linha tem gap 6. Num conteúdo de 370 pt ficam 137 pt para cada opção padrão. Abaixo de 390 pt de ecrã ou fontScale >1,1, período usa linha própria; abaixo de 360 ou fontScale >1,25, todos os seletores usam largura total. Não limitar linhas dos nomes de jogo/modo.

Desconhecidos: coluna de largura total, gap 0, cada acesso >=44 pt. “N sem resultado conhecido”; “Destes, N antigos por confirmar”, explicitando o subconjunto. Amostra sob taxa e rotas mantidas; o resto da composição não foi alterado.

Comparação com A a largura normalizada: referência do Resumo usa x38…328 (~290 px) e capturas anteriores x38…904 (~866 px), normalizados a 370. A referência tem controlos desenhados mais baixos que 44 pt; a app reserva alvos reais, podendo aumentar altura. A tem duração disponível numa única linha, a captura tem ausência e cobertura em duas linhas. A tem um acesso para desconhecidos; a app conserva também a linha dos antigos por confirmar. A ilustra três jogos com capas; dados de teste mostram um jogo com placeholder. Voltar permanece no cabeçalho da app. Estas diferenças são de conteúdo/acessibilidade; não concluir que os cartões devem ocupar alturas idênticas.

Nesta última mensagem não veio um anexo novo. A última captura do chat antecede as folhas inferiores e mostra o ano dividido; não tratá-la como renderização da revisão atual. Comparação lado a lado no HTML ainda depende dos ficheiros locais, que não estão disponíveis neste ambiente. Confirmação visual pendente. Verificado TypeScript e 33 testes específicos de Estatísticas com Node 22.14.0.


Revisão conjunta do Resumo: ver `estatisticas-proporcoes-resumo-a.md` para recortes normalizados, medidas antes/depois pretendidas, correção do recorte que cortava o logótipo e diferenças intencionais. Aplicada como conjunto, preservando 44 pt, scaling, informação e folhas. 273 testes e exportação iOS passaram; confirmação visual pendente.


Direção revista a pedido do utilizador: reprodução da A, sem objetivos de cartões ampliados. Antigos/cobertura extensa recolhidos por defeito; taxa/amostra na linha compacta da A; filtros com pintura 36 e alvo 44; logo proporcional 94×62. `estatisticas-proporcoes-resumo-a.md` foi reescrito e substitui os objetivos anteriores. As entradas históricas acima não descrevem a composição atual. Comparação preenchida de captura nativa ainda pendente dos ficheiros.


## Verificação do bundle e reinício do Expo — 9 de outubro

O utilizador fez Reload mas via composição anterior. Confirmado processo Metro 45105 na8082 com raiz MeepleBoardApp e manifesto iOS apontando a 192.168.1.224:8082, routerRoot=src/app e lazy=true. O entry bundle não contém todos os ecrãs devido ao carregamento por módulos; verificar o módulo StatisticsScreen, não concluir que marcadores ausentes no entry provam cache antiga. O módulo servido continha shortGames/resultDetails/FilterTrigger/setDurationDetails. Não foi confirmada a causa exata do código antigo visível no dispositivo.

Parado apenas o processo Metro identificado, iniciado de novo com scripts/start-device-test-expo.sh 192.168.1.224, Node22.14.0/npm10.9.2, cache limpa, DeviceTests guard verificado. Novo processo62308 porta8082. Log acessível /private/tmp/meepleboard-expo-8082.log. API/SQL não reiniciados nem alterados. Módulo após reinício contém todos os marcadores; SHA256 dc583007d731133e3552a61956d4471e0770825ec168335375f1d1b67621d2b4 corresponde apenas ao pedido diagnóstico JS modulesOnly sem bytecode, não ao hash do entry HBC recebido no iPhone.

Inspector detetou iPhone mas ligações foram intermitentes; corrigida origem explícita http://127.0.0.1:8082 no WebSocket (handshake anterior401). Reabrir exp://192.168.1.224:8082 para verificar código efetivamente carregado. Não declarar confirmação visual ou fontScale sem resposta do dispositivo.


Correção do diagnóstico: após o utilizador reabrir o projeto, o log do novo Metro confirma bundle entry2190 módulos, arranque ExpoGo e API local5099. A leitura efetiva [Statistics layout] foi width402/height874/scale3/fontScale1. Não há evidência no log de falha na entrega. A hipótese de cache foi sobrevalorizada; não classificar as capturas como antigas apenas pela diferença visual. A comparação de fidelidade deve continuar com render real, mantendo aprovação visual pendente. Leitura pontual do inspector/captura falhou porque o dispositivo não estava disponível nesse momento.
