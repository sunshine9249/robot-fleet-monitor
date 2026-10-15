# Adding resources and pages

An *Resource* is a React hook, registered with a string key, that wraps an API (the key is used for permission checks). A *Page* is a route that receives Resources and assembles screens. How they work: [architecture.md](architecture.md). Where files go: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md). Component-side rules: [code-conventions.md](code-conventions.md).

Reference implementation: `core/resources/robot/` + `components/robots/` + `pages/Robots.tsx`.

## 1. Add a Resource

One Resource usually wraps one API endpoint and has one responsibility. File names: `FooListResource.tsx`, `FooViewResource.tsx`, `FooAddResource.tsx`, `FooEditResource.tsx`, `FooDeleteResource.tsx`.

1. **Add the key** in `src/core/resources/resource.ts`: append an enum member at the **bottom** with a `domain:verb` string value (`"robot:list"`). Never rename or reuse an existing key, including the key of a removed Resource.
2. **Add the label** in `src/core/resources/resourceName.ts` (plain Korean, shown in the role editor). The `ResourceName` map is typed against the enum, so `tsc` fails if you forget this step.
3. **Implement** it in `src/core/resources/<domain>/` (templates 1.1 to 1.3).
4. **Export** it with `export *` from the domain's `index.ts`; for a new domain also from `core/resources/index.ts`.
5. **Mock the endpoint** with a `route(...)` in `src/mock/handlers.ts` so the demo mode keeps working. If a demo role should get the new Resource, add it to the role data in `src/mock/db.ts`. The role editor builds its table from the registered pages, so it needs no change.

### 1.1 Add / edit / delete: `useMutation`

