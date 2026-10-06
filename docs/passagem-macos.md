# Passagem do MeepleBoard para macOS

**Continuação no Mac:** o utilizador escolheu e validou SQL Server local em Docker por emulação. A adaptação antes descrita como pendente foi implementada; ver [resultado, proteções e comandos macOS](../../MeepleBoardApi/docs/testes-macos-docker.md). O restante guia conserva o contexto da passagem original e a alternativa de host x86-64. A base habitual permanece intacta. O utilizador confirmou health no Safari, Expo 8082, login, Início e Sessões sem erros 401 no iPhone. Próximo percurso: registo de partidas numa sessão ativa, um passo de cada vez.

Verificação: 6 de outubro de 2026. O utilizador confirmou **Apple Silicon M2**. Este guia não modifica nem substitui o ambiente Windows ativo. A solução recomendada é API/Expo nativos no Mac e SQL Server num **host Linux x86-64 dedicado a testes**, ligado por rede privada. O frontend e os testes isolados podem ser preparados entretanto; o arranque da API com SQL no Mac está bloqueado pela ligação LocalDB fixa no anfitrião atual.

## Repositórios e estado enviado

| Repositório | URL | Branch a clonar | Ponto de referência antes deste guia |
|---|---|---|---|
| Frontend | https://github.com/Rubenmpff/MeepleBoardApp.git | `feat/session-invitation-experience` | `fafedab` |
| Backend | https://github.com/Rubenmpff/MeepleBoardApi.git | `fix/session-invite-accepted-friends` | `2f9ce9a` |

Antes da documentação, ambos estavam limpos; após `git fetch origin`, a comparação com upstream deu `0 0`. A história do frontend inclui pontuações (`8753a97`), correções TypeScript (`820b98d`), os seis grupos de design, navegação (`a278a7c`), privacidade (`ab42706`), catálogo/preços (`aa04f46`), estabilização de escrita/datas e convites. A história do backend inclui pontuações (`75b96e1`), autorização (`88db80f`), ambiente descartável (`315b68e`), estabilização de escrita (`0c18de6`), UTC (`83ad5bc`) e amizade aceite nos convites (`2f9ce9a`). As branches preservam essas alterações; não usar `main` como ponto de partida desta passagem.

```bash
mkdir -p "$HOME/Projects/MeepleBoard"
cd "$HOME/Projects/MeepleBoard"
git clone --branch feat/session-invitation-experience https://github.com/Rubenmpff/MeepleBoardApp.git
git clone --branch fix/session-invite-accepted-friends https://github.com/Rubenmpff/MeepleBoardApi.git
```

Não copiar pastas `node_modules`, `bin`, `obj`, `.expo` nem ficheiros locais do Windows. Os repositórios privados, se aplicável, exigem autenticação GitHub local; nunca inserir tokens em URLs ou ficheiros versionados.

## Ferramentas e versões

- Git e ferramentas de linha de comandos Apple: `xcode-select --install` se ainda não estiverem instaladas. Xcode completo só é necessário para simulador/compilação iOS nativa; o percurso Expo Go no iPhone não exige essa compilação.
- Node: referência Windows **22.14.0**, npm **11.10.0**. Usar Node 22 compatível, no mínimo **22.13.0**, conforme `engines` de React Native/Metro no lockfile. O projeto não tem uma versão Node fixada por `.nvmrc` nem `engines` no `package.json`; o lockfile é a referência das dependências. Não atualizar dependências durante a passagem.
- Frontend: `package.json` pede Expo `^57.0.9`; `package-lock.json` resolve **57.0.20**, React Native **0.86.3**, React **19.2.3**, TypeScript **6.0.3**. Instalar com `npm ci`, não instalar Expo CLI global. Usar Expo Go compatível com SDK 57; verificar a compatibilidade no dispositivo, não a presumir a partir do Windows.
- .NET SDK **9.0**: os projetos são `net9.0`; referência Windows **9.0.312**. Escolher instalador **arm64** ou **x64** segundo o Mac. EF Core **9.0.2** está declarado no backend. Não existe `global.json` a fixar SDK. O SDK 10 sozinho não é um substituto garantido do runtime 9 para executar estes projetos.
- SQL Server: provider real `Microsoft.EntityFrameworkCore.SqlServer`; não substituir por SQLite/PostgreSQL para estes testes. No M2, recomendar host Linux x86-64 dedicado com SQL Server 2022 Developer, apenas para desenvolvimento/testes. O endereço e a disponibilidade desse host ainda não foram fornecidos.
- `dotnet-ef` não é necessário para o anfitrião de testes: ele executa `MigrateAsync`. Não executar `dotnet ef database update` contra a configuração habitual.

