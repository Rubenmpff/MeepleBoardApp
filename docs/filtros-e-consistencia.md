# Filtros comuns e consistência visual

Proposta aprovada em 15/10/2026 (`docs/mockups/app/filtros/proposta.html`). Implementado só em DeviceTests, por etapas, a partir de `checkpoint/pre-filters-base`. A classificação BGG e os filtros que dependem dela esperam pela amostra XML (`MeepleBoardApi/tools/DeviceTestApi/fetch-bgg-sample.sh`).

## Feito

| Etapa | O que mudou |
| --- | --- |
| 1 · Base comum | `src/ui/Filters.tsx`: `OptionGroup` (44 pt; uma escolha ou várias), `FilterSheet` (rascunho até «Aplicar»; «Cancelar» e tocar fora não mudam nada; «Limpar» limpa o rascunho; o botão diz quantos resultados dá o rascunho quando é barato saber), `SortSheet`, `ActiveFilters` (retirar já; «Limpar tudo» a partir de dois), `ListToolbar` («Filtros (n)», contagem, «Ordenar: …»), `NoResults` («Ajustar», «Limpar filtros»). `src/shared/hooks/useAccountMemory.ts`: separador, pesquisa, filtros e posição por conta e por área enquanto a app está aberta (`recall` / `useRemember` / `useRememberedRef`), esquecidos ao terminar sessão; ordenação, vista e idioma dos recursos guardados no dispositivo por conta; pesquisas recentes por conta (as listas antigas, comuns ao dispositivo, são apagadas porque não se sabe de quem são). |
| 3 · Biblioteca | Folhas do kit; «Vamos ser N», nota BGG, modo (cooperativo, solo), histórico. «Competitivo» deixou de ser deduzido de «não cooperativo». Jogos sem número de jogadores ou nota BGG ficam fora desses filtros e são contados («n sem esta informação ficaram de fora»). Contagens dos separadores e «x de y jogos» seguem a pesquisa e os filtros, sobre a biblioteca inteira. Trocar para Descobrir e voltar mantém tudo. |
| 3 · Descobrir | Folhas, barra e chips ativos do kit; pesquisa, tipo, filtros e posição por conta; ordenação no dispositivo. Online, os filtros continuam no servidor para todas as páginas; a lista local (uma letra ou sem rede) deixa de contar jogos sem dados como compatíveis. Destaques do BGG com o nome em até três linhas; chips de tipo com 44 pt. |
| 4 · Rankings | Tema, ícones e estado vazio do kit; a explicação da ordenação passou para texto por baixo dos separadores (sem cortes com texto grande). |
| 5 · Jogar | Partidas: período, jogo e modo num rascunho com «Cancelar / Aplicar» (os chips de resultado aplicam já). Sessões: pesquisa (nome, local, jogo previsto) e filtro «Jogo previsto» com «Por definir». Campanhas: estados em chips com contagem, pesquisa e filtro por jogo. Contagens seguem pesquisa e filtro. |
| 6 · Restantes ecrãs | Uma só família de ícones (MaterialCommunityIcons via `Glyph`) em 34 ficheiros, incluindo autenticação, amigos, diário, registo, sessões e campanhas; ações do amigo e dos jogos da biblioteca na folha comum; `SheetSurface`, `ClubPrimaryButton` e `ClubSectionCard` removidos (sem utilizadores). Capturas antes/depois iguais exceto nos ícones. |

Os temas antigos (`appTheme`, `clubTheme`, `uiStyles`) já derivam de `src/ui/theme` com os mesmos valores; ficam como estão nos ecrãs que os importam.

## Pendente

- **Classificação BGG** (tipo, modo, estrutura, votos e «melhor/recomendado com», temas, mecânicas, idade sugerida, idioma) e os filtros que dependem dela, incluindo os de Rankings: esperam pela amostra XML.
- **Total em Descobrir:** a rota de sugestões devolve só a lista (o `TotalCount` da proposta é da lista paginada de jogos, não da pesquisa). Contar com os mesmos critérios pede uma consulta ao catálogo; entra com a etapa do catálogo. Até lá não se mostra total.
- **Partidas por sessão ou campanha:** precisa de um parâmetro novo na API de estatísticas, nos ficheiros com trabalho por commitar; fica para depois desse trabalho entrar.
- **Etiquetas pessoais:** segunda fase.

## Verificação

- App: TypeScript sem erros; 324 testes (`node --test tests/*.test.cjs`), incluindo rascunho/cancelar/aplicar, contagens, dados desconhecidos, «Competitivo» ausente, pesquisa e filtros de Sessões e Campanhas.
- WebKit (`--account participante`): `filtros-biblioteca`, `filtros-descobrir`, `rankings-kit`, `filtros-jogar`, `icones-kit` e `registar` (antes/depois), `perfil`.

## Por confirmar no iPhone

1. Biblioteca: filtros com «Ver n resultados»; aplicar, cancelar, limpar; chips removíveis; «Nenhum resultado com estes filtros» com o que ficou de fora; abrir um jogo e voltar com filtros, pesquisa e posição; ir a Descobrir e voltar.
2. Descobrir: pesquisa com teclado aberto; filtros e ordenação; voltar de um jogo; fechar e abrir a app (a ordenação mantém-se, os filtros não).
3. Rankings com texto grande.
4. Partidas: escolher modo e cancelar (nada muda); escolher e aplicar.
5. Sessões e Campanhas: pesquisa, filtro por jogo, contagens.
6. Ícones em todo o percurso (autenticação, amigos, registo, diário, sessões, campanhas).
7. Terminar sessão e entrar com outra conta: nada dos filtros, pesquisas recentes ou vista da primeira.
