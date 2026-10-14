# Detalhe do jogo, recursos e fim automático das sessões

Ramo `feat/game-resources-session-autoclose` (app e API), a partir de `checkpoint/pre-resources-autoclose`. Feito e verificado apenas em DeviceTests. Regras da API em `MeepleBoardApi/docs/recursos-jogos.md` e `MeepleBoardApi/docs/sessoes-encerramento-automatico.md`.

## Página do jogo

Revisão de 2026-10-14 segundo a proposta aprovada (`docs/mockups/app/jogo/proposta.html`; ponto de recuperação `checkpoint/pre-game-page-v3`).

- **Topo:** capa com as proporções originais sobre a faixa lavanda (sem capa, um ícone neutro), nome, «ano · Jogo base/Expansão · Cooperativo · Solo». Avaliações BGG e MeepleBoard lado a lado, cada uma com «/10»; o BGG mostra o número de avaliações e a posição e abre a página original. Sem nenhuma, «Ainda sem avaliações»; sem uma delas, «Sem avaliações» nesse lado. Cálculos inalterados.
- **Ficha:** jogadores, duração, idade e complexidade, só os que existem (sem traços). Duração, idade e complexidade vêm da importação BGG (`minPlayTime`, `maxPlayTime`, `minAge`, `averageWeight`; 0 no BGG = sem dado); com algum deles, a linha «Ficha do BoardGameGeek» identifica a origem e abre a página original. Mínimo = máximo mostra um só valor.
- **Ações:** «Registar partida» e a biblioteca lado a lado (em coluna com texto grande); por baixo, a linha «Combinar sessão» (toda a largura, 44 pt), que abre a criação de sessão com este jogo previsto.
- **Separadores** «Sobre», «Como jogar», «Recursos». Ao descer, passada a capa aparece uma barra com o nome e «Voltar»; passados os separadores, a barra mostra-os também.
- **Sobre**, por esta ordem:
  - Descrição (4 linhas, «Ler mais»), «Texto original do BoardGameGeek, sem tradução» e «Ficha no BoardGameGeek». Sem descrição, a secção não aparece.
  - «A tua experiência»: partidas, vitórias (o teu resultado em cada partida) e a última; «A tua avaliação» = média das avaliações que deste às tuas partidas, com «Diário» (a partida por avaliar mais recente ou o diário da última); «n partidas por avaliar» em dourado; as duas últimas partidas e «Ver as n partidas»; «Companhia neste jogo»; campanhas e «Nova campanha». Sem partidas: uma linha e «Nova campanha».
  - «Amigos que têm este jogo»: avatar, nome e perfil; até quatro, ou três e «+n», com «Ver todos (n)» a abrir a lista completa numa folha. Só amigos aceites com «Tenho» e biblioteca visível (regras na API). Sem resultados visíveis: «Sem amigos com este jogo visível na biblioteca.» (não afirma que nenhum amigo o tem).
  - «Expansões» do catálogo, com o teu estado na biblioteca («Tenho», «Quero», «Jogados») e «Tens n de m»; cada uma abre a sua página. Sem expansões no catálogo, a secção não aparece.
- **Companhia neste jogo:** abre Companhia com o filtro do jogo e um período personalizado da tua 1.ª partida desse jogo até hoje, visível no seletor. As estatísticas aceitam no máximo 3660 dias: com uma 1.ª partida mais antiga, a página diz «Últimos 10 anos de …» e Companhia mostra um aviso com a data da 1.ª partida e a data a partir da qual conta. Sem partidas, a linha não aparece.
- **Como jogar / Recursos:** um botão de idioma (folha com os idiomas e «Todos»; «Escolher aqui não muda o idioma da app»). Jogo base primeiro e cada expansão num grupo; só os tipos com conteúdo. O primeiro vídeo do jogo base aparece grande com a imagem real; os outros e os das expansões em linhas com miniatura; os modelos 3D numa grelha de dois (um com texto grande) por categoria. O que não existe em nenhum idioma fica numa linha («Ainda sem partidas completas.»); o que existe noutro idioma tem «Também em …». «Sugerir recurso» em linha tracejada; «Gerir recursos» só para administradores. «…» em cada recurso: «Abrir em …» e «Reportar problema».
- Código: `src/features/games/catalog/components/` (`GameHero` com `GameFacts`, `GameExperience`, `FriendOwners`, `GameExpansions`) e `src/features/games/resources/components/` (`ResourceArea`, `ResourceCard`, `ResourceRow`, `ResourceActionsSheet`). `GameRatings.tsx` foi substituído (topo e «A tua experiência»).

## Sessões

