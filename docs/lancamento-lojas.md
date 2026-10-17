# Preparação para lançamento — App Store e Google Play

**Auditoria só de leitura** de 2026-10-17, revista no mesmo dia. Não foi implementado nem publicado nada. As contas das lojas, o EAS, o Azure e a produção não foram consultados nem alterados. O DeviceTests não foi usado para escrever dados.

**Base:**

- o código da app (Expo SDK 57, React Native 0.86.3) e da API (.NET 9);
- a configuração lida com `npx expo config --type introspect`, só de leitura;
- `npm audit --omit=dev` e `dotnet list package --vulnerable --include-transitive`, só de leitura;
- os requisitos oficiais em vigor nesta data (fontes no fim).

**Como ler:**

- **Falha confirmada:** está verificada no código ou na configuração.
- **Por verificar:** depende do primeiro build, das consolas das lojas, do EAS ou do Azure. Nada que dependa destes passos está marcado como cumprido.
- **Recomendação:** não é exigida pelas lojas.
- **Bloqueia:** «Sim» significa que impede a submissão ou leva a rejeição provável.

## 1. Falhas confirmadas

| # | Falha | Evidência | Regra | Bloqueia |
| --- | --- | --- | --- | --- |
| F1 | Não há eliminação da própria conta na app | Não há ecrã nem rota da conta autenticada. Só um administrador elimina contas (`DELETE /MeepleBoard/users/{id}`). CONTA01. | Apple 5.1.1(v). Google: eliminação de conta. | **Sim** (ambas) |
| F2 | Não há página web para pedir a eliminação | Não existe página. | Google: link na Segurança dos dados, funcional e que permita o pedido sem a app. | **Sim** (Google) |
| F3 | A eliminação no servidor não trata todos os dados partilhados nem os fornecedores | Ver [proposta-eliminacao-conta.md](proposta-eliminacao-conta.md). | Apple e Google: apagar o que não é obrigatório guardar e descrever o que se guarda. | **Sim**, até estar decidido e descrito |
| F4 | Os links legais não abrem | `welcome/index.tsx` aponta para `meepleboard.com/terms`, `/privacy` e `/guidelines`. O domínio não está registado (whois: «No match», 2026-10-17). | Apple 5.1.1(i) e Google: política acessível na ficha e na app. | **Sim** |
| F5 | Não há texto da política de privacidade, dos termos nem das regras | Não há rascunho no projeto. | Apple 5.1.1(i): dados, usos, terceiros, retenção, eliminação e revogação. | **Sim** |
| F6 | Não há contacto nem URL de apoio | Nada na app nem no projeto. | Apple 1.2 e URL de apoio obrigatório. Google: e-mail de contacto obrigatório. | **Sim** |
| F7 | Não é possível bloquear utilizadores | `FriendshipStatus.Blocked` existe no domínio, sem endpoint nem ecrã. | Apple 1.2. Google: apps públicas bloqueiam utilizadores. | **Sim** |
| F8 | Não é possível denunciar perfis | Só há denúncia de publicações (`ReportSheet.tsx`) e de recursos. | Apple 1.2. Google: «report users and content». | **Sim** |
| F9 | Não há filtro de conteúdo à entrada | Nenhum filtro em comentários, etiquetas, nomes de sessões e campanhas, nem em nomes de utilizador. Só ocultação automática por número de denúncias. | Apple 1.2 («method for filtering»). | **Sim** (risco alto) |
| F10 | Permissões iOS com texto genérico e inúteis | Introspeção: «Allow $(PRODUCT_NAME) to access your photos», em inglês. Câmara, microfone e Face ID declarados sem uso. | Apple 5.1.1: o texto explica o uso. | **Sim** provável |
| F11 | Modo de API por omissão em HTTP local | `env.ts`: sem `EXPO_PUBLIC_API_MODE`, usa `http://<host>:5000`. Um build sem as variáveis de produção falha em silêncio. | Funcionamento. | **Sim**, se as variáveis faltarem (ver V6) |
| F12 | Permissões Android desnecessárias | `RECORD_AUDIO`, `READ_EXTERNAL_STORAGE` e `WRITE_EXTERNAL_STORAGE` vêm do image picker. A app só escolhe fotografias da galeria. | Google: só o necessário; constam na Segurança dos dados. | Não |
| F13 | Notificações Android sem FCM | Falta `android.googleServicesFile` em `app.json`. | Funcionamento (as notificações não chegam). | Não |
| F14 | Nome debaixo do ícone | `expo.name` é «MeepleBoardApp». | — | Não |
| F15 | Não há contas de revisão nem ficha da loja | Contas de demonstração em produção, capturas, textos, gráfico de destaque. | Apple 2.1. Google: acesso à app e ficha. | **Sim** |
| F16 | Idade mínima não definida | O registo não pede idade nem declaração. | Público-alvo (Google), classificação (Apple), RGPD art.º 8.º (13 anos em Portugal). | **Sim** (os formulários das lojas exigem a decisão) |

