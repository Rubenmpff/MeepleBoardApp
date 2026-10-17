# Diagnóstico de UI/UX — 2026-10-17

Diagnóstico apenas. Nenhuma alteração à app ou à API está aprovada. A proposta do Início ([mockups/app/inicio/](mockups/app/inicio/proposta.html)) continua como candidata, por aprovar.

**Como foi feito:**

- **Capturas:** os ecrãs atuais foram capturados em DeviceTests a 17 out. com a pré-visualização visual (`tools/visual-preview`, só GET; dados do roteiro intactos), nas contas «autor» e «participante».
- **Leitura de código:** os estados de resultado foram confirmados no código da app e da API e com leituras GET.

**Fora do alcance:** o teclado nativo, o VoiceOver e os gestos não são reproduzidos pela pré-visualização e ficam para o iPhone.

**Sobre os dados de teste:**

- **Partidas antigas:** muitas partidas de teste são «antigas», ou seja, sem resultado explícito. Foram criadas por verificadores com o formato anterior do pedido. Para o autor, 81 das 100 partidas sem resultado conhecido são antigas. Por isso, as capturas exageram a frequência dos textos de partidas antigas. Em produção, o peso depende de quantas partidas antigas cada pessoa tem, e isso fica por medir.
- **Nomes técnicos:** nomes como «Rule pending 1792217250941» e as campanhas «Campanha fictícia SQL» repetidas são resíduos de verificações. Não são problemas de interface.

## Conclusão

A app está coerente: um kit de componentes comum, folhas e filtros com o mesmo comportamento, e textos claros na maior parte dos fluxos. Não há nenhum percurso que precise de ser repensado. Precisa de ajustes pontuais e de **uma decisão de produto**, a linguagem dos resultados de partidas antigas, que atravessa vários ecrãs.

Pelo lado da interface, lançar depende sobretudo de:

- validar no iPhone, sobretudo o texto grande, o teclado e o VoiceOver;
- resolver a decisão sobre os resultados.

Fora da interface, a eliminação de conta pela própria pessoa (CONTA01) continua pendente. A App Store exige-a às apps que permitem criar conta, o que a torna um requisito para publicar na loja.

## Estados de resultado (confirmados no código)

A app e a API distinguem quatro estados de resultado (ver [proposta-modos-resultados.md](proposta-modos-resultados.md)). O modo de jogo é uma dimensão à parte.

| Estado | No domínio | Texto atual na partida | É definitivo? |
| --- | --- | --- | --- |
| Resultado conhecido | `Result` explícito, com vitória, derrota ou empate de cada jogador | «Vitória», «Derrota», «Empate» | Sim |
| Resultado não definido | `Result = "Undefined"`: a pessoa escolheu «Não definido» no registo | «Resultado não definido» | Sim, por escolha |
| Antiga, com vencedor registado | `Result = null` e `WinnerId` presente | «Vencedor registado: X · resultado antigo por confirmar» | Fica assim enquanto ninguém o corrigir |
| Antiga, sem informação suficiente | `Result = null`, sem vencedor | «Resultado antigo sem informação suficiente» | Igual |
| Modo antigo (dimensão separada) | `GameMode = null` | «Modo antigo por confirmar» / «Modo não registado» | Igual |

Na partida e nos jogadores, a app mostra cada estado corretamente. Confirmei-o com uma partida «Não definido», em que os jogadores aparecem como «Resultado não definido», e com uma antiga, em que aparecem como «Resultado antigo sem informação suficiente».

**Não existe nenhum estado «à espera de confirmação».** Nenhum percurso da app permite confirmar ou corrigir o resultado de uma partida antiga. A API aceita a atualização pelo autor, mas a app só corrige a duração. Os problemas estão nos **agregados e nos textos**:

