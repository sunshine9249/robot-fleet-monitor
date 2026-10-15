import React, { useContext } from "react";
import {
  Switch,
  Route,
  Redirect,
  RouteComponentProps,
  matchPath,
} from "react-router-dom";
import {
  EuiButton,
  EuiEmptyPrompt,
  EuiPage,
  EuiPageBody,
  EuiText,
} from "@elastic/eui";

import { RouteContext } from "../contexts/RouteContext";
import { Page } from "../types/pages";
import { PagePath } from "../types/pagePath";
import { auth } from "../utils/auth";

export type RoutesProps = {
  notFound?:
    React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
};

/**
 * 접근 가능한 화면이 하나도 없을 때.
 *
 * 화면 권한은 액세스 토큰의 `pages` 목록으로만 판단하고(`getPagePermissions`),
 * 목록에 없으면 조용히 false 가 됩니다. 그래서 권한이 통째로 비면 라우트가 0개가
 * 되는데, 이때 "Page Not Found" 를 띄우면 경로 문제인지 권한 문제인지 알 수가
 * 없습니다. 원인을 짚어 주는 화면을 따로 보여줍니다.
 */
function NoAccessiblePage() {
  return (
    <EuiPage style={{ height: "100%" }}>
      <EuiPageBody>
        <EuiEmptyPrompt
          iconType="lock"
          title={<h2>접근 가능한 화면이 없습니다</h2>}
          body={
            <EuiText size="s">
              <p>
                계정에 부여된 화면 권한이 없거나, 로그인 정보가 권한 변경 전의
                것입니다.
              </p>
              <p>
                다시 로그인해도 같다면 관리자에게 권한(역할) 설정을 확인해
                주세요.
              </p>
            </EuiText>
          }
          actions={
            <EuiButton
              fill={true}
              onClick={() => {
                // 권한은 로그인 시점에 토큰에 박히므로, 새 토큰을 받아야 반영됩니다.
                auth
                  .logout()
                  .catch(() => undefined)
                  .finally(() => {
                    window.location.href = "/login";
                  });
              }}
            >
              다시 로그인
            </EuiButton>
          }
        />
      </EuiPageBody>
    </EuiPage>
  );
}

/**
 * 경로를 못 찾았을 때 "없는 주소"인지 "권한이 없어 화면이 사라진 것"인지 가려 줍니다.
 *
 * `page` 를 두지 않은 화면(계정 설정)은 권한과 무관하게 항상 라우트에 들어갑니다.
 * 그래서 권한 비트가 통째로 비어도 라우트 수는 0 이 아니고, 사용자 눈에는
 * "계정 설정만 열리고 나머지는 전부 Page Not Found" 로 보입니다.
 */
function NotFoundOrNoAccess({
  notFound: NotFound,
  ...routeProps
}: Required<RoutesProps> & RouteComponentProps<any>) {
  const hasPagePermission =
    auth.hasAccessToken() && auth.getPagePermissions().size > 0;

  return hasPagePermission ? (
    <NotFound {...routeProps} />
  ) : (
    <NoAccessiblePage />
  );
}

export function Routes({ notFound }: RoutesProps) {
  const { routes, defaultRoute } = useContext(RouteContext);

  // 권한이 없는 계정도 계정 설정 화면은 남으므로 여기까지 오는 일은 없습니다. 방어용입니다.
  if (routes.length === 0) {
    return <NoAccessiblePage />;
  }

  /**
   * 기본 경로는 서버가 로그인 응답으로 내려준 값(`defaultRoute`)을 그대로 씁니다.
   *
   * 다만 그 화면에 권한이 없거나 이 앱에 없는 경로일 수 있어, 그때는 대시보드 →
   * 접근 가능한 첫 화면 순으로 물러섭니다. 등록 순서에 기대지 않도록 대시보드를
   * 먼저 봅니다.
   */
  const paths = routes.map((route) => route.props.path as string);
  const isRoutable = (target: string) =>
    !!target && paths.some((path) => matchPath(target, { path }));

  const dashboard = PagePath[Page.Dashboard][1];
  const home = isRoutable(defaultRoute)
    ? defaultRoute
    : isRoutable(dashboard)
      ? dashboard
      : paths[0];

  return (
    <Switch>
      <Route path="/" exact={true}>
        <Redirect to={home} />
      </Route>
      {routes}
      <Route
        path="*"
        render={(routeProps) =>
          notFound ? (
            <NotFoundOrNoAccess notFound={notFound} {...routeProps} />
          ) : null
        }
      />
    </Switch>
  );
}
