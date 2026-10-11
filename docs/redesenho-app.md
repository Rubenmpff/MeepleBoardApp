# Redesenho da app

Implementação da direção aprovada em [mockups/app/direcao/proposta.html](mockups/app/direcao/proposta.html) (capturas «antes» em `mockups/app/direcao/antes/`). Ramo `feat/app-redesign`; ponto de partida `checkpoint/pre-app-redesign`. Trabalho feito e validado apenas em DeviceTests (API 5099, Expo 8082, base `MeepleBoard_DeviceTests`). A aprovação visual final depende do iPhone.

## Decisões aprovadas e como foram aplicadas

1. **＋ na barra:** folha com Registar partida, Nova sessão, Adicionar jogo e Nova campanha. «Registar partida» continua direto e destacado no Início, na página de cada jogo (com o jogo já escolhido) e nas ações da biblioteca.
2. **Amigos dentro de Perfil:** secção com os amigos mais frequentes e «Ver todos e procurar pessoas»; a lista completa é uma subpágina de Perfil com retorno. Na criação de sessões e nos convites, os amigos continuam disponíveis dentro do próprio fluxo.
3. **Jogos:** «A minha biblioteca» e «Descobrir jogos» separados no mesmo separador. Rankings mantém área própria em Descobrir, porque passá-lo a ordenação perderia os modos Geral/Minha.
4. **Quero / Já joguei:** o servidor guarda e devolve `Wishlist` e `Played` (verificador `tools/DeviceTestApi/verify-library-statuses.cjs`, repositório da API). «Quero» foi ativado ao adicionar. «Já joguei» não foi exposto: ver L-PLAYED01 em [pendencias-funcionais.md](pendencias-funcionais.md).
5. **Ações de risco no fim:** Encerrar/Cancelar sessão, Concluir/Abandonar/Sair da campanha e Terminar sessão estão no fim da página, em texto vermelho (Concluir em verde), cada uma com a confirmação que já existia.

## Organização

- `src/ui/` — base visual partilhada: `theme.ts` (única paleta; `constants/colors`, `styles/appTheme`, `styles/clubTheme` e `features/auth/styles/authTheme` derivam dela), `components.tsx` (Section, Card, Row, Segmented, FilterChips, Avatar, EmptyState…), `Sheet.tsx`, `Screen.tsx`, `format.ts` (datas, horas e avaliações).
- `src/components/navigation/ScreenHeader.tsx` e `src/components/ui/ScreenLayout.tsx` (contexto `EmbeddedScreen` para ecrãs dentro dos separadores Jogos e Jogar).
- `src/features/navigation/` — folha ＋ e separador Jogar. `src/features/users/screens/ProfileHomeScreen.tsx` — separador Perfil.
- Cores: verde = ações/tu; lavanda = destaque; dourado suave = algo à tua espera; violeta = amigo; vermelho apenas em ações de risco.

## Por etapa

| Etapa | Âmbito |
| --- | --- |
| Base | Paleta única, cabeçalhos, barra com cinco lugares, folha ＋, Perfil |
| Jogos | Biblioteca/Descobrir, página do jogo, adicionar com estado, Rankings |
| Partidas | Passos do registo, página da partida com acesso ao diário, avaliações pendentes |
| Jogar | Lista e detalhe de sessões, criação de sessão, campanhas |
| Perfil | Amigos como subpágina, Definições em listas, Terminar sessão no fim |
| Início e entrada | Início contextual (abaixo); etiquetas dos interruptores também alternam; paleta da entrada em tokens |

## Início

Responde a «o que faço agora?», só com dados que já existem:

1. **Sessão a decorrer** (organizada por mim ou com presença confirmada): «A decorrer», início (só a hora se for hoje; com data se ficou aberta de outro dia), confirmados, partidas quando houver, local; «Registar partida aqui» liga o registo à sessão e «Abrir» vai ao detalhe. Sem sessão a decorrer, o lugar é do botão «Registar partida» (decisão 1).
2. **Por fazer** (só quando há algo): convites por responder (até três, cada um abre a sessão; mais do que isso, ligação à lista), partidas por avaliar e pedidos de amizade. Convites de sessões encerradas ou canceladas não contam, como na lista de sessões.
3. **Próximas sessões**: as minhas, de hoje em diante (as que continuam «Agendada» com data passada ficam em Jogar → Agendadas), mais próxima primeiro e sem data no fim; sem nenhuma e sem sessão a decorrer, «Combinar uma sessão».
4. **Última partida**: jogo, resultado e data. Não abre a partida porque `/matches/last` não devolve o identificador; não foi alterado o contrato.
5. **O teu ano**: partidas, jogos e vitórias do ano até à data, com «Ver estatísticas».

