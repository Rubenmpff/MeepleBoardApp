# Revisão de Estatísticas e integração — 07/10/2026

O primeiro resumo foi uma entrega funcional, não uma revisão visual concluída. O mockup aprovado continua a referência. Não substituir a identidade aprovada da autenticação, Início ou Biblioteca.

## Afinação já aplicada

- Indicadores agrupados em fundo lavanda, com ação na área inteira e indicação discreta, eliminando a repetição de «Consultar partidas» em cada indicador.
- Resultados agrupados num único bloco, com bordas suaves; valores ficam separados de cobertura e explicações.
- Evolução passa de uma lista de barras mínimas para gráfico de colunas real, junto ao resumo: meses/dias localizados, contagens visíveis e cada coluna abre as partidas do intervalo correspondente. Zero tem altura zero, sem inventar atividade; o eixo é comum às colunas e normalizado ao maior valor.
- Scroll horizontal no gráfico quando necessário, sem reduzir rótulos/texto à força. Texto ampliado mantém scroll vertical e indicadores numa coluna. Verde escuro nos dados; lavanda/branco quente nos fundos.

Não é captura do iPhone. TypeScript e verificações funcionais não confirmam contraste/composição/renderização nativa. Capturas anunciadas pelo utilizador ainda aguardadas para comparação concreta.

## Diferenças intencionais / trabalho seguinte

- Usamos colunas, em vez da área de linha vazia do mockup, para representar contagens discretas e permitir tocar em cada período. Não desenhamos uma linha fictícia.
- O mockup tinha placeholders sem dados; a implementação conserva cobertura, origem legada, filtros e texto confortável mesmo quando ocupam mais espaço.
- As três métricas podem quebrar linhas em ecrãs estreitos/texto ampliado; não cortar rótulos para reproduzir literalmente a grelha.
- Filtros de modo ainda ocupam mais altura do que a proposta. Secções por modo/avaliações continuam visíveis no resumo funcional; devem migrar para as secções exploráveis à medida que forem implementadas, preservando acessos.
- Explorar e retrospetiva/partilha continuam fases autorizadas em desenvolvimento, não funcionalidades concluídas por esta afinação. Não introduzir botões sem destino para simular o mockup.

## Ambiente e integração

App 8082 → API 5099 → `MeepleBoard_DeviceTests`; health confirma `DeviceTests` e `externalDelivery=false`. Endpoints e agregações de Estatísticas estão integrados na API principal. DeviceTests fornece configuração exclusiva, dados fictícios e substitutos locais externos.

Auditoria backend, configurações, migrações, serviços externos, futura cópia e execução no Windows: [integração da cópia real](../../MeepleBoardApi/docs/integracao-copia-real.md). No Mac, a ligação habitual nos User Secrets aponta para SQL `localhost:1433`, base `MeepleBoardDb`; isto não identifica a base efetiva do PC Windows. O utilizador confirmou não ter transferido a base. Nenhuma ligação à base habitual foi realizada.

Migrações e API principal aplicam-se também no Windows; não usar o anfitrião fictício para migrar uma cópia real. Estatísticas não criaram migração nova. Transferência e validação real ficam para quando houver acesso ao PC; continuar agora com testes fictícios.

## Confirmação no iPhone

Abrir Mais → Estatísticas, comparar cabeçalho/filtros/resumo/resultados e gráfico. Selecionar um período com atividade; tocar numa coluna e voltar. Mudar modo/jogo e verificar gráfico/cobertura. Testar ano vazio e texto ampliado, incluindo scroll horizontal e vertical. Comparar capturas com o mockup e ajustar antes de considerar a revisão visual concluída.

Solo empate/não definido, resultados cooperativos, campanhas e fluxos de autenticação ainda não confirmados mantêm as pendências existentes. «Jogar novamente» permanece pendente.

## Verificações executadas

Node 22.14.0; TypeScript sem erros, 249 testes frontend aprovados (9 de Estatísticas) e export iOS concluído, em pasta ignorada `.expo/statistics-visual-ios-export`. Health da API confirma a base fictícia. A auditoria SQL da cópia foi preparada e revista, mas não executada: ainda não existe cópia disponível. Sem mudanças no pipeline/API de arranque nem nos dados habituais.
