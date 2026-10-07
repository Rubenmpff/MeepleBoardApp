# Estatísticas — correção de composição, 07/10/2026

Estado: correção implementada; aprovação visual **pendente no iPhone**. O utilizador rejeitou a apresentação anterior por ser extensa, repetitiva e distante do mockup. Não avançar com novas secções ou retrospetiva antes de rever esta composição.

## Problemas confirmados no código anterior

- Modos apresentados como múltiplos controlos permanentes e cartões de resultados repetidos por modo.
- Tempo e o texto «Indisponível» dividiam uma grelha com três métricas, demasiado estreita.
- Fórmulas e explicações ocupavam o resumo inteiro; muitos valores repetiam ações e contornos.
- Fundos lavanda independentes na área de cada coluna pareciam barras mesmo com valor zero. A escala não era explícita.

## Composição corrigida

- Período segmentado compacto, sem contorno por opção; navegação do período centrada.
- Jogo e Modo em seletores lado a lado quando há espaço, empilhados em ecrãs estreitos/texto ampliado. Só um seletor fica aberto de cada vez. Listas de opções mostram o estado selecionado e conservam a escolha de jogo/período/modo.
- Partidas e jogos alinhados num resumo lavanda com duas métricas; tempo num bloco próprio de largura inteira. «Sem duração registada» substitui a ausência de duração, sem valor numérico inventado. Duração zero continua `0 min`.
- Gráfico sem fundos por coluna. Zero não renderiza qualquer barra. Escala inteira comum visível, contagens junto às colunas, rótulos mensais/dias sem truncamento e scroll horizontal. Acessibilidade inclui mês/ano ou dia completo. A altura representa a contagem dividida pelo teto da escala, nunca um mínimo artificial.
- Um único bloco Resultados: três totais e uma linha para a taxa/amostra. O seletor global de Modo filtra estes resultados e todos os restantes indicadores; contexto do modo visível. Não repetimos cartões completos por modo.
- Indicadores tocáveis sem contorno individual; cobertura/amostra junto aos valores, acesso às partidas sem repetição de botões. As partidas sem resultado e as antigas por confirmar mantêm os seus acessos.
- «Resultados antigos por confirmar» e variantes substituem a terminologia «legado» na apresentação. Métrica/API `legacy` mantida, sem alterações de classificação ou dados.
- Fuso, fórmulas, limites dos dados, avaliação própria e regras cooperativas em «Como calculamos», fechado por defeito. Amostra e cobertura permanecem no resumo.
- Avaliação e jogos mais jogados mantêm acessos existentes, com linhas simples. Não adicionámos secções exploráveis nem retrospetiva.

## Comparação com o mockup

[Mockup aprovado](mockups/estatisticas/estatisticas-ano-partilha.png): recuperação do período compacto, seletores em paralelo, fundo lavanda comum e hierarquia Resumo → Evolução → Resultados. A divisão duas métricas + tempo próprio segue a correção explícita do utilizador, em vez das três colunas originais. Os contornos ficam essencialmente nos seletores/campos, não em cada valor.

Diferenças intencionais: colunas com dados em vez da área de linha ilustrativa vazia; scroll confortável em vez de obrigar toda a página a caber num ecrã; opções empilhadas e texto completo com ampliação. Não mostramos acessos fictícios a Explorar/retrospetiva ainda não implementados.

As três capturas do iPhone foram entretanto recebidas e comparadas diretamente com a primeira imagem, identificada pelo utilizador como mockup. Mostram a versão anterior a esta nova afinação (158 partidas, 1 jogo, zero durações; 29 vitórias, 14 derrotas, 19 empates). A leitura dos valores nas imagens não substitui uma auditoria da base. Não apresentar um mockup ou exportação como captura real.

### Comparação direta e nova afinação após as capturas

