# Ordem de trabalho (acordada a 2026-10-16)

Abrange a app e a API. Cada etapa só começa quando a anterior está fechada. Tudo corre em DeviceTests. Nada vai para produção sem aprovação explícita.

## 1. Validação no iPhone — avaliações, diário e experiências (em curso)

O utilizador valida o percurso descrito em [avaliacoes-diario-experiencias.md](avaliacoes-diario-experiencias.md). Só se corrige o que as capturas mostrarem, sem funcionalidades novas nem mudanças de composição. A etapa fecha quando o utilizador a aprovar.

## 2. Segurança (antes de qualquer publicação em produção)

Problemas da revisão técnica de 2026-10-16:

- **UserController** (`MeepleBoardApi/Controllers/UserController.cs`): listar, consultar, criar, editar e apagar utilizadores sem autenticação. Em DeviceTests, um pedido anónimo à lista devolve 200, e o DTO inclui o email.
- **MatchPlayerController**: acrescentar e remover jogadores de qualquer partida sem autenticação. Os erros 500 devolvem a mensagem da exceção.
- **GameController e BGGController**: criação de jogos (aprovados de imediato) e importação do BGG anónimas. Falta decidir se a pesquisa BGG pode ficar anónima.
- Testes HTTP em `tests/Authorization.Tests` para estas rotas e para as rotas das experiências.

## 3. Eliminação de contas com denúncias

Hoje, a chave do autor de uma denúncia (de experiências e de recursos) é restritiva: apagar uma conta que fez denúncias falha. É preciso definir o que acontece a essas denúncias e aplicar a regra às duas áreas.

## 4. Organização dos dois repositórios

Respeita a estrutura existente. Não introduz convenções novas.

**Antes de mexer:**

- Mapa curto da estrutura atual e das mudanças propostas (origem → destino), para aprovação.
- No mapa, distinguir a mera organização de ficheiros das alterações reais de arquitetura (responsabilidades e dependências entre camadas).
- Lista de duplicações e de código comprovadamente sem uso. Preservar o que [proximas-etapas-produto.md](proximas-etapas-produto.md) prevê.
- Não criar interfaces, repositórios, abstrações nem pastas só para preencher a estrutura.

**API:**

- Seguir a separação existente: `Implementations`, `Interfaces`, contratos/DTOs (`Mapping/Dtos`), domínio (`MeepleBoard.Domain`) e acesso a dados (`MeepleBoard.Infra.Data`).
- Rever em especial `Services/Experiences`, `Services/GameDurations` e `Services/Statistics`, que usam o `DbContext` diretamente e definem os contratos junto do serviço.
- Verificar responsabilidades e dependências, não apenas pastas.

**App:**

- Manter a organização por funcionalidades (`src/features/<área>/{screens,components,hooks,services,types,utils}`) e o kit partilhado (`src/ui`).
- Cada ficheiro vai para o sítio que a convenção já adotada indica.

**Execução, depois de aprovado o mapa:**

- Commits de organização separados das correções funcionais.
- Atualizar namespaces, imports, injeção de dependências, testes e documentação.
- Preservar o comportamento, o design, os contratos externos e os dados.

**Statistics:** há 9 ficheiros da API por commitar:

- `StatisticsContracts.cs`, `StatisticsExploreContracts.cs`, `StatisticsExploreService.cs`, `StatisticsService.cs`;
- `StatisticsController.cs`, `tools/StatisticsChecks/Program.cs`;
- os não versionados `docs/companhia-contexto-participantes.md`, `tools/DeviceTestApi/verify-company-context.cjs` e `verify-library-statuses.cjs`.

Não se movem nem se sobrescrevem. Primeiro integram-se de forma controlada; só depois se reorganiza essa área.

## 5. Restantes pontos da revisão técnica

Cada um precisa de autorização própria:

- Regras de média sem uso ou divergentes (`GetAveragePersonalRatingAsync`, `UpdateMeepleBoardScoreAsync`) e a regra da média da campanha por documentar.
- `RatingCard` definido dentro do render em `MatchDetailScreen.tsx`.
- Formatos de duração e de data por unificar em `src/ui/format.ts` e `formatDuration`.
- Mensagens de erro em português fixo nos serviços.
- `npm test` aponta para Jest, mas os testes correm com `node --test`.
- O estado de [pendencias-funcionais.md](pendencias-funcionais.md) é contraditório (por exemplo, SC01).
- Testes que fixam estados por índice de `useState`, e testes de componentes sem uso.
- O projeto não tem configuração de ESLint: `npm run lint` instala uma. Na revisão havia 95 erros de lint.
- AutoMapper 14 (NU1903).

## Regras permanentes

- Não alterar produção, tokens, variáveis de ambiente nem Azure.
- Não acrescentar atribuições automáticas a IA em commits ou PRs.
- Não apagar ficheiros incertos.
