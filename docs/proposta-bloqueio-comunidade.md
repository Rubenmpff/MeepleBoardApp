# Proposta — bloqueio de utilizadores e proteções da comunidade

Proposta de 2026-10-18, com as decisões 1–5 do utilizador. **Por confirmar** a tabela de efeitos e os estados visuais, antes de implementar em DeviceTests.

**Princípios:**

- **Histórico:** fica igual (nomes, resultados, partidas). Bloquear impede novas interações e o acesso a informação que deixa de estar autorizada.
- **Servidor:** é ele que aplica todas as regras. A app só reflete o que o servidor permite.
- **Discrição:** sem notificação e sem mensagem que diga quem bloqueou quem. As recusas usam frases neutras. Não se promete que o bloqueio seja impossível de deduzir.
- **Grupos existentes:** ninguém é expulso automaticamente.

## 1. Bloqueio (tabela própria, separada das amizades)

- **`UserBlocks`** guarda `BlockerId`, `BlockedId` e `CreatedAt`. Cada pessoa só cria e só remove o bloqueio que fez.
- **Ao bloquear:**
  - a amizade e os pedidos pendentes entre os dois são apagados;
  - os convites pendentes entre quem convidou e quem foi convidado são retirados (secção 2).
- **Desbloquear:** não restaura a amizade. Se a outra pessoa também tiver bloqueado, esse bloqueio mantém-se.
- **Um bloqueio em qualquer sentido** impede:
  - pedidos de amizade, nos dois sentidos;
  - encontrar a outra pessoa na pesquisa;
  - abrir o perfil, a coleção e o histórico em conjunto da outra pessoa (as rotas respondem 404, como «não encontrado»);
  - convites;
  - partidas novas em conjunto.
- **Publicações públicas na página do jogo:** as dos dois deixam de aparecer a um e a outro (contagens e listas).

## 2. Efeitos nas sessões e campanhas

«Bloqueio» quer dizer um bloqueio em qualquer sentido entre as duas pessoas.

| Situação | Sessões | Campanhas |
| --- | --- | --- |
| Convite pendente **entre quem convidou e quem foi convidado** quando o bloqueio é criado | O convite é retirado, sem aviso. A sessão continua. | O convite é retirado, sem aviso. A campanha continua. |
| Convite pendente em que o bloqueio é **com outro participante** (não com quem convidou) | O convite fica, mas aceitar é recusado enquanto houver bloqueio com algum participante aceite. | Igual, com os membros aceites. |
| **Novo convite** | Quem organiza só convida amigos aceites (regra atual). É recusado se houver bloqueio entre a pessoa convidada e quem organiza, ou qualquer participante aceite ou com convite pendente. | Só amigos aceites de quem convida, sem bloqueio entre os dois (decisão 5). É recusado se houver bloqueio com qualquer membro aceite ou com convite pendente. |
| **Participantes ou membros já aceites** com bloqueio entre si | Ficam. Ninguém é expulso; a sessão e as partidas ficam. | Ficam. A campanha, as notas e os encontros ficam. |
| **Registar uma partida nova** | É recusado se dois dos jogadores tiverem bloqueio entre si, seja quem for que regista. Assim, o bloqueio não se contorna através de outro membro. | Igual. Juntar à campanha uma partida que já existe continua possível (é histórico). |
| **Registo rápido** (fora de sessões; hoje sem verificação de relação) | Igual: é recusado se dois jogadores tiverem bloqueio entre si, mesmo com IDs enviados diretamente. | — |
| **Partidas já registadas** | Ficam iguais. Cada participante continua a avaliar e a escrever no seu diário. | Igual |
| **Ver a sessão, campanha ou partida partilhada** | Os nomes e resultados ficam. O nome da pessoa bloqueada não abre o perfil (a rota responde 404). | Igual |

**Mensagens neutras:**

- «Não é possível convidar esta pessoa.»
- «Não é possível aceitar este convite.»
- «Não é possível registar a partida com estes jogadores.»

## 3. Denúncias

| O quê | Onde se denuncia | O que chega à moderação |
| --- | --- | --- |
| Publicação (já existe) | Folha «Denunciar» da publicação | Sem mudança |
| **Pessoa** | Perfil (menu ⋯), resultado de pesquisa, publicação | Pessoa, motivo (abuso, assédio ou ameaça, nome ofensivo, spam, outro), texto opcional, quem denunciou (visível só a administradores) |
| **Fotografia** visível a quem denuncia (diário de uma partida em que participou) | Visualizador da fotografia | A fotografia concreta (entrada de diário e chave da fotografia), o motivo e o texto opcional |

