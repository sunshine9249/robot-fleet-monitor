# Code conventions

Rules to follow when adding or changing code in this project. Setup, commands and the easy-to-break rules are in [CLAUDE.md](../CLAUDE.md).

Reference implementation (copy its shape for a new domain): robots.

| Layer | Path |
| --- | --- |
| Resources | `core/resources/robot/` (`RobotList/View/Add/Edit/DeleteResource.tsx`) |
| Components | `components/robots/` (`RobotsView.tsx`, `RobotFormFlyout.tsx`, `RobotViewFlyout.tsx`) |
| Page | `pages/Robots.tsx` |

Older parts of the code base are inconsistent. Do not copy the surrounding code blindly: this file and the reference implementation win. **Do not refactor, rename or reformat anything outside the scope of the request.**

Related: [resources-and-pages.md](resources-and-pages.md) (Resource/Page), [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) (file locations), [architecture.md](architecture.md) (how it works), [WORKFLOW.md](WORKFLOW.md) (commits, done checklist), [testing.md](testing.md) (tests).

## 1. Tech constraints

- React 18 + TypeScript (strict), Vite, **pnpm**, Node 20.
- Router **react-router v5** (`Switch`, `Route`, `useHistory`, `useParams`, `useRouteMatch`). The v6 API (`Routes`, `useNavigate`, `element`) is forbidden.
- Forms **react-hook-form v6.15.8** (`useForm`, `Controller`, `UseFormMethods`, `form.handleSubmit`). The v7 API (spreading the return value of `register`, `render={({ field })}`) is forbidden.
- UI is **Elastic EUI** (`@elastic/eui`, dark mode) + emotion; custom styles are SCSS Modules. 3D uses `three` with `@react-three/fiber` / `drei`.
- HTTP goes through `useApi()` (ky) **inside a Resource only**; components never call `ky` or `fetch`.
- HTTP methods: `get`, `post`, `delete`; `put` for full edits (`RobotEditResource`) and `patch` for partial updates (`EventUpdateResource`).
- Dates use `moment`. API data carries times as epoch **milliseconds** (number); display format `"YYYY-MM-DD HH:mm"` unless the screen already uses another.
- Dependency direction `pages → components → core`. Outside `core` import from `"core"`; inside `core` use relative paths ([PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)). ESLint (`import/no-restricted-paths`) enforces both: outside code may not deep-import `core`, and `core` may not import from the rest of `src`.
- Inside `core`, prefer importing from the declaring module over an `index.ts` barrel: a barrel leads back to the `core` barrel and the resulting cycle can leave exports `undefined` while modules load (for example a Resource registered before `ResourceName` exists). ESLint does not enforce this and a few files still use a barrel; do not add new ones.
- **Language**: commit subjects are English. Code comments and UI text are Korean; keep one language within a file.

## 2. Components

