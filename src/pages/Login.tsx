import { LoginView } from "components/login/LoginView";
import { registerPage, AuthResource, PagePath } from "core";

export const LoginPage = registerPage(
  {
    title: PagePath.LoginPage[0],
    path: PagePath.LoginPage[1],
    resources: [AuthResource] as const,
    excludeFromSwitch: true,
  },
  ([authResource]) => <LoginView authResource={authResource} />,
);
