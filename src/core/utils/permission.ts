import {
  Resource,
  ResourceFn,
  ResourceIdentifier,
} from "../resources/register";

import { pages, isPageAccessible } from "./page";
import { Page as PageIdentifier } from "../types/pages";

import { auth } from "./auth";

export function hasPermission(target: ResourceFn | string): boolean {
  if (typeof target === "function") {
    return hasResourcePermission(target[ResourceIdentifier]);
  } else {
    const page = pages.get(target);
    if (!page) {
      if (process.env.NODE_ENV === "development") {
        throw new Error(`hasPermission: Unknown pathname "${target}"`);
      }
      return false;
    }
    return hasPagePermission(page.options.page);
  }
}

function hasPagePermission(page?: PageIdentifier) {
  return isPageAccessible(auth.getPagePermissions(), page);
}

function hasResourcePermission(resource: Resource) {
  return auth.getResourcePermissions().has(resource);
}
