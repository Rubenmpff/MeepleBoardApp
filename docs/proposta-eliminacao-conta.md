# Proposta — eliminação da própria conta (CONTA01)

Proposta de 2026-10-17, **por aprovar**. Nada está implementado.

**Requisitos:**

- **Apple 5.1.1(v):** a eliminação começa dentro da app; não basta desativar; não se pode exigir e-mail ou apoio.
- **Google:** percurso na app e um link web onde se pode pedir a eliminação; apagar os dados associados e descrever o que se conserva e porquê.
- **RGPD:** responder no prazo de um mês.

**Ponto de partida:** já existe `UserService.DeleteAsync` → `UserRepository.AnonymizeAsync`, só para administradores, numa única transação. Está verificado em `verify-account-deletion.cjs` (`MeepleBoardApi/docs/eliminacao-contas.md`). Esta proposta reaproveita esse núcleo e acrescenta o que falta.

**Princípios:**

- **O que é só da pessoa:** é apagado.
- **O que a pessoa criou e outros usam:** é tratado caso a caso. Nada é apagado só por ser partilhado, e nada fica só por ser partilhado.
- **Conteúdo de outros participantes:** nunca é apagado automaticamente, mesmo que mencione ou mostre a pessoa.

## 1. Percurso na app

Usa os componentes atuais (`Section`, `Row tone="danger"`, `Card`, `Note`, `PrimaryButton`), sem redesenho.

1. **Perfil › Conta › Definições:** na última secção, por baixo de «Terminar sessão», uma nova linha a vermelho: **«Eliminar conta»**.
2. **Ecrã «Eliminar conta»** (`/settings/delete-account`), que mostra:
   - **O que é apagado:** perfil, e-mail, amigos, coleção, notas, avaliações, fotografias e publicações.
   - **O que fica nas partidas partilhadas, sem o teu nome:** o teu lugar e o resultado, como «Conta eliminada», para não mudar o histórico dos outros.
   - **Avisos só quando se aplicam:**
     - «Organizas N sessões agendadas: serão canceladas e os convidados avisados.»
     - «Tens 1 sessão a decorrer: termina agora; as partidas ficam guardadas.»
     - «Criaste N campanhas com outros membros: passam para {membro}.»
   - **Ligação** para a política de privacidade.
   - **Campo «Palavra-passe»**, para confirmar a identidade.
   - **Botão «Eliminar conta definitivamente»,** desativado até haver palavra-passe.
3. **Confirmação final** em folha: «Esta ação não pode ser desfeita.» com «Cancelar» e «Eliminar».
4. **Resultado:**
   - **Sucesso:** a app apaga a sessão e os dados locais (tokens no SecureStore, memória da conta, pesquisas recentes e caches) e volta às boas-vindas com «A tua conta foi eliminada.»
   - **Falha:** a mensagem diz o motivo e nada muda (por exemplo, «Palavra-passe incorreta», ou falha de rede com «Tentar novamente»).

**Na API:** `DELETE /MeepleBoard/users/me` com `{ password }`.

| Situação | Resposta |
| --- | --- |
| Sucesso | 204 |
| Palavra-passe errada | 400 |
| Sem sessão iniciada | 401 |
| Pedidos repetidos | 429 (limite próprio) |

- **Cancelar sessões agendadas e terminar a sessão a decorrer:** usa as regras já existentes (`CancelSessionAsync` e o fecho por `SaveCloseAsync`).
- **Tokens:** depois da eliminação, os anteriores deixam de dar acesso. Já é assim desde 2026-10-17.

## 2. Pedido pela web (Google)

Página estática **«Eliminar conta MeepleBoard»** no alojamento das páginas públicas (ver `lancamento-lojas.md`, secção 4).

**Primeira versão (simples):**

- **Explica o percurso na app:** Perfil › Definições › Eliminar conta.
- **Para quem já não tem a app:** pedir por e-mail para o endereço de apoio, **a partir do e-mail da conta**, com o assunto «Eliminar conta».
- **Explica** o que é apagado e o que se conserva (a tabela da secção 3, resumida) e o prazo: até 30 dias.
- **Processo interno:**
  1. responder ao mesmo e-mail a pedir confirmação;
  2. com a confirmação, um administrador usa o endpoint que já existe (`DELETE /users/{id}`);
  3. responder a confirmar que foi feito.
- **Registo dos pedidos:** data do pedido e da eliminação, sem conteúdo.

**Versão seguinte (opcional):** formulário com o e-mail. A API envia uma ligação de uso único, válida 1 hora, e a eliminação faz-se ao abri-la. A resposta é sempre igual, exista ou não a conta, para não revelar quem tem conta.

## 3. Dados — o que acontece a cada um

**Legenda:**

- **Apagado:** deixa de existir.
- **Anonimizado:** fica sem nada que identifique a pessoa.
- **Conservado:** fica, com motivo e prazo.
- **Hoje:** o que `AnonymizeAsync` já faz.

### 3.1 Conta e dados só da pessoa

