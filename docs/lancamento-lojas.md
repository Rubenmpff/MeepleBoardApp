# Preparação para lançamento — App Store e Google Play (auditoria de 2026-10-17)

Esta auditoria é só de leitura. Não foi implementado nem publicado nada. As contas das lojas, o EAS, o Azure e a produção não foram consultados nem alterados. O DeviceTests não foi usado para escrever dados.

**Base:** código da app (Expo SDK 57, React Native 0.86.3) e da API (.NET 9), a configuração efetiva lida com `npx expo config --type introspect` (só leitura) e os requisitos oficiais em vigor nesta data (fontes no fim).

**Legenda:**

- **Estado:** ✅ cumprido · ❌ em falta · ❔ por verificar.
- **Bloqueia:** **Sim** impede a submissão ou leva a rejeição provável · **Não** é obrigatório, mas não impede a submissão · **Rec.** é uma recomendação.

## Resumo

A versão atual **não pode ser submetida**. Os bloqueios estão quase todos fora dos ecrãs existentes:

1. **Eliminação da própria conta:** não existe na app (CONTA01), nem há a página web que a Google exige.
2. **Documentos legais:** o domínio `meepleboard.com` não está registado (o whois responde «No match», em 2026-10-17). Por isso, os links da app para os Termos, a Política de Privacidade e as Regras da Comunidade não abrem. Também não há URL de suporte nem contacto público.
3. **Conteúdo da comunidade:** já é possível denunciar publicações, e elas ficam escondidas automaticamente com denúncias. Falta bloquear utilizadores, denunciar uma pessoa e filtrar conteúdo à entrada (Apple 1.2; Google, conteúdo gerado pelos utilizadores).
4. **Builds e configuração de produção:** têm de ser compilações próprias, não o Expo Go, e não está confirmado que apontem para a API pública por HTTPS.
5. **Contas e formulários das lojas:** estão todos por verificar (tipo de conta, testes fechados da Google, DSA, classificação etária, declarações de privacidade).

## 1. Eliminação da própria conta

| # | Item | Estado | Evidência | Regra | Bloqueia |
| --- | --- | --- | --- | --- | --- |
| E1 | Percurso na app para eliminar a própria conta | ❌ | Não há ecrã nem rota da conta autenticada; só um administrador elimina (`DELETE /MeepleBoard/users/{id}`). CONTA01 em `pendencias-funcionais.md`. | Apple 5.1.1(v): a eliminação começa dentro da app, sem exigir e-mail ou apoio. Google: percurso na app, fácil de encontrar. | **Sim** (ambas) |
| E2 | Página web para pedir a eliminação | ❌ | Não existe página nem domínio. | Google: o link vai na secção «Segurança dos dados». Tem de funcionar, referir a app ou o programador e permitir o pedido sem reinstalar a app. | **Sim** (Google) |
| E3 | Anonimização no servidor | ✅ parcial | `UserRepository.AnonymizeAsync`, numa só transação. Apaga: nome, e-mail, telefone, palavra-passe, 2FA, acessos externos, tokens, push token, URL da fotografia de perfil, biblioteca, amizades, convites não aceites, todo o diário (notas, avaliações, fotografias, publicações), e a nota e avaliação antigas nas partidas criadas. As fotografias do diário são apagadas do Cloudinary (públicas antigas e autenticadas). Verificado em `verify-account-deletion.cjs`. | Apple e Google: apagar a conta e os dados associados que não seja legalmente obrigatório guardar. | — |
| E4 | O que fica depois de anonimizar | ❔ | Ver a lista abaixo. Anonimizar o nome **não** resolve estes casos: falta decidir caso a caso e descrevê-lo na política. | Google: o que se guarda e porquê tem de estar descrito (por exemplo, na política de privacidade). Apple 5.1.1(i): retenção e eliminação explicadas. | **Sim**, enquanto não estiver decidido e descrito |
| E5 | Fornecedores e cópias de segurança | ❔ | Brevo (registos de envio de e-mail), cópias de segurança do Azure SQL e registos do App Service guardam dados por algum tempo. | Google: pedir também aos fornecedores que apaguem. Indicar prazos na política. | Não (descrever na política) |

**O que fica hoje, e porquê:**