**Confirmado no código, sem depender do build:**

- Login só por e-mail e palavra-passe, por isso a Apple 4.8 não se aplica.
- Não há referências ao DeviceTests em `src/`.
- Aceitação dos termos no registo.
- Denúncia de publicações com 5 motivos, ocultação automática e moderação por administrador.
- Logótipo «Powered by BGG».
- `app.UseIpRateLimiting()` ativo, apesar do comentário «temporariamente desativado».

## 2. Requisitos por verificar

| # | Requisito | O que se sabe | Como confirmar | Bloqueia se falhar |
| --- | --- | --- | --- | --- |
| V1 | Build próprio, não Expo Go | `eas.json` tem perfil `production` (`autoIncrement`, versões remotas). Projeto EAS `94aba926…`, dono `rubenmpff`. | Primeiro `eas build --profile production`. | **Sim** |
| V2 | iOS compilado com Xcode 26 e SDK iOS 26 (desde 28/04/2026) | O Expo SDK 57 deve usar Xcode 26 no EAS. | Imagem do build EAS e aceitação no App Store Connect. | **Sim** |
| V3 | Android com target API 36 (desde 31/08/2026) | O valor por omissão do React Native 0.86.3 é `targetSdk = 36`, mas o valor final é o do build. | Play Console, depois do upload do AAB. | **Sim** |
| V4 | Páginas de memória de 16 KB | RN 0.86 e Expo 57 devem suportar. | Explorador de App Bundles da Play Console. | Não (obrigatório para atualizações a partir de 01/02/2027) |
| V5 | Assinatura | Não há chaves no repositório. | Credenciais iOS e Android no EAS; assinatura de apps do Google Play. | **Sim** |
| V6 | API pública por HTTPS | `env.ts` exige `https://` no modo `production`. No servidor, o HTTPS fica a cargo do App Service. | Ambiente «production» do EAS: `EXPO_PUBLIC_API_MODE=production` e `EXPO_PUBLIC_PRODUCTION_API_URL=https://…`. Azure: certificado. | **Sim** |
| V7 | ATS (iOS) | A introspeção mostra `NSAllowsArbitraryLoads: true`. | `Info.plist` do IPA de produção. | Provável pedido de justificação |
| V8 | Manifesto de privacidade iOS | `ios.privacyManifests` ausente. O Expo junta os manifestos dos módulos. | E-mail da Apple depois do primeiro upload; relatório de privacidade no Xcode. | Possível |
| V9 | Credenciais de notificações | — | APNs e FCM V1 no EAS. | Não |
| V10 | Apple Developer Program | — | Inscrição ativa; tipo (individual ou organização: o nome do vendedor fica público). | **Sim** |
| V11 | Conta Google Play | — | Pessoal ou organização, e data de criação. Pessoal criada depois de 13/11/2023: teste fechado com 12 ou mais testadores durante 14 dias seguidos. Identidade verificada. | **Sim** |
| V12 | DSA, estatuto de comerciante | Obrigatório na Apple para a UE. Com intenção de monetizar, é provável seres comerciante: o endereço, o telefone e o e-mail ficam públicos. | App Store Connect › Informação da app. Play Console: confirmar se pede a mesma declaração. | **Sim** (Apple) |
| V13 | Classificação etária e público-alvo | Há conteúdo gerado pelos utilizadores e interação entre pessoas. | Questionário Apple (4+/9+/13+/16+/18+), IARC e público-alvo da Google, coerentes com F16. | **Sim** |
| V14 | Formulários da Play Console | — | Anúncios (não), funcionalidades financeiras e de saúde (nenhuma), acesso à app, Segurança dos dados. | **Sim** |
| V15 | App Privacy (Apple) e Segurança dos dados (Google) | Dados recolhidos, todos ligados à identidade e sem rastreio: e-mail, nome de utilizador, ID, fotografias, outro conteúdo (notas, comentários, partidas, sessões), interações (biblioteca), token de push. Fornecedores: Azure, Cloudinary, Brevo, Expo, APNs e FCM. | Preencher depois de F3–F5. | **Sim** |
| V16 | Fluxos de conta A01–A08 | Abertos (`pendencias-funcionais.md`). Os e-mails usam ligações `meepleboard://`. | iPhone e Android, com contas novas e clientes de e-mail reais. | **Sim** provável (a revisão cria uma conta) |
| V17 | Fotografias públicas antigas (PR02) | O URL é recusado pela API, mas o ficheiro pode continuar público no Cloudinary. | Inventário só de leitura no Cloudinary. | Não para a loja; sim para a privacidade |
| V18 | iPad | `supportsTablet: true`, sem validação em iPad. | Decisão: validar em iPad, com capturas e revisão, ou pôr `false`. | **Sim** se ficar `true` sem capturas |
| V19 | Encriptação (exportação) | `ITSAppUsesNonExemptEncryption` ausente. A app usa só HTTPS. | Resposta no App Store Connect, ou `false` em `infoPlist`. | Não |
| V20 | Runtime .NET em produção | A exposição real de L3 depende dele. | Versão do runtime no App Service. | Não |

