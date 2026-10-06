# Registo partilhado — inteiros com sinal e revisão

Implementado em 6 de outubro de 2026, apenas validado no ambiente DeviceTests do Mac. Não foram alteradas credenciais, dependências ou a base habitual.

## Percurso

O mesmo `RegisterMatchForm` serve o registo rápido e o registo da sessão: **Jogo → Jogadores → Resultado → Rever**. A capa real (proporções preservadas/fallback neutro), nome e modo selecionado acompanham as etapas. O modo pode ser corrigido através do cabeçalho e é escolhido junto do jogo, sem etapa própria. Mantêm-se modos oficiais, expansões e justificação de modo não oficial.

Jogadores aparecem numa lista compacta, sem repetir etiquetas e cartões com campos. Nas sessões só são elegíveis membros com convite aceite; no registo rápido a origem são os amigos. O utilizador autenticado é incluído e não pode ser removido, com uma explicação da participação obrigatória. O comportamento dos outros consumidores de `PlayerSelector` permanece disponível pela variante antiga.

Resultado contém as opções **Sem pontuação** (predefinição) e **Com pontuação**. Nesta última, cada jogador precisa de um inteiro entre `-2147483648` e `2147483647`. Zero e negativos são valores válidos; espaços/vazio, um sinal isolado, decimais, notação hexadecimal/científica e overflow são recusados. O controlo **±** permite introduzir negativos no teclado numérico do iPhone; num campo vazio produz apenas um sinal pendente, nunca zero.

Desligar pontuação conserva os textos no rascunho, mas omite todos os valores do pedido. Voltar a ligar recupera-os. O vencedor competitivo é sempre selecionado manualmente, mesmo com um único jogador; a maior ou menor pontuação não o decide. Alternar o modo limpa a escolha de resultado para não transportar vencedores de equipa para o competitivo; os valores dos jogadores são conservados ao passar por solo e regressar.

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