- **Lugar nas partidas partilhadas, sessões aceites e campanhas**, com «Conta eliminada». Fica para não mudar os resultados dos outros. Defensável, mas tem de ser descrito.
- **Texto livre escrito pela pessoa em registos partilhados:**
  - nome e local das sessões que organizou;
  - nome e notas das campanhas que criou;
  - `Location`, `ScoreSummary` e `Tags` das partidas que criou;
  - recursos de jogos que sugeriu.

  Estes textos podem ter dados pessoais (por exemplo, «Casa do Ruben»). **Decisão necessária:** limpar, manter, ou permitir à pessoa apagá-los antes de eliminar a conta.
- **Na linha da conta:** `CreatedAt`, `LastActiveAt` e `DeletedAt`. `LastActiveAt` não precisa de ficar.
- **Denúncias feitas pela pessoa:** ficam sem a identificar (moderação).
- **Fotografias da pessoa no diário de outros participantes:** pertencem ao diário de quem as tirou. Hoje não há forma de as denunciar, porque a denúncia só existe para publicações.
- **Ficheiro da fotografia de perfil:** o URL é limpo, mas o ficheiro não é apagado do armazenamento. A app não carrega fotografias de perfil. Confirmar se existem em produção (por exemplo, vindas de OAuth).

## 2. Conteúdo da comunidade

Há conteúdo público: as publicações de experiência (comentário e avaliação) aparecem a todos na página do jogo, e os nomes de utilizador aparecem na pesquisa de pessoas. Há também conteúdo partilhado com os participantes: fotografias, etiquetas e resumos.

| # | Item | Estado | Evidência | Regra | Bloqueia |
| --- | --- | --- | --- | --- | --- |
| C1 | Denunciar conteúdo | ✅ publicações · ❌ fotografias e perfis | `POST /experiences/{id}/reports`, com 5 motivos (`ReportSheet.tsx`). Não há denúncia de pessoas, de fotografias partilhadas nem de nomes de utilizador. | Apple 1.2: forma de denunciar e resposta atempada. Google: apps públicas «report users and content». | **Sim** (perfis) |
| C2 | Bloquear utilizadores | ❌ | `FriendshipStatus.Blocked` existe no domínio, mas não há endpoint nem ecrã. Remover um amigo não impede que essa pessoa veja publicações ou volte a pedir amizade. | Apple 1.2: bloquear utilizadores abusivos. Google: apps públicas «block users». | **Sim** |
| C3 | Filtrar conteúdo inaceitável à entrada | ❌ | Não há filtro nos comentários, etiquetas, nomes de sessões e campanhas nem nos nomes de utilizador. Só existe ocultação automática por número de denúncias (`ExperienceReport.AutoHideThreshold`). | Apple 1.2: «a method for filtering objectionable material». | **Sim** (Apple, risco alto) |
| C4 | Moderação | ✅ | Ecrã «Moderação» (administrador), com manter, esconder e repor. Os recursos sugeridos também têm denúncia e administração. | Google: moderação razoável. Apple: resposta atempada. | — |
| C5 | Regras e aceitação antes de criar conteúdo | ✅ na app · ❌ nas páginas | O registo exige aceitar os Termos (interruptor de consentimento). O link «Regras da Comunidade» aponta para `meepleboard.com/guidelines`, que não existe. | Google: aceitar os termos antes de criar conteúdo, e os termos definem o que é inaceitável. | **Sim** |
| C6 | Contacto de apoio publicado | ❌ | Não há e-mail nem URL de apoio na app nem no repositório. | Apple 1.2 (contacto) e URL de apoio obrigatório nos metadados. Google: e-mail de contacto obrigatório na ficha. | **Sim** |

## 3. Privacidade

