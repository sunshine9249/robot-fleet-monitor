import {
  Page,
  PagePath,
  Section,
  registerPage,
  RoleListResource,
  RoleAddResource,
  RoleEditResource,
  RoleDeleteResource,
} from "core";
import RolesView from "components/system/role/RolesView";
import { MD_SYMBOLS_ICONS } from "../../icons";

const basePath = PagePath[Page.Roles][1];

export const RolesPage = registerPage(
  {
    page: Page.Roles,
    title: PagePath[Page.Roles][0],
    icon: MD_SYMBOLS_ICONS.adminPanel,
    path: basePath,
    section: Section.System,
    sortIndex: 1,
    resources: [RoleListResource] as const,
    optionalResources: [
      RoleAddResource,
      RoleEditResource,
      RoleDeleteResource,
    ] as const,
  },
  (
    [roleListResource],
    [roleAddResource, roleEditResource, roleDeleteResource],
  ) => (
    <RolesView
      basePath={basePath}
      roleListResource={roleListResource}
      roleAddResource={roleAddResource}
      roleEditResource={roleEditResource}
      roleDeleteResource={roleDeleteResource}
    />
  ),
);
