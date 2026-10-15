import { IconComponentType } from "core/utils";
import { Resource, ResourceOptions } from "../resources/register";
import { Page } from "./pages";

export type SidebarTreeCommon = {
  title: React.ReactNode;
  icon?: IconComponentType;
  sortIndex?: number;
};

export type SidebarTreePage = SidebarTreeCommon & {
  page?: Page;
  section?: number;
  path: string;
  resources: ResourceOptions[];
  optionalResources: ResourceOptions[];
  resourceDependency: Resource[][];
};

export type SidebarTreePageGroup = SidebarTreeCommon & {
  children: SidebarTreePage[];
};

export type SidebarTreeItem = SidebarTreePage | SidebarTreePageGroup;
export type SidebarTreeSection = SidebarTreeItem[];
export type SidebarTree = SidebarTreeSection[];
