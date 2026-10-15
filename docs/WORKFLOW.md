# Work workflow

Separate from the coding policy ([code-conventions.md](code-conventions.md)): branches, commits and the definition of "done".

## 1. Git conventions

### Branches

The repository has a single `main` branch (remote `origin/main`). Work directly on `main` or on a short-lived branch (`feature/{name}`, `fix/{name}`) and merge it back; there is no staging or production branch and no review pipeline.

- Branch names are lowercase kebab-case.

### Commit messages

- **English**, format `type: Subject`, subject **<= 50 characters**, **imperative** (`Add`, `Fix`, `Update`).
- Conventional Commits types:

  | type | Use |
  |---|---|
  | `feat` | New feature |
  | `fix` | Bug fix |
  | `docs` | Documentation |
  | `style` | Formatting/style only |
  | `refactor` | Refactoring without behavior change |
  | `test` | Tests |
  | `chore` | Build, config, dependencies, misc |

- Put details in the body after a blank line:

  ```
  feat: Add alert toast toggle to the header

  - Add alertsEnabled to ToastContext, stored in localStorage
  - Add "알림 끄기" button and header icon
  ```

## 2. Build

- `pnpm build` locally must pass (it runs lint and `tsc`). Output goes to `build/`; see [deployment.md](deployment.md).
- Pre-commit: husky runs `lint-staged`, which runs `prettier --write` on staged `js/ts/tsx/json/css/scss` files.

## 3. When delegating work to an AI

- Example request: "Build `<feature>` on the model of `<reference domain>`, following the chapter 4 checklist of `docs/PROJECT_STRUCTURE.md`."
- Respect the structure of existing files, write new parts per `docs/code-conventions.md`, and **do not refactor, rename or mass-format outside the requested scope.**
- Do not commit or push unless asked.
- When done, go through the checklist below and report results as they are (passed/failed, skipped items).

## 4. Completion checklist

- [ ] `pnpm lint` passes (no new warnings)
- [ ] `pnpm typecheck` passes (no type errors)
- [ ] Prettier applied (including new files)
- [ ] New `Resource` / `Page`: key appended at the end of the enum (no released key renamed), `ResourceName` / `PagePath` entry added, mock handlers cover the endpoints
- [ ] New page: exported from `pages/index.ts`, route and menu entry visible
- [ ] No unused imports, dead code or `console.*`
- [ ] Tests added for new logic: `pnpm test` passes ([testing.md](testing.md))
- [ ] The screen was opened in `pnpm dev` and checked in normal, error and empty-list states, with the three demo roles when permissions are involved (`admin`, `operator`, `viewer`)
- [ ] If the change touches data stored in the mock database, check it with a fresh state too (`localStorage.removeItem("rfm.mock.db")`, then reload)
