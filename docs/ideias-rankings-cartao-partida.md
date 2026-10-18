# Rankings de jogadores e cartão de partida — análise (2026-10-18)

> **Estado: ideias futuras. Nada disto está autorizado para implementação**, nem há maquetas.
>
> O trabalho autorizado em curso é outro: a validação no iPhone do Diário, das fotografias públicas e da moderação. A denúncia duplicada (passo 4) também continua por validar.
>
> Esta análise só regista opinião e âmbito, para decidir mais tarde.

Inspiração: dois exemplos enviados pelo utilizador, um cartão de partida partilhado numa história e um ranking de um jogo num site de jogo online. Aproveitam-se as ideias, não a composição.

## Recomendação curta

| | Cartão de partida | Rankings de jogadores |
| --- | --- | --- |
| **Valor** | Alto e imediato: cada partida registada passa a ter uma saída bonita. Também dá a conhecer a app sem nenhuma exposição pública. | Alto a prazo, quando houver base de jogadores. No lançamento, as listas ficariam quase vazias. |
| **Simplicidade** | **A mais simples.** Gera-se no telemóvel com o que a partida já tem. Reutiliza a partilha local do cartão do ano (`react-native-view-shot` + `expo-sharing`). Sem servidor nem dados novos. | **Complexa.** Precisa de dados que ainda não existem (ver abaixo), de uma nova definição de privacidade e de defesa contra abuso. |
| **Quando** | Primeira a fazer. Antes do lançamento só se não atrasar os pontos obrigatórios de [lancamento-lojas.md](lancamento-lojas.md); caso contrário, logo depois. | **Depois do lançamento**, começando só entre amigos. |
| **Não compensa agora** | — | O ranking mundial e qualquer ranking de «habilidade». |

## 1. Cartão de partida para partilhar fora da app

**O que é:** uma imagem gerada no telemóvel a partir de uma partida em que participaste, enviada pelo menu de partilha do sistema.

Não é uma publicação:
- não torna a partida pública;
- não cria nada no servidor;
- não passa pela comunidade nem pela moderação.

Nada fica guardado além do ficheiro temporário, que é libertado depois da partilha (como no cartão do ano).

**Pré-visualização com escolhas antes de exportar.** Por omissão:

| Elemento | Por omissão | Notas |
| --- | --- | --- |
| Nome e capa do jogo | Sim | Ver a questão da capa abaixo. |
| O meu resultado | Sim | Escrito do meu ponto de vista: «Vitória», «2.º de 4», «Vitória da equipa», «Empate no 1.º lugar», «Solo · vitória». Usa as regras explícitas de modo e resultado; resultados desconhecidos não são inventados. |
| Pontuações | Sim, anonimizadas | Só se a partida tiver pontuações. |
| Data | Sim (dia e mês) | Pode desligar-se. |
| Duração | Sim, se for conhecida | Pode desligar-se. Indica «medida» ou «estimativa» como na app; sem duração, não aparece. |
| Fotografia de fundo | Não | Só do meu diário dessa partida, ou uma escolhida no momento. Aviso: pode mostrar outras pessoas. A imagem exportada é desenhada de novo, por isso não leva os metadados (GPS, câmara) do ficheiro original. |
| «N.ª partida de {jogo}» | Opcional | Vem do meu próprio histórico; é um pormenor pessoal sem dados de outros. |
| Identidade MeepleBoard | Sim | Pequena e discreta, sem endereço nem identificador da conta. |
| Nomes, avatares e fotografias de outros | **Nunca, na primeira versão** | |
| Local e notas privadas | **Nunca** | Não existem como opção. |

**Jogadores anonimizados (proposta).** A tabela mostra posições e pontuações sem identidade:
- **Eu:** «Tu» (ou o meu nome, se eu escolher).
- **Os outros:** cada linha fica com um marcador neutro, igual para todos, com a cor da posição e sem iniciais. As iniciais podem identificar as pessoas.
  - Rótulos possíveis: «Jogador 2», «Jogador 3», ou só «2.º», «3.º».
- **Empates:** aparecem como empates.
- **Equipas:** num jogo cooperativo, uma única linha «Equipa · n jogadores».
- **Alternativa mínima:** mostrar só a minha linha, por exemplo «62 pontos · 1.º de 4».
- **Nomes de outros, mais tarde:** só com autorização da própria pessoa, que exigiria uma definição nova do tipo «Permitir o meu nome em cartões partilhados por amigos». Até lá, não há nomes de outros, nem escritos à mão.

**Identidade, sem copiar as referências.**
- Usa as superfícies creme, o verde principal e a tipografia da app, e um detalhe de tabuleiro ou meeple como assinatura.
- O resultado é o elemento principal, e não a lista de jogadores.
- Dois formatos: história (9:16) e publicação (4:5).
- Testar o contraste com e sem fotografia de fundo (véu sobre a fotografia), em modo escuro do sistema e com texto ampliado na pré-visualização.

**Riscos e questões a resolver antes de autorizar:**
- **Capas do catálogo:** vêm do BGG ou das editoras. É preciso confirmar se podem ser usadas em imagens que saem da app. Se houver dúvida, usar um cartão sem capa ou a capa só em miniatura.
- **Pontuação de outros:** mesmo anonimizada, quem conhece o grupo reconhece as pessoas. O aviso na pré-visualização deve dizê-lo, e a opção «só o meu resultado» deve estar à mão.
- **Partilha indisponível no dispositivo:** mostrar o erro, como no cartão do ano.