- Início sempre à hora marcada; aceitar um convite, mesmo tarde, não o muda (decisão de 2026-10-14). O detalhe mostra «Início» e «Fim» em hora local desde a criação, também sem convidados confirmados: «Começa …, à hora marcada» / «Começou …», «Termina automaticamente …, 24 horas depois», «Termina …, hora escolhida pelo organizador» ou «Terminou automaticamente …». Sem convidado confirmado: «Só decorre com pelo menos um convidado confirmado. Sem confirmações até …, é cancelada.»
- O organizador de uma sessão a decorrer tem «Prolongar»: mais 1/3/6 horas, até ao limite (48 h desde a hora marcada) ou outra hora; escolhas acima do limite não aparecem nem são enviadas.
- «Encerrada» passa a «Terminada» (estado, filtro e ação «Terminar sessão», sempre com confirmação).
- **Jogo previsto** (opcional): «Combinar sessão» na página do jogo abre «Criar Sessão» com o jogo preenchido («Escolhido na página do jogo») e «Alterar»; a escolha oferece «Sem jogo definido», os jogos da biblioteca e a pesquisa no catálogo. A partir de Sessões começa sem jogo («Escolher jogo») e pode ser criada assim. Os cartões das sessões mostram «Jogo previsto: …» ou «Por definir».
- No detalhe: «Jogo previsto» com «Podem registar partidas de qualquer jogo.»; só o organizador vê «Alterar»/«Escolher jogo», enquanto a sessão está agendada ou a decorrer. Alterar não muda partidas anteriores, o prazo nem as horas (`PUT /session/{id}/planned-game`).
- «Registar partida nesta sessão» abre com o jogo previsto escolhido; «Mudar» escolhe outro e a partida fica sempre na sessão.

## Verificação

- App: TypeScript sem erros; 321 testes (`node --test tests/*.test.cjs`), incluindo `game-resources.test.cjs` (topo, ficha e origem BGG, experiência e diário, Companhia e limite de 10 anos, amigos, expansões, recursos) e `sessions-campaigns-design.test.cjs` (jogo previsto na criação, escolha, detalhe e registo).
- API: `Sessions.Tests` 16, `GameResources.Tests` 11 (inclui a ficha BGG), `Library.Tests` 16, Authorization 59+1, PlayerScores 72.
- SQL real (DeviceTests): `verify-game-page.cjs` (ficha, expansões e jogo previsto: criar, alterar, retirar, recusas), `verify-game-resources.cjs`, `verify-game-friends.cjs`, `verify-session-auto-close.cjs`.
- WebKit: `pagina-jogo` (19 ecrãs), `pagina-jogo-en` (7) e `sessao-jogo-previsto` (7), `--account participante`. O Wingspan do DeviceTests não tem capa, descrição nem avaliações BGG (não são copiadas); tem a duração e a idade das capturas do BGG de 14/10/2026 e não tem complexidade, o que mostra também a ficha incompleta.

## Por confirmar no iPhone

1. **Wingspan → topo** (conta `participante`): ícone em vez de capa, «Ainda sem avaliações», ficha com 1–5, 40–70 e 10+ e «Ficha do BoardGameGeek» a abrir o BGG; «Registar partida», «Biblioteca» e «Combinar sessão».
2. **Descer:** passada a capa aparece a barra com o nome; passados os separadores, a barra mostra-os e trocar de área funciona sem saltos estranhos.
3. **Sobre:** «A tua experiência» vazia numa linha com «Nova campanha»; amigos com três avatares, «+2» e «Ver todos (5)» a abrir a lista completa; o perfil abre ao tocar; «Expansões» com «Tens 1 de 2» e «Tenho» na European; tocar abre a página da expansão.
4. **Meeple Teste Solo:** MeepleBoard 5,8; «A tua experiência» com 1 partida, 1 vitória, a tua avaliação 7,5 e «Diário»; «Companhia neste jogo» abre Companhia com Meeple Teste Solo e o período desde a 1.ª partida.
5. **Combinar sessão** a partir do Wingspan: «Jogo previsto (opcional)» preenchido; «Alterar» → «Sem jogo definido», biblioteca e pesquisa; criar a sessão e confirmar «Jogo previsto: Wingspan» na lista e no detalhe; «Alterar» no detalhe muda só o jogo.
6. **Convidado** (conta `autor`): vê o jogo previsto, sem «Alterar». Numa sessão a decorrer, «Registar partida nesta sessão» começa com o jogo previsto e permite mudar.
7. **Como jogar:** botão de idioma → Inglês; vídeo principal grande; expansões em grupos; «Ainda sem partidas completas.»
8. **Recursos:** grelha de modelos 3D com imagens; «…» → «Reportar problema».
9. **Texto grande e EN:** sem cortes; ações e avaliações em coluna, ficha 2 × 2.
