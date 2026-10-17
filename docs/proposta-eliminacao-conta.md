# Proposta — eliminação da própria conta (CONTA01)

Proposta de 2026-10-17. Decisões aprovadas no mesmo dia (secção 4). A implementação, em DeviceTests, está descrita na secção 5.

**Requisitos:**

- **Apple 5.1.1(v):** a eliminação começa dentro da app; não basta desativar; não se pode exigir e-mail ou apoio.
- **Google:** percurso na app e um link web onde se pode pedir a eliminação; apagar os dados associados e descrever o que se conserva e porquê.
- **RGPD:** responder no prazo de um mês.

**Ponto de partida:** já existe `UserService.DeleteAsync` → `UserRepository.AnonymizeAsync`, só para administradores, numa única transação. Está verificado em `verify-account-deletion.cjs` (`MeepleBoardApi/docs/eliminacao-contas.md`). Esta proposta reaproveita esse núcleo e acrescenta o que falta.

**Princípios:**

- **O que é só da pessoa:** é apagado.
- **O que a pessoa criou e outros usam:** é tratado caso a caso. Nada é apagado só por ser partilhado, e nada fica só por ser partilhado.
- **Conteúdo de outros participantes:** nunca é apagado automaticamente, mesmo que mencione ou mostre a pessoa.

## 1. Percurso na app (decisões aprovadas a 2026-10-17)

Usa os componentes atuais, sem redesenho. A eliminação funciona mesmo com sessões ou campanhas ativas. A pessoa não tem de resolver nada à mão.

1. **Perfil › Conta › Definições:** última secção, por baixo de «Terminar sessão», uma linha a vermelho: **«Eliminar conta»**.
2. **Ecrã «Eliminar conta»** (`/settings/delete-account`), que mostra:
   - **O que é apagado** e **o que fica sem o teu nome**, num resumo curto.
   - **Avisos, só quando se aplicam.** Vêm de `GET /users/me/deletion-summary`:
     - «N sessões agendadas que organizas serão canceladas. Os convidados veem-nas como canceladas na app e recebem uma notificação, se a tiverem ativa.»
     - «A sessão a decorrer termina agora. As partidas ficam guardadas.»
     - As **campanhas que criaste e têm outros membros**, uma linha cada, com **«Novo gestor»**. Uma folha mostra os membros ativos e a opção «Ninguém». Sem escolha, a campanha fica para os outros em modo de leitura nas funções de gestão. Os membros continuam a jogar, a escrever o seu diário e a editar o nome e as notas, como já hoje podem.
     - **As notas dessas campanhas**, quando existem: «As notas podem ter texto de outros membros e ficam com a campanha. Revê-as antes de eliminar.» Há uma ligação para a campanha.
   - **Ligação** para a política de privacidade.
   - **Campo «Palavra-passe»** e **«Esqueceste-te da palavra-passe?»**:
     - envia o e-mail de recuperação que já existe e guarda no dispositivo que o pedido está a meio (válido 1 hora);
     - depois de definir a nova palavra-passe pela ligação do e-mail, a app volta a este ecrã, em vez do início de sessão.
   - **Botão «Eliminar conta definitivamente».**
3. **Confirmação final** em folha: «Esta ação não pode ser desfeita.» com «Cancelar» e «Eliminar».
4. **Resultado:**
   - **Sucesso:** a app apaga os dados locais e volta às boas-vindas com «A tua conta foi eliminada.» O acesso termina logo. Os prazos dos fornecedores estão na secção 3.3.
   - **Falha:** nada muda, e a mensagem diz o motivo.

**Na API:** `DELETE /MeepleBoard/users/me`, com `{ password, campaignTransfers: [{ campaignId, newManagerId }] }`.

| Situação | Resposta |
| --- | --- |
| Sucesso | 204 |
| Palavra-passe errada | 400 |
| Bloqueio do Identity depois de várias falhas | 429 |
| Novo gestor inválido | 400 |
| Sem sessão iniciada | 401 |

