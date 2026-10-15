import { useContext } from "react";
import {
  Resource as ResourceEnum,
  ResourceFn,
  ResourceIdentifier,
} from "../resources/register";
import { ResourceContext } from "../contexts/ResourceContext";

export enum UseResourceScope {
  DEFAULT = "singleton",
  SINGLETON = "singleton", // eslint-disable-line @typescript-eslint/no-duplicate-enum-values
  TRANSIENT = "transient",
}

export interface UseResourceOptions {
  readonly scope?: UseResourceScope;
}

function useResourceCommon(
  Resource: ResourceFn,
  optional: boolean,
  options?: UseResourceOptions,
) {
  const resourcesMaps = useContext(ResourceContext);
  const resourcesMap = resourcesMaps[optional ? 1 : 0];

  const resourceKey = Resource[ResourceIdentifier];
  if (
    process.env.NODE_ENV === "development" &&
    !resourcesMap.has(resourceKey)
  ) {
    const resourceName = ResourceEnum[resourceKey];
    const pageName = resourcesMaps[2];
    throw new Error(
      `${
        optional ? "Optional " : ""
      }Resource '${resourceName}' is missing in the dependency list of page '${pageName}'. Check '${
        optional ? "optionalResources" : "resources"
      }' parameter of page '${pageName}'.`,
    );
  }

  if (options?.scope === UseResourceScope.TRANSIENT) {
    return Resource();
  } else {
    return resourcesMap.get(resourceKey);
  }
}

export function useResource<T extends ResourceFn>(
  Resource: T,
  options?: UseResourceOptions,
): ReturnType<T> {
  return useResourceCommon(Resource, false, options);
}

export function useOptionalResource<T extends ResourceFn>(
  Resource: T,
  options?: UseResourceOptions,
): ReturnType<T> | null {
  return useResourceCommon(Resource, true, options);
}

/**
 * Use an resource as hook manually
 * This is intended for internal use only and must not be exposed
 * Be sure to handle permission with caution
 * @param Resource Resource to execute
 */
export function useResourceInternal<T extends ResourceFn>(
  Resource: T,
): ReturnType<T> {
  return Resource();
}
