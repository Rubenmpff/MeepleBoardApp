# Ordem de trabalho (acordada a 2026-10-16)

Abrange a app e a API. Cada etapa só começa quando a anterior está fechada. Tudo corre em DeviceTests. Nada vai para produção sem aprovação explícita.

## 1. Validação no iPhone — avaliações, diário e experiências (em curso; dados do roteiro mantidos estáveis)

O utilizador valida o percurso descrito em [avaliacoes-diario-experiencias.md](avaliacoes-diario-experiencias.md). Só se corrige o que as capturas mostrarem, sem funcionalidades novas nem mudanças de composição. A etapa fecha quando o utilizador a aprovar.

## 2. Segurança (antes de qualquer publicação em produção) — feita a 2026-10-16

API `f781fd4` e `f906eb6`. Estas rotas exigem agora autenticação e, conforme o caso, perfil de administrador ou ser o criador da partida. Testes em `Authorization.Tests` (94 HTTP). Detalhe em `MeepleBoardApi/docs/autorizacao-partidas-diarios.md`. A pesquisa BGG passou a exigir conta.

Problemas da revisão técnica de 2026-10-16:

- **UserController** (`MeepleBoardApi/Controllers/UserController.cs`): listar, consultar, criar, editar e apagar utilizadores sem autenticação. Em DeviceTests, um pedido anónimo à lista devolve 200, e o DTO inclui o email.
- **MatchPlayerController**: acrescentar e remover jogadores de qualquer partida sem autenticação. Os erros 500 devolvem a mensagem da exceção.
- **GameController e BGGController**: criação de jogos (aprovados de imediato) e importação do BGG anónimas. Falta decidir se a pesquisa BGG pode ficar anónima.
- Testes HTTP em `tests/Authorization.Tests` para estas rotas e para as rotas das experiências.

## 3. Eliminação de contas com denúncias — feita a 2026-10-16; acesso após eliminação fechado a 2026-10-17

API `f0d0b27`: um token emitido antes da eliminação deixa de dar acesso, porque cada pedido autenticado confirma que a conta existe e não foi eliminada. O refresh token anterior não renova. A conta deixa de contribuir para a duração da comunidade e os outros participantes mantêm a partida. Fluxos legítimos das contas verificados em `9edc09a` (`verify-account-flows`); a app não tem edição de perfil, fotografia nem eliminação pela própria pessoa.

API `5e4a656`. Decisão: anonimizar a conta, e as avaliações saem da média MeepleBoard. Afinal eram 12 chaves restritivas, não só as das denúncias. Detalhe, verificação e limitações (token já emitido válido até 24 h) em `MeepleBoardApi/docs/eliminacao-contas.md`.

Hoje, a chave do autor de uma denúncia (de experiências e de recursos) é restritiva: apagar uma conta que fez denúncias falha. É preciso definir o que acontece a essas denúncias e aplicar a regra às duas áreas.

## 4. Organização dos dois repositórios — feita a 2026-10-17, exceto Statistics

Executado conforme o mapa aprovado, em commits só de organização ou só de remoção:

- **API:**
  - A1/A2 `6c9525d`;
  - A3 Experiences `116baae`;
  - A4 GameDurations `07527ec`;
  - A5 médias sem uso `081c6d1`;
  - A6 namespaces `7c281d6`.
- **App:**
  - B1 `d81e8c8`;
  - B2 `08a2888`;
  - B3/B4 `3793237`;
  - B5 `1ce02f1`;
  - B6 `782507f`.
- **Documentação:** cada documento ficou no repositório do código a que se refere, com uma ligação no outro.

**Statistics (2026-10-17):**

- cópia de segurança em `MeepleBoard-backups/2026-10-17-statistics-por-commitar`;
- os 9 ficheiros integrados sem alterações (API `2b4f008`);
- A7: calculadoras em `Services/Calculators` (`5bc6ea6`); serviço, interface, repositório e DTOs (`8a23059`), com 504 respostas reais idênticas antes e depois; `JournalPhotoReference` em `Calculators` (`9d1cf47`);
- B7: a área de estatísticas da app (`e5cb785`), com as 16 capturas idênticas antes e depois.

Os documentos `estatisticas-*` não são duplicados: o da API descreve contratos e o da app a interface. A convenção final está em `organizacao-codigo.md`, em cada repositório.


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

Cada um precisa de autorização própria. Já resolvidos: as regras de média sem uso (`081c6d1`) e o NU1903 analisado. Falta:

- `RatingCard` definido dentro do render em `MatchDetailScreen.tsx`.
- Formatos de duração e de data por unificar em `src/ui/format.ts` e `formatDuration`.
- Mensagens de erro em português fixo nos serviços.
- `npm test` aponta para Jest, mas os testes correm com `node --test`.
- O estado de [pendencias-funcionais.md](pendencias-funcionais.md) é contraditório (por exemplo, SC01).
- Testes que fixam estados por índice de `useState`, e testes de componentes sem uso.
- O projeto não tem configuração de ESLint: `npm run lint` instala uma. Na revisão havia 95 erros de lint.
- AutoMapper 14 (NU1903): analisado a 2026-10-17. A aplicabilidade é baixa, o limite de recursão foi confirmado e há um teste de regressão. A correção exige mudar de licença (15.x/16.x), por isso fica para decisão; ver `seguranca-dependencias-macos.md`.

## Regras permanentes

- Não alterar produção, tokens, variáveis de ambiente nem Azure.
- Não acrescentar atribuições automáticas a IA em commits ou PRs.
- Não apagar ficheiros incertos.