- **Repetição:** o token antigo deixa de dar acesso (401), e pedidos simultâneos produzem uma única eliminação, sem efeitos adicionais.
- **Falha da notificação push:** nunca impede a eliminação.

## 2. Pedido pela web (Google)

Página estática **«Eliminar conta MeepleBoard»** (alojamento: `lancamento-lojas.md`, secção 4).

- **Explica o percurso na app.** Para quem já não tem a app: **pedido por e-mail** para o endereço de apoio.
- **Verificação da identidade:** não confiamos no remetente, porque o remetente de um e-mail pode ser falsificado.
  1. O administrador regista o pedido com o e-mail indicado (`POST /MeepleBoard/admin/account-deletion/requests`). A resposta é sempre igual, exista ou não a conta.
  2. Se a conta existir, a API envia **para o endereço da conta** uma ligação de uso único, válida 24 horas (token do Identity, finalidade própria).
  3. A ligação abre uma página da API com o resumo e o botão **«Eliminar conta»**. A eliminação faz-se com esse pedido POST, nunca só por abrir a ligação, porque os programas de correio podem abri-las sozinhos.
  4. Concluída a eliminação, a página confirma-o e é enviado um **e-mail de conclusão** para o endereço capturado antes da anonimização (esse endereço não fica guardado).
  5. Uma ligação já usada ou expirada mostra «Ligação inválida ou expirada» e não faz nada.
- **Prazos explicados na página:**
  - resposta ao pedido em até 5 dias úteis;
  - eliminação logo que a pessoa confirma pela ligação;
  - em qualquer caso, no máximo um mês desde o pedido (RGPD).
- **Campanhas por esta via:** ficam sem novo gestor (modo de leitura), e as sessões seguem as mesmas regras.

## 3. Dados — o que acontece a cada um

**Legenda:** **Apagado** · **Anonimizado** (sem nada que identifique a pessoa) · **Neutro** (texto substituído por um título neutro) · **Conservado** (com motivo e prazo) · **Hoje** (o que `AnonymizeAsync` já fazia).

**Títulos neutros:** guardados como marcadores sem língua (`deleted:session:2026-10-17`, `deleted:campaign`). A app traduz-os no mesmo ponto onde já traduz «Conta eliminada»: em PT «Sessão de 17 out. 2026» e «Campanha sem título»; em EN «Session on 17 Oct 2026» e «Untitled campaign».

### 3.1 Conta e dados só da pessoa

| Dados | Proposta | Hoje |
| --- | --- | --- |
| Nome, e-mail, telefone, palavra-passe, 2FA, *security stamp* | Apagado. Fica uma linha técnica (ID, `deleted:xxxxxxxx`, `DeletedAt`, `CreatedAt`). | ✅ |
| `LastActiveAt` | Apagado. | ❌ → novo |
| Fotografia de perfil | O URL é apagado. Se for um ficheiro nosso, também é apagado (com as mesmas tentativas das fotografias). | URL ✅ |
| Token de push, acessos externos, tokens, claims, papéis, refresh tokens, registos de reenvio | Apagado. | ✅ |
| Coleção (incluindo preço), amizades e pedidos | Apagado. | ✅ |
| Diário: avaliações, notas, etiquetas, publicações (e as denúncias feitas a elas) | Apagado; as médias são recalculadas. | ✅ |
| Fotografias que a pessoa pôs no diário | Apagado no Cloudinary, depois da transação. **Três tentativas imediatas.** Se continuar a falhar, fica um job com novas tentativas (Hangfire em produção). A conta fica eliminada em qualquer caso. | ✅ (sem nova tentativa) → novo |
| Dados no dispositivo (tokens, memória da conta, pesquisas recentes, caches) | Apagado pela app. | ❌ → novo |

### 3.2 Conteúdo partilhado com outras pessoas

