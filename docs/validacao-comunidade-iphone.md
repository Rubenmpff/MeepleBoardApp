# Roteiro curto — proteções da comunidade no iPhone (DeviceTests)

Preparado a 2026-10-18. Usa contas descartáveis próprias, nunca as contas do roteiro principal (autor, participante, alheio, membro, admin).

## Contas

- **Criação:** `node tools/DeviceTestApi/community-validation.cjs setup` (na API). Já foi feita.
- **Credenciais:** ficam em `MeepleBoardApi/.device-tests/community-validation-setup.json`, só no Mac. Não são mostradas em lado nenhum.

| Pessoa | Papel no teste |
| --- | --- |
| **Ana** (Teste-ana-…) | Quem usa o iPhone. Amiga de Bruno, Carla e Duarte. |
| **Bruno** | Vai ser bloqueado. Aceitou a sessão «Noite da validação» de Carla. |
| **Carla** | Organiza «Noite da validação» (Ana convidada, por responder). Jogou Wingspan com Ana e tem uma fotografia no diário. |
| **Duarte** | Ana já o denunciou por assédio, por isso aparece na moderação. É ele quem fica suspenso. |
| **admin** | Administrador só destas contas. |

**Antes de começar:** a API de testes foi reiniciada. Se a app tiver uma sessão aberta, inicia sessão de novo.

## Passos

1. **Bloquear.** Entra como Ana. Em Amigos, abre Bruno e toca em ⋯ › «Bloquear».
   - Confirma o texto «Deixam de ser amigos…» e escolhe «Bloquear».
   - **Esperado:** voltas atrás e Bruno sai dos amigos.
   - Em «Procurar utilizadores», escreve «Teste-bruno»: não aparece.
2. **Convite indisponível.** Abre a lista de sessões: «Noite da validação» já não aparece. O convite ficou impossível de aceitar, porque Bruno aceitou essa sessão.
3. **Desbloquear.** Vai a Definições › Comunidade › «Pessoas bloqueadas».
   - Aparece Bruno. Toca em «Desbloquear» e confirma.
   - **Esperado:** a lista fica vazia («Não bloqueaste ninguém.»).
   - Bruno não volta aos amigos.
   - «Noite da validação» volta à lista de sessões, com «Aceitar».
4. **Denunciar uma fotografia.** Abre a partida de Wingspan com Carla › Diário.
   - Toca na fotografia de Carla, depois em «Denunciar fotografia».
   - Escolhe um motivo e toca em «Enviar». **Esperado:** mensagem de agradecimento; a fotografia continua lá.
5. **Denunciar uma pessoa.** Abre o perfil de Carla e toca em ⋯ › «Denunciar». Escolhe um motivo e envia.
   - **Esperado:** agradecimento, sem bloquear nem alterar a amizade.
6. **Moderar.** Termina a sessão e entra como admin. Vai a Perfil › Moderação.
   - **Pessoas:** Duarte aparece (Assédio ou ameaça · 1) e Carla também.
   - Em Duarte, toca em «Suspender…», escolhe «7 dias», escreve um motivo e toca em «Suspender».
   - **Fotografias:** aparece a fotografia de Carla. Escolhe «Manter» ou «Remover fotografia».
7. **Suspensão.** Termina a sessão e entra como Duarte.
   - **Esperado:** a entrada é recusada com «A tua conta está suspensa até … Para contestar a suspensão ou pedir a eliminação da conta, contacta o apoio do MeepleBoard.»
   - O endereço de apoio continua pendente.
8. **Levantar a suspensão.** Entra como admin › Moderação › Pessoas.
   - Duarte aparece como suspenso. Toca em «Levantar suspensão» e confirma.
   - Entra como Duarte: a entrada funciona, com uma sessão nova.

## No fim

`node tools/DeviceTestApi/community-validation.cjs teardown setup` remove estas pessoas e tudo o que fizeram.

## Registo: a nota pessoal da Ana (18/10/2026)

**Observado.** Numa captura das 20:33 (Lisboa), o detalhe da partida mostrava «Nota pessoal · Ahahahshhsan». Ao mesmo tempo, o Diário mostrava o campo vazio, e a leitura seguinte do servidor não devolve nota.

**Factos dos registos.** O diagnóstico só guarda método, caminho, código e hora, nunca o conteúdo dos pedidos.
- Houve duas gravações do Diário da Ana nessa partida: `PUT …/journal` às 19:31:17 e às 19:32:35 UTC, ambas com 200.
- Não houve nenhuma outra escrita nessa entrada.
- A entrada tem a última alteração às 19:32:35 e não tem nota.
- Na app, só o «Guardar» do Diário escreve ali, e só fica ativo quando o conteúdo difere do que foi carregado.

**Hipótese (não confirmada).** A nota foi guardada às 19:31 e esvaziada na gravação das 19:32. Os registos não permitem saber o que foi enviado nem confirmar que a nota foi apagada por quem usava o iPhone. A nota não foi recriada.

**Defeito encontrado e corrigido.** O detalhe da partida só carregava ao abrir. Ao voltar do Diário, continuava a mostrar a nota antiga, o que explica a diferença na captura. Agora volta a carregar ao regressar (app `c00af16`).

**Testes acrescentados:**
- `tools/DeviceTestApi/verify-journal-note.cjs`, com pessoas descartáveis e SQL real;
- o teste «note: save → back…» em `tests/experience-organisation.test.cjs`.

Os dois cobrem este percurso:
1. guardar uma nota e voltar ao detalhe: o texto aparece;
2. apagar a nota e guardar: o detalhe fica sem nota;
3. cancelar sem guardar: a nota anterior mantém-se, e o outro jogador nunca a recebe.
