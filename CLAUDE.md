# CLAUDE.md

React 18 + TypeScript + Vite SPA: a robot fleet monitoring dashboard (Robot Fleet Monitor).
By default it runs without a server: a mock API (MSW service worker) and a fleet simulator start in the browser.
See [README.md](README.md) for the screens, demo accounts and setup.

**Before writing or changing code, read [docs/code-conventions.md](docs/code-conventions.md) and follow it.**
When adding a feature, copy the shape of an existing domain (see [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)).

## Commands

Use pnpm only (Node 20). Never use npm or yarn.

| Command | Description |
|---|---|
| `pnpm dev` | Dev server on :15160 (demo mode: MSW mock API + simulator) |
| `pnpm lint` | ESLint on `src` |
| `pnpm typecheck` | Type-check only (`tsc --noEmit`). Run it and `pnpm lint` before calling a change done |
| `pnpm build` | clean + lint + tsc + vite build into `build/`. Slow; use only when needed |
| `pnpm preview` | Preview the build |
| `pnpm test` / `pnpm test:watch` | Vitest unit tests (`*.test.ts` next to the code), see [docs/testing.md](docs/testing.md) |
| `pnpm prettier` | Format `src` (lint-staged also formats changed files on commit) |

## Architecture essentials (details: [docs/architecture.md](docs/architecture.md))

- `src/` is the Vite root. Aliases: `assets`, `components`, `contexts`, `core`, `pages`, `strings`.
- Dependency direction `pages` → `components` → `core`. `core` never imports from outside `core`
  (it must not import `mock` either; the mock API is an MSW service worker started in `src/index.tsx`;
  the one exception is `GlobalLayout`, marked with `eslint-disable`).
  Outside code imports from `"core"` (the barrel), not deep paths. ESLint enforces both zones.
- **Resource** = hook created with `registerResource({ id, name }, () => {...})`, one responsibility per resource
  (list/view/add/edit/delete). Components never call `fetch`/`ky` directly. Edit uses PUT (or PATCH for partial updates).
  Location: `core/resources/<domain>/`, exported from that folder's `index.ts`.
- **Page** = `registerPage(options, render)` in `pages/`. The page injects resources and passes them
  down as props (`basePath`, `xxxResource`). Registration is an import side effect, so export it from `pages/index.ts`.
  Templates: [docs/resources-and-pages.md](docs/resources-and-pages.md).
- Components get resources as props (primary), `useResource(X)` (auxiliary) or `useOptionalResource(X)` (permission-gated,
  `null` if not permitted). Each resource must be declared on the page, or dev mode throws.
- Auth: in-memory JWT renewed via `/api/auth/renew`. The JWT carries string permission keys: `pages` (e.g. `"robots"`) and `resources` (e.g. `"robot:list"`).
- HTTP: `useApi()` / `baseApi` (authenticated) or `publicApi`, both `ky`. Server state goes through
  TanStack Query, wrapped by `useQuery` / `useMutation` / `useList` in `core/hooks` (never call `useQuery` from `@tanstack/react-query` directly in a Resource). Realtime robot data comes from a
  `TelemetrySource` (`core/telemetry`, provided through `TelemetryContext`), not from a socket in `core`.
  Naming: pushed realtime values are **Telemetry**; request/response APIs and their permission keys are **Resource**
  (see [docs/architecture.md](docs/architecture.md) ch. 8). Never name a realtime subscription `...Resource`.
- UI: Elastic UI (dark mode) + SCSS modules; 3D map with three.js / react-three-fiber.
  Router **react-router v5** (no v6 API), **react-hook-form v6** (no v7 API).
- Errors: there is no global API error toast. Resources expose `loading`/`error`; screens show them with `EuiCallOut`
  or `useConfirm`. Branch on status codes with `HTTPError` from `core`.

## Code conventions (summary; details: [docs/code-conventions.md](docs/code-conventions.md))

- One responsibility per file, `XxxProps` above the component. Prefer named exports in new files.
- Forms: the form component only renders fields from a `form` prop; `useForm`, submit, reload and close live in
  the Add/Edit component.
- Flyout/Modal open and selection state lives in the URL (`Route`, `history.push(basePath...)`).
- UI text is written directly in Korean in JSX. Only EUI built-in texts and a few shared texts are in
  `src/strings/ko-KR.ts`. Do not invent an i18n token scheme for new screens.
- Naming: PascalCase component/resource/page files; camelCase hooks/utils; `UPPER_SNAKE_CASE` module constants;
  booleans `is`/`has`/`can`/`should`; no `I` prefix. Never two files/folders differing only by case.
- No `console.*`, no commented-out code, no unused imports, no unrelated refactors/renames/format sweeps.
- Add a Vitest test next to new pure logic (state resolution, simulator, mappers, permissions).
- Language: commit subjects English; code comments Korean (match the file); UI text Korean.

## Rules that are easy to break

- **Never rename or reuse a released key** in the `Resource` enum (`core/resources/resource.ts`, values like `robot:list`)
  or `Page` enum (`core/types/pages.ts`, values like `robots`). Stored roles and tokens contain these strings.
  Add new keys at the bottom; if a key must change, add a migration like `src/mock/legacyRoles.ts` and bump the mock DB version.
- A new `Resource` also needs a `ResourceName` entry (`core/resources/resourceName.ts`); a new `Page` needs a `PagePath`
  entry (`core/types/pagePath.ts`). `tsc` fails if missing. The mock API must handle the new endpoints (a `route(...)` in `src/mock/handlers.ts`).
- A `registerPage` without `page` is open to every logged-in user.
- Times in API data are epoch **milliseconds** (number, as `Date.now()`); pass them to `moment(value)` for display.
- New route paths must not be a prefix of an existing route (`<Route>` is not `exact`; the first registered wins).
- Keep a single instance of `react`, `react-dom`, `three` and `@react-three/fiber` (`resolve.dedupe` in `vite.config.ts`);
  two copies break react-three-fiber hooks.
- Do not commit `.env.local`, `.env.*.local` or `build/`.

## Commits and branches (details: [docs/WORKFLOW.md](docs/WORKFLOW.md))

- Work on `main` or short-lived branches; there are no staging/production branches.
- Commits: Conventional Commits `type: Subject`, English, imperative, <= 50 chars
  (`feat fix docs style refactor test chore`).
- **Do not commit or push unless the user asks.**

## Document index

| Document | Contents |
|---|---|
| [docs/code-conventions.md](docs/code-conventions.md) | Components, forms, styles, naming, anti-patterns |
| [docs/resources-and-pages.md](docs/resources-and-pages.md) | Resource/Page templates and registration |
| [docs/architecture.md](docs/architecture.md) | Boot order, mock API and simulator, routing, permissions, contexts |
| [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) | Folder layout, new-domain checklist |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Git, commits, completion checklist |
| [docs/testing.md](docs/testing.md) | Test policy, Vitest rules |
| [docs/deployment.md](docs/deployment.md) | Build and configuration |
| [docs/DESIGN.md](docs/DESIGN.md) | Design tokens (Vancouver+ Dark) |
| [docs/design.md_vancouver_obsidian_glow_analytics.md](docs/design.md_vancouver_obsidian_glow_analytics.md) | Design system specification (Obsidian Glow Analytics) |