- **Junta um estado definitivo aos antigos:** em Estatísticas › Companhia, «93 por confirmar», «Partidas por confirmar» e «Ver as 79 partidas por confirmar» contam todas as partidas sem resultado conhecido. Isso inclui as que foram guardadas como «Não definido», que são definitivas.
- **Usa «confirmado» para um total que mistura estados:** no Resumo, «3 sem resultado confirmado» é o total sem resultado conhecido. Logo abaixo, «Antigos por confirmar · Já contados nos 3 sem resultado» separa os antigos.
- **Promete uma ação que não existe:** «por confirmar», nas partidas antigas, sugere um passo que a app não oferece.

«Por avaliar» (a avaliação pessoal) é um conceito diferente e já é coerente: «13 partidas por avaliar», «Avaliações pendentes», «Avaliar». Zero é uma avaliação válida.

## Problemas por impacto

**Impacto real:**

1. **R1 — Linguagem dos resultados de partidas antigas.**
   - **Feito a 2026-10-17** (commit `6743d7c`, texto apenas, PT e EN), com a tabela aprovada pelo utilizador:
     - «Sem resultado conhecido» é o título abrangente, com explicação na lista;
     - «Não definido» deixa de aparecer como pendência;
     - os registos sem resultado explícito passam a «Registo antigo com resultado incompleto»;
     - o vencedor registado mantém-se («Vencedor registado: X · registo antigo»);
     - os jogadores sem resultado aparecem como «Sem resultado individual»;
     - os avisos e o cartão passam de dourado a neutro.

     **O que define o estado:** a ausência de resultado explícito (`Result = null`), não a data. Verificado nos dados: as partidas de 2024 com resultado explícito contam como conhecidas, e não há combinações parciais. Totais, cálculos, filtros e acessos ficam iguais.
   - **Problema:** os textos e os agregados descritos acima.
   - **Impacto:** uma pessoa pode pensar que tem trabalho pendente, ou que dezenas de partidas guardadas como «Não definido» estão incompletas.
   - **Decisão necessária:** ou se mudam os textos para descrever um estado (por exemplo, «registo antigo incompleto»), ou se dá ao autor uma forma de corrigir o resultado, e então «por confirmar» passa a ser verdade. Em ambos os casos, «Não definido» sai do total «por confirmar».
   - **Restrição:** os textos das Estatísticas estão preservados por decisão anterior, por isso qualquer mudança aí precisa de autorização própria.
2. **R2 — Linhas de partidas antigas nas listas.**
   - **Exemplo:** no Histórico, «17 out. 2026 · Modo não registado · Resultado antigo por confirmar», em 3 linhas com texto grande. Nas partidas da sessão e na última partida do Início, a frase do vencedor antigo junta-se às pontuações.
   - **Recomendação:** depende de R1. Depois de decidido o termo, as listas podem usar a forma curta.
   - **Por confirmar:** o peso em produção.
3. **R3 — O subtítulo «Registo rápido» num fluxo de 5 passos.** O texto promete o que o fluxo não é. *Feito a 2026-10-17:* fora de uma sessão, o cabeçalho mostra só «Registar partida»; numa sessão, continua a mostrar o nome da sessão.

**Ajustes pontuais (consistência, pouco risco).** *Feitos a 2026-10-17, com autorização*, exceto os das Estatísticas:

- **Retirado:** a data «18/10/2026» na folha «Hora de fim» vem do substituto da pré-visualização para o seletor nativo. No iPhone aparece a roda nativa do iOS.


- **Maiúsculas:** «Criar Sessão» no título e no botão. *Feito:* «Criar sessão» e «Nova campanha»; em EN, «New campaign» e «New encounter».
- **Rever:** «Corrigir jogadores» aparece como título verde, e os restantes «Corrigir» ficam à direita. «Vencedor: Teste-participante» parte em duas linhas. *Feito:* «Jogadores» passa a secção própria com «Corrigir» à direita, como as outras. A quebra de um nome comprido é o comportamento esperado.
- **Perfil do amigo:** «1 h 15 min» parte em duas linhas já com texto normal. *Feito:* cada coluna tem a largura do conteúdo. A 160 %, as colunas passam para uma nova linha (3 + 1) em vez de partirem o valor.
- **Estatísticas** (cada mudança precisa de autorização):
  - «45,45%» (duas casas decimais);
  - «0,00 · moeda não indicada»;
  - «À direita: partidas no período. Tocar no nome abre o jogo.»

