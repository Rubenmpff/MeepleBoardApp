# Avaliações, diário e experiências — implementação (DeviceTests)

Implementa a proposta aprovada em [mockups/app/diario/proposta.html](mockups/app/diario/proposta.html). API: commits `25e2775` e `4f984dd` (ver `MeepleBoardApi/docs/avaliacoes-experiencias.md`).

## Regras

- **Uma avaliação por experiência, fechada.** No diário, a avaliação pode ser ajustada até «Confirmar avaliação»; depois fica «Fechada» e o servidor recusa alterações (409). Uma nova avaliação só com outra partida.
- **Nota pessoal** visível apenas para o autor. Etiquetas e fotografias continuam visíveis para os jogadores da partida.
- **Média pessoal**: todas as avaliações próprias, incluindo partidas não oficiais.
- **Média MeepleBoard**: só partidas oficiais, de autores que continuam na partida. Aparece desde a primeira contribuição, com número de avaliações e de jogadores; abaixo de 5 avaliações mostra «Poucas avaliações».
- **Ranking de jogos**: pelo menos 5 avaliações de 3 jogadores distintos, em partidas oficiais. Médias iguais partilham a posição; o número de avaliações e o nome só ordenam a apresentação.
- **Recalcular**: criar, apagar ou mudar o jogo de uma partida; guardar avaliação; adicionar ou remover jogador; apagar conta.
- **Publicar** (opcional): a avaliação com o nome e o comentário (até 500 caracteres) são escolhas independentes. Retirar ou apagar nunca altera a avaliação nem a sua contribuição para a média.
- **Público**: nome do autor, avaliação e/ou comentário publicados, modo, número de jogadores e mês. Nunca a partida, os outros participantes, o local nem as notas.
- **Denúncias**: motivo obrigatório; três pessoas distintas ocultam o comentário até revisão. Administradores mantêm, ocultam ou repõem em Perfil → Moderação.

## Ecrãs

- Diário da partida (`/games/matches/[id]/journal`): avaliação, nota pessoal, secção com os participantes, estado «Fechada».
- Publicar experiência (`/games/matches/[id]/publish`), com pré-visualização igual ao que os outros veem.
- Detalhe do jogo: mosaico MeepleBoard (média, contagens, «Como se calcula») e secção «Experiências da comunidade»; lista completa em `/games/experiences/[id]`.
- Rankings: nota de critério e posição partilhada.
- Moderação de experiências (`/games/experiences/moderation`, só administradores).

## Verificação

- 349 testes da app (`tests/ratings-experiences.test.cjs` novo), TypeScript sem erros.
- API: Experiences.Tests e restantes suites; `tools/DeviceTestApi/verify-ratings-experiences.cjs` 10/10 em DeviceTests (permissões, zero avaliações, avaliação fechada, publicação e retirada, moderação, médias e ranking).
- Dados existentes preservados; o primeiro recálculo corrigiu 4 médias desatualizadas (por exemplo, Meeple Teste Solo 6,5 → 5,8, porque apagar uma partida não recalculava).
- Capturas: cenários `avaliacoes`, `avaliacoes-amigo` e `moderacao` em `tools/visual-preview/scenarios`.

Pendente: validação no iPhone. Rankings de jogadores ficam no plano futuro ([proximas-etapas-produto.md](proximas-etapas-produto.md) §5).
