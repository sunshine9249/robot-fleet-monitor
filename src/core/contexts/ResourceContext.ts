import React from "react";
import { Resource } from "../resources/resource";

export type ResourceContextValue = [
  resourcesMap: Map<Resource, any>,
  optionalResourcesMap: Map<Resource, any>,
  pageName: string,
];

export const ResourceContext = React.createContext<ResourceContextValue>([
  new Map(),
  new Map(),
  "Unknown",
]);
