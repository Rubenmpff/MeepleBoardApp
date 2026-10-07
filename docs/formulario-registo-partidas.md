# Registo partilhado — inteiros com sinal e revisão

Atualização: modos e resultados explícitos implementados; ver [regras aprovadas](proposta-modos-resultados.md). As limitações de Solo/cooperativo/empate descritas nas etapas históricas abaixo foram substituídas por este contrato. Confirmação visual pendente.

Implementado em 6 de outubro de 2026, apenas validado no ambiente DeviceTests do Mac. Não foram alteradas credenciais, dependências ou a base habitual.

## Continuação — participantes distintos e avaliação obrigatória

Competitivo exige pelo menos **dois participantes distintos**, no formulário e na criação pela API. Com um jogador, a etapa Jogadores explica como adicionar participantes; no registo rápido oferece acesso explícito ao modo de jogo para escolher Solo. A contagem nunca muda o modo automaticamente. Dentro de sessões Solo está indisponível, incluindo o modo forçado, e a API recusa novas partidas Solo. Elegibilidade, participação obrigatória do utilizador atual e leitura dos registos antigos mantêm-se.

**A minha avaliação é obrigatória:** escala existente **0–10, em meios pontos**, incluindo zero válido. Dez estrelas compactas, botão explícito 0 e ajustes ±0,5 estão sempre visíveis no Resultado, fora dos detalhes opcionais. Sem avaliação mantém o estado ausente e impede guardar; não é zero. O valor aparece em Rever e conserva-se ao voltar entre etapas ou após falha. Cada participante avalia a própria experiência; o registo só cria a entrada do utilizador autenticado.

Corrigida perda de precisão: o diário backend tinha coluna inteira e arredondava a avaliação na criação; o ecrã de diário também arredondava ao enviar. Agora mantém-se o meio ponto em entidade, DTO, escrita e releitura. A migração `PreserveJournalHalfRatings` converte apenas a coluna nullable do diário de int para float, sem preencher valores antigos ausentes. Aplicada exclusivamente à base marcada `MeepleBoard_DeviceTests`; base habitual intacta. Ver [contrato backend](../../MeepleBoardApi/docs/avaliacao-participantes.md).

Validação: Node 22.14.0, TypeScript, 219 testes frontend, 47 testes de regras, 59 testes HTTP de autorização e auditoria de modelo, 32 cenários HTTP/SQL reais. **A validação visual no iPhone continua pendente.** Datas locais, negativos/zero, vencedor manual, rascunhos, privacidade, bloqueio de submissão repetida e repetição apenas de fotografias mantêm-se. RESULT01 (solo, cooperativo e empate) continua pendente; esta etapa só fecha estas duas regras.

Percurso: recarregar Expo 8082 e voltar a autenticar após reinício da API → sessão ativa → Registar partida. Tentar continuar com apenas o próprio utilizador; adicionar outro participante confirmado. Resultado: -17 e 0, vencedor manual; tentar Rever sem avaliação e confirmar bloqueio. Escolher 7 nas estrelas e + para 7,5; Rever, voltar e confirmar retenção. Guardar → confirmação → detalhes → voltar à sessão; reabrir o diário e confirmar 7,5 apenas na própria avaliação. Num segundo registo, verificar que 0 permite guardar e continua 0 ao reabrir. No registo rápido, verificar a escolha explícita de Solo com um jogador; nas sessões Solo deve estar indisponível.

## Correção após utilização real no iPhone — validação visual aberta

O utilizador reportou calendário quase ilegível, controlos sem texto e espaços excessivos. Esta correção tem prioridade sobre RESULT01: **não avançar para solo, cooperativo, empate ou dados reais antes da confirmação visual**.

Causas identificadas no código: o seletor iOS seguia o tema do sistema sobre uma superfície clara da aplicação; os botões de data/hora eram componentes com conteúdo flexível numa linha sem largura atribuída; o nome do participante reutilizava `flex: 1` num contentor vertical sem altura definida. A avaliação apresentava vinte áreas de toque em várias linhas, e a revisão repetia botões grandes. Os testes de renderização anteriores não calculavam layout nativo e não podiam certificar a apresentação real.

Correções:

