# Biblioteca, catálogo e validação isolada

## Compatibilidade com o esquema atual

O backend em `fix/match-journal-authorization`, preservado nesta branch, mapeia `Matches.CreatorId`. Uma propriedade nullable continua a exigir a coluna no SQL. Sem ela, leituras que materializam partidas e gravações novas falham com coluna inexistente. O processo/Swagger podem arrancar; isso não demonstra funcionamento dos percursos da aplicação. Jobs de partidas também podem falhar.

Não houve consulta à base atual, execução de migrações nem alteração de dados. A migração `20261006120000_AddMatchCreator` continua apenas preparada. Partidas antigas têm de manter autoria desconhecida, sem backfill por suposição.

Mantêm-se abertas **SC01**, divergência pré-existente do índice do catálogo no snapshot, e **PR02**, proteção de fotografias públicas antigas. Ver [autorizacao-partidas-diarios.md](autorizacao-partidas-diarios.md) e [pendencias-funcionais.md](pendencias-funcionais.md). Não desativar a verificação de divergência do EF9 para contornar SC01.

## Acessos e comportamento

Comparação com `60e0037` (antes de simplificar a navegação): o menu dava acesso a Início, pesquisa, Biblioteca, Rankings, Sessões, Campanhas, Amigos, pendências, Perfil e Definições. Após a simplificação, Início/Biblioteca/Amigos ficaram nos separadores e os restantes destinos em Mais, exceto a pesquisa do catálogo. Esta volta a estar em **Mais → Jogos → Pesquisar jogos**, usando a rota existente `/games/search`.

Na Biblioteca, **Adicionar jogo** substitui o botão apenas com `+` e abre a mesma pesquisa. O campo **Pesquisar na coleção** continua a filtrar apenas os jogos da coleção, sem chamar a pesquisa do catálogo. Detalhes, filtros, importação/adição, parâmetros e retorno usam os fluxos existentes. O redesign de Mais fica para outra etapa.

O preço vazio é desconhecido (`null` no PATCH), zero é gratuito e vírgula/ponto decimal são aceites. Entrada inválida é recusada em ambos os formulários, sem transformar texto inválido em zero. A precisão de duas casas corresponde ao `decimal(18,2)` existente; não é feito arredondamento silencioso de mais casas. A adição já não descarta zero no ecrã de pesquisa. Falha de adição mantém o formulário e o preço para tentar novamente.

O reducer aplica também a remoção do preço; recarregar e reabrir mostram os valores devolvidos pela API. O total da Biblioteca mantém o âmbito anterior (estado **Tenho**), incluindo atualização após edição/remoção, e passa a mostrar zero nesse separador. O método de total do backend soma preços em todos os estados, como antes; essa diferença de âmbito não foi alterada nem usada para substituir o total da Biblioteca.

Remover chama apenas `DELETE /users/{userId}/games/{gameId}`: o backend remove `UserGameLibraries`, não o jogo do catálogo nem partidas. O modal usa o ID da entrada existente, permitindo remover também quando foi aberto a partir de uma sugestão do catálogo apenas com BGG ID. O estado local conserva o histórico jogado e limpa os metadados da associação removida. Estados existentes e permissões mantêm-se. Não foi necessário alterar o código de produção do backend; foram acrescentados testes.

## Verificações sem base de dados

Frontend, a partir da respetiva raiz:

```text
node node_modules/typescript/bin/tsc --noEmit
node --test --test-reporter=spec tests/*.test.cjs
node node_modules/expo/bin/cli export --platform ios --output-dir .expo/library-ios-export
```

Backend, a partir da respetiva raiz:

```text
dotnet run --project tests/Library.Tests --no-launch-profile
```

O servidor de testes usa Kestrel em localhost/porto efémero, controller/serviço reais e repositórios em memória. Não arranca o `Program` habitual, nem lê configuração/segredos, usa fornecedores externos ou abre SQL. Verifica adição/edição/limpeza/zero, pedidos antigos, estados, leitura posterior, autorização e conservação do histórico. A verificação EF gera SQL de consulta offline e inspeciona o estado de eliminação; não executa comandos. Estes testes não provam persistência/restrições numa instância SQL real nem qualidade visual no dispositivo.

Resultados: 15 verificações isoladas do backend (14 cenários HTTP/serviço e uma verificação offline EF) passaram; 147 testes frontend, TypeScript e exportação iOS passaram. Compilação backend sem erros, com o aviso pré-existente `NU1903` do AutoMapper 14.0.0. Sem novas dependências. Validação nativa e SQL real pendentes.

## Ambiente descartável para Expo Go

1. Criar uma instância/base SQL vazia dedicada ao teste, com conta que só possa aceder a essa base; não copiar dados pessoais. Preparar contas, jogos e partidas exclusivamente de teste.
2. Rever a divergência SC01 e o historial das migrações. Gerar e rever SQL do esquema antes de executar qualquer coisa; preparar o esquema completo, incluindo `CreatorId`, exclusivamente na base descartável. Para validar uma atualização, criar aí o esquema anterior e ensaiar a migração de autoria, confirmando que os registos antigos permanecem sem criador. Não aplicar nem suprimir avisos na base atual.
3. Executar o backend num perfil/processo separado, porta diferente e `ConnectionStrings__DefaultConnection` explicitamente apontada à base descartável. Não arrancar com a configuração habitual: o `Program` usa Hangfire e seeders, que podem escrever durante o arranque. Usar credenciais de teste para autenticação e fornecedores (email, notificações, fotografias); isolar também o armazenamento Hangfire. Confirmar o destino antes de arrancar.
4. Configurar o frontend para esse endereço de teste, acessível pelo iPhone. Em LAN: `EXPO_PUBLIC_API_MODE=local`, `EXPO_PUBLIC_API_PORT` com a porta separada e `EXPO_PUBLIC_API_BASEPATH=/MeepleBoard`; o host é o do Expo, portanto API e Expo têm de estar acessíveis nessa máquina/rede. Em túnel: `EXPO_PUBLIC_API_MODE=tunnel` e `EXPO_PUBLIC_TUNNEL_API_URL` com a origem HTTPS do backend de teste, sem repetir `/MeepleBoard`. Reiniciar com `npm run start -- --clear` e confirmar o endereço apresentado no arranque. Os testes HTTP em memória usam autenticação de fixtures e não são uma API completa para Expo Go.
5. No iPhone, testar **Mais → Pesquisar jogos**, **Biblioteca → Adicionar jogo**, detalhe e retorno; confirmar que a pesquisa na coleção não explora o catálogo.
6. Adicionar sem preço, com `0` e com `35,50`; editar para outro valor e apagar; guardar, recarregar a coleção e reabrir a entrada. No separador Tenho, verificar o total, incluindo zero. Confirmar estados e PT/EN, teclado, ecrã pequeno e texto ampliado.
7. Remover uma entrada com partidas de teste: o jogo deve continuar na pesquisa/detalhes e o histórico deve manter as partidas. Verificar também Cancelar com rascunho e falha de gravação.

A API atual sem `CreatorId` não permite validar a aplicação completa desta branch. Estes passos são um roteiro; não foi criado/aplicado um esquema SQL nem exercitada a API habitual nesta tarefa.