Write operations wrap the request in `useMutation` (`core/hooks/useRequest`, built on TanStack Query's `useMutation`). It tracks `loading`, stores the server message in `error`, and **rethrows** an `Error` with that message so the caller can branch on success/failure.

```tsx
import { useApi } from "../../hooks/useApi"; // relative: this is inside core
import { useMutation } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { RobotFormData, RobotListItem } from "../../types/robot";

export type RobotAddResource = ResourceType<typeof RobotAddResource>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RobotAddResource = registerResource(
  { id: Resource.RobotAddResource, name: ResourceName[Resource.RobotAddResource] },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation((data: RobotFormData) =>
      api.post("/api/robots", { json: data }).json<RobotListItem>(),
    );
    return { addRobot: run, loading, error };
  },
);
```

- **Same name for the value and the type**, and keep the `eslint-disable-next-line ... no-redeclare` comment.
- Inside `core`, imports are **relative and point to the declaring module**.
- Return `{ loading, error, <functions> }`. Function names are verb + domain (`addRobot`, `editRobot`, `deleteRobot`); no generic names such as `submit` / `run`.
- **Error contract**: `error` holds the message and the function rethrows. The screen proceeds on the success path inside `try { ... } catch {}` and shows `error` for the failure message ([code-conventions.md](code-conventions.md) 2.2).
- HTTP methods: `post` for add, `put` for a full edit, `patch` for a partial update, `delete` for delete. Type the response with `.json<FooData>()`. Use `removeEmptyFields` (`core/utils/api`) when empty strings or `null` must not be sent.
- New API paths are `/api/<kebab-case>`.

### 1.2 List Resource: `useList`

Wraps `useList` (`core/hooks/useList`, built on TanStack Query) and keeps the filters inside the Resource. Pass every filter that changes the result in `queryKey`: it is the cache key, and a change returns the list to page 1.

```tsx
const [query, setQuery] = useState("");

const resolver = useCallback(
  (_api: unknown, params: ListResolverParams<RobotListItem>) =>
    api.get("/api/robots", {
      searchParams: {
        page: params.page,
        pageSize: params.pageSize,
        sort: String(params.sort),
        order: params.order,
        ...(query ? { query } : {}),
      },
    }),
  [api, query],
);

const list = useList<RobotListItem>(resolver, {
  queryKey: ["robots", { query }],
  sort: "name",
  order: "asc",
  pageSize: 50,
});

return { ...list, query, setQuery };
```

- The response shape is `{ items, count }`; `page` starts at 1; the default `pageSize` is 20.
- Changing a filter changes `queryKey` and re-queries automatically, so never leave a filter out of it (the list would show another filter's cached result).
- The list only loads while `active` is true. The Page turns it on and off with `setActive(true)` / `false` (chapter 2).

### 1.3 View Resource: `useQuery`

`setFooId(id | null)` receives the target and `useQuery(name, key, fetcher)` (`core/hooks/useRequest`, built on TanStack Query) loads it. `name` is a unique cache name per Resource (`"robotView"`), so two Resources that use the same id never share a cache entry; a `null` key does not fetch. Return `{ ...query, fooId, setFooId }` (`data`, `loading`, `error`, `reload`). See `RobotViewResource`.

## 2. Add a Page

1. **Add the page key** in `src/core/types/pages.ts`: append to the `Page` enum at the **bottom** (value is the route name, `"robots"`). Never rename or reuse an existing key.
2. **Add title and path** in `src/core/types/pagePath.ts`: `PagePath[Page.Foo] = [title, path]`. The map is typed, so `tsc` fails if you forget.
3. **Page file** `src/pages/Foo.tsx` (template 2.1).
4. **Export** it with `export *` from `pages/index.ts`. Registration is an import side effect, so if this chain breaks the page does not appear.
5. **Menu**: the page shows up in the header menu or the settings menu according to its `section` (`Section` enum in `core/types/sections.ts`; a new `Section` goes at the bottom, and its group title goes into `GROUP_TITLE` in `components/system/role/permissionModel.ts`). A page without `section` stays out of the menu. Which sections appear in the header is decided by `TOP_SECTIONS` in `components/header/MainHeaderList.tsx`.

### 2.1 Template

```tsx
const basePath = PagePath[Page.Robots][1];

export const RobotsPage = registerPage(
  {
    page: Page.Robots,
    title: PagePath[Page.Robots][0],
    icon: MD_SYMBOLS_ICONS.robot,
    path: basePath,
    section: Section.Basic,
    sortIndex: 0, // order inside the section
    resources: [RobotListResource, RobotViewResource, SiteMapResource] as const,
    optionalResources: [RobotAddResource, RobotEditResource, RobotDeleteResource] as const,
    resourceDependency: [[RobotAddResource, RobotEditResource]],
  },
  (
    [robotListResource, robotViewResource, siteMapResource],
    [robotAddResource, robotEditResource, robotDeleteResource],
  ) => (
    <RobotsView
      basePath={basePath}
      robotListResource={robotListResource}
      robotViewResource={robotViewResource}
      siteMapResource={siteMapResource}
      robotAddResource={robotAddResource}
      robotEditResource={robotEditResource}
      robotDeleteResource={robotDeleteResource}
    />
  ),
);
```

Options:

- `page`: the `Page` id. **Omit it only for pages every logged-in user may open**; otherwise it is required for access control.
- `resources`: required, **always `as const`** (otherwise the render-argument types are not inferred). Each one is called on every render of the page.
- `optionalResources`: `null` when the user lacks the permission; use it to hide buttons or block a feature (also `as const`).
- `resourceDependency`: groups of Resources that must be granted together (used by the role editor). Use with care.
- `selector`: header target selector. The only value is `"robot"`; the selection arrives as the third render argument, `selected`.
- `excludeFromSwitch: true`: registers the page without a top-level route; use it for pages embedded in another page.

Rules:

- The render function's arguments are `(resources, optionalResources, selected)`; destructure the arrays and omit unused trailing arguments.
- Declare **every Resource the page tree uses** in `resources` / `optionalResources`. A child's `useResource` / `useOptionalResource` of an undeclared Resource throws in dev mode (the error names the page).
- Define the path **once** (`const basePath = PagePath[...][1]`) and derive every `Route path` and `history.push` from it; child components receive it as the `basePath` prop.
- Put the `/add` Route **before** the `/:id` Route (`Switch` matches from the top).
- A page only does: ① inject Resources ② the `setActive` lifecycle (when a list is used) ③ pass props. Screen logic, flyout/modal `Route` branching and markup live in `components/<domain>/` (see `RobotsView`).
- Paths: kebab-case for new ones, and never a prefix of an existing path (routes are not `exact`).

## 3. Using Resources in components

| Case | Use |
| --- | --- |
| **Primary Resources** of the screen (list, view, add, edit, delete) | Receive the page's Resource objects as **props**. Dependencies are visible and the component is easy to test |
| **Auxiliary Resources** used in part of a screen, or shared Resources awkward to pass down several levels | `useResource(X)` |
| Resources whose **absence must hide or block** a feature | `useOptionalResource(X)`: returns `null` when not permitted; must be in `optionalResources` |

```tsx
const { getFoo } = useResource(FooListResource);
const addResource = useOptionalResource(FooAddResource); // null if not permitted
```

This app currently passes every Resource down as a prop (`RobotsView`, `RobotControlBar` take `commandResource: RobotCommandResource | null`); the hooks exist in `core/hooks/useResource.ts` for the other two cases.

- Whichever way, **the Resource must be declared** in the page's `resources` / `optionalResources`, or dev mode throws an error naming the page.
- When `useOptionalResource` returns `null`, pick one of two fallbacks:
  1. **Hide** the button or section.
  2. If the screen is meaningless without that Resource, show a "no permission" notice and send the user back to the list: `useConfirm({ confirmOnly: true, onClickConfirm: () => history.push(basePath) })`. Include the missing Resource's name (`ResourceName[...]`) in the text so the user knows what to ask the administrator for.
- **TRANSIENT scope**: `useResource(X, { scope: UseResourceScope.TRANSIENT })` returns a fresh instance with its own state instead of the page-wide shared one. Use it when the same Resource must run with different states at the same time.
- **Outside the page system** (the login page), `useResource` does not work: call `publicApi` / `baseApi` directly or use the Resource through its own component (`AuthResource`).

## 4. Permission key checklist

Keys are a contract with the stored role data and the tokens. For every new Resource or Page:

- Append the key at the bottom of the enum, using the `domain:verb` form for resources.
- Never rename or reuse a released key. `checkDuplicateEnumValues` throws in development on a duplicate value. If a rename is unavoidable, convert the stored data with a migration (see `src/mock/legacyRoles.ts`) and bump `VERSION` in `src/mock/db.ts`.
- Keep default data that references the key (the demo roles in `src/mock/db.ts`) in sync so existing roles get or do not get the permission on purpose.
- Put it in the same commit as the code that uses it.
