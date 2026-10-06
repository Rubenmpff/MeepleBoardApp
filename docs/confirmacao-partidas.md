# Guardar → confirmação → detalhes → sessão

Etapa aprovada pelo utilizador após confirmar no iPhone o registo na página própria, regresso ao detalhe e conservação de jogo, vencedor e pontuações 17/0 após reabrir.

## Comportamento

Depois de um registo bem-sucedido numa sessão, a página troca o formulário por uma confirmação baseada no MatchDto realmente devolvido pela API: capa/nome, resultado disponível e pontuações por jogador, incluindo zero. Voltar à sessão é a ação principal; Ver detalhes da partida é secundária. O vencedor identificado por WinnerId é destacado discretamente. Não se inferem resultados pelas pontuações nem pelo catálogo; nome do vencedor indisponível e resultado não definido continuam distintos.

Abrir detalhes usa push: Voltar regressa à confirmação com o ID guardado, não ao formulário. A ação Voltar à sessão usa o retorno existente por dismissTo e recarrega o detalhe. Na lista da sessão, toda a linha é tocável e mostra capa, nome, resultado, pontuações, data e duração quando disponíveis, com indicação discreta de acesso aos detalhes. Voltar dos detalhes abertos pela lista regressa à sessão. Se não houver histórico, o detalhe usa a sessão indicada como fallback, sem aceitar destinos arbitrários.

GameCover preserva proporções com contain, usa placeholder neutro quando não há URL ou ocorre erro e permite tentar uma URL diferente. O mesmo componente é usado na confirmação, lista e detalhe individual. A API preenche GameImageUrl a partir de Game.ImageUrl; não são inventadas imagens, nomes ou resultados.

## Gravação e fotografias

Um bloqueio síncrono impede duplo envio enquanto o POST decorre. Após sucesso, o ID e a resposta ficam retidos; voltar dos detalhes mantém a confirmação e não disponibiliza novamente Guardar. Uma falha de criação conserva o rascunho e permite tentar novamente. A confirmação só é exibida após uma resposta de criação bem-sucedida.

As fotografias são enviadas para o ID já guardado. Falhas parciais mostram explicitamente que a partida ficou guardada. Repetir envio das fotografias envia apenas os URIs falhados, sem chamar o endpoint de criação de partidas; falhas repetidas conservam os URIs e sucessos são retirados da lista. Durante o envio/repetição, as ações de saída ficam bloqueadas e a proteção de navegação permanece ativa. As fotografias usadas em execução são locais/fictícias em DeviceTests.

O contexto da confirmação fica na página de registo enquanto está no histórico; não foi acrescentada persistência de rascunhos ou uploads pendentes após terminar o processo da aplicação. Solo/cooperativo/empate mantêm as limitações RESULT01 e aguardam correção funcional separada.

## Validação

Node 22.14.0/npm 10.9.2: TypeScript e 190 testes frontend aprovados, incluindo confirmação realista, bloqueio de ressubmissão, rascunho na falha, repetição exclusiva de uploads, falhas repetidas, saída bloqueada, placeholders, proporções, linhas tocáveis e retorno de detalhes.

Backend: compilação; 59 testes HTTP de autorização + 1 auditoria offline, incluindo capa presente/ausente no DTO individual e da sessão; 20 cenários integrados HTTP/SQL; verificação das partidas existentes e fotografias locais; confirmação SQL das fixtures. Bundle iOS validado pelo Metro. Testes simulados não certificam gestos/layout no iPhone: a confirmação manual deste novo percurso continua pendente.

Somente MeepleBoard_DeviceTests marcada foi usada. Sem migrações novas, alterações à base habitual, armazenamento externo ou atualizações de dependências. API DeviceTests reiniciada para aplicar o mapeamento; voltar a fazer login no iPhone. Segredos e fixtures locais excluídos dos commits.

## Percurso manual curto

1. Recarregar Expo 8082 e entrar como autor. Na sessão Ativa, registar Meeple Teste Competitivo com autor 17, participante 0 e vencedor autor; duração opcional 5 minutos.
2. Guardar uma vez: confirmar capa ou placeholder, nomes, resultado, pontuações e Voltar à sessão.
3. Ver detalhes da partida → Voltar: deve regressar à mesma confirmação, sem formulário nem possibilidade de criar novamente a partida guardada.
4. Voltar à sessão: deve haver uma única partida nova. Tocar na linha → Voltar: deve regressar à sessão. Reabrir a sessão e confirmar os dados.

O teste de falha de fotografias não exige manipular dados no iPhone: foi coberto com adaptadores isolados, com armazenamento local validado separadamente. Não encerrar a sessão neste percurso.