| # | Item | Estado | Evidência | Regra | Bloqueia |
| --- | --- | --- | --- | --- | --- |
| P1 | Política de privacidade publicada e acessível | ❌ | Os links (`welcome/index.tsx`) apontam para o domínio não registado. Depois do login, o link só existe nas boas-vindas. | Apple 5.1.1(i): link nos metadados **e** na app, fácil de encontrar. Google: obrigatória na ficha e na app. | **Sim** |
| P2 | Conteúdo da política | ❌ | Não existe texto. | Apple 5.1.1(i): dados, usos, terceiros, retenção e eliminação, revogação do consentimento. | **Sim** |
| P3 | Fornecedores externos | ❔ | Encontrados no código: Azure (alojamento e SQL), Cloudinary (fotografias), Brevo (e-mail), serviço de push da Expo, com APNs e FCM (token). O BGG recebe só pedidos do servidor, sem dados de utilizadores. Não há SDK de analítica, publicidade ou crash. | Apple 5.1.1(i)/5.1.2. RGPD: subcontratantes. | **Sim** (na política) |
| P4 | Declarações App Privacy (Apple) e Segurança dos dados (Google) | ❔ | Por preencher. Dados recolhidos, todos ligados à identidade e sem rastreio: e-mail, nome de utilizador, ID de utilizador, fotografias, outro conteúdo do utilizador (notas, comentários, partidas, sessões), interações na app (biblioteca, partidas), token de push. «Local» só como texto livre. | Ambas obrigatórias. A da Google inclui as perguntas sobre eliminação. | **Sim** |
| P5 | Consentimentos | ✅ parcial | Aceitar os termos no registo. A partilha de durações está desligada por omissão. A privacidade da coleção é configurável. | RGPD. Apple 5.1.2. | Não |
| P6 | Idade mínima | ❔ | O registo não pede idade nem declaração. Em Portugal, o consentimento próprio para serviços online vale a partir dos 13 anos. | Google: público-alvo. Apple: classificação etária. RGPD art.º 8.º | Não (decisão: declarar 13+ ou 16+ nos termos e nas lojas) |
| P7 | Fotografias públicas antigas (PR02) | ❔ | O URL público é recusado pela API, mas o ficheiro pode continuar público no Cloudinary. | Proteção de dados. | Rec. forte (antes de lançar) |
| P8 | Manifesto de privacidade iOS (`PrivacyInfo.xcprivacy`) | ❔ | `ios.privacyManifests` ausente. O Expo junta os manifestos dos módulos, mas a Apple nem sempre lê bem os das dependências. | Apple: razões declaradas para as APIs que as exigem. | ❔ (confirmar no primeiro upload; a Apple avisa por e-mail) |

## 4. Autenticação e permissões

| # | Item | Estado | Evidência | Regra | Bloqueia |
| --- | --- | --- | --- | --- | --- |
| A1 | Métodos de login | ✅ | A app só tem e-mail e palavra-passe. Os botões Google e Apple foram retirados (A07). Na API, Google e Apple só se ativam com credenciais e não são usados pela app. | Apple 4.8: só se aplica com login de terceiros. Se Google voltar, é preciso Sign in with Apple ou equivalente. | — |
| A2 | Fluxos de conta: registo, confirmação de e-mail, recuperação | ❔ | A01–A08 abertas (`pendencias-funcionais.md`). Os e-mails usam ligações `meepleboard://` (por confirmar como abrem no Gmail e no Outlook). | Apple 2.1: app completa. A revisão vai criar uma conta. | ❔ (risco de rejeição se a confirmação de e-mail falhar) |
| A3 | Permissão de notificações | ✅ com reparo | É pedida logo depois do login (`(app)/_layout.tsx`), não é obrigatória e a app funciona sem ela. | Apple 5.1.2: não exigir. | Rec. (pedir com contexto) |
| A4 | Textos das permissões iOS | ❌ | Introspeção: textos genéricos em inglês («Allow $(PRODUCT_NAME) to access your photos»). Também estão declarados câmara, microfone e Face ID, que a app não usa. | Apple 5.1.1: o texto explica o uso concreto. | **Sim** provável (rejeição comum por textos genéricos) |
| A5 | Permissões Android | ❌ | `RECORD_AUDIO`, `READ_EXTERNAL_STORAGE` e `WRITE_EXTERNAL_STORAGE` (vêm do image picker), sem uso. A app só escolhe fotografias da galeria. | Google: pedir só o necessário; as permissões aparecem na Segurança dos dados. | Não (Rec. forte: retirar) |
| A6 | Encriptação (exportação) | ❔ | `ITSAppUsesNonExemptEncryption` não está definido. A app usa só HTTPS. | App Store Connect pergunta em cada envio. | Rec. (`false` em `infoPlist`) |

## 5. Distribuição e builds