**Âmbito mínimo recomendado:**
- botão «Partilhar cartão» no detalhe da partida, só para participantes;
- pré-visualização com as escolhas acima e um formato;
- sem fotografia de fundo na primeira versão; vem depois, se a primeira for bem recebida;
- testes de que nenhum dado de outro participante, local ou nota entra na imagem.

## 2. Rankings de jogadores por jogo

**Já existe:**
- o ranking de **jogos** pela avaliação MeepleBoard (`/MeepleBoard/game/rankings`), que é outra coisa;
- a nota de 2026-10-16 em [proximas-etapas-produto.md](proximas-etapas-produto.md) §5: mundial e entre amigos, «Só eu / Amigos / Público», mais vitórias, mais partidas e melhores pontuações;
- as regras de vitórias e taxas das Estatísticas ([proposta-estatisticas-ano-a-mesa.md](proposta-estatisticas-ano-a-mesa.md)): «mais vitórias» é diferente de «maior taxa»; a taxa só é mostrada com denominador conhecido; os resultados desconhecidos não contam como derrota.

**Três tipos, com nomes que não enganam:**

| Tipo | Exemplo | O que diz | O que não diz |
| --- | --- | --- | --- |
| **Quantidade** | «Mais partidas registadas» | Quem joga mais vezes (e regista). | Nada sobre resultado ou qualidade. |
| **Resultados** | «Mais vitórias registadas»; «Taxa de vitórias (mín. 10 resultados)»; «Melhor pontuação registada» | O que aconteceu nas partidas registadas e confirmadas. | **Não é prova de que alguém joga melhor:** depende de quantas vezes joga, contra quem e do número de jogadores. O texto deve dizê-lo. |
| **Habilidade** | Uma classificação tipo Elo | Uma estimativa de força. | **Não recomendo.** Os sites de jogo online podem fazê-lo porque cada partida é verificada pelo próprio jogo. Aqui as partidas são declaradas por pessoas, os grupos são fechados e há poucas partidas por jogo. Um número de «habilidade» pareceria rigoroso sem o ser. |

**Melhor pontuação:** só é comparável entre partidas com:
- o mesmo jogo;
- o mesmo modo;
- o mesmo número de jogadores;
- a mesma variante e expansões;
- sentido conhecido (em alguns jogos ganha a pontuação mais baixa).

Sem esses dados, é um **recorde pessoal**, e não um ranking.

**Dados necessários (hoje não existem):**
1. **Participação confirmada por cada jogador.** Hoje quem regista acrescenta os outros sem confirmação individual. Para contar, a participação tem de ser aceite pela própria pessoa: confirmação explícita, ou presença aceite na sessão de origem. É a principal defesa contra abuso.
2. **Definição de visibilidade nos rankings**, separada das publicações:
   - «Desligado», por omissão: não apareço;
   - «Só eu»: vejo a minha posição, ninguém me vê;
   - «Amigos»;
   - «Público».
   - Mudar para «Desligado» retira-me de imediato.
   - As contas suspensas, eliminadas ou bloqueadas (nos dois sentidos) nunca aparecem.
3. **Variante e expansões na partida.** Hoje só há o jogo (que pode ser uma expansão do catálogo) e o indicador de regras oficiais (`IsOfficialMode`).
4. **Sentido da pontuação por jogo** (maior ou menor é melhor), definido pela administração no catálogo. Só servirá para os recordes.
5. **Número de jogadores e modo**, para separar os rankings. Já existem.
6. **Período** («últimos 12 meses» e «sempre») e **amostra mínima** visível, por exemplo «12 partidas».

**Riscos de abuso:**
- **Partidas falsas ou repetidas** para subir posições, com contas alternativas ou amigos coniventes. Mitigação:
  - só contam participações confirmadas;
  - limite de partidas por jogo e por dia;
  - partidas sem a confirmação dos adversários não contam para vitórias;
  - alertas para a moderação sobre padrões anómalos.
- **Pontuações absurdas ou erradas** (por exemplo 999). Mitigação: só para recordes, com confirmação dos participantes, limites plausíveis e denúncia.
- **Pessoas expostas sem querer.** Mitigação: por omissão, ninguém aparece. Um ranking público mostra o nome de utilizador e é fácil de recolher automaticamente.
- **Competitividade tóxica e comparação injusta** (quem joga mais aparece à frente). Mitigação: nomes honestos para cada lista, amostra visível e nenhum rótulo «melhor jogador».
- **Bloqueios e contas apagadas.** Mitigação: excluir de forma consistente, como nas experiências publicadas.

**Âmbito mínimo que recomendo (depois do lançamento):**
- Por jogo, **só «Entre amigos»**, apenas com quem ativou a visibilidade.
- Duas listas: «Mais partidas registadas» e «Mais vitórias registadas» (só no modo competitivo, com resultados explícitos e participações confirmadas).
- A minha posição destacada, o período e o número de partidas de cada pessoa.
- Primeiro o ranking entre amigos, porque assenta em relações que já existem. O **mundial** fica para quando houver confirmação de participação, base de jogadores e moderação provadas. Os recordes de pontuação, só com sentido e variante registados.
- A habilidade fica fora.

## Próximos passos (quando for retomado)

1. **Cartão:** decidir a questão das capas e aprovar a proposta visual. Só depois implementar.
2. **Rankings:** primeiro propor a confirmação de participação e a definição de visibilidade, que são úteis por si. Depois, o ranking entre amigos.
