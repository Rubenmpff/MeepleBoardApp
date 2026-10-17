# Visual preview

Renderiza ecrãs reais da app (os ficheiros TSX de `src/`) no WebKit do Mac, a 402 × 874 pt, com dados em direto da API **DeviceTests**. Serve para rever composição, comparar com maquetas e medir áreas de toque, antes da validação nativa no iPhone.

Não substitui o iPhone: o layout é feito pelo flexbox do WebKit seguindo as regras do Yoga, as fontes são as do sistema do Mac, e os componentes nativos (calendário, teclado, folhas do sistema) são substitutos visuais.

## Requisitos

- macOS com `swiftc` (Xcode Command Line Tools) e Node 22.
- API de testes ativa em `127.0.0.1:5099` (`./scripts/start-device-test-api.sh` no backend). O runner recusa qualquer outra API.
- `../MeepleBoardApi/.device-tests/accounts.json`, ou a pasta indicada em `MEEPLE_API_DIR`.

## Utilização

```bash
node tools/visual-preview/run.mjs tools/visual-preview/scenarios/survey.json            # todos os ecrãs
node tools/visual-preview/run.mjs tools/visual-preview/scenarios/statistics.json --only 00-resumo-topo
node tools/visual-preview/run.mjs scenarios.json --account participante                 # outra conta de testes
node tools/visual-preview/run.mjs --extract docs/mockups/.../proposta.html out/dir     # um PNG por .phone de uma maqueta
node tools/visual-preview/compare.mjs comparacao.json                                   # página lado a lado
tools/visual-preview/out/bin/sheet folha.png 4 a.png b.png c.png d.png                  # folha de contacto
```

As capturas, o bundle e a sessão de teste ficam em `tools/visual-preview/out/`, que está no `.gitignore`. Cada captura tem um `.json` com as medições, e o runner mostra um resumo: erros, toques abaixo de 44 pt, texto que transborda, ícones em falta, escritas recusadas e rotas sem ecrã.

## Cenários

```json
{ "name": "pasta", "defaults": { "params": {} },
  "screens": [ { "id": "01-inicio", "route": "/dashboard", "fontScale": 1.3, "scroll": "end",
                 "steps": [ { "click": "rótulo acessível ou texto" }, { "type": ["rótulo do campo", "texto"] },
                            { "scroll": 420 }, { "scrollTo": "texto", "offset": 200 }, { "back": true } ] } ] }
```

- `route` usa os caminhos do Expo Router. Os layouts de `src/app` (separadores, Estatísticas) são aplicados como na app, e premir controlos navega entre ecrãs.
- `{{game}}`, `{{match}}`, `{{pendingMatch}}` (a primeira partida por avaliar), `{{session}}`, `{{activeSession}}`, `{{campaign}}`, `{{user:participante}}` e `{{game:Wingspan}}` (jogo pelo nome exato) são IDs reais da conta, obtidos por GET. `--account admin` usa a conta fictícia de administração.
- `"account": "participante"` no topo do cenário escolhe a conta de que ele precisa (por exemplo, quem organiza a sessão ativa). `--account` sobrepõe-se.

## Segurança

- Só GET: o cliente da pré-visualização recusa POST, PUT, PATCH e DELETE (ficam registados em “escritas recusadas”), e a API só autoriza GET por CORS.
- O token da conta de testes fica apenas em `out/session.js`, que é ignorado pelo git.
- Não usar com a API habitual.

## Ficheiros

`bundle.cjs` (empacotador e tabela de rotas) · `rn-dom.tsx` (primitivas React Native em DOM) · `mocks.tsx` (Expo, navegação, armazenamento, rede) · `app.tsx` (entrada, passos, medições) · `harness.html` · `shot.swift` (captura) · `phones.swift` (extração de maquetas) · `sheet.swift` (folhas de contacto) · `run.mjs` · `compare.mjs` · `scenarios/`.