| # | Item | Estado | Evidência | Regra | Bloqueia |
| --- | --- | --- | --- | --- | --- |
| D1 | Builds independentes do Expo Go | ❔ | `eas.json` tem perfil `production` (`autoIncrement`, versões remotas). Projeto EAS `94aba926…`, dono `rubenmpff`. Não há registo de nenhum build de produção. | As lojas só aceitam binários próprios (IPA/AAB). | **Sim** até haver build |
| D2 | iOS: Xcode 26 / SDK iOS 26 (desde 28/04/2026) | ❔ provável ✅ | O Expo SDK 57 compila no EAS com Xcode 26 (confirmar a imagem no build). | Apple, requisito de SDK mínimo. | **Sim** se falhar |
| D3 | Android: target API 36 (desde 31/08/2026) | ✅ | `react-native/gradle/libs.versions.toml`: `targetSdk = 36`, `compileSdk = 36`, `minSdk = 24`. | Google, nível de API alvo. | — |
| D4 | Páginas de memória de 16 KB | ❔ provável ✅ | RN 0.86 e Expo 57. Confirmar no explorador de App Bundles da Play Console. | Android: obrigatório para atualizações a partir de 01/02/2027. | Não (por agora) |
| D5 | Assinatura | ❔ | Não há keystore nem certificados no repositório (o `.gitignore` exclui-os). | Google: assinatura de apps do Google Play. Apple: certificado de distribuição e perfil. | **Sim** até configurar (credenciais geridas pelo EAS) |
| D6 | API pública por HTTPS | ❔ | `env.ts` exige `https://` em `production`. **Mas o modo por omissão é `local`** (`http://…:5000`): um build sem `EXPO_PUBLIC_API_MODE=production` e `EXPO_PUBLIC_PRODUCTION_API_URL` no ambiente EAS «production» liga-se a HTTP local. Na API, o HTTPS é tratado pelo App Service (`UseHttpsRedirection` comentado). | Funcionamento. Apple ATS. | **Sim** se as variáveis faltarem |
| D7 | ATS (iOS) | ❔ | A introspeção mostra `NSAllowsArbitraryLoads: true`. Confirmar no `Info.plist` do build de produção. | Apple: justificar exceções ao ATS. | ❔ |
| D8 | Sem ferramentas nem dados do DeviceTests | ✅ | `src/` não tem referências a DeviceTests, `meepleboard.test`, 5099 nem IPs locais. `tools/` e `tests/` não entram no bundle. As contas e o anfitrião DeviceTests estão só na API (`tools/DeviceTestApi`), fora da publicação. | — | — |
| D9 | Notificações push em builds próprios | ❔ | Falta `android.googleServicesFile` (FCM) em `app.json`. As credenciais APNs e FCM V1 no EAS estão por confirmar. Sem elas, as notificações não chegam, embora a app funcione. | Funcionamento. | Não |
| D10 | Nome apresentado | ❔ | `expo.name` é «MeepleBoardApp» e aparece debaixo do ícone. | — | Rec. («MeepleBoard») |
| D11 | iPad | ❔ | `supportsTablet: true`: são obrigatórias capturas de iPad, e a revisão também testa em iPad. Nunca foi validado em iPad. | Apple, metadados e 2.1. | Decisão: validar em iPad ou pôr `false` |

## 6. Submissão e contas das lojas

| # | Item | Estado | O que tens de confirmar | Bloqueia |
| --- | --- | --- | --- | --- |
| S1 | Apple Developer Program | ❔ | Inscrição ativa. Tipo (individual ou organização: o nome do vendedor aparece na loja). | **Sim** |
| S2 | Conta Google Play | ❔ | Pessoal ou organização, e data de criação. **Pessoal criada depois de 13/11/2023:** obrigatório um teste fechado com ≥ 12 testadores ativos durante 14 dias seguidos antes de pedir acesso à produção (recomenda-se recrutar 15–20). Organização: não. Identidade do programador verificada. | **Sim** |
| S3 | DSA, estatuto de comerciante (UE) | ❔ | Apple: declaração obrigatória (sem ela, a app não aparece na UE). Se houver intenção de monetizar, é provável seres comerciante e o endereço, o telefone e o e-mail ficam públicos. Google: confirmar na Play Console se pede a mesma declaração. | **Sim** (Apple) |
| S4 | Classificação etária | ❔ | Apple: novo questionário (4+/9+/13+/16+/18+), com conteúdo gerado pelos utilizadores e interação entre pessoas. Google: questionário IARC. | **Sim** |
| S5 | Público-alvo (Google) | ❔ | Declarar que não é para crianças (13+ ou 16+, coerente com P6). Se incluíres menores de 13, aplica-se o programa Famílias. | **Sim** |
| S6 | Restantes formulários da Play Console | ❔ | Anúncios (não), funcionalidades financeiras (nenhuma), saúde (nenhuma), acesso à app (credenciais), Segurança dos dados. | **Sim** |
| S7 | Contas para revisão | ❌ | Contas de demonstração **em produção**, com dados fictícios: partidas, sessões, amigos e publicações, para mostrar a comunidade e a moderação. As contas do DeviceTests não servem, porque são locais. Apple 2.1 e Google «Acesso à app». | **Sim** |
| S8 | Ficha da loja | ❌ | Capturas (iPhone 6,9″; iPad se D11; Android telemóvel), ícone de 1024 px (Apple) e 512 px (Google), gráfico de destaque 1024×500 (Google), descrição curta e longa, palavras-chave, categoria, URL de apoio, URL de marketing (opcional) e URL da política. | **Sim** |
| S9 | Testes antes de submeter | ❌ | Validação no iPhone pendente em vários percursos (REG-DUR01, RESULT01, Início). TestFlight e teste fechado ou interno na Google. | Apple 2.1 (sem falhas) |

