# Detalhe do jogo, recursos e fim automático das sessões

Ramo `feat/game-resources-session-autoclose` (app e API), a partir de `checkpoint/pre-resources-autoclose`. Feito e verificado apenas em DeviceTests. Regras da API em `MeepleBoardApi/docs/recursos-jogos.md` e `MeepleBoardApi/docs/sessoes-encerramento-automatico.md`.

## Página do jogo

- Sempre à mão: capa, ficha (tipo, ano, jogadores, peso), «Ficha do BoardGameGeek» com ligação à página original, «Registar partida» e o estado na biblioteca («Adicionar à biblioteca» ou «Na tua biblioteca · …» para gerir).
- **Sobre:** «Avaliação BGG» (com número de avaliações, posição e origem BoardGameGeek), «Avaliação MeepleBoard» (média dos jogadores na app) e «A tua avaliação», todas de 0 a 10 e com estado claro quando não existem; descrição com a origem («Texto original do BoardGameGeek, sem tradução.»); as tuas partidas e campanhas, como antes.
- **Como jogar:** regras oficiais, vídeos de explicação, partidas completas.
- **Recursos:** modelos 3D por categoria (organizadores e inserts, acessórios, peças de substituição, melhorias decorativas), unboxings e materiais adicionais. Gratuito/pago só quando confirmado.
- **Idioma dos recursos:** começa no idioma da app, guarda-se à parte (`resource_language`) e não muda a língua da app. Mostra o idioma do utilizador, os idiomas com recursos e «Todos». Sem nada no idioma escolhido, um aviso único oferece os idiomas com mais recursos e «Ver todos os idiomas»; num grupo vazio, uma linha leva ao idioma alternativo.
- Cada recurso abre a página original; a bandeira «Reportar problema» envia o motivo aos administradores. «Sugerir recurso» abre o formulário (fica pendente). Administradores veem «Gerir recursos».
- Código: `src/features/games/resources/` (tipos, serviço, hooks, componentes, ecrãs de formulário e gestão); rotas `/games/resources/form` e `/games/resources/admin`.

## Sessões

- O detalhe mostra «Fim da sessão» em hora local: «Termina automaticamente …», «Termina …, hora escolhida pelo organizador», «Terminou automaticamente …» ou «Termina 24 horas depois de começar».
- O organizador de uma sessão a decorrer tem «Prolongar»: mais 1/3/6 horas, até ao limite (48 h desde o início) ou outra hora; escolhas acima do limite não aparecem nem são enviadas.
- «Encerrada» passa a «Terminada» (estado, filtro e ação «Terminar sessão», sempre com confirmação).

## Verificação

- App: TypeScript sem erros; 313 testes (`node --test tests/*.test.cjs`), incluindo `game-resources.test.cjs` e `session-end-time.test.cjs`.
- API: `Sessions.Tests` 13, `GameResources.Tests` 9, e os projetos existentes (Authorization 59+1, PlayerScores 72, Library 15) sem alterações.
- SQL real (DeviceTests): `verify-session-auto-close.cjs` e `verify-game-resources.cjs`, ambos também com `--recheck` depois de reiniciar a API.
- WebKit: cenários `recursos`, `recursos-admin` (`--account admin`) e `sessoes-fim` em `tools/visual-preview/scenarios/`.

## Por confirmar no iPhone

1. **Wingspan → Sobre:** três avaliações distintas; «Ficha do BoardGameGeek» abre o site; texto grande sem cortes.
2. **Como jogar:** idioma Português mostra o aviso e «Ver em Inglês (4)»; em Inglês, abrir um vídeo (YouTube) e voltar à app no mesmo separador.
3. **Recursos:** abrir um modelo da Printables; «Reportar problema» → motivo → Enviar; repetir dá a mensagem de que já foi reportado.
4. **Sugerir recurso** com a conta `autor`: aparece em «Pendentes» na conta `admin`; aprovar e confirmar que fica público; rejeitar outra e confirmar que não aparece.
5. **Idioma dos recursos:** mudar para «Todos», fechar a app e voltar: a escolha mantém-se e a app continua no mesmo idioma.
6. **Sessões:** «Sessão de teste · fim automático» (conta `autor`) mostra o fim; «Prolongar» com o seletor nativo de data e hora; a conta `participante` vê a mesma hora sem «Prolongar».
7. **Terminadas:** sessões antigas aparecem em Jogar → Sessões → Terminadas com partidas e participantes; «Registar partida» deixa de estar disponível nelas.
8. Para registar partidas numa sessão ativa no roteiro anterior, criar uma sessão nova (as antigas terminaram automaticamente).