- Cabeçalho maior e título à esquerda no iPhone, contra cabeçalho compacto/título centrado no mockup: variante compacta apenas em Estatísticas, logótipo 88 × 58, título centrado e menos margem superior. Início/Biblioteca mantêm o padrão anterior.
- Seletores de duas linhas contra uma linha no mockup: em estado «todos», mostram Jogo/Modo numa linha, conservando o estado completo no rótulo acessível e na lista de opções. Escolhas com nomes longos continuam a poder ocupar mais linhas.
- O resumo da captura repete Tempo registado, Sem duração registada, Duração em 0 de 158 e 158 partidas sem duração. Quando nenhuma duração existe, ficam a mensagem e a cobertura; a própria linha abre as partidas sem duração. Em cobertura parcial, o acesso às partidas sem duração continua separado.
- A captura mostra apenas janeiro–junho, com zeros, apesar da escala 158: o desenho anterior reservava 60 pt por mês, ficando a segunda metade fora da área visível. Não inventamos em que mês estão os dados. O novo gráfico mensal até 24 meses tem visão completa à largura disponível e escala comum; Consultar meses expande a consulta detalhada, com alvos ≥44 pt e acesso a cada mês. Legendas da visão geral adaptam a densidade ao texto ampliado, sem diminuir o texto; a alternativa detalhada preserva todos os meses e valores.
- Redução de gaps e padding, sem diminuir globalmente o corpo 16/24 ou os alvos de toque. Resultados antigos passam a «Destes, N antigos por confirmar», deixando claro que pertencem às partidas sem resultado conhecido, não que são partidas adicionais.
- Valores da captura são aritmeticamente coerentes: 29+14+19=62; 29/62≈46,77%; 158−62=96. A afinação preserva os cálculos e filtros; não troca resultados para corresponder ao desenho.

A nova versão ainda não tem captura nativa nem aprovação visual. As capturas recebidas documentam os problemas anteriores, não validam as correções agora aplicadas.

## Verificação e limites

- Node 22.14.0; TypeScript sem erros; 252 testes frontend aprovados, incluindo 12 de Estatísticas.
- Verificados: filtros/drilldown/back, opções e explicações fechadas por defeito, duração ausente versus zero, avaliações próprias zero, rótulos PT/EN, estados vazios/erro/carregamento, cancelamento de pedidos e lógica da escala/ausência de barras para zero.
- Exportação iOS concluída em `.expo/statistics-captures-ios-export`, ignorada. Expo 8082 ativo.
- Health da API 5099: `DeviceTests`, base `MeepleBoard_DeviceTests`, `externalDelivery=false`. Nenhuma alteração de backend, migração, ligação SQL ou dados nesta revisão. Base habitual intacta.
- O harness de testes verifica comportamento e propriedades; não comprova equilíbrio visual nativo, contraste percebido, posição dos elementos com teclado real ou cortes no dispositivo. Não há captura nativa/simulador nesta validação.

## Percurso curto no iPhone

1. Mais → Estatísticas. Comparar período, seletores, duas métricas, tempo e o único bloco Resultados.
2. Selecionar um modo e um jogo; tocar num total ou coluna → partida → Voltar → Voltar. Confirmar contexto/filtros mantidos.
3. Abrir um período sem duração/atividade: «Sem duração registada», cobertura correta, zero sem barra. Comparar a visão anual completa e abrir Consultar meses para percorrer todos os valores.
4. Abrir «Como calculamos» e confirmar fuso/explicações; testar texto ampliado e intervalo personalizado com teclado aberto.

Manter aprovação visual aberta até confirmação do utilizador. Novas secções/retrospetiva aguardam esta revisão. Solo empate/não definido, cooperativo, campanhas, autenticação e «Jogar novamente» conservam as pendências existentes.

## Integração habitual

As agregações/endpoints permanecem na API principal. DeviceTests fornece apenas configuração/dados fictícios e substitutos externos. A configuração habitual local aponta para SQL `localhost:1433`, base `MeepleBoardDb`; não identifica a origem efetiva do PC Windows. O utilizador trouxe código sem transferir a base. A transferência aguarda acesso ao PC.

[Configurações, migrações e futura cópia isolada](../../MeepleBoardApi/docs/integracao-copia-real.md). Nenhuma validação da base real é declarada concluída.
