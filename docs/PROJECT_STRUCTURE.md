# Folder structure and domain file layout

Project structure can change with requirements, so it is kept apart from the coding policy ([code-conventions.md](code-conventions.md)). If the structure changes, edit only this file.

## 1. Repository root

```
robot-fleet-monitor/
  src/                 # Vite root. All application code
  public/              # Static files (favicon, manifest, robots.txt) copied to build/
  build/               # Build output (gitignored)
  docs/                # These documents, design specs and screenshots
  vite.config.ts       # aliases, build settings, vitest settings
  .eslintrc.yaml  .prettierrc.json  tsconfig.json  tsconfig.node.json
  .husky/ + lint-staged  # prettier --write on commit
  CLAUDE.md  README.md
```

There is no `e2e/` folder, CI configuration or changelog.

## 2. `src/`

```
src/
  index.tsx  App.tsx  config.ts  includes.ts  euiIcons.ts  index.html
  core/              # framework layer + domain Resources
    resources/             # resource.ts, resourceName.ts, register.ts, index.ts, domain Resource folders
    components/          # form/, eui/ (EUI wrappers), Routes, GlobalLayout, EventAlert
    contexts/  hooks/  telemetry/  utils/  types/
    index.ts             # public entry (barrel)
  components/          # screen components, one folder per domain (see 2.1)
  pages/               # route-level pages (registerPage); aggregated by pages/index.ts
  mock/                # MSW handlers (handlers.ts), service worker start (browser.ts), database, fleet simulator (demo mode)
  strings/             # index.ts (locale map), ko-KR.ts (Korean texts for EUI and a few shared texts)
  styles/              # global.scss, base/ (SCSS partials: _color, _breakpoint, ...), euiColorOverride.ts
  icons/               # iconify icon maps (lineMd.ts, mdSymbols.ts)
  assets/  types/
```

### 2.1 Domain folders

| Layer | Path | Domains |
|---|---|---|
| Resources | `core/resources/<domain>/` (`index.ts`, `XxxResource.tsx`) | `auth`, `ai`, `robot`, `site`, `event`, `dashboard`, `system` (users, roles), `personal` |
| Screens | `components/<domain>/` | `dashboard` (+ `building3d/`), `monitoring`, `events`, `robots`, `system/{user,role}`, `personal`, `ai`, `login`, `header`, `model` (3D robot model and controls), `common` |
| Pages | `pages/<Name>.tsx`, `pages/system/*.tsx` | one file per registered page |

Rules:

- Domain names are camelCase folders. The same domain uses **the same name** under resources and components where both exist.
- A component used by several domains but not part of the framework goes in `components/common`; if only one domain uses it, keep it in that domain.
- Split a growing domain into feature subfolders (`system/user`, `dashboard/building3d`). Do not create subfolders first in a small domain.
- Tests sit next to the code as `*.test.ts`; styles are SCSS modules next to the component (`Foo.module.scss`).
- Robot domain types (`Robot`, `RobotTelemetry`, `RobotEvent`, health and state resolution) live in `core/types/robot.ts`.

## 3. Dependency direction and import paths

Dependency is one-way **`pages` → `components` → `core`**.

- From `components`/`pages`, import core things **always via `from "core"`**. Deep paths such as `core/resources/...` are forbidden (ESLint `import/no-restricted-paths`).
- `core` must not import other `src` folders (only `core/index.ts` is exposed outward). `mock` may import `core`, but `core` never imports `mock` ([architecture.md](architecture.md) chapter 2).
- Inside `core`, use **relative paths** and prefer importing **from the declaring module** (`../../hooks/useApi`) over an `index.ts` barrel ([code-conventions.md](code-conventions.md) ch. 1).
- Between `components`, use `baseUrl` (`src`) paths such as `components/common/ViewModal`; same folder `./`.
- Aliases (`vite.config.ts`): `assets`, `components`, `contexts`, `core`, `pages`, `strings`. `contexts` is a separate alias from `core/contexts`: do not use it, import from `core`.

## 4. New domain (feature) checklist

For a domain `foo` (types/components `Foo`):

| Step | Location | Content |
|---|---|---|
| 1 | `core/resources/resource.ts` | Append the key (`domain:verb`) to the end of the `Resource` enum. Never rename or reuse existing keys |
| 1b | `core/resources/resourceName.ts` | Add the `ResourceName` entry in Korean (`tsc` fails if missing) |
| 2 | `core/types/foo.ts` (or next to the Resource when small) | `FooData` (response), `FooFormData` / `FooDto` (request) |
| 3 | `core/resources/foo/Foo{List,View,Add,Edit,Delete}Resource.tsx` | Implement Resources ([templates](resources-and-pages.md)) |
| 4 | `core/resources/foo/index.ts` and `core/resources/index.ts` | `export *` |
| 5 | `core/types/pages.ts` | Append the key to the end of the `Page` enum |
| 5b | `core/types/pagePath.ts` | Add the `PagePath` entry `[title, path]` (`tsc` fails if missing) |
| 6 | `components/foo/*` | Layout from chapter 5 |
| 7 | `pages/Foo.tsx`, `pages/index.ts` | `registerPage` + `export *` so the registration side effect runs |
| 8 | `mock/handlers.ts` (and `mock/db.ts`) | A `route(...)` for each new endpoint; demo role permissions if needed |
| 9 | `*.test.ts` next to the code | Pure logic: mappers, validators, permissions, state resolution |

A new `Section` goes at the end of `core/types/sections.ts` (and a title in `GROUP_TITLE` of `components/system/role/permissionModel.ts`).

## 5. `components/<domain>/` file layout

```
FooView.tsx             # the screen: filters, list, and the Route branching for flyouts
FooView.module.scss
FooFormFlyout.tsx       # add/edit form flyout (creates useForm, handles submit)
FooViewFlyout.tsx       # read-only detail flyout
```

`robots` is the model (`RobotsView`, `RobotFormFlyout`, `RobotViewFlyout`). Create only what is needed (a read-only screen needs no form flyout). Shared shells for flyouts and modals are `components/common/ViewFlyout.tsx` and `ViewModal.tsx`. Split a file when it mixes concerns, for example `events` separates `EventFilterBar`, `EventTable` and `EventDetailFlyout`.

## 6. `pages/` layout

- `Foo.tsx`: `export const FooPage = registerPage(...)` (one page per file; `pages/system/` for the system menu pages).
- `index.ts`: `export *` for every page. The domain must be reachable from here so `registerPage` runs and the route and menu entry appear.

## 7. Reference domains

- Standard CRUD + flyouts + form: `robots` (`core/resources/robot`, `components/robots`, `pages/Robots.tsx`). The system users and roles screens (`components/system`) follow the same shape.
- Read-only list with filters and detail flyout: `events`.
- Live screens fed by telemetry: `dashboard`, `monitoring`.