## 3. Recomendações

- **Notificações:** pedi-las com contexto, e não logo depois do login (Apple 5.1.2 só proíbe exigi-las).
- **Registos (logs):** deixar de registar e-mails. Hoje há `AuthService` com o e-mail em cada login, `UserCleanupJob` e erros de registo.
- **Licenças:** lista de licenças open source em «Sobre e créditos».
- **Rate limiting:** rever os limites para produção.
- **`.easignore`:** para não enviar `docs/`, `tests/` e `tools/` no upload do EAS.

## 4. Páginas públicas sem comprar um domínio

**O que é preciso:**

- política de privacidade;
- termos;
- regras da comunidade;
- apoio, com contacto;
- pedido de eliminação de conta.

São páginas estáticas, e nenhuma das lojas exige domínio próprio: só URLs públicos por HTTPS.

| Opção | Custo | URL | Prós | Contras |
| --- | --- | --- | --- | --- |
| **Cloudflare Pages** (recomendada) | Gratuito | `meepleboard.pages.dev` (se estiver livre) | HTTPS automático. Repositório privado. Publicação a partir do Git ou por upload. Domínio próprio mais tarde sem mudar nada. | Conta Cloudflare nova. |
| GitHub Pages | Gratuito (repositório público) | `<utilizador>.github.io/meepleboard` | Simples. | Repositório público, ou plano pago para privado. Nome menos limpo. |
| Azure Static Web Apps (Free) | Gratuito | `*.azurestaticapps.net` | Já usas Azure. | Mexe no Azure, fora desta ronda. |
| Servir pela própria API | Sem custo extra | `https://<api>/legal/...` | Nada novo. | Junta páginas públicas ao servidor da API, e qualquer falha da API derruba as páginas legais. |

**Apoio:** uma caixa de correio gratuita dedicada (por exemplo, Gmail ou Proton), indicada nas páginas, na app e nas fichas.

**Pedido de eliminação pela web:** ver a proposta (formulário por e-mail na primeira versão).

Quando houver domínio próprio, basta apontá-lo para o mesmo alojamento e atualizar os URLs na app e nas fichas.

## 5. Autorização BGG

**Já obtida** (informação fornecida pelo utilizador): aprovação do uso da XML API por e-mail de 11/02/2026. A condição é mostrar o logótipo «Powered by BGG», ligado ao BoardGameGeek e legível. Está cumprida na página do jogo e em «Sobre e créditos», com o ficheiro oficial sem alterações.

**Dúvidas concretas, só para confirmares no e-mail:**