| Dados | Onde | Proposta | Hoje |
| --- | --- | --- | --- |
| Nome de utilizador, e-mail, telefone, palavra-passe, 2FA, *security stamp* | `AspNetUsers` | Apagado. Fica uma linha técnica com o ID, o nome neutro `deleted:xxxxxxxx` («Conta eliminada») e `DeletedAt`, para manter as partidas partilhadas coerentes. | ✅ |
| Fotografia de perfil | `ProfilePictureUrl` e o ficheiro | Apagado: o URL e, se for nosso, o ficheiro no Cloudinary. | URL ✅, ficheiro ❌ |
| `LastActiveAt` | `AspNetUsers` | Apagado. | ❌ |
| `CreatedAt` | `AspNetUsers` | Conservado na linha técnica (não identifica). | — |
| Token de push | `ExpoPushToken` | Apagado. | ✅ |
| Acessos externos, tokens, claims, papéis, refresh tokens (com `DeviceInfo`) | Tabelas Identity e `RefreshTokens` | Apagado. | ✅ |
| Registos de reenvio de e-mail | `EmailResendLogs` | Apagado. | ✅ |
| Coleção, incluindo preço pago e estado | `UserGameLibraries` | Apagado. | ✅ |
| Amizades e pedidos (e bloqueios, quando existirem) | `Friendships` | Apagado. | ✅ |
| Preferências (privacidade da coleção, partilha de durações) | `AspNetUsers` | Repostas: privada e desligada. | ✅ |
| Diário: avaliação, nota pessoal, etiquetas | `MatchJournalEntries` | Apagado. As médias MeepleBoard são recalculadas. | ✅ |
| Fotografias que a pessoa pôs no diário (partilhadas com os participantes) | `MatchJournalEntries.PhotoUrls` e Cloudinary | Apagado: são conteúdo da pessoa, mesmo que os outros as vejam. Falhas no armazenamento são repetidas automaticamente (job), em vez de só ficarem num aviso no registo. | ✅ (sem nova tentativa) |
| Publicações de experiência (comentário e avaliação pública) e as denúncias feitas a elas | `MatchExperiencePublications` e `ExperienceReports` | Apagado. | ✅ |
| Nota e avaliação antigas guardadas na própria partida | `Matches.Notes` e `PersonalRating` | Apagado. | ✅ |
| Dados no dispositivo | SecureStore, AsyncStorage | Apagado pela app no fim do percurso. | ❌ (novo) |

### 3.2 Conteúdo partilhado com outras pessoas

| Caso | Proposta | Porquê | Hoje |
| --- | --- | --- | --- |
| Lugar e resultado nas partidas com outros participantes | **Anonimizado:** «Conta eliminada», com o resultado e a pontuação. | São parte do registo de cada participante. Retirá-los mudava vitórias, empates e estatísticas de quem fica. | ✅ |
| Partidas sem mais nenhum participante ativo (solo, ou com todos os outros já eliminados) | **Apagadas**, com as respetivas fotografias, diários e ligações a sessões e campanhas. Recalcular as médias. | Não há mais ninguém a quem pertençam. | ❌ (ficam anónimas) |
| Partidas criadas pela pessoa, com outros participantes: `Location` e `Tags` (texto livre) | **Apagados.** | O local pode ser uma morada. As etiquetas antigas copiavam as da pessoa. | ❌ |
| Mesmas partidas: `ScoreSummary` (por exemplo, «17–0») | **Conservado.** | Descreve o resultado comum. **Decisão D4.** | — |
| Mesmas partidas: permissão para as corrigir | Ninguém as pode corrigir, como em qualquer partida cujo criador desapareça (só leitura). | Mudar o dono seria uma regra nova. **Decisão D5.** | ✅ (implícito) |
| Sessões agendadas que organiza | **Canceladas** (regra atual de cancelar), com aviso aos convidados. | Sem organizador, ninguém as gere. | ❌ (ficam órfãs) |
| Sessão a decorrer que organiza | **Terminada já.** As partidas ficam. | É a regra de «Terminar sessão». | ❌ |
| Sessões já terminadas que organizou | Ficam no histórico dos participantes, com o organizador «Conta eliminada». **`Location` apagado.** O nome fica. | O nome identifica o encontro para os outros. **Decisão D3.** | ❌ (o local fica) |
| Convites de sessão por responder (recebidos) | Apagado. | — | ✅ |
| Lugar em sessões aceites | Anonimizado. | Histórico dos outros. | ✅ |
| Campanhas que criou, com outros membros | **Passam para o membro ativo mais antigo.** O nome e as notas da campanha ficam. | As funções de criador (apagar, gerir membros) ficavam sem ninguém. As notas são conteúdo comum da campanha. **Decisão D2.** | ❌ (ficam sem gestor) |
| Campanhas que criou, sem outros membros | **Apagadas** (as partidas mantêm-se segundo as regras acima). | Só eram da pessoa. | ❌ |
| Lugar como membro noutras campanhas | Anonimizado, no histórico dos encontros. | — | ✅ |
| Recursos de jogos que sugeriu (título, ligação pública) | **Conservados**, com `SuggestedById` apagado. | É catálogo público, sem dados pessoais. | ⚠️ (o ID fica) |
| Denúncias que fez (publicações e recursos) | **Conservadas** sem a identificar. O texto livre (`Detail`, `Comment`) é apagado quando a denúncia é resolvida. | Moderação e prevenção de abusos, que são motivo legítimo para conservar. **Decisão D6.** | ✅ (o texto fica sempre) |
| Fotografias, notas ou publicações **de outras pessoas** onde a pessoa aparece ou é mencionada | **Não apagadas automaticamente.** A pessoa pode pedir a remoção pelo apoio. A pessoa que as publicou ou a moderação decide. | São conteúdo de outra pessoa. Apagá-las automaticamente prejudicava terceiros. A denúncia de fotografias fica para a etapa da comunidade. | — |