Fontes oficiais: [instalação .NET em macOS](https://learn.microsoft.com/en-us/dotnet/core/install/macos), [suporte .NET](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core). .NET 9 termina suporte em **10 de novembro de 2026**; uma futura atualização é uma tarefa separada, não faz parte desta passagem.

## Configuração e informação sensível

Verificação dos ficheiros atuais e regras Git: `.env`/`.env.local` e `.expo` do frontend estão ignorados; `.device-tests/`, incluindo `accounts.json`, fixtures HTTP, outbox e fotografias, está ignorado no backend. Não estão na lista de ficheiros versionados. As chaves/segredos e a ligação SQL de `appsettings.json` estão vazios; os templates usam referências locais/variáveis, sem credenciais reais identificadas nos ficheiros de configuração revistos. O Compose existente referencia a palavra-passe através do ambiente.

**Atenção:** `MeepleBoardApi/appsettings.Development.json` está versionado apesar da regra de ignore, porque já era tracked. Contém configuração de logging e um caminho Windows para o catálogo, não credenciais; esse caminho não é portátil. `.gitignore` não protege um ficheiro já versionado. Nunca colocar segredos nesse ficheiro. Esta revisão não é uma certificação de ausência de segredos em toda a história Git; se algum segredo tiver sido publicado no passado, remover do último commit não basta e será necessário rodá-lo.

Configuração habitual (apenas inventário, não necessária para testes): ligação SQL, `JWT_KEY`, emissor/audiência JWT, OAuth Google/Apple, Brevo/email, Cloudinary, BGG e credenciais do dashboard Hangfire. Preservar os nomes definidos no código; obter valores por canal privado e usar configuração local/user-secrets. Não copiar os valores habituais para o ambiente descartável.

O anfitrião `tools/DeviceTestApi/Program.cs` usa `CreateEmptyBuilder`, ignora `appsettings`, user-secrets e ligações SQL do ambiente habitual. Gera a chave JWT por processo, mantém email em ficheiros, fotografias locais, BGG simulado e notificações/jobs desativados. Após reiniciar, voltar a fazer login.

Variáveis frontend de testes, apenas no processo Expo:

```bash
EXPO_PUBLIC_API_MODE=local
EXPO_PUBLIC_API_PORT=5099
EXPO_PUBLIC_API_BASEPATH=/MeepleBoard
REACT_NATIVE_PACKAGER_HOSTNAME=<IPv4-do-Mac-na-rede-local>
```

O endereço local da API deriva do anfitrião Expo em `src/constants/env.ts`. No modo local, API e Expo devem estar no **mesmo Mac**; se SQL estiver num host remoto, isso não altera o endereço HTTP da API no Mac. Variáveis `EXPO_PUBLIC_*` são públicas no bundle e nunca devem conter segredos.

## SQL descartável no M2: recomendação e impedimento confirmado

LocalDB e autenticação integrada Windows não funcionam no macOS. Há **três ligações LocalDB fixas** em `tools/DeviceTestApi/Program.cs`: configuração do DbContext, ligação `master` e ligação à base descartável. Alterar só a primeira seria insuficiente. Definir `ConnectionStrings__DefaultConnection` atualmente **não funciona**, porque o anfitrião ignora essa configuração.

Comparação que fundamenta a escolha após a confirmação M2:

- **Intel:** avaliar SQL Server Linux x86-64 num contentor dedicado, isolado do Compose habitual, com nome/volume próprios e porta local própria. Docker Desktop executa o servidor numa VM Linux.
- **Apple Silicon (este Mac):** não assumir SQL Server ARM nativo. A Microsoft só suporta as imagens em Linux Intel/AMD x86-64; emulação/Rosetta não é testada nem suportada. Recomenda-se um host Linux x86-64/VM remota **dedicado a testes**; emulação local só mediante decisão explícita, com a limitação registada. Não escolher Azure SQL Edge como substituto automático.

Fonte: [requisitos oficiais dos contentores SQL Server](https://learn.microsoft.com/en-us/sql/linux/sql-server-linux-docker-container-deployment?pivots=cs1-bash&view=sql-server-ver15).

Não executar o `docker-compose.yml` existente como ambiente descartável: usa o serviço/container `meeple_sql`, volume próprio da configuração existente e imagem `2022-latest`; não oferece o isolamento específico deste anfitrião. Não ligar o Mac à base habitual nem transportar um backup com dados pessoais.

### Preparação do host dedicado e adaptação necessária

O host recomendado pode estar na rede local ou acessível por VPN. Deve executar SQL Server 2022 Developer numa instância/contentor exclusivo (por exemplo, `meepleboard-device-tests-sql`), com volume exclusivo (por exemplo, `meepleboard-device-tests-data`) e versão da imagem fixada após validação, sem usar o volume `meeple_sql` existente. Não expor SQL à Internet; permitir a ligação apenas ao Mac/rede privada. O iPhone fala apenas com a API no Mac, nunca diretamente com SQL.

Um administrador prepara credenciais exclusivas e um servidor vazio para testes. O anfitrião cria `MeepleBoard_DeviceTests`, marca a propriedade, migra e semeia: as credenciais de preparação precisam de criar essa base, além de acesso às suas tabelas. Não reutilizar credenciais de produção. Endereço, porta, configuração TLS e segredo ficam locais; o certificado deve ser validado para ligações remotas. `TrustServerCertificate=True` não deve ser transportado automaticamente da configuração LocalDB para um servidor remoto.

Não é possível fornecer já comandos de provisionamento específicos sem conhecer o host escolhido. A preparação não implica alterar o Windows atual nem a sua LocalDB.

1. Manter exatamente o caminho Windows atual como predefinição no Windows. Acrescentar configuração **exclusiva DeviceTests** para SQL externo, sem ler a configuração habitual, e recusar arranque não-Windows sem essa configuração explícita.
2. Validar a configuração com `SqlConnectionStringBuilder`: base exatamente `MeepleBoard_DeviceTests`, servidor de testes explicitamente aprovado, sem `AttachDbFilename`/instância habitual. Derivar `master` da mesma configuração validada. Não receber ligação por argumento que fique na lista de processos nem escrever palavras-passe em logs.
3. Criar uma instância/contentor e credenciais exclusivas, guardar segredo num ficheiro local ignorado com permissões restritas. Nome e volume distintos; ligar a porta SQL apenas à interface necessária. A API continua em 5099.
4. Manter a marca `MeepleBoardDeviceTestsOwner = MeepleBoardDeviceTestApi-v1`: base inexistente é criada e marcada; base existente sem marca correta é recusada **antes das migrações**. Nunca marcar uma base preexistente desconhecida para contornar a proteção.
5. Preservar a auditoria offline modelo/snapshot e operações esperadas. São **23 migrações**, incluindo `AddMatchCreator` e o índice filtrado do catálogo. A divergência do índice já foi corrigida no snapshot/migração; o arranque recusa nova divergência. Não usar `EnsureCreated` em substituição das migrações.
6. Executar migrações **só nesta base marcada** e o seeder existente. Confirmar `Matches.CreatorId`, índice filtrado e história de migrações com SQL real.
7. Portar os verificadores SQL para uma ferramenta multiplataforma, de preferência o próprio projeto .NET usando `Microsoft.Data.SqlClient` já disponível, com a mesma ligação exclusiva/marca e queries parametrizadas. Não instalar outro provider ou remover verificações.

Esta adaptação **não foi implementada nem testada em macOS** neste trabalho de documentação. Os comandos SQL/arranque completos serão acrescentados quando existir um host de testes escolhido e a adaptação for implementada; não há um comando seguro que torne a versão LocalDB atual portátil por simples variável de ambiente.

## Dados fictícios e isolamento

O seeder existente recria, numa base nova, quatro contas com passwords aleatórias guardadas localmente em `.device-tests/accounts.json`:

- `autor@meepleboard.test` — Teste-autor;
- `participante@meepleboard.test` — Teste-participante;
- `alheio@meepleboard.test` — Teste-alheio;
- `membro@meepleboard.test` — Teste-membro.

O autor tem amizade aceite com as outras três contas; estas não são automaticamente amigas entre si. As contas têm email confirmado. Os jogos fictícios são **Meeple Teste Competitivo**, **Meeple Teste Cooperativo** e **Meeple Teste Solo**, BGG IDs 990001–990003. Catálogo e tokens de pesquisa são criados em SQL. A Biblioteca pode começar vazia: adicionar um jogo antes de pesquisar na coleção.

Não copiar `accounts.json` sozinho para uma base já existente: as passwords locais podem não corresponder ao Identity. Numa base nova, deixar o seeder gerar contas e ficheiro coerentes. Não prometer os mesmos IDs/sessões do Windows: os scripts de testes criam novas fixtures. Não transportar as sessões que estavam a ser validadas no iPhone sem uma tarefa específica de exportação.

- BGG continua `OfflineCatalog`; não configurar token nem ligar importadores/jobs.
- Emails ficam em `.device-tests/outbox`, sem entrega; links/tokens nesses ficheiros também são sensíveis.
- Fotografias ficam em `.device-tests/photos`, entregues pelo endpoint protegido; a referência com domínio Cloudinary é um identificador do simulador, não um upload ao armazenamento habitual.
- JWT/data protection são efémeros. Não transportar tokens do Windows.
- CreatorId continua ausente da base habitual: o backend atualizado exige o esquema completo nos percursos relevantes. A base de testes terá a coluna; não corrigir isso aplicando migrações à base habitual.
- A proteção das fotografias públicas antigas continua pendente, separada do ambiente local. Cancelar versus eliminar permanece fora desta passagem.

## Scripts a portar

| Script atual | Equivalente macOS necessário |
|---|---|
| Backend `scripts/start-device-test-api.ps1` | Shell ou launcher .NET; não chamar SqlLocalDB; iniciar/verificar o host dedicado após escolher SQL; encaminhar `--audit-only`/`--verify`/`--data` |
| Frontend `scripts/start-device-test-expo.ps1` | Shell; health-check validado, IPv4 explícito, variáveis por processo, `npm` em vez de `npm.cmd`, porta 8082 |
| Frontend `scripts/stop-device-tests.ps1` | Usar Ctrl+C nos terminais próprios; eventual script com PID validado, sem `pkill node`/`pkill dotnet` globais |
| Frontend `scripts/enable-device-test-firewall.ps1` | Configuração da firewall macOS para node/DeviceTestApi e rede local; não copiar regras Windows |
| Backend `verify-session-sql.ps1` | Verificador SQL multiplataforma: sessões/campanhas, permissões, recarga |
| Backend `verify-session-dates-sql.ps1` | Identidade da sessão, UTC e deadline null/custom |
| Backend `verify-session-required-friend-sql.ps1` | Amigo obrigatório e nenhuma gravação inválida |
| Backend `verify-session-invite-friends-sql.ps1` | Amizade aceite, duplicados, recusados e persistência de convites |

Os scripts `.cjs` usam Node/fetch e caminhos relativos e podem ser reutilizados no Mac com a API em `127.0.0.1:5099`; pressupõem `.device-tests/accounts.json` e alguns exigem fixtures anteriores. Os verificadores HTTP não substituem a confirmação SQL.

## Preparação executável já, sem SQL

Instalar Node compatível e .NET SDK 9 pela distribuição oficial correspondente à arquitetura. Depois:

```bash
cd "$HOME/Projects/MeepleBoard/MeepleBoardApp"
node --version
npm --version
npm ci
npx tsc --noEmit
node --test tests/*.test.cjs

cd "$HOME/Projects/MeepleBoard/MeepleBoardApi"
dotnet --info
dotnet restore tools/DeviceTestApi/DeviceTestApi.csproj
dotnet run --project tools/DeviceTestApi/DeviceTestApi.csproj --configuration DeviceTests --no-launch-profile -- --audit-only --data="$PWD/.device-tests"
dotnet run --project tests/PlayerScores.Tests --no-launch-profile
dotnet run --project tests/Library.Tests --no-launch-profile
dotnet run --project tests/Authorization.Tests --no-launch-profile
```

`--audit-only` retorna antes de abrir SQL, mas cria o diretório local de dados; não executa migrações. Os três projetos de testes são runners próprios, não assumir que `dotnet test` os executa. `npm test` entra em watch e não é o runner dos testes `.cjs` acima.

## Arranque no Mac depois de adaptar e validar SQL

Não executar ainda a API normal `MeepleBoardApi/Program.cs` como substituto do anfitrião isolado. Depois da adaptação, o comando do anfitrião manterá:

```bash
cd "$HOME/Projects/MeepleBoard/MeepleBoardApi"
dotnet run --project tools/DeviceTestApi/DeviceTestApi.csproj --configuration DeviceTests --no-launch-profile -- --data="$PWD/.device-tests"
```

**Pré-condição:** a configuração exclusiva/host SQL têm de estar preparados e validados; hoje este comando tenta LocalDB e falha no macOS. Manter API num terminal e Expo noutro. Após a API estar pronta, obter IPv4 na Definições do Sistema → Rede (não assumir interface `en0`) e iniciar:

```bash
cd "$HOME/Projects/MeepleBoard/MeepleBoardApp"
export MEEPLE_TEST_IP='<IPv4-do-Mac>'
curl --fail --silent --show-error "http://${MEEPLE_TEST_IP}:5099/device-test/health" \
  | node -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{const h=JSON.parse(s);if(h.environment!=="DeviceTests"||h.database!=="MeepleBoard_DeviceTests"||h.externalDelivery!==false)process.exit(1);console.log("Ambiente de testes confirmado");});' \
  && env EXPO_PUBLIC_API_MODE=local EXPO_PUBLIC_API_PORT=5099 \
     EXPO_PUBLIC_API_BASEPATH=/MeepleBoard REACT_NATIVE_PACKAGER_HOSTNAME="$MEEPLE_TEST_IP" \
     npm run start -- --lan --port 8082 --clear
```

Não editar `.env` habitual. Não usar `--tunnel` com esta resolução local da API. No iPhone, mesma rede, Safari `http://<IPv4-do-Mac>:5099/device-test/health` deve mostrar DeviceTests; abrir QR ou `exp://<IPv4-do-Mac>:8082`. Aceitar acesso à rede local do Expo Go. Usar conta fictícia/password do novo ficheiro local. O endereço Windows 192.168.1.83 não é o endereço do Mac.

## Critérios de validação antes de considerar a passagem concluída

1. Host SQL dedicado e marcado; auditoria sem diferenças, 23 migrações, CreatorId e índice confirmados com SQL real. Nenhuma ligação à base habitual.
2. `--verify` do anfitrião, após a adaptação, valida JWT/permissões/pontuações zero/preços/recarga com SQL real. Deixa dados fictícios, não correr em base habitual.
3. Executar `verify-catalog-search.cjs` e `verify-local-photos.cjs`; sem BGG/email/Cloudinary reais.
4. Executar `verify-session-writes.cjs` e verificador SQL equivalente para criação/recarga de sessões, campanhas, encontros, pontuações/resultado/diário, atualização de partida sem 404 e edição do diário sem 500. Executar pares HTTP/SQL de datas, amigo obrigatório e convites. Criar fixtures antes dos verificadores que as leem; `verify-session-campaign-reading.cjs` requer sessões/campanhas existentes.
5. Confirmar iPhone → login → Início → Sessões → Campanhas, catálogo/coleção/preços, criação com UTC, seleção múltipla e permissões. Automação não certifica layout, teclado, acessibilidade ou rede no Mac.
6. Confirmar que só diretórios locais ignorados recebem passwords, tokens de email, fotos e fixtures; terminar com `git status` e não adicionar esses ficheiros.

Situação desta passagem: repositórios/história/configuração revistos, M2 confirmado e guia preparado com recomendação SQL x86-64 separado; **host concreto, adaptação do anfitrião/scripts, execução macOS e rede iPhone no Mac ainda por preparar/confirmar**. Os testes Windows anteriores passaram (178 frontend, 23 focados backend, 58 autorização e HTTP/SQL), mas não equivalem a resultados macOS.