1. A aprovação cobre uso com monetização? Está registada a intenção de monetizar.
2. Cobre também a importação do catálogo a partir do ficheiro de rankings (`Bgg:CatalogLocalFilePath` e `Bgg:CatalogPageUrl`), além da XML API?
3. Onde fica guardada uma cópia do e-mail? Recomenda-se fora do repositório.
4. O `Bgg__Token` de produção está definido no Azure? Não verificado.

## 6. Triagem das vulnerabilidades

Nada foi atualizado. O AutoMapper fica como está (decisão anterior: «mitigada, não resolvida»).

### App (npm, só dependências de produção do `package.json`)

O `npm audit` conta 37 ocorrências (1 crítica, 24 altas, 12 moderadas). A maioria são **cadeias**: `react-native`, `expo`, `reanimated`, `worklets`, `view-shot` e `datetimepicker` aparecem só porque dependem das ferramentas de build. As «correções» que o `npm audit` propõe são downgrades inviáveis (por exemplo, `expo@44`, `react-native@0.72`). Por isso, a triagem é feita pela vulnerabilidade de origem:

| Origem (versão instalada) | Gravidade | Quem a traz | Uso real | Correção disponível | Proposta |
| --- | --- | --- | --- | --- | --- |
| `decode-uri-component` 0.2.2 | Moderada (DoS por URL malformado) | `expo-router` 57.0.19 › `query-string` 7.1.3 | **Na app em execução** (caminhos e ligações). Exposição baixa: uma ligação maliciosa só bloqueia a própria app. | `expo-router` 58 (SDK 58) ou override para `decode-uri-component` 0.5.0 | Override testado numa etapa própria, ou esperar pelo SDK 58. |
| `shell-quote` 1.10.0 | Crítica | `react-native` › `react-devtools-core` 6.1.5 | Só em desenvolvimento (DevTools). Não entra no bundle de produção. | 1.12.0 | Override de patch, de baixo risco. |
| `node-forge` 1.4.0 | Alta | `@expo/code-signing-certificates` (CLI) | Só nas ferramentas (assinatura de atualizações, que não são usadas). | Sem versão corrigida acima de 1.4.0 no npm | Aceitar até a Expo atualizar. |
| `braces` 3.0.3 / `micromatch` 4.0.8 | Alta | Metro | Só build e servidor de desenvolvimento. | Só no Metro mais recente | Aceitar; segue as atualizações do SDK. |
| `brace-expansion` 5.0.9 | Alta | `minimatch` 10 (ferramentas) | Só build. | 5.0.12 | Override de patch. |
| `compression` 1.8.1 | Alta | `@expo/cli` (servidor de desenvolvimento) | Só desenvolvimento. | 1.8.2 | Override de patch. |
| `source-map-js` 1.2.1 | Alta | `postcss` (ferramentas) | Só build. | 1.2.2 | Override de patch. |
| `uuid` 7.0.3 | Moderada | `xcode` (config plugins) | Só prebuild. A cópia direta da app é a 11.1.1, já corrigida. | — | Aceitar. |

**Resumo:** só uma vulnerabilidade chega à app publicada (`decode-uri-component`), com impacto baixo. As outras estão nas ferramentas de build e desenvolvimento. Na próxima ronda de segurança, propor overrides de patch só para `shell-quote`, `brace-expansion`, `compression` e `source-map-js`, com verificação, e tratar `decode-uri-component` à parte.

### API (.NET)

