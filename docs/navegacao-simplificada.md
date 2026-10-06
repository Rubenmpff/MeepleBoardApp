# Navegação simplificada

As observações sobre Comentários/Notas abaixo descrevem a auditoria anterior. As permissões do código atualizado estão em [autorizacao-partidas-diarios.md](autorizacao-partidas-diarios.md), incluindo a migração preparada e as limitações das fotografias antigas.

## Estrutura

A barra inferior apresenta Início, Biblioteca, Registar, Amigos e Mais. Registar é uma ação: abre `/games/register-match` no stack exterior aos separadores. Cancelar usa o histórico do router para regressar ao contexto de origem; uma abertura sem histórico regressa ao Início. O Início conserva a organização anterior.

Mais substitui o menu lateral: Sessões e Campanhas em «Jogar em conjunto»; Avaliações pendentes e Rankings em «Partidas»; Perfil e Definições em «Conta», com a identidade real e a ação de terminar sessão existentes. Não existe swipe entre separadores nem botão hambúrguer.

Início, Biblioteca, Amigos e Mais não apresentam seta de retorno. Pesquisa, detalhes e restantes subpáginas regressam ao contexto anterior; sem histórico, o cabeçalho de retorno regressa ao Início. Formulários apresentam Cancelar; no registo de partidas, Anterior muda apenas a etapa e conserva o rascunho.

Os antigos acessos à biblioteca (`/games/library` e o index do grupo da biblioteca), aos amigos (`/friends` e o index do respetivo grupo) e ao index do registo são aliases com `Redirect` e transmissão de todos os parâmetros. As implementações únicas da biblioteca e dos amigos têm os caminhos públicos `/library` e `/people`. Os restantes destinos e links mantêm os caminhos existentes, incluindo os grupos das campanhas.

## Alterações por guardar

`useUnsavedChanges` utiliza `usePreventRemove` do Expo Router para confirmar a remoção de ecrãs com rascunhos, pelo botão Cancelar, retorno do sistema ou navegação que os remova. A confirmação oferece continuar a editar ou descartar. Durante gravação/upload, bloqueia a saída; uma gravação bem-sucedida permite a navegação prevista.

A proteção aplica-se ao registo de partidas, criação de sessões/campanhas/encontros, diário e formulários de autenticação. Os modais de biblioteca e o cancelamento dos rascunhos dentro de sessões/campanhas também confirmam o descarte. Trocar de separador sem remover o ecrã conserva o seu estado. Não foi acrescentada persistência de rascunhos após fechar o processo.

## Comentários e Notas — campos preservados

- **Comentários** do registo são enviados como `scoreSummary` e guardados em `Matches.ScoreSummary` pelo serviço .NET. Aparecem como «Resumo» nos detalhes da partida. Não são comentários de um mural nem um campo pessoal separado por participante.
- **Notas** do registo são enviadas como `notes`. O backend cria uma cópia em `Matches.Notes` e uma entrada do autor em `MatchJournalEntries.Notes`. As alterações posteriores no diário atualizam a entrada individual, sem sincronizar a cópia inicial da partida. O histórico nos detalhes do jogo lê essa cópia, que pode ficar desatualizada.
- O diário mostra a entrada do utilizador e as entradas dos outros quando o diário está fechado ou o utilizador já submeteu uma avaliação; a lista dos outros filtra entradas com avaliação. Os detalhes da campanha também mostram notas nas entradas dos encontros. Estas condições visuais não estabelecem permissões no servidor.
- A escrita no diário valida que o utilizador autenticado participou na partida e grava a sua própria entrada. Na leitura, o endpoint de diário exige autenticação, mas não recebe/verifica o utilizador nem a participação: pelo código, qualquer utilizador autenticado que conheça o ID pode pedir essas entradas. O GET dos detalhes da partida não declara autorização nem valida participação e devolve também o resumo/notas da partida. Não se deve apresentar estes campos como privados.

Confirmado por leitura de `MatchService`, `CampaignService`, `CampaignController`, `MatchController`, `CampaignRepository` e `MeepleBoardDbContext` do backend deste workspace. As permissões efetivas em execução e o esquema aplicado na base de dados não foram testados. A pendência PR01 está registada separadamente; não foram alterados campos, permissões ou backend.

## Validação e limites

Os testes isolados verificam destinos, aliases com parâmetros, PT/EN, Cancelar/Anterior, rascunhos, saída durante gravação e navegação após sucesso, além das verificações anteriores de pedidos, pontuação zero e autenticação. Não contactam a API nem escrevem na base de dados. A exportação iOS verifica a compilação; não prova o comportamento do histórico e dos gestos nativos nem a qualidade visual.

No iPhone, verificar cada separador e Mais; abrir/cancelar Registar a partir de cada origem; distinguir Anterior de Cancelar com pontuação zero; manter/descartar rascunhos por botão e gesto; abrir biblioteca/amigos pelos links antigos; regressar de detalhes, sessões, campanhas e diário; testar teclado, áreas seguras, PT/EN e texto ampliado. Gravações reais e permissões entre contas devem ser verificadas num ambiente de teste separado.