As ações rápidas Sessões, Biblioteca e Campanhas saíram porque repetiam Jogar, Jogos e ＋. Ao regressar ao Início (depois de registar, responder a um convite…) tudo é recarregado sem esconder o que já está no ecrã; também há puxar para atualizar.

## Partidas (Jogar → Partidas)

Todas as minhas partidas, de qualquer jogo, sessão ou campanha, num só lugar. Também se chega por Início → «Última partida» → «Ver todas as partidas».

- **Fonte:** a lista que já serve as Estatísticas (`GET /statistics/me/matches`, páginas de 25 com total); não há contrato novo. Cada linha mostra jogo, data, modo, resultado e a minha avaliação, e abre o detalhe da partida.
- **Filtros:** resultado (Todas, Vitórias, Derrotas, Empates, Sem resultado) em chips; período (todas as datas, este mês ou cada ano com partidas), jogo e modo num painel «Filtros». Os anos e os jogos vêm do resumo das Estatísticas.
- **Regresso:** o separador Jogar fica montado por baixo do detalhe, por isso a área, os filtros, as páginas carregadas e a posição mantêm-se. A área e os filtros também ficam lembrados durante a sessão da app, por conta. Ao regressar, a lista só recarrega se o total mudou (partida registada ou removida noutro lado); há puxar para atualizar.
- **Limite:** «Todas as datas» cobre os últimos 10 anos, o máximo que o contrato aceita (H-LIST01 em [pendencias-funcionais.md](pendencias-funcionais.md)). A nota «últimos 10 anos» aparece junto ao total.

## Fecho: ficheiros revistos

Cada candidato foi procurado em `src`, `tests`, `tools` e `docs` (imports, caminhos em texto, rotas do Expo Router e pendências planeadas).

| Ficheiro | Decisão | Motivo |
| --- | --- | --- |
| `dashboard/components/AppHeader`, `DashboardAction`, `PrimaryButton`, `SectionCard`; `dashboard/styles/dashboardTheme` | Removidos | Só o Início antigo os usava |
| `games/catalog/hooks/useExpansionsByBaseGame` | Removido | Sem chamadores; `ExpansionSelector` usa `gameService.getExpansionsOfBase` diretamente |
| `games/matches/types/CreateMatchRequest` | Removido | Cópia desatualizada da interface que vive em `mapMatchFormToRequest` |
| `library/components/GameCard` | Removido | Substituído pelos cartões `Collection*`; textos fixos em português |
| `utils/dateUtils` | Removido | Sem chamadores; formatação em `src/ui/format` |
| `getStatusLabel` (`sessions/types/GameSession`) | Removido | Rótulos fixos em português, substituídos por i18n |
| `friends/components/WhatCanWePlayModal` | Mantido | Funcionalidade planeada (P01 em [pendencias-funcionais.md](pendencias-funcionais.md)) |
| `users/hooks/usePlayers` e `getUsers` | Mantido, por decidir | Sem chamadores, mas `GET /users` existe na API; decidir se haverá diretório de jogadores |
| `hooks/reduxHooks` | Mantido, por decidir | Hooks tipados de Redux sem uso; o código usa `useSelector` com `RootState`. Adotar ou remover |

Também corrigido: o eixo do gráfico «Partidas por mês» passa a ter largura para três algarismos (antes «158» quebrava em duas linhas).

## Comparação com a proposta

| Proposta | Estado |
| --- | --- |
| Barra Início · Jogos · ＋ · Jogar · Perfil; «Mais» desaparece | Feito (caminhos antigos mantidos como aliases) |
| ＋ com Registar partida, Nova sessão, Adicionar jogo, Nova campanha | Feito |
| Registar partida no Início só com sessão ativa | Ajustado pela decisão 1: sempre destacado; dentro da sessão a decorrer, «Registar partida aqui» |
| Início: sessão a decorrer, Por fazer, última partida, o teu ano | Feito, com «Próximas sessões» acrescentadas; sem a data da avaliação pendente mais recente (o hook só devolve a contagem) |
| Sino com contagem no topo do Início | Dispensado nesta fase: «Por fazer» mostra convites, avaliações e pedidos |
| Jogos: um campo para coleção e catálogo | Ajustado pela decisão 3: «A minha biblioteca» e «Descobrir jogos» no mesmo separador |
| Rankings como ordenação do catálogo | Ajustado pela decisão 3: área própria em Descobrir, para manter Geral/Minha |
| Chips Tenho · Quero · Já joguei | «Quero» ativado; «Já joguei» por decidir (L-PLAYED01) |
| Jogar: sessões e campanhas | Feito |
| Jogar → Partidas (lista geral) | Feito: todas as partidas com filtros, detalhe e regresso; as por avaliar continuam no Início («Por fazer») e no Perfil |
| Perfil: o teu ano, amigos com pedidos, Definições; Terminar sessão no fim | Feito; pedidos pendentes em destaque no Perfil e em «Por fazer». Contagem no separador dispensada nesta fase |
| Ações de risco no fim, com confirmação | Feito (decisão 5) |
| Contadores «0 partidas» nas listas | Escondidos quando 0; correção na API registada (S-LIST02, C-LIST01) |

