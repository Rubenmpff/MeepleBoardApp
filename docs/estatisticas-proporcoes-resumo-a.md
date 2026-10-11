> Referência do Resumo atualizada após aprovação do desenho com um único botão Filtros e gráfico visível. Os objetivos atuais estão em [resumo-filtros-grafico-aprovado.md](resumo-filtros-grafico-aprovado.md); as medidas abaixo conservam o histórico anterior.

# Resumo: reprodução do painel A

Esta versão substitui os objetivos anteriores de composição. A referência concreta é exclusivamente o painel 1 de `mockups/estatisticas/navegacao-v2/a-areas.png`, recortado em x38/y146/largura290/altura667, preservando o logótipo inteiro. A captura anterior às 21:15 tem largura de conteúdo aproximadamente 866 px (x38…904). Normalizar ambos a 370 unidades; não comparar a imagem completa de seis telemóveis. Medidas abaixo são estimativas da referência e cálculos de layout, não medições de uma nova captura nativa.

| Bloco | Referência A normalizada | Objetivo do estado inicial |
|---|---:|---:|
| Topo até atividade, incluindo logo inteiro | 210–223 | 210–223 |
| Atividade | ~128 | 124–128 |
| Resultados | ~174 | 170–178 |
| Linha de jogo | ~66 | 64–66 |

Não aumentar estes objetivos por haver resultados antigos ou falta de duração. Informação adicional fica em detalhes recolhidos. Quantidades e nomes só provêm dos contratos existentes.

## Composição e medidas

- Cabeçalho comum estável: logo real 94×62 proporcional ao recorte normalizado, centrado independentemente de Voltar; padding vertical 3, altura habitual 68. A redução anterior para 66×44 afastava-se da proporção da A e é substituída. Com teclado, a decoração recolhe; em ampliação, Voltar muda de linha para evitar sobreposição.
- Separadores: seleção visual 28 e alvo transparente mínimo 44; estado e navegação persistentes mantidos. Título 20/26. Conteúdo com gap 4.
- Filtros: superfície visual branca 36 mínimo, borda fina e raio 8; alvo exterior 44. Ano preservado numa linha, Jogo e Modo com nomes integrais; adaptação para ampliação sem diminuir fonte. Folhas inferiores mantidas.
- Atividade: lavanda, padding 12, duas métricas 28/34 e rótulos 14/20. Texto visual “Jogos” como na A; rótulo de acessibilidade conserva o número de jogos diferentes. Duração numa linha secundária 12/18. Se ausente, “Sem duração registada”, sem converter ausência em zero. Com duração disponível, mostrar minutos e cobertura curta. Detalhes de duração recolhidos incluem a cobertura extensa e acesso às partidas sem duração.
- Resultados: superfície branca leve, padding 8. Título 16/22; três resultados 20/24, rótulos 14/20. Taxa e amostra na mesma linha secundária 12/18, percentagem em negrito, como na A. Uma única linha de desconhecidos com acesso às partidas. Ícone discreto com alvo 44 abre os detalhes dos antigos por confirmar e a explicação; “Destes” conserva a relação de subconjunto.
- Lista: capas reais/fallback, nomes completos e contagem de partidas, separadores leves. Nenhum jogo ou capa criado para preencher o cartão. Corpo geral continua 16/24; texto nativo continua escalável.

## Detalhes exatos de acessibilidade

Os filtros desenhados têm cerca de 34–36 unidades de altura na referência normalizada, inferiores ao alvo mínimo de 44 pt. Reproduzir a pintura dentro de um alvo exterior de 44; não usar alvos sobrepostos. Taxa, desconhecidos e ícones de detalhes preservam 44 sem superfície pesada. Em texto ampliado, altura cresce naturalmente e as métricas/filtros podem passar para coluna. Não impor alturas fixas nem desligar scaling. Esta adaptação em ampliação não é um novo desenho para a escala habitual.

## Comparação e limites

A maior diferença nas capturas anteriores era resultados ~250 contra ~174 da A, devido ao estado inicial mostrar informação adicional como linhas principais. A revisão recolhe essa informação, sem retirar dados ou rotas. A estrutura inicial segue a A; duração ausente altera o conteúdo da linha, não acrescenta outra linha obrigatória.

Os anexos são visíveis para análise, mas não estão acessíveis como ficheiros neste ambiente. O HTML `mockups/estatisticas/navegacao-v2/comparar-resumo.html` recorta o painel individual da A à largura370; a coluna real depende de selecionar uma captura local. Não existe ainda um artefacto preenchido de comparação lado a lado da revisão atual. Sem Xcode/simulador ou inspector ligado, não há captura nativa nova. Não apresentar render do harness como app nem afirmar fidelidade visual alcançada. Aprovação visual permanece pendente.

Verificação: Node 22.14.0, TypeScript sem erros, 274 testes gerais (34 específicos) passados e exportação iOS concluída. Teste novo confirma detalhes recolhidos, abertura e acesso aos antigos/sem duração com filtros intactos, incluindo fontScale 2. Divisor da atividade e cor coral das derrotas repostos conforme a A. Estas verificações não medem layout nativo nem substituem comparação visual.
