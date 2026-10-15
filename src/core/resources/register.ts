import React from "react";

import { Resource } from "./resource";
export { Resource } from "./resource";

type ResourceDefinition<T = any> = (...args: void[]) => T;

export const ResourceIdentifier = Symbol("resource");

export type ResourceFn<T = any> = ResourceDefinition<T> & {
  [ResourceIdentifier]: Resource;
};

export type ResourceFns = readonly ResourceFn[];

export type ResourceType<T extends ResourceDefinition> = ReturnType<T>;

export type ResourceOptions = {
  id: Resource;
  name: React.ReactNode;
};

export const resources = new Map<Resource, ResourceOptions>();

export function registerResource<T>(
  options: ResourceOptions,
  fn: ResourceDefinition<T>,
) {
  const resource = fn as ResourceFn<T>;
  resource[ResourceIdentifier] = options.id;
  resources.set(options.id, options);
  return resource;
}
