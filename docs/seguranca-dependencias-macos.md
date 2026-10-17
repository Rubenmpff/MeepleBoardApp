# Dependências — análise de segurança separada

Registo de 6 de outubro de 2026, durante a continuação no Mac M2.

- Frontend: o utilizador reportou **67 vulnerabilidades** após `npm ci`, com Node **22.14.0** e npm **10.9.2**; `npx tsc --noEmit` passou. A contagem não identifica 67 falhas exploráveis na aplicação: falta recolher o relatório, gravidades, dependências diretas/transitivas e exposição em runtime/build.
- Backend: **AutoMapper 14.0.0**, aviso de segurança **NU1903**, já referido na documentação de estabilização. O utilizador confirmou compilação com .NET SDK **9.0.318**. Falta analisar o advisory, os usos afetados e uma correção compatível.

Estes avisos não foram corrigidos nesta passagem. Não foram alterados manifests ou lockfiles, nem executados `npm audit fix`, `--force` ou atualizações NuGet. A análise futura deve recolher relatórios apenas de leitura e propor alterações e validação separadamente; a contagem npm aqui é reportada pelo utilizador, não uma auditoria repetida.

A shell do agente usa por defeito Node 24.13.0/npm 11.6.2; o caminho instalado de Node 22.14.0 foi verificado e tem npm 10.9.2. Usar explicitamente esse ambiente na futura reprodução. Não foi mudado o default da shell.

## Atualização 07/10/2026 — partilha de cartões

A instalação dirigida de expo-sharing/react-native-view-shot e remoção de uma dependência direta desnecessária reportou **69 vulnerabilidades npm: 17 moderadas, 51 altas e 1 crítica**, com Node 22.14.0/npm 10.9.2. Manifests/lockfile alterados apenas para esta funcionalidade, usando versões mapeadas pelo SDK Expo local. Esta contagem global não atribui automaticamente as falhas aos novos pacotes nem substitui análise de exposição. Não executados npm audit fix, --force ou atualização automática generalizada. NU1903/AutoMapper 14.0.0 permanece para análise separada. O registo inicial de 67 fica como evidência histórica.

## Atualização 17/10/2026 — organização dos repositórios

Na app, `lodash.debounce` passou a dependência direta (já vinha por uma dependência do Babel; mesma versão 4.0.8). Foram removidas 7 dependências sem import, sem configuração e sem dependente obrigatório: `@react-navigation/drawer`, `@react-navigation/material-top-tabs`, `react-native-pager-view`, `@react-native-picker/picker`, `react-native-keyboard-aware-scroll-view`, `react-native-webview` e `expo-blur`. Verificado com TypeScript, testes e exportação iOS. Não foi executado `npm audit` nem `audit fix`. A contagem de vulnerabilidades não foi repetida. NU1903/AutoMapper 14.0.0 continua por analisar.

## Análise do NU1903 — AutoMapper 14.0.0 (2026-10-17)

**Estado: MITIGADA, NÃO RESOLVIDA.** O aviso NU1903 continua ativo até haver uma decisão. Não se compram licenças nem se atualiza a dependência entretanto. Opção preferida pelo utilizador, em avaliação: substituir o AutoMapper por mapeamentos explícitos (estimativa em `ordem-de-trabalho.md`, etapa 5).

**Aviso:** [GHSA-rvv3-g6hj-g44x](https://github.com/advisories/GHSA-rvv3-g6hj-g44x) / CVE-2026-32933, gravidade alta (CVSS 7,5). É uma negação de serviço por recursão sem limite: mapear um grafo de objetos auto-referenciado com milhares de níveis (o exemplo do aviso usa cerca de 25 000) esgota a pilha. O `StackOverflowException` termina o processo. Está corrigido só em **15.1.1** e **16.1.1**; a 14.x não vai ter correção.

**Aplicabilidade ao MeepleBoard: baixa.**

- O único tipo auto-referenciado mapeado é `Game → GameDto` (`Expansions`). Já tem `.MaxDepth(3)`.
- A API regista os perfis por análise do assembly, e `Game → GameDto` existe duas vezes: com `MaxDepth(3)` em `MappingEntityToDto` e por `ReverseMap()` em `MappingDtoToEntity`. Confirmei com o registo real que fica em vigor o limite de 3 níveis: uma cadeia de 501 jogos dá 3 níveis.
- O teste de regressão está em `GameResources.Tests` e falha se o limite for retirado.
- Os mapeamentos de DTO para `Game` não são usados no código, por isso nenhum dado do cliente chega a um mapeamento recursivo.
- O System.Text.Json limita por defeito a profundidade do JSON a 64.
- Os grafos vêm da base de dados, com jogo base e expansões, e na prática têm 2 níveis.

**A correção não foi aplicada.** Exige atualizar para 15.x ou 16.x, que mudaram de licença:

- licença dupla: RPL 1.5 (exige publicar o código de quem a usa) ou a licença comercial da Lucky Penny Software;
- chave de licença: sem chave funciona, mas escreve avisos no registo;
- a mudança de versão principal também altera a configuração (`AddAutoMapper`).

**Opções para decisão:**

1. Manter a 14.0.0 com a mitigação e o teste de regressão (situação atual).
2. Comprar ou registar a licença comercial e atualizar para 15.1.1 ou superior.
3. Substituir o AutoMapper por mapeamento manual ou por uma biblioteca livre, como o Mapperly. São 11 mapeamentos, uma refatoração à parte.

Fontes:

- [aviso GitHub](https://github.com/advisories/GHSA-rvv3-g6hj-g44x);
- [licença AutoMapper 15.0.1 no NuGet](https://www.nuget.org/packages/AutoMapper/15.0.1/License);
- [anúncio das edições comerciais](https://www.jimmybogard.com/automapper-and-mediatr-commercial-editions-launch-today/);
- [documentação ABP sobre a 14.x sem correção](https://abp.io/docs/latest/framework/infrastructure/luckypenny-automapper).
