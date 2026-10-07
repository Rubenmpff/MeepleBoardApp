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

As capturas referidas pelo utilizador **não estavam anexadas/disponíveis nesta mensagem**. A comparação foi feita com o mockup existente e os problemas descritos; não foi feita comparação visual direta com capturas do iPhone. Não apresentar um mockup como captura real.

## Verificação e limites

- Node 22.14.0; TypeScript sem erros; 251 testes frontend aprovados, incluindo 11 de Estatísticas.
- Verificados: filtros/drilldown/back, opções e explicações fechadas por defeito, duração ausente versus zero, avaliações próprias zero, rótulos PT/EN, estados vazios/erro/carregamento, cancelamento de pedidos e lógica da escala/ausência de barras para zero.
- Exportação iOS concluída em `.expo/statistics-composition-ios-export`, ignorada. Expo 8082 ativo.
- Health da API 5099: `DeviceTests`, base `MeepleBoard_DeviceTests`, `externalDelivery=false`. Nenhuma alteração de backend, migração, ligação SQL ou dados nesta revisão. Base habitual intacta.
- O harness de testes verifica comportamento e propriedades; não comprova equilíbrio visual nativo, contraste percebido, posição dos elementos com teclado real ou cortes no dispositivo. Não há captura nativa/simulador nesta validação.

## Percurso curto no iPhone

1. Mais → Estatísticas. Comparar período, seletores, duas métricas, tempo e o único bloco Resultados.
2. Selecionar um modo e um jogo; tocar num total ou coluna → partida → Voltar → Voltar. Confirmar contexto/filtros mantidos.
3. Abrir um período sem duração/atividade: «Sem duração registada», cobertura correta, zero sem barra. Percorrer todos os meses no gráfico.
4. Abrir «Como calculamos» e confirmar fuso/explicações; testar texto ampliado e intervalo personalizado com teclado aberto.

Manter aprovação visual aberta até confirmação do utilizador. Novas secções/retrospetiva aguardam esta revisão. Solo empate/não definido, cooperativo, campanhas, autenticação e «Jogar novamente» conservam as pendências existentes.

## Integração habitual

As agregações/endpoints permanecem na API principal. DeviceTests fornece apenas configuração/dados fictícios e substitutos externos. A configuração habitual local aponta para SQL `localhost:1433`, base `MeepleBoardDb`; não identifica a origem efetiva do PC Windows. O utilizador trouxe código sem transferir a base. A transferência aguarda acesso ao PC.

[Configurações, migrações e futura cópia isolada](../../MeepleBoardApi/docs/integracao-copia-real.md). Nenhuma validação da base real é declarada concluída.
