import {
  Resource,
  ResourceFns,
  ResourceIdentifier,
  ResourceOptions,
  resources as ResourceMap,
} from "../resources/register";

import { auth } from "./auth";

import { SidebarTree, SidebarTreePage, SidebarTreePageGroup } from "../types";
import { isPageAccessible, PageGroup, PageOptions, pages } from "./page";

export function getSidebarTree(all?: boolean): SidebarTree {
  const pagePermissions = auth.getPagePermissions();

  const sections: (PageGroup | PageOptions<any, any>)[][] = [];
  const pageGroups = new Map<PageGroup, PageOptions<any, any>[]>();

  for (const { options: page } of pages.values()) {
    const section = page.section ?? page.pageGroup?.options.section;
    if (
      typeof section !== "undefined" &&
      (all || isPageAccessible(pagePermissions, page.page))
    ) {
      if (!sections[section]) {
        sections[section] = [];
      }
      if (page.pageGroup) {
        const children = pageGroups.get(page.pageGroup);
        if (children) {
          children.push(page);
        } else {
          sections[section].push(page.pageGroup);
          pageGroups.set(page.pageGroup, [page]);
        }
      } else {
        sections[section].push(page);
      }
    }
  }

  return sections
    .map((items) =>
      items
        .map((item) => {
          if (item instanceof PageGroup) {
            return pageGroupToSidebarGroup(item, pageGroups);
          } else {
            return pageToSidebarItem(item);
          }
        })
        .sort(sortPage),
    )
    .filter(Boolean);
}

function pageToSidebarItem(
  page: PageOptions<ResourceFns, ResourceFns>,
): SidebarTreePage {
  const resources = resolveResourceOptions(page.resources);
  const optionalResources = page.optionalResources
    ? resolveResourceOptions(page.optionalResources)
    : [];

  const resourceDependency: Resource[][] = page.resourceDependency
    ? page.resourceDependency.map((resources) =>
        resources.map((resource) => resource[ResourceIdentifier]),
      )
    : [];

  return {
    page: page.page,
    section: page.section ?? page.pageGroup?.options.section,
    title: page.title,
    path: page.path,
    icon: page.icon,
    sortIndex: page.sortIndex,
    resources,
    optionalResources,
    resourceDependency,
  };
}

function pageGroupToSidebarGroup(
  pageGroup: PageGroup,
  pageGroups: Map<PageGroup, PageOptions<any, any>[]>,
): SidebarTreePageGroup {
  const children = (pageGroups.get(pageGroup) || [])
    .map(pageToSidebarItem)
    .sort(sortPage);

  return {
    title: pageGroup.options.title,
    icon: pageGroup.options.icon,
    sortIndex: pageGroup.options.sortIndex,
    children,
  };
}

function sortPage(
  pageA: { sortIndex?: number },
  pageB: { sortIndex?: number },
) {
  return (pageA.sortIndex ?? Infinity) - (pageB.sortIndex ?? Infinity);
}

function resolveResourceOptions(resources: ResourceFns): ResourceOptions[] {
  // Filter out duplicated values
  const resourceOptionMap = new Map<Resource, ResourceOptions>();
  for (const resource of resources) {
    const resourceId = resource[ResourceIdentifier];
    const resourceOption = ResourceMap.get(resourceId);
    if (resourceOption && !resourceOptionMap.has(resourceId)) {
      resourceOptionMap.set(resourceId, resourceOption);
    }
  }
  return [...resourceOptionMap.values()];
}
