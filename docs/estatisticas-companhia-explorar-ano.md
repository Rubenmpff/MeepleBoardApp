# Estatísticas — Companhia, Explorar e O teu ano à mesa (07/10/2026)

Implementação autorizada após o utilizador confirmar o resumo mais organizado. Conservada a identidade lavanda/verde/branco quente/dourado e o resumo existente. Novos acessos em Explorar; não acrescentar tudo ao resumo. Apenas API 5099 DeviceTests e Expo 8082.

## Implementado

- Consultar meses: lista compacta com mês, valor e acesso às partidas; eliminada a repetição do gráfico na consulta mensal.
- Companhia: selecionar amigo aceite; período/jogo/modo; contagem conjunta, jogos frequentes, competitivo com vitórias minhas/dele/partilhadas, empates entre ambos ou com outros, vencedor externo e partilha com terceiro. Cooperativo separado com resultado da equipa. Evolução textual acessível, amostra/desconhecidos, valores lado a lado por jogo/modo/data e acesso aos suportes. Lista de amigos com mais partidas conjuntas; selecionar regressa ao topo da comparação.
- Jogos e recordes: ordenar por frequência, vitórias ou taxa; cobertura/sem resultado; mínimo/máximo pessoais com drilldown exato, zero e negativos preservados. Não chamar maior pontuação melhor sem regras de comparabilidade.
- Avaliações: apenas as próprias, média por jogo/modo e evolução com cobertura, zero/meios pontos preservados.
- Coleção: entradas atuais adicionadas no período, estados, preços individuais conhecidos, incluindo zero, e jogos possuídos sem partidas no histórico. Acesso ao jogo e às partidas do período. Sem moeda/data de compra/eventos guardados, não inventa despesas anuais ou aquisições; explica o limite e o significado do filtro de modo.
- O teu ano à mesa: oito cartões, ano anterior/seguinte, líderes empatados, mais jogados/mais vitórias/maior taxa distintos, companhia anónima, tempo com cobertura, mês mais ativo e primeiros jogos no histórico registado. Taxa destacada exige cinco resultados conhecidos. Ano vazio explícito. Partidas de suporte preservam jogo/modo/ano/mês.
- Pré-visualização e partilha: imagem PNG local do mesmo cartão, capas reais/fallback, informação fixa de amigos anónimos, share sheet nativa após ação explícita. Sem nomes, avatares, IDs de amigos, notas, avaliações ou pontuações privadas de terceiros. Sem upload/link público. Filtros e fuso ficam indicados no cartão. Guardar imagem pode ser feito pela ação disponibilizada na folha de partilha do iOS.

## Integração e proteção

Rotas novas `/statistics/company`, `/statistics/explore`, `/statistics/year`; contratos partilhados da API principal, sem endpoint funcional exclusivo de DeviceTests e sem migração nova. Ver [contratos e cálculo](../../MeepleBoardApi/docs/estatisticas-companhia-explorar-ano.md).

Filtros e seleção mantidos ao regressar dos suportes/detalhes. Pedidos cancelados ao mudar consulta/conta ou sair; resultados antigos não substituem a consulta atual. Ampliação mantém texto e scroll; seletores empilham quando necessário. As imagens públicas passam por projeção explícita de campos permitidos, sem espalhar DTOs arbitrários.

## Verificado e pendente

Node 22.14.0/npm 10.9.2 explícitos. TypeScript, 258 testes frontend e exportação iOS; testes de filtros, rotas, amostras, mês textual, zero/negativos, preço zero, separação entre vitórias e taxa, anonimização/projeção de todas as imagens e cancelamento. Backend compilado e casos SQL/API conhecidos verificados na base fictícia.

A exportação confirma o bundle, não o resultado visual nem a captura/folha de partilha nativa. Continuam pendentes: composição no iPhone, texto ampliado, teclado dos intervalos, carregamento/falha de capas, anos/listas vazios, guardar/partilhar PNG e inspeção da imagem final. Não há captura real nativa produzida nesta etapa. Testes manuais pendentes de Solo empate/não definido, cooperativo, campanhas e autenticação não são encerrados por fixtures SQL. Jogar novamente permanece pendente.

Foram acrescentadas apenas as dependências de captura/partilha compatíveis com o SDK Expo instalado: react-native-view-shot e expo-sharing. Alertas npm/AutoMapper registados para análise separada, sem correções automáticas com --force.

## Primeiro percurso no iPhone: Companhia

1. Recarregar Expo 8082. Se a sessão anterior receber 401 após reinício da API de testes, entrar novamente na conta fictícia autor.
2. Mais → Estatísticas → Ano 2024 → Companhia. Escolher participante (amigo fictício) e filtrar Competitivo.
3. Abrir Vitórias partilhadas entre nós → uma partida → Voltar → Voltar. Confirmar nomes/pontuações autorizadas e conservação do amigo, período e modo. A amostra anual pode incluir outras partidas fictícias já registadas; para valores determinísticos usar intervalo 27/10/2024–27/10/2024, fuso Europe/Lisbon: três competitivas conjuntas, uma vitória minha, duas do amigo, uma partilhada e um empate entre ambos.

Depois desta confirmação, validar cooperativo/evolução/pontuações e as restantes secções, um percurso de cada vez. Partilha: escolher ano 2024 → cartão Companhia → pré-visualizar → partilhar/guardar imagem; confirmar ausência de nomes e cobertura visível. Nenhuma aprovação visual nativa é declarada por estes testes.