| Caso | Proposta | Porquê | Hoje |
| --- | --- | --- | --- |
| Lugar, resultado, pontuação nas partidas com outros participantes | **Anonimizado** («Conta eliminada»). Jogo, pontuações, resultados, duração e data **ficam**. | Dados estruturados do registo de quem fica. | ✅ |
| Texto livre escrito pela pessoa nas partidas que criou: `Location`, `ScoreSummary`, `Tags` | **Apagado.** | Pode ter dados pessoais (D4). | ❌ → novo |
| Ações dos outros participantes nessas partidas | **Continuam**: avaliar, nota pessoal, etiquetas e fotografias do próprio diário, publicar. | Cada um gere os seus dados (D5). | ✅ (a confirmar nos testes) |
| Dados comuns dessas partidas (jogo, jogadores, resultado, duração) | **Só leitura**: só o criador os corrigia. | Distinção de D5. | ✅ (implícito) |
| Partidas sem mais nenhum participante ativo | **Apagadas**, com diários, publicações e ligações a campanhas; as médias são recalculadas. | Não pertencem a mais ninguém. | ❌ → novo |
| Título do encontro de campanha (`SessionTitle`) nas partidas que a pessoa criou | **Apagado** (a app mostra «Sessão N»). | Texto da pessoa. | ❌ → novo |
| Texto escrito por **outros** (diários, publicações, partidas que criaram, nome e notas que editaram) | **Não é tocado.** | Conteúdo de terceiros. | ✅ |
| Sessões agendadas que organiza | **Canceladas** (estado «Cancelada», que a app já mostra). O nome passa a neutro e o local é apagado. Push aos convidados, se disponível; uma falha não bloqueia. Na app, a sessão sai das listas e, aberta, aparece como cancelada. | Sem organizador, ninguém a gere (D9). | ❌ → novo |
| Sessão a decorrer que organiza | **Terminada** agora (o mesmo fecho condicional de «Terminar sessão»). Nome neutro, local apagado. As partidas ficam. | Regra atual. | ❌ → novo |
| Sessões já terminadas que organizou | Ficam no histórico dos outros. **Nome neutro e local apagado.** | D3: o nome foi escrito pela pessoa. | ❌ → novo |
| Lugar em sessões de outros (aceites) | Anonimizado. Convites por responder: apagados. | Histórico dos outros. | ✅ |
| Campanhas criadas, **com novo gestor escolhido** | Passam para esse membro. **Nome neutro**; as notas ficam. | D2: o nome foi escrito na criação; as notas podem ter texto de outros. | ❌ → novo |
| Campanhas criadas, **sem novo gestor** | Ficam para os membros, com as funções de gestão só de leitura. **Nome neutro**; as notas ficam. | D2 e D3. | ❌ → novo |
| Campanhas criadas **sem outros membros ativos** | **Apagadas** (as partidas seguem as regras acima). | Só eram da pessoa. | ❌ → novo |
| Notas de campanha | Ficam com a campanha. O ecrã de eliminação mostra-as para revisão. | Não se sabe quem as escreveu, porque qualquer membro as edita: apagar podia remover texto de outros; conservar sem aviso podia guardar texto da pessoa. | — |
| Recursos de jogos sugeridos | Conservados (catálogo público). `SuggestedById` é apagado. | Sem dados pessoais. | ❌ → novo |
| Denúncias feitas pela pessoa (publicações e recursos) | **Abertas:** ficam, visíveis só para administradores. O texto é apagado quando a denúncia é resolvida e, no máximo, **90 dias depois da eliminação da conta** (job de limpeza). **Já resolvidas:** o texto é apagado logo. Fica o motivo (lista fechada), sem texto livre. | D6: moderação, sem retenção indefinida. | ❌ → novo |

### 3.3 Fornecedores e cópias (prazos separados)

