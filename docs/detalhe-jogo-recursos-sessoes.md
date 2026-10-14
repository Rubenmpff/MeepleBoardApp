# Detalhe do jogo, recursos e fim automático das sessões

Ramo `feat/game-resources-session-autoclose` (app e API), a partir de `checkpoint/pre-resources-autoclose`. Feito e verificado apenas em DeviceTests. Regras da API em `MeepleBoardApi/docs/recursos-jogos.md` e `MeepleBoardApi/docs/sessoes-encerramento-automatico.md`.

## Página do jogo

Revisão de 2026-10-14 (ponto de recuperação `checkpoint/pre-game-page-v2`).

- **Topo compacto:** capa 72 pt, nome, ficha numa linha (tipo, ano, jogadores, peso, Solo/Cooperativo), «Ficha do BoardGameGeek» com ligação à página original. «Registar partida» e a biblioteca lado a lado («Biblioteca», ou o estado atual com ▾ para gerir; o rótulo acessível diz sempre «Adicionar à biblioteca» / «Gerir na biblioteca: …»). Com texto grande ficam em coluna e com o rótulo completo.
- **Sobre:**
  - «Avaliações»: BoardGameGeek e MeepleBoard lado a lado, cada um com a escala «/10»; o BGG mostra o número de avaliações e a posição quando existem. Sem nenhuma das duas, uma só frase; sem uma delas, «Sem avaliações» nesse lado. Cálculos inalterados.
  - «A tua avaliação», à parte: a média das avaliações que deste às tuas partidas, com o número de partidas avaliadas, e acesso ao diário (a partida por avaliar mais recente, ou o diário da última). Não existe avaliação direta do jogo e a página não sugere que exista.
  - «Amigos que têm este jogo»: avatar (foto quando existe), nome e acesso ao perfil; quatro e «Ver todos (n)». Só amigos aceites com «Tenho» e biblioteca visível (regras na API: `GET /game/{id}/friend-owners`).
  - Descrição (com a origem BGG), as tuas partidas e campanhas, como antes.
- **Como jogar / Recursos:** jogo base primeiro e cada expansão num grupo próprio (campo `expansion`); dentro, só os tipos e categorias 3D com conteúdo. Nada na área: um único estado vazio com «Sugerir recurso». Nada no idioma escolhido: um aviso com os idiomas alternativos; com conteúdo mas mais noutro idioma: uma linha «Também em …».
- **Cartões de recurso:** miniatura real (a do YouTube para vídeos; a pré-visualização do site original quando registada em `thumbnailUrl`), ou um ícone neutro por tipo; título em destaque; autor e plataforma, depois «Da editora · idioma · preço» e a compatibilidade como informação secundária. Tocar abre a página original; «…» abre um menu com «Abrir em …» e «Reportar problema» (o relato continua na mesma folha, com «Voltar»).
- **Explicações secundárias** em texto pequeno: idioma («não muda o idioma da app») e a nota sobre links externos.
- **Idioma dos recursos:** começa no idioma da app, guarda-se à parte (`resource_language`) e não muda a língua da app.
- «Sugerir recurso» (fica pendente) aceita expansão e imagem https opcionais; administradores veem «Gerir recursos».
- Código: `src/features/games/catalog/components/GameRatings.tsx`, `FriendOwners.tsx`; `src/features/games/resources/` (`ResourceRow`, `ResourceActionsSheet`, `ResourceArea`, formulário e gestão).

## Sessões

- Início sempre à hora marcada; aceitar um convite, mesmo tarde, não o muda (decisão de 2026-10-14). O detalhe mostra «Início» e «Fim» em hora local desde a criação, também sem convidados confirmados: «Começa …, à hora marcada» / «Começou …», «Termina automaticamente …, 24 horas depois», «Termina …, hora escolhida pelo organizador» ou «Terminou automaticamente …». Sem convidado confirmado: «Só decorre com pelo menos um convidado confirmado. Sem confirmações até …, é cancelada.»
- O organizador de uma sessão a decorrer tem «Prolongar»: mais 1/3/6 horas, até ao limite (48 h desde a hora marcada) ou outra hora; escolhas acima do limite não aparecem nem são enviadas.
- «Encerrada» passa a «Terminada» (estado, filtro e ação «Terminar sessão», sempre com confirmação).

## Verificação

- App: TypeScript sem erros; 317 testes (`node --test tests/*.test.cjs`), incluindo `game-resources.test.cjs` (página do jogo, avaliações, amigos, recursos) e `session-end-time.test.cjs`.
- API: `Sessions.Tests` 13, `GameResources.Tests` 10, `Library.Tests` 16 (inclui amigos com o jogo), Authorization 59+1, PlayerScores 72.
- SQL real (DeviceTests): `verify-session-auto-close.cjs`, `verify-game-resources.cjs` (todos os jogos; expansões e miniaturas) e `verify-game-friends.cjs` (quem aparece e quem não pode aparecer).
- WebKit: cenários `pagina-jogo` e `pagina-jogo-en` (`--account participante`), `recursos-admin` (`--account admin`) e `sessoes-fim`. Avaliações BGG preenchidas só nos testes isolados, com dados de teste identificados: o DeviceTests não copia dados do BGG.

## Por confirmar no iPhone

1. **Wingspan → Sobre** (conta `participante`): topo compacto com as duas ações; avaliações sem dados numa frase; «A tua avaliação» à parte; «Amigos que têm este jogo» com 4 + «Ver todos (5)», o nome longo sem cortes, e o perfil abre ao tocar. Não aparecem: amigo com biblioteca privada, «Quero jogar», «Já joguei», pedido pendente, não amigo.
2. **Meeple Teste Solo → Sobre:** MeepleBoard e a tua avaliação preenchidas, «Ver o diário da partida de …» abre o diário; amigos vazio numa linha.
3. **Como jogar:** Português mostra o aviso e «Ver em Inglês (4)»; em Inglês, jogo base primeiro e as expansões European e Oceania em grupos; miniaturas do YouTube; abrir um vídeo e voltar à app.
4. **Recursos:** miniaturas da Printables; «…» → «Reportar problema» → motivo → Enviar; repetir dá a mensagem de que já foi reportado. Num jogo sem recursos, um único estado vazio. Texto grande e EN sem cortes.
5. **Sugerir recurso** com a conta `autor`: aparece em «Pendentes» na conta `admin`; aprovar e confirmar que fica público; rejeitar outra e confirmar que não aparece.
6. **Idioma dos recursos:** mudar para «Todos», fechar a app e voltar: a escolha mantém-se e a app continua no mesmo idioma.
7. **Sessões:** «Sessão de teste · fim automático» (conta `autor`) mostra início e fim; «Prolongar» com o seletor nativo de data e hora; a conta `participante` vê a mesma hora sem «Prolongar».
8. **Terminadas:** sessões antigas aparecem em Jogar → Sessões → Terminadas com partidas e participantes; «Registar partida» deixa de estar disponível nelas.
9. Para registar partidas numa sessão ativa no roteiro anterior, criar uma sessão nova (as antigas terminaram automaticamente).
