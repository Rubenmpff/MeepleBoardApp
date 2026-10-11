# Estatísticas: direção de conjunto implementada

Ponto de partida: [proposta](mockups/estatisticas/direcao-conjunto/proposta.html). Comparação com a proposta, ecrã a ecrã: [comparacao.html](mockups/estatisticas/direcao-conjunto/comparacao.html). Aprovação visual no iPhone pendente.

## Estrutura comum

Todas as áreas seguem a mesma ordem: cabeçalho fixo (Voltar, logótipo original, áreas), âmbito (período e filtros num só cartão), um destaque lavanda, secções com o título fora do cartão e “Mais detalhes” no fim. Componentes em `src/features/statistics/ui/`:

- `theme.ts`: cores com significado, seis estilos de texto (34/40, 22/28, 17/22, 15/20, 13/18, 12/16), espaços 4/8/12/16/24, raios 14/12/16/22 e toque de 44 pt.
- `components.tsx`: Section, Card, Hero, Row (≥ 52 pt, separador alinhado ao texto), Disclosure, Segmented (toque de 44 pt, seletor de 38 pt), ResultsTrio, ProportionBar, RankBar, PendingNotice, Button, EmptyState, Avatar e SearchField.
- `Sheet.tsx`: folha inferior com Cancelar · título · Aplicar/Fechar, sobreposta à página, com altura mínima opcional para folhas pesquisáveis.
- `Screen.tsx`: margens de 16, 24 entre secções, scroll sob o indicador inicial.

`ExploreFilters` passa a ser o âmbito (Resumo, Companhia, Explorar). `FiltersSheet` é a folha de filtros, com Jogo e Modo como subpáginas e rascunho até Aplicar. O Ano usa-a sem período. A faixa do cabeçalho chega ao topo do ecrã. As áreas usam sublinhado verde e, com texto ampliado, uma faixa deslizante.

## Decisões face à proposta

- Companhia: a cobertura passou de anel a barra linear (“39 de 129 com resultado confirmado”). O frente a frente usa três segmentos (só tuas, partilhadas, só do amigo) e a legenda correspondente, para não sugerir que as vitórias partilhadas são distintas.
- Resumo: “Antigos por confirmar” fica em “Mais detalhes”, indicado como já contado nas partidas sem resultado.
- Cartão anual: lavanda também na partilha. O dourado fica reservado a “por confirmar”.
- Coleção: o nome abre o jogo e o número abre as partidas do período (dois toques distintos).
- Folha de amigo: “Selecionado” junto ao ✓ e altura estável durante a pesquisa.

Cálculos, contratos, serviços, autorização, privacidade e acessos às partidas não foram alterados. Os acessos e rótulos acessíveis (“Vitórias partilhadas entre nós: n”, “Partidas por confirmar: n”, …) mantêm-se. As equipas no cooperativo têm agora rótulos explícitos (“Vitórias da equipa: n”).

## Verificação

- TypeScript sem erros e 286 testes aprovados. Atualizei apenas os testes que dependiam de índices de estado, textos ou da estrutura antiga. As asserções de comportamento continuam todas.
- O Metro 8082 serve o bundle iOS com as alterações.
- Renderização local: componentes TSX reais em WebKit a 402 × 874, com respostas GET gravadas da API DeviceTests (MeepleBoard_DeviceTests). Em 27 estados não há toques abaixo de 44 pt, texto a transbordar nem ícones em falta. Inclui nomes longos e texto a 130 %.
- Não é renderização nativa. O calendário inline aparece como substituto e as sombras e o texto do iOS podem diferir.

## Confirmar no iPhone (uma ronda)

Reload em `exp://<IPv4-do-Mac>:8082`. Ver Resumo 2024 (topo e fim), Filtros (intervalo com o calendário nativo), Companhia 2026 (Todas, Só vocês e troca de amigo com teclado, regresso à lista com pesquisa e scroll), Explorar (jogo expandido, Coleção) e Ano 2024 (cartão 2 e pré-visualização, sem partilhar). Depois repetir o Resumo e a Companhia com texto ampliado e VoiceOver. O inspetor do Metro mostrou o iPhone ligado, mas recusou a ligação, por isso não houve captura do dispositivo.
