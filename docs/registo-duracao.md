# Registo de partida redesenhado e duração das partidas

Proposta aprovada a 16/10/2026 (`docs/mockups/app/registo/proposta.html` e `pagina-jogo-duracao.html`). Implementado só em DeviceTests. API: `MeepleBoardApi/docs/duracao-partidas.md`.

## Registo (5 passos)

- **Jogo** (`GamePicker`): biblioteca em grelha (só «Tenho»), pesquisa na biblioteca e no catálogo ao mesmo tempo, em grupos; jogos da biblioteca não se repetem no catálogo; jogo escolhido marcado e barra «Escolhido: …» (com «não está na tua biblioteca»). Qualquer jogo do catálogo pode ser escolhido; a biblioteca não muda. Depois, resumo com «Mudar», modo em três (com «Forçar» como antes) e expansões usadas numa linha.
- **Entrada direta**: um jogo escolhido antes de abrir, com um só modo no catálogo e sem expansões tuas desse jogo, abre em Jogadores. Caso contrário mostra a configuração primeiro.
- **Mudar de modo ou de resposta** limpa logo vencedores, empatados, resultado de equipa ou solo e a confirmação de vitória partilhada, com aviso e «Desfazer»; jogadores, pontuações, avaliação, duração, data e detalhes ficam.
- **Resultado** (`ResultChoices`, `MatchResultFields`): competitivo «Escolher vencedor(es) / Empate no 1.º lugar / Não definido»; equipa «Ganhámos / Perdemos / Empate / Não definido»; solo «Ganhei / Perdi / Empate / Não definido». Tabela Jogador · Pontos · Vencedor/Empatado · Resultado; vencedores escolhidos à mão (um ou mais; mais de um pede a confirmação de vitória partilhada); a explicação aparece uma vez. Nomes longos ou texto ampliado: o nome passa para a sua linha. No iOS, «±» e «Concluir» por cima do teclado numérico.
- **Avaliação e data**: `RatingControl` («x / 10», barra 0–10 com toque, ±0,5, ajustável com VoiceOver, zero ≠ sem avaliação, obrigatória); `DurationField` (horas e minutos, nunca pré-preenchida, «Estimativa» por omissão, «Medida» à escolha, «Não sei», confirmação abaixo de 5 min ou acima de 6 h, zero recusado); «Quando» numa linha com «Alterar»; detalhes opcionais recolhidos.
- **Rever**: Jogo, Resultado (com a lista de jogadores e «Corrigir jogadores») e Avaliação (avaliação, duração com o método, quando, local e detalhes), cada um com «Corrigir».

## Duração

- **Página do jogo** (`GameDurationsSection`, em «Sobre» depois de «A tua experiência»): «A tua média», «Média MeepleBoard» e «Indicada pelo BGG» separadas; média, número de partidas e o método numa palavra («medidas», «estimadas», «método não indicado», «métodos mistos»). Sem dados: «Ainda sem dados suficientes», sem número e sem usar o BGG.
- **Ver detalhes** (`/games/durations/[id]`): mediana, metade central, muito afastadas, o que ficou de fora (só na tua), por número de jogadores, como se calcula, a tua preferência e a duração do BGG à parte.
- **Definições → Privacidade das estatísticas**: «Contribuir para a duração da comunidade», desligado por omissão, com a explicação (o que é usado e nunca usado, todos os participantes, inclui partidas anteriores, efeito de desligar).
- **Detalhe da partida**: duração com o método («48 min · medida», «Não sei», «método não indicado», «Sem duração»); o criador corrige em «Corrigir duração».

## Diferenças face à maqueta

- O aviso de mudança de modo aparece também no passo Jogo, onde a mudança é feita.
- A escolha «Com/Sem pontuação» mantém-se visível com «Não definido», para nenhuma pontuação ficar escondida.
- «Corrigir jogadores» na revisão, para manter a correção direta que existia.
- Nomes de utilizador longos passam para a sua linha na tabela.
- Além do erro junto da avaliação ou da duração, aparece o aviso do sistema, como antes.

## Verificação

- TypeScript sem erros; 339 testes (`node --test tests/*.test.cjs`), incluindo `registration-redesign.test.cjs` (13) e os testes anteriores do registo adaptados aos 5 passos com as mesmas regras.
- WebKit: `registo-completo` (16 ecrãs, conta `participante`) e `duracao-partida`; comparação com a maqueta publicada.
- API: `GameDurations.Tests` e `verify-durations.cjs` contra SQL real.

## Por confirmar no iPhone

Ver o roteiro na entrega de 16/10/2026 e em `pendencias-funcionais.md` (REG-DUR01).