| Onde | O que fica | Prazo e tratamento | Confirmar |
| --- | --- | --- | --- |
| Base de dados (Azure SQL) | Nada do que está acima como apagado. | Imediato. | — |
| Cópias de segurança do Azure SQL | Dados anteriores à eliminação. | Até expirar a cópia (7–35 dias, conforme a configuração). Num restauro, as eliminações voltam a ser aplicadas a partir das linhas técnicas. | Prazo |
| Registos da API (App Service) | Hoje: o e-mail em cada início de sessão. | Passa a não registar e-mails. Os registos antigos expiram segundo a configuração. | Prazo |
| Cloudinary | Fotografias. | Apagadas logo, com tentativas e job. Invalidação da CDN pedida. | Cópias de ficheiros (backup) |
| Brevo | Registos dos e-mails enviados. | Segundo o prazo do Brevo, indicado na política. | Prazo e API |
| Expo Push, APNs e FCM | O token, que é apagado da nossa base. | Os fornecedores não guardam conteúdo. | — |
| Dispositivo | Dados locais. | Apagados pela app no fim do percurso. Noutros dispositivos, a sessão termina na próxima utilização (401). | — |

## 4. Decisões (aprovadas a 2026-10-17)

| # | Decisão |
| --- | --- |
| D1 | **Imediata.** Os prazos dos fornecedores e das cópias estão na tabela 3.3. |
| D2 | **Novo gestor à escolha** entre os membros ativos. Sem escolha: a campanha fica só de leitura nas funções de gestão, e isso não impede a eliminação. |
| D3/D4 | **Título neutro** para os nomes escritos pela pessoa (sessões, campanhas criadas). Apagar local, resumo, etiquetas e títulos de encontro escritos por ela. Conservar os dados estruturados das partidas e todo o texto de outras pessoas. |
| D5 | **Partidas partilhadas preservadas.** Cada participante continua a gerir os seus dados; os dados comuns ficam só de leitura. |
| D6 | **Texto das denúncias** apagado na resolução e, no máximo, 90 dias depois da eliminação. Visível só para administradores. |
| D7 | **E-mail com verificação** por ligação de uso único enviada para o endereço da conta, confirmação por POST e e-mail de conclusão. |
| D8 | **Palavra-passe**, com recuperação a partir do ecrã e regresso a ele. |
| D9 | **Push quando disponível.** O estado aparece na app sem notificações, e uma falha no envio não impede nada. |

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

## 6. Estado da implementação (2026-10-17, DeviceTests)

**Implementado:**

- **API:** commits `c76cf66`, `f5a728b`, `33bf5bd` e `56c3f12`; detalhe em `MeepleBoardApi/docs/eliminacao-contas.md`.
- **App:** commits `846a763` e `9bfe2a6`.

**Testes:**

| Onde | Resultado |
| --- | --- |
| `Accounts.Tests` | 8 passam |
| Restantes projetos de testes da API | Todos passam |
| `verify-own-account-deletion.cjs` (SQL real, contas descartáveis) | Passa por inteiro, com falhas simuladas do Cloudinary e do push e três pedidos simultâneos |
| App | 367 testes passam, incluindo 6 do ecrã, o regresso depois do reset e os títulos neutros em PT e EN |

As sessões e contas do roteiro não mudaram.

**Pendente:**

- ~~Validação no iPhone~~: feita a 2026-10-17 (secção 7).
- **Página web pública «Eliminar conta»** (texto da secção 2), na etapa das páginas públicas. O endereço de apoio também não existe ainda.
- **Ligação de uso único em produção:** o URL usa `Request.Scheme` e `Host`. Atrás do App Service, confirmar que sai `https` (cabeçalhos encaminhados) antes de usar em produção.
- **Fornecedores:** confirmar os prazos do Azure, do Cloudinary e do Brevo para a política.

**O verificador antigo `verify-account-deletion.cjs`** não foi corrido nesta ronda, porque cria atividade temporária na conta «autor» do roteiro. O caminho do administrador é o mesmo `DeleteAsync` e está coberto pelos testes isolados e pelo novo verificador.

## 7. Validação no iPhone (2026-10-17)

**Percurso:** o utilizador eliminou no iPhone (Expo Go, DeviceTests) a conta descartável de `iphone-account-deletion.json`, pelo ecrã «Eliminar conta», e escolheu **Teste-conta-fica-a** como novo gestor. A eliminação ficou registada às 22:49:57 (Lisboa).

**Acesso, com tokens guardados só em memória antes da eliminação:**

