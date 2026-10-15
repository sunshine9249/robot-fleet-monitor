import {
  Page,
  PagePath,
  Section,
  registerPage,
  UserListResource,
  UserViewResource,
  UserAddResource,
  UserEditResource,
  UserDeleteResource,
  RoleListResource,
} from "core";
import UsersView from "components/system/user/UsersView";
import { MD_SYMBOLS_ICONS } from "../../icons";

const basePath = PagePath[Page.Users][1];

export const UsersPage = registerPage(
  {
    page: Page.Users,
    title: PagePath[Page.Users][0],
    icon: MD_SYMBOLS_ICONS.group,
    path: basePath,
    section: Section.System,
    sortIndex: 0,
    resources: [UserListResource, UserViewResource] as const,
    optionalResources: [
      RoleListResource,
      UserAddResource,
      UserEditResource,
      UserDeleteResource,
    ] as const,
  },
  (
    [userListResource, userViewResource],
    [roleListResource, userAddResource, userEditResource, userDeleteResource],
  ) => (
    <UsersView
      basePath={basePath}
      userListResource={userListResource}
      userViewResource={userViewResource}
      roleListResource={roleListResource}
      userAddResource={userAddResource}
      userEditResource={userEditResource}
      userDeleteResource={userDeleteResource}
    />
  ),
);
