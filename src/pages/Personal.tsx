import {
  registerPage,
  PagePath,
  PersonalEditResource,
  PasswordChangeResource,
} from "core";
import { PersonalView } from "components/personal/PersonalView";

export const PersonalPage = registerPage(
  {
    title: PagePath.PersonalPage[0],
    path: PagePath.PersonalPage[1],
    resources: [] as const,
    optionalResources: [PersonalEditResource, PasswordChangeResource] as const,
  },
  (_resources, [personalEditResource, passwordChangeResource]) => (
    <PersonalView
      personalEditResource={personalEditResource}
      passwordChangeResource={passwordChangeResource}
    />
  ),
);
