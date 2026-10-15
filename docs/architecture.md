# Architecture

How the app boots, how pages are registered and exposed, how data reaches the screens, and how permissions apply.

To write new code, see [code-conventions.md](code-conventions.md). For Resource/Page registration, see [resources-and-pages.md](resources-and-pages.md).

## 1. Boot sequence

1. `src/index.tsx` imports `./includes` (Korean moment locale, EUI icon registration in `euiIcons.ts`, `Buffer` polyfill) and `./styles` (global SCSS, EUI color overrides).
2. `bootstrap()` decides the **data mode** (chapter 2), then renders `App` inside `BrowserRouter` and `QueryParamProvider` (react-router 5 adapter) and passes the telemetry source down.
3. `src/App.tsx` wraps everything in `EuiProvider` (dark mode, emotion cache `rfm`, `euiOverrides`), `EuiContext` (Korean texts for EUI components from `strings["ko-KR"]`) and `TelemetryContext`. `/login` renders `LoginPage` without authentication; everything else goes through `CoreContext` and `GlobalLayout`.
4. `CoreContext` renders a spinner while the token is being renewed after a reload, and `null` when logged out (`useCore` redirects to the login page). Once logged in, `AuthCoreContext` prepares `usePage`, `useUser`, `useSelector` and `useToast`, provides their contexts and mounts `EventAlert`.
5. `GlobalLayout` renders the header (`AppHeader`) and `<Routes>`. Management screens (`/basic`, `/system`) get the settings side menu (`SystemSideNav`) around the routes.

## 2. Mock API and simulator

This is a demo app: there is no backend. Everything the screens fetch comes from the browser.

- `index.tsx` starts an MSW service worker (`src/mock/browser.ts`) before rendering, so every `ky` request to `/api/*` is answered by the handlers in `src/mock/handlers.ts`. The requests show up in the browser's Network tab like real calls. The telemetry source is the fleet simulator (`src/mock/fleet`).
- Robots, users, roles and AI chat history persist in `localStorage` under `rfm.mock.db`.
- `core` never imports `mock`. The app code does not know a mock exists (it is a service worker, not an injected fetch), and screens read live values only through the `TelemetrySource` interface (`core/telemetry`).

A new endpoint therefore needs a `route(...)` in `src/mock/handlers.ts` as well as the Resource ([resources-and-pages.md](resources-and-pages.md)).

## 3. Authentication

- `core/utils/auth.ts` keeps the access token **in memory only**. On load, `auth.init()` calls `POST /api/auth/renew`; the token renews itself shortly before it expires.
- JWT payload: `sub` (user id), `pages` (accessible Page keys) and `resources` (callable Resource keys), both arrays of strings. `auth.getPagePermissions()` / `auth.getResourcePermissions()` return them as Sets, cached per token.
- Every authenticated request goes through `baseApi` (`core/utils/api.ts`), whose `beforeRequest` hook adds `Authorization: Bearer <token>`. `publicApi` sends no auth header (login, token renewal). `useApi()` returns `baseApi`.
- The demo accounts and their roles are listed in [README.md](../README.md); they are defined in `src/mock/db.ts`.

## 4. Permission model (Page / Resource keys)

- The unit of permission is a **Page** (screen access) or a **Resource** (API call). Each has a string key. A permission is granted when the key is in the matching Set from the token.
- The keys live in the string `Page` enum (`core/types/pages.ts`) and the `Resource` enum (`core/resources/resource.ts`).
- Resource keys are `domain:verb` (`robot:list`); page keys are the route name (`robots`). **Stored roles and tokens contain these strings, so never rename or reuse a released key.** Add new keys at the bottom; there is no number to keep in step. `checkDuplicateEnumValues` throws in development on a duplicate value.
- Role data in the mock database (`localStorage` `rfm.mock.db`) is version 2. Version 1 stored numeric ids and `actions`; `mock/legacyRoles.ts` converts such roles when the database loads, so existing browsers keep their users and robots.
- A `registerPage` call without `page` is open to every logged-in user.
- When the user lacks a Resource that a page uses: `resources` (required) are a precondition for accessing the page at all. `optionalResources` resolve to `null` without permission, so the page can hide buttons or features.
- `resourceDependency` declares Resource groups that must be granted together (used by the role editor).

## 5. Page registry and routing

