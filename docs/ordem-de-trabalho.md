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

## 5. Restantes pontos da revisão técnica (estado a 2026-10-17)

Cada ponto pendente precisa de autorização própria. **P1** = segurança ou publicação; **P2** = defeito visível ou manutenção relevante; **P3** = qualidade interna.

| # | Ponto | Prioridade | Estado |
| --- | --- | --- | --- |
| 5.1 | AutoMapper 14 (NU1903, CVE-2026-32933) | P1 | **Mitigada, não resolvida.** O limite de recursão está confirmado e tem teste de regressão (API `4619889`). Substituição por mapeamentos explícitos em avaliação; estimativa abaixo. Sem licenças nem atualização. |
| 5.2 | Mensagens de erro em português fixo nos serviços da app (`matchService` 11, `authService` 10, `experienceService` 2, uma ainda com «relatório»). `change()` e `moderate()` das experiências não tratam o erro e podem mostrar «Request failed with status code 409». | P2 | Pendente |
| 5.3 | Três formatos de duração («1 h 05 min», «1 h 5 min», «1h 5m») e datas formatadas à mão em cerca de 20 ficheiros, em vez de `src/ui/format.ts`. `formatLongDate` (amigos) pode mostrar «10/2026». | P2 | Pendente |
| 5.4 | `RatingCard` definido dentro do render e cor fixa `#B9B3C0` em `MatchDetailScreen.tsx` | P2 | Pendente |
| 5.5 | `npm test` aponta para Jest com `jest-expo`, que não está instalado. Os testes correm com `node --test`. | P2 | Pendente |
| 5.6 | Estado contraditório em `pendencias-funcionais.md` (por exemplo, SC01 «resolvida» e «aberta») | P2 | Pendente |
| 5.7 | A app chama `/game/by-bgg/{id}`, que não existe na API: cada pesquisa por id do BGG faz um pedido que dá 404 antes de importar. Funciona, mas é um pedido desperdiçado. | P3 | Pendente (encontrado a 2026-10-17) |
| 5.8 | Testes que fixam estados por índice de `useState` | P3 | Pendente. Os testes de componentes sem uso já foram removidos (app `3793237`). |
| 5.9 | O projeto não tem configuração de ESLint; na revisão havia 95 erros de lint | P3 | Pendente |
| 5.10 | O nome das contas eliminadas fica guardado em português (`Conta eliminada …`) | P3 | Pendente (limitação registada) |

**Concluídos na etapa 5:** regras de média sem uso (API `081c6d1`); análise do NU1903; remoção dos testes de componentes sem uso.

**Fora da etapa 5:**

- unificação dos componentes paralelos: etapa própria, com validação visual;
- eliminação da própria conta: pendência funcional CONTA01, em `pendencias-funcionais.md`.

### 5.1 — Substituição do AutoMapper por mapeamentos explícitos (estimativa, não autorizada)

**Âmbito real:** 11 mapeamentos configurados, mas só 8 em uso. São os 7 de entidade para DTO (`Game`, `Match`, `MatchPlayer`, `GameSession`, `GameSessionPlayer`, `User`, `UserGameLibrary`) e `UserDto → User`, usado na criação e edição de contas pelo administrador. Os inversos `GameDto → Game`, `GameSessionPlayerDto → GameSessionPlayer` e `UserGameLibraryDto → UserGameLibrary` não são usados. Não há achatamentos implícitos: as convenções são por nome igual. As regras explícitas são o `MaxDepth(3)` de `Game → GameDto`, `Notes` ignorado, as conversões de datas UTC das sessões e valores por omissão como «Jogador Desconhecido».

**Locais afetados:**

- `Mapping/AutoMapper` (3 ficheiros, 155 linhas): substituído por funções de mapeamento explícitas na mesma área (`Mapping`).
- 33 chamadas `Map` em 7 serviços (`GameService` 12, `MatchService` 9, `UserService` 5, `GameSessionService` 4, e 1 em cada um de `AuthService`, `MatchPlayerService` e `UserGameLibraryService`) e 5 no anfitrião DeviceTests.
- Uma injeção sem uso em `GameController`.
- O registo na injeção de dependências.
- 6 projetos de teste que constroem `MapperConfiguration`.
- O pacote no `MeepleBoard.Services.csproj`.

**Esforço estimado:** cerca de 1,5 dias.

- Testes de equivalência antes da troca: 0,5 dia.
- Mapeamentos explícitos e chamadas: 0,5 dia.
- Remoção do pacote, testes e documentação: 0,25 dia.
- Verificação completa: 0,25 dia.

**Verificação planeada (comportamento igual):**

1. **Primeiro commit, com o AutoMapper ainda ativo:** testes de equivalência. Para cada um dos 8 mapeamentos usados, constroem-se fixtures com:
   - todos os campos preenchidos;
   - todos os opcionais nulos;
   - navegações em falta (`Game`/`User` nulos);
   - coleções vazias;
   - pontuações zero e negativas;
   - avaliações de meio ponto;
   - datas com `DateTimeKind` não especificado;
   - partidas e jogadores aninhados;
   - uma cadeia de expansões com mais de 3 níveis e uma referência circular.

   O resultado é serializado com as mesmas opções JSON da API e guardado como referência. Para `UserDto → User`, compara-se o estado da entidade campo a campo, por reflexão, na criação e na edição.
2. **Teste de cobertura:** por reflexão, cada propriedade pública dos DTOs tem de ficar preenchida na fixture completa. As exceções são explícitas, como `Notes` e as estatísticas calculadas depois. Assim nenhum campo fica esquecido.
3. **Troca para mapeamentos explícitos:** os mesmos testes têm de dar resultados idênticos às referências, incluindo nulos, relações e o limite de 3 níveis das expansões.
4. **Nível HTTP:** recolha das respostas reais, só de leitura, em DeviceTests, antes e depois:
   - partidas, sessões, ficha e lista de jogos, rankings, pesquisa;
   - `users/me`, utilizadores para o administrador, biblioteca, utilizador no login.

   As respostas têm de ser idênticas byte a byte, como as 504 das estatísticas. Não altera os dados do roteiro do iPhone.
5. **Final:** suites, verificadores e exportação iOS. O aviso NU1903 desaparece quando o pacote sair.

## Regras permanentes

- Não alterar produção, tokens, variáveis de ambiente nem Azure.
- Não acrescentar atribuições automáticas a IA em commits ou PRs.
- Não apagar ficheiros incertos.