| Teste | Resultado |
| --- | --- |
| Token de acesso antigo, `/users/me` e `/matches/pending-journal` | 401 |
| Refresh token antigo | 401, não renova |
| Login com a palavra-passe antiga | 400 «Invalid credentials» |

A mudança foi detetada 6 segundos depois. O processo de monitorização terminou nesse momento.

**Cenário do iPhone (leituras e pedidos recusados, sem alterar dados):**

- **Campanha com novo gestor:** passou para Teste-conta-fica-a, com título neutro. Ficaram as notas que A tinha escrito e os membros B e «Conta eliminada». Teste-conta-fica-b não a pode apagar (403).
- **Campanha sem novo gestor:** ficou com B, título neutro e gestão só de leitura. B não a pode apagar (403).
- **Campanha só da pessoa:** foi apagada.
- **Sessões:**
  - a agendada saiu das listas;
  - a que estava a decorrer terminou;
  - a terminada ficou com título neutro e sem local;
  - todas mantêm A como participante e a pessoa eliminada como «Conta eliminada»;
  - a sessão de A ficou intacta.

**Operação real de gestão, numa campanha descartável própria (fora do cenário do iPhone):** uma conta nova R criou uma campanha com A e B, jogou uma partida com A e outra sozinha, e eliminou a conta com A como novo gestor.

- **Campanha:** B foi recusado (403) e a campanha continuou lá. A apagou-a (204) e a campanha deixou de existir (404).
- **Partida partilhada:**
  - continua para A, com pontuações 9 e 4, duração de 50 min e R como «Conta eliminada»;
  - o resumo e o local escritos por R foram apagados;
  - o diário de A ficou, e A continua a poder editar a nota pessoal;
  - a avaliação já guardada continua fechada, como em qualquer partida;
  - os dados comuns da partida ficam só de leitura (403).
- **Partida solo de R:** foi apagada.

**Limitação conhecida, para decisão futura:** autoria e gestão da campanha usam os mesmos campos (`Campaign.CreatorId` e `CampaignMember.IsCreator`). Depois da transferência, o novo gestor aparece com a etiqueta «Criador», e não há registo de quem criou a campanha originalmente. Há duas opções:

- mudar a etiqueta para «Gestor», só no texto;
- separar a gestão num campo próprio, com migração.

**Correção feita durante a validação** (commit `a855a88`): remover membros não é exclusivo de quem gere, porque qualquer membro o pode fazer. O ecrã passou a dizer que, sem novo gestor, ninguém pode apagar, concluir ou abandonar a campanha.

**Dados de teste:**

- **O que fica:** a conta eliminada, a campanha transferida, as sessões e a partida partilhada da verificação manual, todos com as contas descartáveis.
- **Limpeza:** são removidos na próxima execução de `verify-own-account-deletion.cjs`, que limpa no fim tudo o que pertence às contas descartáveis.
- **Roteiro:** as contas e as sessões do roteiro não mudaram (as contagens são iguais às de antes).

## 8. Sucessor obrigatório nas campanhas (2026-10-17)

Esta decisão substitui a escolha «Ninguém» de D2 e a gestão só de leitura (secções 1, 3.2 e 7).

- **Regra:** uma campanha mantém sempre um gestor enquanto tiver outros membros aceites e ativos.
- **Na eliminação:** o sucessor é o escolhido ou, sem escolha, o membro ativo há mais tempo. O ecrã mostra-o antes da confirmação, e a API valida-o de novo no momento.
- **Autoria:** fica com quem escreveu a campanha, com a etiqueta «Criador», também como «Conta eliminada». O sucessor aparece como «Gestor».
- **Permissões:**
  - remover membros, concluir, abandonar e apagar: só quem gere;
  - concluir e abandonar: só a partir de «Ativa»;
  - convidar e editar nome e notas: membros aceites;
  - retirar uma partida: quem a jogou ou quem gere.

O detalhe, os testes e a reparação dos dados de teste estão em `MeepleBoardApi/docs/eliminacao-contas.md` («Gestão e autoria das campanhas»).
