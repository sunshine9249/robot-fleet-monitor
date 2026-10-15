import React, { useContext, useEffect, useState } from "react";
import { Route } from "react-router-dom";

import { Page as PageIdentifier } from "../types";
import { PageContext } from "../contexts/PageContext";
import { SelectorContext } from "../contexts/SelectorContext";
import { SelectorOption, Selected } from "../hooks/useSelector";
import {
  ResourceContext,
  ResourceContextValue,
} from "../contexts/ResourceContext";

import { auth } from "./auth";
import { IconifyIcon } from "@iconify/react";

import {
  Resource,
  ResourceFn,
  ResourceFns,
  ResourceIdentifier,
} from "../resources/register";

type ReturnTypes<T> = {
  readonly [K in keyof T]: T[K] extends (...args: any) => any
    ? ReturnType<T[K]>
    : never;
};

type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export type IconComponentType =
  React.FunctionComponent<React.SVGProps<SVGSVGElement>> | IconifyIcon;

type Page<T extends ResourceFns, K extends ResourceFns> = (
  resources: ReturnTypes<T>,
  optionalResources: Nullable<ReturnTypes<K>>,
  selected: Selected,
) => React.ReactElement | null;

type PageGroupOptions = {
  /**
   * Title for page
   */
  title: React.ReactNode;
  /**
   * Icon in sidebar
   */
  icon?: IconComponentType;
  /**
   * Section in sidebar
   * If not provided, the page won't be visible in sidebar
   */
  section?: number;
  /**
   * Sort index in sidebar
   */
  sortIndex?: number;
};

export type PageOptions<
  T extends ResourceFns,
  K extends ResourceFns,
> = PageGroupOptions & {
  /**
   * Page identifier for access control
   * If not provided, the page will be accessible to all users
   */
  page?: PageIdentifier;
  /**
   * Path of the page to register
   */
  path: string;
  /**
   * Required resources on page
   * Should be annotated with `as const` to get type inference
   */
  resources: T;
  /**
   * Optional resources on page
   * Should be annotated with `as const` to get type inference
   */
  optionalResources?: K;
  /**
   * Exclude page from sidebar
   * Useful for embedded page
   * @default false
   */
  excludeFromSwitch?: boolean;
  /**
   * Manually specify resources that depends on each other
   * Should be used carefully!
   */
  resourceDependency?: ResourceFns[];
  /**
   * Display selector in Navbar
   */
  selector?: SelectorOption;
  /**
   * Page group
   */
  pageGroup?: PageGroup;
};

export class PageGroup {
  options: PageGroupOptions;

  constructor(options: PageGroupOptions) {
    this.options = options;
  }
}

export const pages = new Map<
  string,
  { WrappedPage: React.ComponentType; options: PageOptions<any, any> }
>();

const resourcesPageMap = new Map<
  Resource,
  Map<PageIdentifier, PageOptions<any, any>>
>();

export function registerPage<T extends ResourceFns, K extends ResourceFns>(
  options: PageOptions<T, K>,
  Page: Page<T, K>,
) {
  const WrappedPage = wrapPage(Page, options);
  pages.set(options.path, { WrappedPage, options });

  for (const resource of options.resources) {
    const resourceId = resource[ResourceIdentifier];
    let resourceMap = resourcesPageMap.get(resourceId);
    if (!resourceMap) {
      resourceMap = new Map();
      resourcesPageMap.set(resourceId, resourceMap);
    }
    if (options.page !== undefined) {
      resourceMap.set(options.page, options);
    }
  }

  return WrappedPage;
}

function wrapPage<T extends ResourceFns, K extends ResourceFns>(
  Page: Page<T, K>,
  options: PageOptions<T, K>,
) {
  const pageName = options.page ?? "Unknown";

  const WrappedPage = () => {
    const resourcesMaps = useState<ResourceContextValue>(() => [
      new Map(),
      new Map(),
      pageName,
    ])[0];

    const [resourcesMap, optionalResourcesMap] = resourcesMaps;

    const { setTitle } = useContext(PageContext);
    const { selected, setOption } = useContext(SelectorContext);
    // const { user } = useContext(UserContext);
    // const { addErrorBoundaryLog } = useResourceInternal(
    //   ErrorBoundaryLogAddResource,
    // );

    // 로그인 화면처럼 토큰 없이 그려지는 페이지가 있습니다. 토큰이 없으면 권한 비트도
    // 없으므로 optionalResources 를 모두 막은 채로 그립니다 (예외 상황이 아닙니다).
    const resourcePermissions = auth.hasAccessToken()
      ? auth.getResourcePermissions()
      : null;

    const resources = options.resources.map((fn) => {
      const value = fn();
      resourcesMap.set(fn[ResourceIdentifier], value);
      return value;
    }) as any;

    const optionalResources =
      (options.optionalResources?.map((fn) => {
        const value =
          resourcePermissions !== null &&
          isResourceAccessible(resourcePermissions, fn)
            ? fn()
            : null;
        // we set optionalResourcesMap to null even if it is not available
        // to provide them to `useResource` hook and distinguish if resource is provided but not available
        // or the dev haven't provided the requested resource (which will result in an error in dev mode)
        optionalResourcesMap.set(fn[ResourceIdentifier], value);
        return value;
      }) as any) || [];

    useEffect(() => {
      setTitle(options.title);
    }, [setTitle]);

    useEffect(() => {
      setOption(options.selector);
    }, [setOption]);

    return (
      <ResourceContext.Provider value={resourcesMaps}>
        {Page(resources, optionalResources, selected)}
      </ResourceContext.Provider>
    );

    // return (
    //   <ErrorBoundary fn={addErrorBoundaryLog} userId={user?.id} companyId={1}>
    //     <ResourceContext.Provider value={resourcesMaps}>
    //       {Page(resources, optionalResources, selected)}
    //     </ResourceContext.Provider>
    //   </ErrorBoundary>
    // );
  };

  WrappedPage.displayName = pageName + "Page";
  return WrappedPage;
}

export function isPageAccessible(
  pagePermissions: ReadonlySet<PageIdentifier>,
  page?: PageIdentifier,
): boolean {
  if (typeof page === "undefined") {
    return true;
  }
  return pagePermissions.has(page);
}

export function isResourceAccessible(
  resourcePermissions: ReadonlySet<Resource>,
  resource: ResourceFn,
) {
  return resourcePermissions.has(resource[ResourceIdentifier]);
}

export function getRoutes() {
  const pagePermissions = auth.getPagePermissions();

  const routes: JSX.Element[] = [];

  for (const { WrappedPage, options: page } of pages.values()) {
    if (
      !page.excludeFromSwitch &&
      isPageAccessible(pagePermissions, page.page)
    ) {
      routes.push(
        <Route key={page.path} path={page.path} component={WrappedPage} />,
      );
    }
  }

  return routes;
}

export function findPagesUsingResource(resource: Resource) {
  return resourcesPageMap.get(resource);
}