- A data inicial da sessão usa o dia de `scheduledStartDate` convertido para o fuso do dispositivo; usa `startDate` como fallback legado. Conserva a hora local atual da partida, sem copiar a hora de início da sessão. No registo rápido começa na data/hora atuais. A inicialização só ocorre uma vez e não substitui uma alteração já confirmada no rascunho.
- Data e hora têm linhas próprias com rótulos/valores visíveis. Só Alterar data ou Alterar hora abrem o seletor. Concluir aplica a seleção e fecha; Cancelar descarta apenas a alteração pendente no diálogo. Alterar o dia conserva a hora, e alterar a hora conserva o dia. Mudar de etapa não reinicializa os valores.
- O diálogo nativo recebe tema claro/escuro, superfície, texto e cor de seleção coerentes. Tem altura limitada ao ecrã e ações Concluir/Cancelar fora da área de scroll. Ecrãs estreitos ou texto ampliado usam rodas nativas para evitar cortar o calendário.
- Cada jogador tem nome, pontuação e seleção manual do vencedor numa linha compacta. O indicador tem área de toque de 44 pontos; texto ampliado permite quebrar a linha. Mantêm-se zero, negativos, controlo ± e validação obrigatória de todos os valores quando há pontuação.
- Detalhes opcionais começam recolhidos. Na correção visual inicial a avaliação mantinha valores 0–10 e meios pontos com controlos compactos; a continuação acima repõe estrelas e torna a avaliação obrigatória. Não foi alterado o componente de estrelas usado nos restantes ecrãs. A revisão usa ligações compactas para corrigir secções. Corrigidos os nomes na seleção dos jogadores e reduzidas margens nas quatro etapas.

Verificação desta correção: Node 22.14.0/npm 10.9.2, TypeScript e **214 testes frontend** aprovados. Os novos testes cobrem UTC/meia-noite local e offsets verão/inverno em Lisboa, independência de data/hora, resposta tardia da sessão, retenção do rascunho, contraste/configuração dos dois temas e limites de layout. Bundle iOS devolveu HTTP 200 em Expo 8082; health confirma DeviceTests/MeepleBoard_DeviceTests/externalDelivery false em API 5099. Backend sem alterações nesta correção, sem novas migrações ou escritas SQL. Contentor habitual observado parado.

**A revisão visual permanece pendente até confirmação do utilizador no iPhone.** Testes e bundle aprovados não demonstram legibilidade física, disposição real ou comportamento do teclado.

Percurso curto: recarregar o Expo Go em 8082 → abrir sessão ativa → Registar partida → Resultado. Confirmar dia da sessão e rótulos, abrir Alterar data, verificar contraste em claro/escuro, Concluir e confirmar fecho; alterar a hora e mudar de etapa/regressar para verificar retenção. Introduzir -17/0 e escolher o vencedor pelo indicador, abrir/recolher detalhes e verificar teclado/texto ampliado. Rever → guardar → confirmar → detalhes → voltar à sessão e reabrir. Depois, no registo rápido, confirmar que começa no dia atual. Não é necessário reiniciar a API para esta correção frontend.

## Percurso

O mesmo `RegisterMatchForm` serve o registo rápido e o registo da sessão: **Jogo → Jogadores → Resultado → Rever**. A capa real (proporções preservadas/fallback neutro), nome e modo selecionado acompanham as etapas. O modo pode ser corrigido através do cabeçalho e é escolhido junto do jogo, sem etapa própria. Mantêm-se modos oficiais, expansões e justificação de modo não oficial.

Jogadores aparecem numa lista compacta, sem repetir etiquetas e cartões com campos. Nas sessões só são elegíveis membros com convite aceite; no registo rápido a origem são os amigos. O utilizador autenticado é incluído e não pode ser removido, com uma explicação da participação obrigatória. O comportamento dos outros consumidores de `PlayerSelector` permanece disponível pela variante antiga.

Resultado contém as opções **Sem pontuação** (predefinição) e **Com pontuação**. Nesta última, cada jogador precisa de um inteiro entre `-2147483648` e `2147483647`. Zero e negativos são valores válidos; espaços/vazio, um sinal isolado, decimais, notação hexadecimal/científica e overflow são recusados. O controlo **±** permite introduzir negativos no teclado numérico do iPhone; num campo vazio produz apenas um sinal pendente, nunca zero.

