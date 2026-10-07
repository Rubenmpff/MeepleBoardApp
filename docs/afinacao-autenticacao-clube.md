# Afinação de autenticação — Clube Meeple

Implementação restrita à autenticação; validação visual final no iPhone pendente. API 5099 e Expo 8082 exclusivamente em DeviceTests. Sem migração, credenciais versionadas ou alterações na base habitual.

## Causas e decisões

O cabeçalho combinava viewport do logótipo com 88 pt, placeholder de 116 pt e várias margens. Essa soma dava demasiada prioridade à decoração. O logótipo usa agora 104 × 68 pt (antes 132 × 88); deixou de haver personagem no cabeçalho. Título 24/32 (antes 26/34), subtítulo 16/24, margens verticais menores e dois pequenos tokens de tabuleiro. Tipografia continua ampliável: sem limitar número de linhas, sem reduzir automaticamente a letra ou tentar forçar tudo num ecrã.

`assets/animations/ghost.json` foi incorretamente classificado como mascote na etapa anterior. O utilizador confirmou que é um placeholder; os usos originais em DashboardScreen e GameSelector mantêm-se e os respectivos ficheiros/asset não foram alterados. Não foi encontrado um ficheiro confirmado da mascote verdadeira. Nenhuma personagem foi criada ou substituída; usar apenas o logótipo existente.

Campos com bordo de 1 pt (antes 2), contraste e foco verde mantidos; altura mínima 52, rótulos 16/24, alvos de 44. Ritmo entre grupos de 14 pt e início do formulário a 16 pt: mantém espaço para ler sem acrescentar cartões/margens excessivas.

Nos interruptores, `trackColor.false` sozinho não define consistentemente o fundo desligado do UISwitch: agora `ios_backgroundColor` indica explicitamente o cinzento escuro desligado, verde escuro para ligado e polegar branco contrastante em ambos. Posição do polegar e estado checked acessível distinguem as opções; valores por defeito e handlers mantidos.

Entrada ganhou «Ainda não tens conta? Criar conta» (PT/EN), com push para o registo. Com campos preenchidos, esse acesso usa a confirmação de descarte existente: Continuar a editar conserva os valores e só Descartar e sair permite mudar de percurso. Sem valores/operação, abre diretamente o registo. Não se acrescenta persistência de palavras-passe. A ação fica indisponível durante login/reenvio em curso. Boas-vindas descreve pesquisa/coleção/partidas/sessões/campanhas; não promete conversas ou mensagens.

## Navegação e teclado

Voltar quando o formulário está vazio, sem operação em curso; Cancelar quando há valores/consentimento alterados ou operação em curso. As ações continuam ligadas aos mesmos hooks/guards: não se muda a confirmação de descarte, prevenção de saída ou destinos. O rótulo acessível corresponde à ação; na confirmação de email conservam-se os rótulos/destinos existentes.

Com teclado aberto, ecrã baixo ou texto ampliado, recolhem-se logótipo e tokens; título e formulário permanecem. O campo ativo é reposicionado depois do teclado/layout, sem limpar valores. Mensagens e botões mantêm-se no fluxo rolável e podem ser alcançados acima do teclado; nenhuma barra flutuante sobrepõe campos. Mantidos autofill, campos seguros, mostrar/ocultar, mensagens, cooldown, termos e regras de palavras-passe. A divergência cliente/Identity já registada não foi corrigida nesta tarefa visual.

## Prévia da identidade no Início e Biblioteca

![Identidade lavanda e verde no Início e Biblioteca, sem aplicação global](mockups/autenticacao/previa-inicio-biblioteca.png)

[SVG original](mockups/autenticacao/previa-inicio-biblioteca.svg). É uma composição estática para comparar a direção visual **antes** de alterar a paleta global; não é uma captura da aplicação. Mantém ação Registar, última partida e acessos a Sessões/Biblioteca/Campanhas, mais coleção, pesquisa, filtros e ordenação. Os espaços de capas/dados e «—» são placeholders explícitos de layout, não resultados nem valores históricos. Nenhum dado pessoal, nome de amigo, resultado, despesa ou capa foi inventado. Os ecrãs reais e o tema global permanecem inalterados.

## Verificação e percurso nativo

Node 22.14.0, TypeScript, 236 testes frontend (28 de autenticação), incluindo destinos/contratos PT/EN, navegação Voltar/Cancelar, confirmação de descarte antes de abrir registo e preservação ao escolher continuar a editar, indisponibilidade durante operação, estados do UISwitch e contraste. Exportação iOS concluída em `.expo/auth-refine-ios-export` (ignorada) e bundle iOS HTTP 200 no Expo 8082; saúde da API confirmou DeviceTests/MeepleBoard_DeviceTests/externalDelivery=false. Recolha decorativa e scroll verificados com teclado simulado, largura 320 e texto ampliado; estes testes não demonstram a geometria nativa.

No iPhone: recarregar Expo, terminar sessão de testes, abrir Entrada e observar cabeçalho/bordos. Manter sessão iniciada: alternar ligado/desligado. Criar conta a partir da Entrada; preencher alguns campos, abrir teclado no último e alternar mostrar/ocultar; rolar até termos/botão e verificar mensagens. Cancelar → continuar a editar deve conservar os valores; abandonar deliberadamente regressa ao contexto anterior. Formulários vazios mostram Voltar. Repetir com texto ampliado e testar login com a conta fictícia existente. Não usar dados reais nem contas/email pessoais.

Confirmação visual/funcional no iPhone pendente. Os testes Solo/coop pendentes mantêm-se; Estatísticas e retrospetiva não foram implementadas. A prévia global não autoriza nem representa mudança na paleta global.