- **Nada é automático:** uma denúncia não suspende ninguém nem apaga fotografias. Em particular, as fotografias de terceiros não são apagadas por haver um bloqueio.
- **Retenção:** igual à das publicações (texto apagado na resolução; no máximo 90 dias, se quem denunciou eliminar a conta).

## 4. Moderação e suspensão

O ecrã «Moderação» que já existe passa a ter três secções: «Comentários» (a atual), «Pessoas» e «Fotografias».

- **Pessoa denunciada:** «Arquivar» (resolve sem ação) ou «Suspender».
- **Fotografia denunciada:** «Manter» ou «Remover fotografia». Remover é uma decisão manual.
- **Suspensão:**
  - campos novos em `AspNetUsers`: `SuspendedUntil` (uma data, ou «até revisão»), `SuspensionReason`, `SuspendedAt` e `SuspendedById`;
  - é diferente do bloqueio automático do Identity por tentativas falhadas.
- **Efeitos da suspensão:**
  - o login é recusado com «A tua conta está suspensa» (e até quando, se houver data);
  - o refresh token não renova, e os tokens já emitidos dão 401 (o mesmo ponto que já trata contas eliminadas);
  - a conta, as partidas e o histórico ficam.
- **Levantar a suspensão:** ação do administrador, com registo. Depois, a pessoa volta a poder entrar.

## 5. Filtro de termos (PT/EN)

Lista inicial de termos proibidos, aplicada no servidor ao conteúdo que outras pessoas veem, ao criar, ao editar e ao publicar:

- nome de utilizador (registo);
- comentário publicado, incluindo publicar um rascunho e editar;
- etiquetas do diário partilhadas com os participantes;
- resumo e local da partida;
- nome e local da sessão;
- nome e notas da campanha, e título de encontro;
- título e autor de recurso sugerido.

**Não se aplica** às notas privadas (diário «Só tu vês», nota pessoal).

**Recusa:** «Este texto tem termos que não são permitidos. Revê-o antes de guardar.»

**Limites:** é uma proteção inicial. Não substitui as denúncias, a revisão humana nem o tratamento de assédio e ameaças.

## 6. Estados visuais mínimos (padrões atuais, sem redesenho)

| Onde | Estado |
| --- | --- |
| Perfil de um amigo, menu ⋯ (`FriendActionsMenu`) | + «Bloquear» (folha de confirmação: «Deixam de ser amigos e de se encontrar na pesquisa. As partidas já registadas ficam.») e «Denunciar» (folha de motivos, como a das publicações) |
| Resultado da pesquisa de pessoas | Menu ⋯ com «Bloquear» e «Denunciar» |
| Publicação na página do jogo | O menu ⋯ atual («Denunciar») ganha «Bloquear autor» |
| Definições › nova linha «Pessoas bloqueadas» | Lista com «Desbloquear» (confirmação) e estado vazio «Não bloqueaste ninguém.» |
| Visualizador de fotografia do diário | «Denunciar fotografia» (folha de motivos) |
| Convite, aceitação ou registo recusado | A mensagem neutra no padrão de erro atual |
| Texto com termos proibidos | Erro no campo, no padrão atual |
| Início de sessão de uma conta suspensa | Mensagem no padrão de erro da autenticação |
| Moderação | Secções «Pessoas» e «Fotografias», com folhas «Suspender» (prazo de 7 dias, 30 dias ou «até revisão», e motivo) e «Levantar suspensão» |

**Contacto de apoio:** pendente até haver um endereço real. Não se inventa nenhum, e o requisito continua por cumprir.

## 7. Implementação e testes (depois da confirmação)

- **Migração (DeviceTests):**
  - tabelas `UserBlocks`, `UserReports` e `PhotoReports`;
  - quatro colunas de suspensão em `AspNetUsers`;
  - auditada pelo anfitrião, como as anteriores.
- **Eliminação de conta:** os bloqueios feitos e recebidos são apagados; as denúncias seguem a regra de retenção atual.
- **Testes:**
  - isolados: HTTP, permissões e efeitos;
  - verificador com contas descartáveis próprias: bloqueio nos dois sentidos, desbloqueio, contornos por outro membro e por envio de IDs, denúncias, suspensão (login, renovação, tokens) e filtro;
  - fotografia do roteiro comparada antes e depois.