## 7. Licenças e dependências

| # | Item | Estado | Evidência | Bloqueia |
| --- | --- | --- | --- | --- |
| L1 | Autorização do BGG | ✅ parcial | Aprovação da XML API por e-mail de 11/02/2026, com a condição do logótipo «Powered by BGG» (implementado: `PoweredByBgg.tsx`, página do jogo e «Sobre e créditos»). O e-mail não está guardado no projeto. A licença **comercial** (há intenção de monetizar) está por confirmar (`MeepleBoardApi/docs/recursos-jogos.md`). `Bgg__Token` de produção por confirmar. | ❔ Não para a loja; **Sim** legalmente se monetizares sem licença comercial |
| L2 | AutoMapper 14.0.0 (NU1903, alta) | ❔ mitigada, não resolvida | Decisão registada: manter com a mitigação; a substituição fica para mais tarde. | Não (risco aceite e documentado) |
| L3 | Outras vulnerabilidades .NET | ❔ novas | `dotnet list package --vulnerable` (só leitura): `System.Security.Cryptography.Pkcs` 8.0.1 e `System.Security.Cryptography.Xml` 8.0.2 (altas, transitivas); `System.IdentityModel.Tokens.Jwt` e `Microsoft.IdentityModel.JsonWebTokens` 7.0.3 (moderadas). | Não (Rec. forte: triagem antes de produção) |
| L4 | Vulnerabilidades npm | ❔ | `npm audit --omit=dev`: 1 crítica (`shell-quote`), 24 altas e 12 moderadas. A maioria vem das ferramentas de build (Metro, CLI). As que chegam ao runtime (`react-native`, `reanimated`, `view-shot`, `datetimepicker`) precisam de triagem. Não foi executado `npm audit fix`. | Não (Rec.: triagem) |
| L5 | Rate limiting na API | ✅ | `app.UseIpRateLimiting()` está ativo, embora o comentário diga «temporariamente desativado». Rever os limites para produção. | Rec. |
| L6 | Licenças de terceiros na app | ❔ | «Sobre e créditos» mostra o BGG. Não há lista de licenças open source. | Rec. |

## O que tens de confirmar nas contas (não consegui verificar)

1. **App Store Connect:**
   - inscrição e tipo de conta;
   - estatuto DSA;
   - existe a app `com.meepleboard.app` com o nome «MeepleBoard»?
   - acordos (Free Apps) aceites.
2. **Play Console:**
   - tipo de conta e data de criação (define se se aplica a regra dos 12 testadores durante 14 dias);
   - verificação da identidade;
   - existe a app `com.meepleboard.app`?
   - declaração de comerciante, se for pedida.
3. **EAS (expo.dev, projeto `94aba926…`):**
   - variáveis do ambiente «production»: `EXPO_PUBLIC_API_MODE=production`, `EXPO_PUBLIC_PRODUCTION_API_URL=https://…`;
   - credenciais iOS e Android e chaves de push (APNs, FCM V1).
4. **Azure:**
   - URL público por HTTPS e certificado;
   - retenção das cópias de segurança do SQL e dos registos;
   - `Bgg__Token` e as credenciais do Brevo e do Cloudinary definidas (sem as mostrar).