**Hipóteses a testar (com pessoas ou no iPhone):**

- **Densidade da Biblioteca:** tem separadores, pesquisa, chips, filtrar/ordenar/vista e uma sugestão antes dos jogos. Está ligada às ideias registadas e não aprovadas.
- **«Biblioteca» na página do jogo:** não se sabe se é claro o que o botão faz.
- **Barra de separadores:** se «Jogar» e «Novo» são distinguíveis, e se o «+» de Jogar é necessário.
- **Nota MeepleBoard nas listas:** aparece sem o número de avaliações («★ 0,0 MeepleBoard»). Como zero é válido, a nota sozinha não diz quanto vale.
- **Registo:** se os passos 3 e 4 são longos de mais com texto grande.
- **Toques de 51×31 sinalizados:** são provavelmente interruptores nativos, a confirmar no iPhone.

**Preferências estéticas (sem impacto demonstrado; não recomendo mudar só por isto):**

- **Botões verdes cheios:** os «Adicionar» de cada amigo no registo e os links verdes repetidos.
- **Cartões:** muitos com o mesmo peso.
- **Chips de estado:** quebram para uma segunda linha em Partidas e Sessões. Funciona.
- **Cabeçalhos:** o das Estatísticas tem logótipo, diferente dos restantes.
- **Cartão do ano:** está no Início e no Perfil, com títulos diferentes.

## Já resolvido (verificado a 17 out.)

- **Filtros de Partidas:** a folha usa Cancelar/Aplicar.
- **Avaliação no detalhe da partida:** o detalhe e o diário mostram se a pessoa já avaliou, com «Guardada» e nota pessoal, ou com «Avaliar».
- **Linhas de amigos:** mostram «3 partidas juntos · Última: ontem», sem a frase repetida.
- **Datas ao criar sessão:** aparecem por extenso.
- **Botões principais no Início:** passou a haver um só botão principal.

## A manter

- **Registo:**
  - indicador de passos;
  - rodapé fixo «Anterior / Continuar»;
  - «Mudar» no jogo;
  - «Rever» com «Corrigir»;
  - validação explicada, por exemplo «Indica a duração ou escolhe «Não sei»».
- **Avaliação e privacidade:**
  - avaliação fechada com explicação;
  - «Só tu vês» / «Com os participantes»;
  - pré-visualização antes de publicar.
- **Folhas:** «Trocar amigo» (o contexto mantém-se), «Hora de fim» e o intervalo de datas com a data final incluída.
- **Sessões:**
  - criação com o botão desativado e a explicação;
  - «Prolongar» com o limite à vista.
- **Ações destrutivas:** agrupadas em «Gerir campanha».
- **Avaliações:** separação entre BGG e MeepleBoard; zero é válido.
- **Autenticação:** como está.
- **Estados vazios com orientação:** pesquisa de amigos e recursos sem idioma.
- **Texto grande:** Início, Estatísticas e página do jogo adaptam-se sem cortar.

## Ordem recomendada

1. **R1:** decidir a linguagem e o tratamento dos resultados antigos (decisão de produto; a seguir, os textos).
2. **R2 e R3:** listas de partidas antigas, depois do termo de R1, e o subtítulo do registo.
3. **Ajustes de consistência:** a data, as maiúsculas, o ecrã Rever e a duração no Perfil do amigo.
4. **Validação no iPhone:** texto grande, teclado, VoiceOver e os toques sinalizados.
5. **Proposta do Início:** avaliar como melhoria, não como correção. O Início atual funciona.
6. **Hipóteses:** testar a Biblioteca, «Jogar»/«Novo» e a nota nas listas antes de decidir.