- `registerPage(options, render)` (`core/utils/page.tsx`) stores `{ WrappedPage, options }` in a `pages` map keyed by path and returns `WrappedPage`. **Registration is an import-time side effect**, so a new page file must be exported through `pages/index.ts`.
- What `WrappedPage` does:
  - calls every Resource hook in `options.resources` **on each render** and puts the results in `ResourceContext`;
  - calls optional Resources only when the user has the permission (`null` otherwise);
  - sets the page title (`PageContext.setTitle`) and the selector option (`SelectorContext.setOption`).
- Child components read Resources with `useResource(X)` / `useOptionalResource(X)` instead of calling the hooks again. In development, `useResource` throws when the Resource is not declared on the page. This app mostly passes Resources down as props instead.
- `<Routes>` (`core/components/Routes.tsx`) builds a `<Route path={options.path}>` for each accessible page (`isPageAccessible`) and skips pages with `excludeFromSwitch: true`. `/` redirects to the user's default route (`/dashboard`).
- Routes are **not `exact`** (except `/`), so when path prefixes overlap, **the page registered first wins**. When you choose a new path, make sure it is not a prefix of an existing one.
- Sub-paths inside a page (`/add`, `/:id`, `/:id/edit`) are handled by a `Switch`/`Route` inside the screen component (Flyout/Modal switching).
- There is currently no page-level error boundary: the `ErrorBoundary` wrapper in `registerPage` is commented out, and an error thrown while rendering a page reaches the browser's default handling.

## 6. Menu

- `getSidebarTree` (`core/utils/sidebar.ts`) walks the registry and collects every page that has a `section` (or `pageGroup.options.section`), in `Section` enum order (`Dashboard`, `Monitoring`, `Events`, `Basic`, `System`). Pages of the same section are sorted by `sortIndex`. `PageGroup` exists but no page uses it today.
- The header (`MainHeaderList`) shows the sections in `TOP_SECTIONS` (dashboard, monitoring, events) as top menu items; the other sections are reached from the settings (gear) menu. A page without `section` stays out of the menu. Menu entries use `title` and `icon`.
- A new `Section` is added as an enum member at the **bottom** of `core/types/sections.ts`.

## 7. Selector and contexts

The `selector` option of `registerPage` shows a target selector in the header. The only option is `"robot"` (`SelectorOption` in `core/hooks/useSelector.ts`); the selection is kept in `localStorage` (`rfm.selector`) so the monitoring screen can continue with the robot picked on the dashboard. The page's render function receives it as the third argument, `selected`.

Contexts under `core/contexts` (plus the telemetry context):

| Context | Provides |
|---|---|
| `CoreContext` | Auth gate and the providers below |
| `RouteContext` | Login/route state from `useCore` |
| `UserContext` | Current user (`useUser`) |
| `PageContext` | Page title, sidebar tree, header subtitle |
| `SelectorContext` | Selector state (robot) |
| `ResourceContext` | Resource instances registered by the page (read by `useResource` / `useOptionalResource`) |
| `ToastContext` | Toast list from `useToast`, the realtime-alert on/off switch (`alertsEnabled`, stored in `localStorage` `alertToastEnabled`), `clearAllToasts` |
| `LayoutContext`, `LocaleContext` | Layout state, locale |
| `TelemetryContext` (`core/telemetry`) | The `TelemetrySource` (simulator in demo mode) |

## 8. Realtime data and alerts

### Naming: Telemetry vs Resource

| Term | Meaning | Examples |
|---|---|---|
| **Telemetry** | Values that keep arriving from the robots (position, state, battery, motor temperature, events). The screens subscribe to them. | `TelemetrySource`, `TelemetryContext`, `useRobotTelemetry`, `core/telemetry/` |
| **Resource** | A request/response API and its permission key. The screen asks, the server answers once. | `registerResource`, `RobotListResource`, `Resource.RobotListResource = "robot:list"`, `core/resources/` |

- Use **Telemetry** for realtime values. It is the standard word for values a robot or device reports about itself (robotics, IoT, monitoring), it is what the code already uses, and it says what the data is rather than how it travels, so the source can be the simulator today and a socket later without a rename. "Stream" and "Live" are less precise: "Stream" describes the transport (an event stream is only one part of telemetry here, `useEventStream`), and "Live" describes a UI state, not data.
- Never name a realtime subscription `...Resource`, and never fetch request/response data through `TelemetrySource`. If a value is pushed to the screen, it is telemetry; if the screen has to ask for it, it is a Resource.
- A future socket-backed source is another implementation of `TelemetrySource` under `core/telemetry/`. It does not need a Resource and has no permission key of its own; access to the screens that show it is decided by the page keys.