## Verificador da API

`tools/DeviceTestApi/verify-library-statuses.cjs` está commitado sozinho no ramo `tools/verify-library-statuses` do repositório da API (commit `89d8adf`, a partir de `eebbab1`). Uma cópia igual continua por adicionar na árvore de trabalho, ao lado das alterações por commitar das Estatísticas. Para integrar sem perder a cópia nem tocar nessas alterações:

```sh
cd MeepleBoardApi
f=tools/DeviceTestApi/verify-library-statuses.cjs
git show tools/verify-library-statuses:$f | cmp - $f && echo "cópia igual ao commit"
mv $f ~/verify-library-statuses.cjs.bak      # o git recusa trazer um ficheiro por cima de uma cópia por adicionar
git cherry-pick 89d8adf                       # só acrescenta este ficheiro; as alterações por commitar ficam como estão
cmp ~/verify-library-statuses.cjs.bak $f && rm ~/verify-library-statuses.cjs.bak
git status --short                            # as mesmas alterações das Estatísticas continuam por commitar
```

Se o cherry-pick recusar, `git cherry-pick --abort` e `mv ~/verify-library-statuses.cjs.bak $f` repõem tudo. Também se pode integrar mais tarde, com `git merge tools/verify-library-statuses`, depois de commitado o trabalho das Estatísticas (com o mesmo `mv` antes). Executar: `node $f` com a API DeviceTests na porta 5099 (cria e remove entradas fictícias).

## Ferramenta de comparação

`tools/visual-preview/` desenha os ecrãs reais (TSX) em WebKit com dados vivos do DeviceTests, apenas com pedidos GET. Cenários em `tools/visual-preview/scenarios/` (`jogos`, `registar`, `partidas`, `jogar`, `historico`, `perfil`, `inicio`, …). As capturas vão para `tools/visual-preview/out/`, que não entra no controlo de versões. Instruções em [../tools/visual-preview/README.md](../tools/visual-preview/README.md).

## Roteiro no iPhone (conta `autor`, DeviceTests)

No Expo Go, abrir `exp://192.168.1.116:8082` (servidor Expo `--lan --port 8082`, que aponta para a API DeviceTests na porta 5099) e fazer Reload. O endereço depende do IP do Mac na rede local.

1. **Registar partida:** Início → «Registar partida aqui» na sessão a decorrer → quatro passos → Guardar → abrir a sessão: a partida está na lista → voltar ao Início: «Última partida» e «O teu ano» atualizam (o hero não mostra a contagem enquanto S-LIST02 não for corrigida). Repetir pelo ＋ → Registar partida (sem sessão).
2. **Adicionar jogo:** ＋ → Adicionar jogo → procurar → escolher «Tenho» ou «Quero» → Jogos → A minha biblioteca mostra-o no filtro certo.
3. **Criar sessão:** ＋ → Nova sessão (ou «Combinar uma sessão» no Início) → data, local e prazo → criar → aparece em «Próximas sessões» no Início e em Jogar → Agendadas.
4. **Convidar amigos:** no detalhe da sessão → «Convidar amigos» → escolher → com a conta `participante`, o convite aparece em «Por fazer» no Início → aceitar → a pessoa passa a confirmada.
5. **Voltar às listas:** de cada detalhe, «Voltar» e o gesto de deslizar regressam à lista de origem; confirmar que o filtro e a posição se mantêm (sessões, campanhas, biblioteca, amigos).
6. **Consultar o histórico:** Jogar → Partidas → escolher «Vitórias» e, em Filtros, um jogo e um ano → abrir uma partida → Voltar: a área, os filtros e a posição mantêm-se → «Mostrar mais partidas» acrescenta a página seguinte. Registar uma partida pelo ＋ e voltar: aparece no topo.
7. **Texto grande:** repetir 1 e 3 com Dynamic Type no máximo: os botões da sessão a decorrer ficam em coluna e nada é cortado.

## Por confirmar no iPhone

- Jogar → Partidas: chips em duas linhas com texto grande, painel de filtros, regresso do detalhe com a posição mantida.
- Início: com e sem sessão a decorrer, sem partidas, com convites e pedidos; recarregamento ao regressar e puxar para atualizar.
- Barra inferior e folha ＋ (área segura, Dynamic Type, VoiceOver).
- Interruptor do prazo de resposta na criação de sessão e linhas que alternam ao tocar no texto.
- Separadores segmentados no detalhe da campanha e na lista de amigos com texto grande.
- Teclado sobre os campos do diário da campanha e das notas.
- Cores de estado (dourado/violeta) com o modo de contraste aumentado.
