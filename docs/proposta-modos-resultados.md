# Proposta — modos, resultados e vencedores

Estado: proposta para discussão, **sem alterações de contrato, resultados, histórico ou estatísticas implementadas**. Só foram ajustadas estrelas/visualização de avaliação zero nesta etapa. Dados fictícios em DeviceTests; base habitual intacta.

## Causas confirmadas

- `RegisterMatchForm` distingue multiplayer/solo/cooperative; `mapMatchFormToRequest` envia `gameMode`, mas `CreateMatchDto` e a entidade Match só guardam `IsSoloGame` e `WinnerId`. A capacidade cooperativa do catálogo não identifica o modo efetivamente jogado.
- O mapper elimina `winnerId` em Solo, mesmo quando o formulário escolheu vitória do jogador. Solo não distingue derrota, empate ou resultado não definido no registo persistido.
- Em cooperativo, o formulário marca todos os jogadores quando a equipa vence, mas o mapper escolhe o primeiro `isWinner` como vencedor individual. Sem vitória, a API exige um vencedor por ser um pedido não Solo. Não se guarda um resultado da equipa.
- Empate não tem representação explícita. No histórico com amigos, `FriendshipRepository` usa `Game.IsCooperative` e os dois `IsWinner`: se nenhum deles vence, classifica empate competitivo ou derrota da equipa. Isso pode ser resultado desconhecido ou uma vitória de uma terceira pessoa. A seleção manual e pontuação não resolvem esta ambiguidade.
- `UserService` conta WinnerId, `MatchPlayerRepository` conta IsWinner; as taxas atuais usam todas as partidas como denominador. Estes critérios precisam de alinhamento, sem corrigir a história por inferência.

## Regras propostas

| Modo | Participantes | Resultado escolhido explicitamente | Vencedores |
|---|---|---|---|
| Competitivo | ≥2 distintos | Vitória, Empate ou Resultado não definido | Vitória: selecionar um jogador. Empate: identificar ≥2 jogadores empatados; não lhes atribuir vitórias. |
| Solo | Exatamente 1; só no registo rápido | Vitória, Derrota, Empate ou Resultado não definido | Vitória: o único jogador; derrota: o jogo venceu, sem inventar um utilizador para o jogo. |
| Cooperativo | ≥2 distintos; com 1 pessoa usar Solo | Equipa venceu, Equipa perdeu, Empate ou Resultado não definido | Vitória: todos os membros da equipa; não escolher arbitrariamente um vencedor individual. |

O modo nunca muda pela contagem. Empate em Solo/cooperativo é uma escolha explícita quando as regras do jogo o admitem, nunca uma consequência de pontuações iguais. No competitivo, um empate parcial exige confirmar os resultados dos restantes participantes na revisão; não marcar automaticamente como derrota alguém cujo resultado não foi confirmado. Vitória partilhada competitiva, equipas adversárias e semi-cooperativo ficam fora desta primeira versão e precisam de uma decisão própria.

Com pontuação, conservar a exigência de um inteiro com sinal por jogador; sem pontuação, omitir os valores e manter o rascunho. Pontuação não decide vencedores. Avaliação própria obrigatória 0–10/0,5 continua separada de resultado/pontuação. Datas, privacidade, rascunhos, saída protegida e repetição de fotografias mantêm-se.

## Contrato proposto

Guardar **modo efetivamente jogado** e **tipo de resultado** explícitos, mais resultado de cada participante (`Vitória`, `Derrota`, `Empate`, `Não definido`) e, no cooperativo, resultado da equipa. IDs de vencedores vêm dessas escolhas explícitas, nunca dos scores. API valida coerência: vitória competitiva com um vencedor indicado; empate com pelo menos dois participantes indicados; Solo com um jogador; equipa com resultado comum; resultado desconhecido sem vencedores inventados. Na revisão, mostrar resultado por pessoa antes de guardar.

Introduzir campos nullable para compatibilidade histórica e distinguir uma escolha nova «Resultado não definido» de registo antigo sem informação. `WinnerId` mantém-se apenas como compatibilidade para um vencedor individual, sem selecionar o primeiro membro da equipa. Novo `winnerIds`/resultados individuais representa os vencedores reais; atualizar todos os leitores e estatísticas antes de ativar novas escritas. Validar e preservar combinações antigas sem bloqueá-las na leitura. Não implementar nesta etapa.