### 3.3 Fornecedores e cópias

| Fornecedor | O que tem | Proposta | Verificar |
| --- | --- | --- | --- |
| Azure SQL | Cópias de segurança (point-in-time) | Os dados apagados desaparecem quando a cópia expira (7–35 dias, conforme a configuração). Indicá-lo na política. Se houver um restauro, voltar a aplicar as eliminações com a lista de contas eliminadas (as linhas técnicas). | Prazo configurado |
| Azure App Service | Registos (logs) | Deixar de registar e-mails. Hoje o login regista o e-mail e o dispositivo. Indicar o prazo de conservação dos registos. | Prazo configurado |
| Cloudinary | Fotografias | `Destroy` com invalidação da CDN. Novas tentativas automáticas. | Se as cópias de segurança de ficheiros estão ativas |
| Brevo | E-mail e registos de envio | Conservados pelo Brevo segundo o seu prazo. Indicar na política e, se houver API para isso, pedir a eliminação do contacto. | Prazo e API |
| Expo Push / APNs / FCM | Token do dispositivo | Apagado da nossa base. Os fornecedores não guardam conteúdo. | — |
| BoardGameGeek | Nada da pessoa | — | — |
| Hangfire | Argumentos de jobs | Hoje não há dados pessoais. Os novos jobs de fotografias levam só URLs, sem identidade. | — |

## 4. Decisões necessárias antes de implementar

1. **D1. Momento da eliminação:** imediata (recomendado, o mais simples e aceite pelas lojas) ou período de arrependimento de N dias, com a conta bloqueada.
2. **D2. Campanhas com outros membros:** passar para o membro ativo mais antigo (recomendado), ou deixá-las sem gestor.
3. **D3. Sessões terminadas:** apagar o local e manter o nome (recomendado), ou substituir também o nome por um genérico («Sessão de 17 out. 2026»).
4. **D4. `ScoreSummary` das partidas criadas:** conservar (recomendado) ou apagar.
5. **D5. Partidas criadas, com outros participantes:** ficar só de leitura (recomendado) ou passar a correção para outro participante.
6. **D6. Texto livre das denúncias feitas pela pessoa:** apagar quando a denúncia é resolvida (recomendado) ou conservar.
7. **D7. Pedido pela web:** primeira versão por e-mail (recomendado) ou já com o formulário e a ligação de uso único.
8. **D8. Confirmação de identidade:** palavra-passe (recomendado) ou código por e-mail.
9. **D9. Aviso aos convidados das sessões canceladas:** notificação push (recomendado; o serviço já existe) ou sem aviso.

## 5. Âmbito da implementação (depois das decisões)

**API:**

- `DELETE /users/me`, com palavra-passe e limite de pedidos;
- extensão de `AnonymizeAsync` para os pontos ❌ e ⚠️ das tabelas;
- cancelar e terminar sessões, e passar campanhas, com as regras atuais;
- job com novas tentativas para os ficheiros no Cloudinary;
- deixar de registar e-mails.

**App:**

- linha em Definições, o ecrã e a folha de confirmação;
- limpeza local;
- textos em PT e EN.

**Páginas:** «Eliminar conta», a política (secção de eliminação e conservação) e a página de apoio. Fica para a etapa das páginas públicas, com o texto definido aqui.

**Testes:**

- **Isolados:** domínio, serviço e HTTP (autorização, palavra-passe, idempotência, sessões e campanhas).
- **Com SQL real no DeviceTests:** verificador com contas descartáveis próprias, como o `verify-session-close.cjs`. Cobre as partidas partilhadas e as solo, as sessões, as campanhas com e sem membros, os recursos, as denúncias e as médias no fim.
- **Na app:** testes do ecrã.

**Fora do âmbito:** bloqueio de utilizadores, denúncia de perfis e fotografias, e filtro de conteúdo (etapa seguinte). Não há alterações à produção, ao Azure nem aos segredos.

**Migrações:** em princípio, nenhuma. `SuggestedById` já aceita null, e transferir campanhas muda só o `CreatorId`. Se for preciso um registo de pedidos pela web, fica fora da base, num registo interno.
