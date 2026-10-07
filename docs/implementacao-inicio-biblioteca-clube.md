# Início e Biblioteca — identidade Clube Meeple

Confirmação recebida no iPhone: Início/Biblioteca ficaram bem e os controlos testados funcionam. Mantém-se a versão como base; isto não valida percursos não testados.

Identidade aprovada aplicada apenas a estes ecrãs e aos seus componentes próprios. Paleta opt-in `clubTheme`, cabeçalho `ClubHeader`, botões/cartões e capas partilhados neste âmbito; `appTheme`, autenticação e navegação global não alterados. Modais AddToLibrary/ManageLibraryEntry partilhados com outras áreas mantêm o tema anterior, para evitar alteração indireta fora do âmbito. Preservados destinos, filtros, estados, preço (incluindo zero), edição, ordenação, preferências grelha/lista, ações secundárias, toque prolongado e cálculo de contagens.

Cabeçalhos com logótipo original centrado, tamanho 104×68, título 22/30 e curva suave em lavanda; fundo branco quente, ações verde escuro e estrelas douradas. Com teclado aberto o logótipo/subtítulo recolhem; a Biblioteca usa KeyboardAvoidingView, mantém toques no teclado e permite recolhê-lo com scroll. Capas em contain mantêm proporções, com fallback neutro ao faltar/falhar e reset por URI. Nomes dos jogos não limitados a duas linhas. Grelha passa a uma coluna em ecrãs estreitos/texto ampliado. Alvos de ação mantêm mínimos 44/52 pt.

Início mantém uma única ação Registar partida. Removidas ações duplicadas da última partida/estado vazio. Não foi criado Jogar novamente: LastMatch não inclui gameId e o formulário começa com selectedGame=null, sem contrato de pré-seleção. O rótulo sugerido só será correto quando esse percurso puder iniciar uma nova partida com o mesmo jogo, sem clonar a anterior; registado como evolução separada, não bloqueia este ajuste visual. Convites/avaliações pendentes só aparecem com contagens positivas dos hooks atuais; nenhum indicador ilustrativo entra no produto.

Biblioteca não apresenta Voltar no ecrã principal. Campo «Pesquisar na minha biblioteca…» filtra os dados locais existentes; ação Adicionar jogo com explicação «Procurar no catálogo para adicionar» preserva /games/search. Os estados vazios, carregamento e erro/repetição mantêm-se distintos. Custos continuam condicionados ao separador Coleção e não se muda o tratamento histórico de preços ausentes.

## Verificações realizadas

Node 22.14.0; TypeScript; 240 testes frontend aprovados, incluindo ações/destinos PT/EN, condicionalidade das pendências, grelha adaptável, filtros, ordenação, edição/preço zero, propagação dos toques, falhas/listas vazias, recolha do cabeçalho por eventos de teclado e limpeza de listeners, proporções/fallback de imagens. Exportação iOS `.expo/club-ios-export` ignorada e bundle atual HTTP 200 no Expo 8082.

API 5099 confirmou DeviceTests/MeepleBoard_DeviceTests/externalDelivery=false. Leitura autenticada com credenciais exclusivamente locais: coleção guardada atualmente vazia, jogos já jogados existentes, última partida e 10 avaliações pendentes. Renderização isolada da Biblioteca com esses dados reais em 390 pt e 320 pt/fontScale 2. Nenhuma escrita de partida/coleção nesta verificação. Não se repôs a fixture antiga de coleção/preço 0; esse caso é coberto por testes simulados, não alegado como fixture SQL atual.

Limites: os testes de teclado/render usam adaptadores nativos simulados; não comprovam geometrias, contraste percebido, interação ou persistência no iPhone. Sem simulador iOS instalado. Alteração visual final pendente do utilizador. Base habitual, API e credenciais inalteradas.

## Percurso curto no iPhone

Recarregar Expo 8082 com conta fictícia. Início: cabeçalho centrado, único Registar partida, última partida/resultado/data e pendências sustentadas. Abrir Biblioteca: distinguir pesquisa local e catálogo; experimentar termo sem resultados, limpar, abrir teclado e chegar aos controlos; alternar Todos/Coleção/Desejos/Jogados, filtro e ordenação, grelha/lista. Em jogo existente abrir detalhes/menu, verificar edição de estado/preço e reler quando houver entrada guardada. Repetir com texto ampliado para nomes e alvos de toque, capas sem imagem. Não duplicar partidas para testar o visual.

Autenticação aprovada como base sem encerrar fluxos pendentes; Solo empate/resultado não definido, cooperativo e campanhas continuam registados. Estatísticas/retrospetiva não implementadas.
