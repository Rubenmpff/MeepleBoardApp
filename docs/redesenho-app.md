# Redesenho da app

Implementação da direção aprovada em [mockups/app/direcao/proposta.html](mockups/app/direcao/proposta.html) (capturas «antes» em `mockups/app/direcao/antes/`). Ramo `feat/app-redesign`; ponto de partida `checkpoint/pre-app-redesign`. Trabalho feito e validado apenas em DeviceTests (API 5099, Expo 8082, base `MeepleBoard_DeviceTests`). A aprovação visual final depende do iPhone.

## Decisões aprovadas e como foram aplicadas

1. **＋ na barra:** folha com Registar partida, Nova sessão, Adicionar jogo e Nova campanha. «Registar partida» continua direto e destacado no Início, na página de cada jogo (com o jogo já escolhido) e nas ações da biblioteca.
2. **Amigos dentro de Perfil:** secção com os amigos mais frequentes e «Ver todos e procurar pessoas»; a lista completa é uma subpágina de Perfil com retorno. Na criação de sessões e nos convites, os amigos continuam disponíveis dentro do próprio fluxo.
3. **Jogos:** «A minha biblioteca» e «Descobrir jogos» separados no mesmo separador. Rankings mantém área própria em Descobrir, porque passá-lo a ordenação perderia os modos Geral/Minha.
4. **Quero / Já joguei:** o servidor guarda e devolve `Wishlist` e `Played` (verificador `tools/DeviceTestApi/verify-library-statuses.cjs`, repositório da API). «Quero» foi ativado ao adicionar. «Já joguei» não foi exposto: ver L-PLAYED01 em [pendencias-funcionais.md](pendencias-funcionais.md).
5. **Ações de risco no fim:** Encerrar/Cancelar sessão, Concluir/Abandonar/Sair da campanha e Terminar sessão estão no fim da página, em texto vermelho (Concluir em verde), cada uma com a confirmação que já existia.

## Organização

- `src/ui/` — base visual partilhada: `theme.ts` (única paleta; `constants/colors`, `styles/appTheme`, `styles/clubTheme` e `features/auth/styles/authTheme` derivam dela), `components.tsx` (Section, Card, Row, Segmented, FilterChips, Avatar, EmptyState…), `Sheet.tsx`, `Screen.tsx`, `format.ts` (datas, horas e avaliações).
- `src/components/navigation/ScreenHeader.tsx` e `src/components/ui/ScreenLayout.tsx` (contexto `EmbeddedScreen` para ecrãs dentro dos separadores Jogos e Jogar).
- `src/features/navigation/` — folha ＋ e separador Jogar. `src/features/users/screens/ProfileHomeScreen.tsx` — separador Perfil.
- Cores: verde = ações/tu; lavanda = destaque; dourado suave = algo à tua espera; violeta = amigo; vermelho apenas em ações de risco.

## Por etapa

| Etapa | Âmbito |
| --- | --- |
| Base | Paleta única, cabeçalhos, barra com cinco lugares, folha ＋, Perfil |
| Jogos | Biblioteca/Descobrir, página do jogo, adicionar com estado, Rankings |
| Partidas | Passos do registo, página da partida com acesso ao diário, avaliações pendentes |
| Jogar | Lista e detalhe de sessões, criação de sessão, campanhas |
| Perfil | Amigos como subpágina, Definições em listas, Terminar sessão no fim |
| Início e entrada | Data legível da última partida; etiquetas dos interruptores também alternam; paleta da entrada em tokens |

## Ferramenta de comparação

`tools/visual-preview/` desenha os ecrãs reais (TSX) em WebKit com dados vivos do DeviceTests, apenas com pedidos GET. Cenários em `tools/visual-preview/scenarios/` (`jogos`, `registar`, `partidas`, `jogar`, `perfil`, `inicio`, …). As capturas vão para `tools/visual-preview/out/`, que não entra no controlo de versões. Instruções em [../tools/visual-preview/README.md](../tools/visual-preview/README.md).

## Por confirmar no iPhone

- Barra inferior e folha ＋ (área segura, Dynamic Type, VoiceOver).
- Interruptor do prazo de resposta na criação de sessão e linhas que alternam ao tocar no texto.
- Separadores segmentados no detalhe da campanha e na lista de amigos com texto grande.
- Teclado sobre os campos do diário da campanha e das notas.
- Cores de estado (dourado/violeta) com o modo de contraste aumentado.