- File name = component name = PascalCase, domain prefix kept (`RobotFormFlyout.tsx`, `EventDetailFlyout.tsx`). Styles next to it as `<Component>.module.scss`.
- Prefer a **named export function** in new files. Existing view components (`RobotsView`, ...) use `export default`; leave them as they are.
- Props are declared right above the component and destructured in the signature, as `export type FooProps = { ... }`.
- Common props: `basePath: string` (the page's base path) and the Resource objects the screen needs (`robotListResource`, `robotDeleteResource`, ...).
- **Getting resources**:

  | Case | Use |
  | --- | --- |
  | Primary resources of the screen (list, view, add, edit, delete) | Receive the page's Resource objects as **props** |
  | Auxiliary resources used in part of a screen, or shared resources awkward to pass down | `useResource(X)` |
  | Resources whose absence must hide or block a feature | `useOptionalResource(X)` (`null` if not permitted) |

  Every resource must be declared in the page's `resources` / `optionalResources`, or dev mode throws. Details: [resources-and-pages.md](resources-and-pages.md) chapter 3.
- One responsibility per file. Helpers used by one file only (`getColumns`, small sub-components) go at the bottom of that file; if used elsewhere, make a separate file.
- Local UI state in `useState`; server state and list filters live in the Resource.
- Fill `useEffect` dependency arrays completely (`react-hooks/exhaustive-deps`). Resource setters end up in the dependencies, so they must be stable in the Resource (`useCallback`).
- When a mounted screen sets a value on a Resource, undo it in the cleanup: `useEffect(() => { set(x); return () => set(null); }, [...])`.
- The URL is the source of truth for open/selected state. Open flyouts and modals with a `Route` and close with `history.push(basePath...)`; do not keep an "is open" `useState`.
- Stable keys (`item.id`), never the index.
- Realtime robot data (positions, state, events) is read through the telemetry hooks (`core/telemetry`, e.g. `useEventStream`), not by polling from a component.

### 2.1 Lists

- Layout: filters/search/add button → `EuiBasicTable` (server-side paging and sorting through the list Resource).
- Server-side paging and sorting: pass `items`, `loading`, `sorting`, `pagination.totalItemCount`; in `onChange` call `listResource.setSort / setOrder / setPage / setPageSize`.
- Split columns into a `getColumns(...)` function outside the component.
- When a filter value changes, call the Resource setter in a `useEffect`.
- Delete flow: `useConfirm()` → on confirm `deleteResource.deleteXxx(id)` → `listResource.reload()`. An empty `try { ... } catch {}` is allowed only when the Resource's `error` or the screen shows the failure; never swallow errors without a reason.
- Row click opens the detail route; clicks on buttons and inputs do not.

### 2.2 Forms

- The form body only **renders fields** from a `form: UseFormMethods<...>` prop where it can; `useForm`, submit, list reload and closing belong to the Add/Edit flyout.
- Use `core/components/form` fields first (`FieldText`, `FieldTextArea`, `FieldNumber`, `FieldEmail`, `FieldPassword`, `FieldRadioGroup`, `DatePicker`; wrapped by `FormItem`). Use `EuiFormRow` + `Controller` only when no field exists.
- Keep form-data types and DTO mappers as React-free functions so they can be unit tested. Do not convert or validate inline in the component when the logic is non-trivial.
- Submit flow:

  ```tsx
  async function handleSubmit(data: FooFormData) {
    try {
      await addResource.addFoo(mapFooFormToDto(data));
      await listResource.reload();
      closeFlyout(); // history.push(basePath)
    } catch {}
  }
  ```

  Button: `onClick={form.handleSubmit(handleSubmit)}` + `isLoading={resource.loading}`. On failure show an `EuiCallOut color="danger"` at the top of the flyout. The `catch {}` is empty because the Resource rethrows and exposes `error` ([resources-and-pages.md](resources-and-pages.md) 1.1).

### 2.3 Flyout / Modal

- Flyouts: `EuiFlyout` → header → body → footer. Shared shells are in `components/common` (`ViewFlyout`, `ViewModal`); use them before writing a new one.
- The detail flyout reads the id with `useParams`, sets it on the view Resource (reset to `null` on unmount) and switches View/Edit with `useRouteMatch(`${basePath}/:id/edit`)`.
- Footer: cancel/close on the left, primary `EuiButton fill={true}` on the right.
- Show `"-"` for an empty value in detail views.

### 2.4 Error and loading display

- There is no global API error toast. Use the Resource's `error` / `loading` in the screen: forms use `EuiCallOut`, lists use the `loading` prop, confirmations and notices use `useConfirm`. Server error text can be read with `getErrorMessage` (`core/utils/api`).
- To react to a specific status code use `HTTPError` from `core`: `error instanceof HTTPError && error.response.status === 400`.
- The "no permission" notice (`useConfirm`) should name the needed Resource so the user knows what to ask the administrator for.
- A screen waiting for an async result always shows an `EuiLoadingSpinner` or a button `isLoading`.
- Realtime event notifications are the exception: `EventAlert` (in `core`) shows them as toasts, and the user can switch them off from the header (`ToastContext.alertsEnabled`).

## 3. UI text

- UI text is written directly in Korean in JSX, placeholders, aria-labels and confirm text. There is no per-screen i18n token scheme.
- `src/strings/ko-KR.ts` only holds the Korean texts for EUI's built-in components (`eui*`) and a few shared app texts (`app.common.*`, `app.input.*`, `app.login.*`). When EUI shows an English default somewhere, add its token there.
- Resource names (`ResourceName`) and page titles (`PagePath`) are plain Korean strings, shown in the role editor and the menu.

## 4. Styles

- Solve with EUI components and props first (`EuiFlexGroup gutterSize`, `EuiSpacer size`, `EuiPanel`).
- Custom styles: `import styles from "./Foo.module.scss"` + `className={styles.camelCase}`. Conditional classes with `classnames`.
- Shared values: import the partials in `styles/base/` (`color`, `breakpoint`, `scrollbar`, `border`, `shadow`, `typography`, `z_index`, ...) by relative path (`@import "../../styles/base/color";`) and use their variables (`$appColorPrimary`, `$appTextColorGray`, ...).
- Follow the dark theme tokens in [DESIGN.md](DESIGN.md) and the EUI overrides in `styles/euiColorOverride.ts`.
- EUI internals only via `:global(.euiXxx)`. `!important` only when unavoidable (for example to override a `position: fixed` that EUI sets itself).
- Inline `style={{}}` for one-off or data-driven values only (a per-user color); move repeated ones to the module.scss.
- Do not add hard-coded hex colors in new SCSS; use a `_color.scss` variable or the EUI `color` prop. Chart and 3D colors live in `chartTheme.ts` and `building3d/constants.ts`.
- Prefer the project's EUI wrappers in `core/components/eui` (`EuiCustomButton`, `EuiCustomBadge`, `EuiCustomAvatar`, ...) over writing a new `<button>` or `<span>` look-alike.

## 5. Code style

- Prettier (`quoteProps: consistent`, rest default): double quotes, semicolons, 2 spaces, 80 columns, trailing comma `all`. lint-staged formats on commit, but write new files already formatted.
- Names are at least 2 characters (`id-length`); use `index` and `event`, not `i` and `e`.
- `no-console`: no `console.log`. Avoid `any` and `!`; use concrete types, `?.`, `??` and guards.
- Comments: explain *why*, not *what*. **Leave no commented-out code.**
- Import order: ① React / router ② EUI and other libraries ③ `from "core"` ④ local and `components/...` ⑤ styles; then Props → main component → helpers. Between screens use the alias path (`components/common/ViewModal`); in the same folder `./`.
- Leave no unused imports, variables or props (especially when copying a screen).

## 6. Naming

| What | Rule | Example |
| --- | --- | --- |
| Component, Resource, page files | PascalCase with domain prefix | `RobotFormFlyout.tsx`, `EventListResource.tsx` |
| Hooks, utils, config files | camelCase, hooks start with `use`; barrel is `index.ts` | `useDebounce.ts`, `permissionModel.ts` |
| Folders | camelCase domain name | `robots`, `monitoring` |
| Resource | `<Domain><Verb>Resource` | `RobotListResource` |
| Props / data types | `XxxProps` / `<Domain>Data` / `<Domain>Dto` | |
| Event handlers | `handleXxx` inside, `onXxx` as props | `handleDelete`, `onEdit` |
| Booleans | `is` / `has` / `can` / `should` | `isEditPage`, `hasPermission` |
| Module-level constants | UPPER_SNAKE_CASE | `ROBOT_CHAT_SUGGESTIONS` |
| Routes, API paths (new) | kebab-case | `/api/robots`, `/system/users` |
| SCSS classes | camelCase | `.tableWrapper` |

- Functions start with a verb: read `get` / `find` / `fetch`, convert `map` / `format`, condition `is` / `has` / `can` / `should`. Write operations in Resources follow the UI text: **`add` / `edit` / `delete`** (not `create` / `update`).
- **Page base path**: `const basePath = PagePath[Page.Foo][1]` at the top of the page file, passed down as the `basePath` prop. Keep that spelling.
- **Types**: component props are `type XxxProps = { ... }`; server data shapes may be `interface` or `type`; keep an existing file consistent. **No `I` prefix.**
- **Enums**: enums that tie to permissions (`Resource`, `Page`) use **string values and PascalCase members** (`Resource.RobotListResource = "robot:list"`); a released value is never renamed. Purely local UI state may use a string-literal union.
- **Do not create two files or folders whose names differ only by case**, and match import path case exactly to the real file name (Windows/macOS ignore case, Linux build machines do not). Do not bulk-rename existing files.
- Names say what the thing is; avoid `data`, `temp`, `flag`.

## 7. Tests

Principles and rules: [testing.md](testing.md). Summary: verify what the user sees; keep decisions (health resolution, route search, permission checks, mappers) in pure functions; add `*.test.ts` next to new logic. There is no component or e2e test setup; check screens by hand and report what you checked.

## 8. Anti-patterns

Even if they appear in existing code, do not bring them into new code.

- Commented-out dead code; large components mixing logic, constants and view. Put constants in their own file and separate view from logic.
- Excess `style={{}}` and `!important`.
- Calling `ky` / `fetch` directly from a component.
- Deep imports such as `core/resources/...` from outside `core`; importing `mock` from `core`.
- When copying another domain to start a new one, leaving behind unused props, imports and comments.
- Business logic, API calls or large constant tables inside a component file.
- Renaming or restructuring files the task did not mention.