## Histórico e estatísticas

- Conservar os campos originais. `IsSoloGame=false` não prova competitivo; `Game.IsCooperative` não prova que a partida foi cooperativa. Uma antiga marca Solo com vários jogadores permanece legada/inconsistente até revisão autorizada.
- Mostrar nomes de vencedores existentes como «vencedor registado», quando o ID é válido, sem transformar isso num resultado completo ou num modo certo. ID existente com nome oculto/em falta: «Nome do vencedor indisponível». Ausência nova explicitamente escolhida: «Resultado não definido»; ausência/contradição legada: «Resultado antigo sem informação suficiente».
- Não gerar derrotas/empates por falta de vencedor; não deduzir resultados a partir de pontuações ou capacidades do catálogo. Não recuperar meios pontos que já tenham sido arredondados no passado.
- Resultados legados ambíguos aparecem no histórico e nos totais de atividade, numa categoria «Modo/resultado por confirmar». Se necessário mostrar contagem de vencedores antigos declarados, rotulá-la separadamente, sem a misturar com resultados confirmados. Uma revisão futura só pelo autor autorizado poderá completar dados; autoria desconhecida não será atribuída a um participante por suposição.
- Por pessoa/jogo/modo: partidas, vitórias, derrotas, empates e resultado desconhecido. **Taxa de vitória = vitórias / (vitórias + derrotas + empates)** entre resultados conhecidos dessa pessoa. Empate conta no denominador, não como meia vitória. Se não há resultados conhecidos, mostrar «Sem dados», não 0%.
- Mostrar, por exemplo, «3 vitórias · 60% em 5 partidas com resultado conhecido; 2 por definir», com proveniência/cobertura visíveis. Competitivo, Solo e cooperativo têm filtros separados; no cooperativo usar «sucesso da equipa». Uma vitória da equipa dá uma vitória por participante, mas a partida conta só uma vez.
- «Mais vitórias» usa número absoluto; «maior taxa» usa percentagem com n de resultados conhecidos. Propor mínimo de 5 partidas conhecidas para um destaque de taxa, com aviso explícito de amostra reduzida nos restantes. Empates nos rankings são apresentados como empates, sem inventar um único líder.
- Duração ausente não é zero: somar só valores conhecidos e indicar cobertura. Recordes exigem guardar o sentido da pontuação por jogo/modo/variante (`maior`, `menor`, `não definido`), sem assumir maior=melhor. Sem esse sentido, mostrar mínimo/máximo registados, sem chamar «melhor».

## Apresentação no formulário

Mantém-se Jogo → Jogadores → Resultado → Rever. Modo visível junto da capa/nome. Em Resultado, opções compactas com texto: «Vitória», «Empate», «Não definido»; Solo e cooperativo têm também «Derrota». Vitória competitiva usa a lista compacta atual para escolher o vencedor; empate permite selecionar os envolvidos; cooperativo mostra «Resultado da equipa» e os nomes abrangidos. Pontuação e avaliação própria aparecem separadamente. Rever mostra resultado por participante e ligações para corrigir cada secção; a confirmação usa o resultado disponível sem inventar vencedor.

## Verificação da etapa atual

Estrelas com preenchimento amarelo-dourado e contorno contrastante; vazias com contorno cinzento e sem preenchimento, incluindo meios pontos. Mesma paleta no formulário e diário. Corrigida a indicação «toca para avaliar» em valores zero: o diário mostra 0,0/10, ausência continua ausente.

Node 22.14.0; TypeScript e testes relevantes aprovados. Nova verificação HTTP no ambiente marcado DeviceTests criou uma única partida fictícia com avaliação 0 e pontuações -17/0; duas novas leituras do diário preservaram 0, sem criar avaliação para o segundo jogador. A confirmação física de zero e do novo dourado no iPhone continua pendente. Não se aplicaram migrações nem alterações backend funcionais nesta etapa.