| Pacote (versão) | Gravidade | Quem o traz | Uso real | Correção | Proposta |
| --- | --- | --- | --- | --- | --- |
| AutoMapper 14.0.0 | Alta (GHSA-rvv3-g6hj-g44x) | Direto (`MeepleBoard.Services`) | Mapeamentos internos. A mitigação está documentada. | Licença ou substituição | **Sem mudança** nesta ronda (decisão anterior). |
| System.Security.Cryptography.Xml 8.0.2 / .Pkcs 8.0.1 | Alta (GHSA-37gx-xxp4-5rgx, GHSA-846f-f764-76mx) | `Microsoft.AspNetCore.Authentication` 2.3.0 › `DataProtection` 2.3.0, puxados por pacotes ASP.NET Core 2.x antigos (`Microsoft.AspNetCore.Identity` 2.3.1, `Http.Abstractions` 2.3.0, `TourmalineCore…` 0.1.1) | Num processo .NET 9, o framework partilhado traz as suas próprias versões, já corrigidas (9.0.20 neste Mac). Exposição baixa, se produção usar um runtime 9 atualizado (V20). | Versões 9.0.x corrigidas | Referência direta às versões corrigidas, ou retirar os pacotes 2.x desnecessários. Etapa própria, com testes. |
| System.IdentityModel.Tokens.Jwt / Microsoft.IdentityModel.JsonWebTokens 7.0.3 | Moderada (GHSA-59j7-ghrg-fj52) | `AspNet.Security.OAuth.Apple` 8.3.0 › `OpenIdConnect` 7.0.3 | Login com Apple só fica ativo com credenciais, e a app não o usa. A validação dos tokens da app passa pelo JwtBearer. | 7.1.2+ ou atualizar o fornecedor Apple | Retirar o fornecedor Apple enquanto não for usado, ou atualizá-lo. Decisão tua. |

## 7. Contas a confirmar (não consegui verificar)

1. **App Store Connect:**
   - inscrição e tipo de conta;
   - DSA;
   - existe a app `com.meepleboard.app`?
   - acordos aceites.
2. **Play Console:**
   - tipo de conta e data de criação;
   - verificação de identidade;
   - existe a app `com.meepleboard.app`?
   - declaração de comerciante, se for pedida.
3. **EAS:**
   - variáveis do ambiente «production»;
   - credenciais iOS e Android;
   - APNs e FCM V1.
4. **Azure:**
   - URL HTTPS;
   - versão do runtime .NET;
   - retenção das cópias de segurança do SQL e dos registos;
   - definição (sem os valores) de `Bgg__Token` e das credenciais do Brevo e do Cloudinary.
5. **Cloudinary:** se as cópias de segurança de ficheiros estão ativas, porque guardam ficheiros apagados.
6. **Brevo:** prazo de conservação dos registos de envio.

## 8. Ordem mínima para lançar a versão atual

Sem funcionalidades do roadmap e sem redesenhar ecrãs.

1. **Eliminação da própria conta (F1–F3):** proposta em [proposta-eliminacao-conta.md](proposta-eliminacao-conta.md). As decisões vêm antes da implementação.
2. **Proteções da comunidade (F7–F9) e contacto de apoio (F6).**
3. **Páginas públicas e textos legais (F4, F5)**, alojadas como na secção 4, e e-mail de apoio.
4. **Configuração de distribuição (F10–F14):**
   - textos das permissões em PT e EN;
   - retirar câmara, microfone e Face ID;
   - permissões Android mínimas;
   - FCM;
   - nome «MeepleBoard»;
   - variáveis de produção.
5. **Segurança antes de produção:**
   - fluxos de conta A01–A08 (V16);
   - fotografias públicas antigas, PR02 (V17);
   - overrides de patch da secção 6.
6. **Builds de produção, com verificação de V1–V9.**
7. **Testes:** TestFlight, validação no iPhone e teste fechado da Google (V11).
8. **Contas, formulários e fichas (V10–V15, F15, F16, V18).**
9. **Submissão,** com notas de revisão sobre moderação, denúncia, bloqueio e eliminação de conta.

## Fontes (consultadas a 2026-10-17)

- Apple, App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple, eliminação de conta: https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion
- Apple, SDK mínimo: https://developer.apple.com/news/upcoming-requirements/?id=04282026a
- Apple, DSA: https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-compliance-information
- Google Play, eliminação de conta: https://support.google.com/googleplay/android-developer/answer/13327111
- Google Play, conteúdo gerado pelos utilizadores: https://support.google.com/googleplay/android-developer/answer/9876937
- Google Play, nível de API alvo: https://support.google.com/googleplay/android-developer/answer/11926878
- Google Play, testes para contas pessoais: https://support.google.com/googleplay/android-developer/answer/14151465
- Android, páginas de 16 KB: https://developer.android.com/guide/practices/page-sizes
- Expo, privacidade Apple: https://docs.expo.dev/guides/apple-privacy/
- Classificação etária Apple (alteração de 2025): https://9to5mac.com/2025/07/24/apple-notifies-developers-of-new-app-store-age-rating-system/