### Subscriptions and alerts

- `TelemetrySource` (`core/telemetry/source.ts`) is the only interface screens know: fleet snapshot, per-robot values, a short history, and an event stream. Hooks: `useFleetTelemetry`, `useRobotTelemetry`, `useTelemetryHistory`, `useEventStream`.
- Subscriptions are per robot, so a value change re-renders only the components that watch that robot.
- `EventAlert` (mounted by `AuthCoreContext`) listens to the event stream and shows danger events (and warnings that do not clear themselves) as toasts at the bottom right. The header bell-off icon (`HeaderToastToggle`) and the "알림 끄기" button turn the toasts off; a persistent setting in `localStorage` keeps it.
- `HeaderAlarm` shows the number of open events; it recounts when the event stream changes.

## 9. The `core` layer

`src/core` holds the domain-independent framework layer together with the domain Resources.

| Folder | Contents |
|---|---|
| `core/resources/` | `registerResource`-based API hooks per domain, `resource.ts` (id enum), `resourceName.ts`, `register.ts` |
| `core/components/` | `form/` (Field*, DatePicker), `eui/` (EUI wrappers such as `EuiCustomButton`, `EuiCustomBadge`, `EuiCustomAvatar`), `Routes`, `GlobalLayout`, `EventAlert`, `UserLoadError` |
| `core/hooks/` | `useResource`, `useApi`, `useList`, `useRequest` (`useQuery` / `useMutation`), `useConfirm`, `usePrompt`, `useSelector`, `useUser`, `useToast`, `useLocalStorage`, and others |
| `core/contexts/` | The contexts in chapter 7 |
| `core/telemetry/` | `TelemetrySource` interface, context and hooks |
| `core/utils/` | `auth`, `api` (ky instances, `removeEmptyFields`, `getErrorMessage`), `page` (registry), `sidebar`, `permission`, `bit`, `format`, and others |
| `core/types/` | `Page`, `PagePath`, `Section`, sidebar types, robot domain types (`robot.ts`) |

Import rules (ESLint `import/no-restricted-paths`):

- `core` must not import from other folders of `src`. The one deliberate exception is `GlobalLayout`, which wires the header, side menu and not-found page and carries an `eslint-disable` for it.
- Code outside `core` imports from the barrel only: `from "core"`. `mock` is exempt from the rule because it implements `core` types.
- Inside `core`, prefer importing each name from the module that declares it; barrels lead back to the `core` barrel and can create a cycle that leaves exports undefined while modules load. Not enforced by ESLint.

## 10. Server state (TanStack Query)

`QueryClientProvider` (in `App.tsx`) wraps the app with the shared `queryClient` (`core/utils/queryClient.ts`): no automatic retry and no refetch on window focus. Resources use it only through `useQuery`, `useMutation` and `useList` in `core/hooks`, so components still see `data` / `loading` / `error` / `reload` as before. The cache is cleared on logout (`useCore`) so a different user never sees the previous user's data. After a mutation, call `listResource.reload()` / the view's `reload()` as the screens do today.

## 11. Data flow at a glance

```
UI components -- props / useResource --> Resource (core/resources) -- useApi() / ky --> /api/*
      ^                                      | loading / error / data              |
      '-------------- render <---------------'                     MSW handlers (mock/handlers.ts)

UI components -- useFleetTelemetry / useEventStream --> TelemetrySource (fleet simulator)

URL (history) = source of truth for open/closed/selected state   -   permissions = JWT key lists (Page/Resource)
```

## 12. 3D map and models

The dashboard and monitoring screens draw the building and the robots with react-three-fiber (`components/dashboard/building3d`, `components/model`). `three`, `react`, `react-dom` and `@react-three/fiber` must resolve to a single instance (`resolve.dedupe` and `optimizeDeps.include` in `vite.config.ts`); two copies make drei's hooks fail with "Hooks can only be used within the Canvas component".

Build and environment settings: [deployment.md](deployment.md).