Desligar pontuação conserva os textos no rascunho, mas omite todos os valores do pedido. Voltar a ligar recupera-os. O vencedor competitivo é sempre selecionado manualmente, com pelo menos dois participantes distintos; a maior ou menor pontuação não o decide. Alternar o modo limpa a escolha de resultado para não transportar vencedores de equipa para o competitivo; os valores dos jogadores são conservados ao passar por solo e regressar.

Data/hora local e detalhes opcionais são editados na etapa Resultado, antes da revisão. A data é enviada em UTC e conserva a tolerância existente de um minuto para o futuro. Duração preenchida exige inteiro positivo compatível com o DTO. Local, comentários, diário, avaliação, tags e fotografias continuam disponíveis numa secção expansível. Rever mostra dados, nomes/pontuações, data/duração e restantes valores preenchidos, com ações para corrigir Jogo, Jogadores, Resultado ou Detalhes. Guardar só aparece na revisão.

## Proteções

Mantêm-se rascunho em memória, confirmação de saída e bloqueio de navegação durante gravação/upload. Falha de criação conserva o rascunho. Sucesso substitui o formulário pela confirmação, bloqueando outra submissão; só a ação explícita de registar outra partida inicia um formulário vazio no registo rápido. Fotografias falhadas são repetidas apenas contra o ID guardado, sem novo POST da partida. Sessões conservam Voltar à sessão, Ver detalhes e retorno ao contexto de origem.

A API recebe `scoresEnabled`; com pontuação exige um valor não nulo por participante. Sem pontuação rejeita listas de valores. Pedidos antigos que omitem a opção e os valores continuam válidos; uma lista com valores numéricos também tem de estar completa. A leitura de partidas antigas incompletas permanece inalterada: nenhum null passa a zero. Não se alteraram filtros de privacidade ou regras de autorização.

## Limitações para a próxima correção funcional — RESULT01

- Solo conserva os controlos atuais, mas o mapper ainda omite `winnerId` com `isSoloGame=true`.
- Cooperativo conserva os controlos de equipa; modo/resultado de equipa não têm contrato persistido. O backend ainda exige vencedor não solo; a marcação de equipa pode acabar reduzida a um participante pelo mapper. Sem escolha explícita, a revisão mostra resultado não definido, sem presumir derrota.
- Empate ainda não tem representação explícita. Não inferir resultados de pontuações iguais ou incompletas.

A revisão é um rascunho; a confirmação usa o DTO real guardado. Resultado ausente e nome do vencedor indisponível continuam distintos.

## Validação

Node **22.14.0**, npm **10.9.2**; TypeScript e 200 testes frontend aprovados. Backend: 34 testes focados de serviço/contrato, 59 testes HTTP de autorização e uma auditoria offline; modelo/snapshot sem diferenças. SQL real marcado: 26 cenários HTTP/SQL, incluindo negativos/zero, limites int32, vencedor com pontuação inferior, ausência de pontuações, rejeição sem gravação e leitura antiga incompleta. Esquema conserva 23 migrações. Verificadores de detalhes da sessão e cinco cenários de fotografias locais aprovados. Bundle iOS compilado em Expo 8082.

Os adaptadores de testes verificam comportamento e configuração de scroll/teclado; não substituem uma inspeção física com texto ampliado. Validação manual deste formulário no iPhone ainda pendente.

## Primeiro percurso no iPhone

Reabrir Expo Go em `exp://192.168.1.116:8082` e voltar a iniciar sessão após o reinício da API. Abrir uma sessão ativa → Registar partida → selecionar jogo competitivo e jogadores. Em Resultado, ativar pontuação; deixar um campo vazio e confirmar que Rever é impedido. Introduzir `-17` com **±** e `0`, escolhendo como vencedor quem tem `-17`. Alternar Sem/Com pontuação e confirmar retenção. Rever, corrigir uma secção, guardar e seguir confirmação → detalhes → voltar à sessão. Reabrir e confirmar nomes, vencedor e valores. Avaliar também teclado aberto e texto ampliado neste percurso. Depois testar separadamente o registo sem pontuação e o registo rápido.
