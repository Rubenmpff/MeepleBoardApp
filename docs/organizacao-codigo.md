# Organização do código — app

Convenção em vigor desde 2026-10-17. A convenção da API está em `MeepleBoardApi/docs/organizacao-codigo.md`.

| Pasta | O que contém |
| --- | --- |
| `src/app` | Rotas do expo-router. Só ligam a rota ao ecrã da funcionalidade. |
| `src/features/<área>` (em `games`, uma subpasta por área: `catalog`, `matches`, `journal`, `experiences`, …) | Tudo o que é específico da área, em `components/`, `screens/`, `hooks/`, `services/`, `types/`, `utils/` e, quando existem, `store/` e `styles/`. Nada solto na raiz da área. |
| `src/ui` | Kit e elementos genéricos partilhados por várias áreas: tema, componentes do kit, `Sheet`, `Filters`, `format`, `ScreenLayout`, `ScreenState`, `ScreenHeader`, `PrimaryButton`, `GameCover`, `DialogSurface`, `StartupState`. |
| `src/shared/hooks` | Hooks partilhados que não são de interface (`useAccountMemory`, `useUnsavedChanges`). |
| `src/services`, `src/store`, `src/constants`, `src/i18n` | Cliente HTTP e tokens, store Redux, constantes e rotas, traduções PT e EN. |
| `src/styles`, `src/constants/colors` | Nomes antigos do tema, derivados de `src/ui/theme`. Mantêm-se para não mudar cores. |

**Regra para os componentes:** um componente usado por uma só área fica nessa área (por exemplo, `StarRating` nas campanhas e `ClubHeader` nas estatísticas). Vai para `src/ui` quando várias áreas o usam.

**Fica para outra etapa:** a unificação dos componentes paralelos (`PrimaryButton` e `Button`, `ScreenState` e `EmptyState`, `ScreenLayout` e `Screen`, `GameSelector` e `GamePicker`), porque muda a apresentação e exige validação visual.

**Testes:** `node --test tests/*.test.cjs` com Node 22.14.0. O harness em `tests/helpers/renderNative.cjs` simula pelo nome os hooks que constam da sua lista. As pré-visualizações estão em `tools/visual-preview` (a saída fica fora do git).