5. **Domínio:**
   - registar `meepleboard.com` (ou outro) e decidir onde ficam as páginas legais, a página de eliminação e o apoio;
   - criar o e-mail de apoio.
6. **BGG:**
   - guardar uma cópia do e-mail de autorização (fora do repositório público, se tiver dados pessoais);
   - confirmar se cobre uso comercial.

## Ordem mínima de trabalho para lançar a versão atual

Sem funcionalidades do roadmap e sem redesenhar ecrãs.

1. **Domínio, apoio e textos legais (fora do código):** registar o domínio, publicar a Política de Privacidade, os Termos, as Regras da Comunidade e a página de apoio, e criar o e-mail de apoio. A política tem de descrever o que fica depois de eliminar a conta (E4 e E5) e os fornecedores (P3).
2. **Decisões de produto e jurídicas:**
   - o que acontece ao texto livre partilhado ao eliminar a conta (E4);
   - idade mínima (P6);
   - estatuto de comerciante (S3);
   - iPad sim ou não (D11);
   - licença comercial do BGG (L1).
3. **CONTA01:** eliminação da própria conta na app (Perfil › Conta, com confirmação e reautenticação), a rota da conta autenticada sobre a anonimização que já existe, e a página web de pedido (E1–E4).
4. **Mínimo de segurança da comunidade:**
   - bloquear utilizadores e denunciar perfis (C1, C2);
   - filtro básico de termos inaceitáveis nos textos públicos (C3);
   - contacto de apoio visível na app (C6).
5. **Configuração de distribuição em `app.json` e no EAS:**
   - textos das permissões em PT e EN, sem câmara, microfone nem Face ID (A4);
   - permissões Android mínimas (A5);
   - `ITSAppUsesNonExemptEncryption` (A6);
   - nome «MeepleBoard» (D10);
   - FCM e APNs (D9);
   - variáveis de produção (D6).
6. **Segurança antes de produção:** fechar ou aceitar formalmente A01–A08 (fluxos de conta), PR02 (fotografias públicas antigas) e a triagem de L3/L4. O AutoMapper fica como risco aceite (L2).
7. **Builds de produção:** EAS `production` para iOS e Android; confirmar Xcode 26, ATS, manifesto de privacidade e 16 KB (D1–D8).
8. **Testes:** TestFlight e validação no iPhone dos percursos pendentes. Na Google, teste fechado (12 ou mais testadores durante 14 dias, se a conta for pessoal).
9. **Fichas e formulários:**
   - App Privacy e Segurança dos dados (P4);
   - classificação etária e público-alvo (S4, S5);
   - restantes formulários da Play Console (S6);
   - capturas e textos (S8);
   - contas de revisão em produção (S7).
10. **Submissão:** Apple e Google, com notas de revisão a explicar a moderação, a denúncia, o bloqueio e a eliminação de conta.

**Recomendações que não bloqueiam:**

- pedir as notificações com contexto (A3);
- lista de licenças open source (L6);
- rever os limites do rate limiting (L5);
- `.easignore` para não enviar `docs/`, `tests/` e `tools/` no upload do EAS.

## Fontes (consultadas a 2026-10-17)

- Apple, App Store Review Guidelines (1.2, 2.1, 2.2, 4.8, 5.1.1, 5.1.2): https://developer.apple.com/app-store/review/guidelines/
- Apple, eliminação de conta (5.1.1(v)): https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion
- Apple, SDK mínimo (Xcode 26, desde 28/04/2026): https://developer.apple.com/news/upcoming-requirements/?id=04282026a
- Apple, DSA (estatuto de comerciante): https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-compliance-information
- Google Play, eliminação de conta: https://support.google.com/googleplay/android-developer/answer/13327111
- Google Play, conteúdo gerado pelos utilizadores: https://support.google.com/googleplay/android-developer/answer/9876937
- Google Play, nível de API alvo: https://support.google.com/googleplay/android-developer/answer/11926878
- Google Play, testes para contas pessoais novas: https://support.google.com/googleplay/android-developer/answer/14151465
- Android, páginas de 16 KB: https://developer.android.com/guide/practices/page-sizes
- Expo, privacidade Apple: https://docs.expo.dev/guides/apple-privacy/
- Classificação etária Apple (alteração de 2025): https://9to5mac.com/2025/07/24/apple-notifies-developers-of-new-app-store-age-rating-system/
