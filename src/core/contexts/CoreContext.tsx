import React from "react";
import { useRouteMatch } from "react-router-dom";
import { EuiFlexGroup, EuiLoadingSpinner } from "@elastic/eui";

import { useCore } from "../hooks/useCore";
import { usePage } from "../hooks/usePage";
import { useUser } from "../hooks/useUser";
import { useSelector } from "../hooks/useSelector";
import { useToast } from "../hooks/useToast";

import { RouteContext } from "./RouteContext";
import { PageContext } from "./PageContext";
import { UserContext } from "./UserContext";
import { SelectorContext } from "./SelectorContext";
import { ToastContext } from "./ToastContext";
import { EventAlert } from "../components/EventAlert";
import { UserLoadError } from "../components/UserLoadError";

export function CoreContext({ children }: { children: React.ReactNode }) {
  const state = useCore();
  const isLoginPage = useRouteMatch("/login");

  // 로그인 화면은 스스로 그립니다.
  if (isLoginPage) {
    return null;
  }

  // 새로고침 직후 토큰 재발급(/api/auth/renew)을 기다리는 동안
  if (state.loggedIn === null) {
    return (
      <EuiFlexGroup
        alignItems="center"
        justifyContent="center"
        style={{ height: "100vh" }}
      >
        <EuiLoadingSpinner size="l" />
      </EuiFlexGroup>
    );
  }

  if (!state.loggedIn) {
    return null;
  }

  return (
    <AuthCoreContext>
      <RouteContext.Provider value={state}>{children}</RouteContext.Provider>
    </AuthCoreContext>
  );
}

/** 로그인한 뒤에만 도는 훅들 */
function AuthCoreContext({ children }: { children: React.ReactNode }) {
  const page = usePage();
  const user = useUser();
  const selector = useSelector();
  const toast = useToast();

  if (!user.user && (user.errorResponse || user.error)) {
    return <UserLoadError error={user.errorResponse ?? user.error} />;
  }

  return (
    <PageContext.Provider value={page}>
      <UserContext.Provider value={user}>
        <SelectorContext.Provider value={selector}>
          <ToastContext.Provider value={toast}>
            {children}
            <EventAlert />
          </ToastContext.Provider>
        </SelectorContext.Provider>
      </UserContext.Provider>
    </PageContext.Provider>
  );
}
