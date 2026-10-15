import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { auth } from "../utils/auth";
import { getRoutes } from "../utils/page";
import { queryClient } from "../utils/queryClient";

export function useCore() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [routes, setRoutes] = useState<JSX.Element[]>([]);
  const [defaultRoute, setDefaultRoute] = useState<string>(() =>
    auth.getDefaultRoute(),
  );
  const history = useHistory();

  // 새로고침했을 때 남은 세션으로 토큰을 다시 받아 봅니다
  useEffect(() => {
    if (auth.hasAccessToken()) {
      setLoggedIn(true);
      setRoutes(getRoutes());
      return;
    }
    auth.init().catch(() => setLoggedIn(false));
  }, []);

  // 토큰이 바뀌면(로그인·재발급·로그아웃) 라우트를 다시 만듭니다
  useEffect(() => {
    const unlisten = auth.onTokenUpdate((loggedIn) => {
      setLoggedIn(loggedIn);
      // 로그아웃하면 이전 사용자 데이터가 캐시에 남지 않게 비웁니다
      if (!loggedIn) queryClient.clear();
      if (loggedIn) {
        setDefaultRoute(auth.getDefaultRoute());
        setRoutes(getRoutes());
      }
    });
    return unlisten;
  }, []);

  useEffect(() => {
    if (loggedIn === false) {
      history.push("/login");
    }
  }, [loggedIn, history]);

  return { loggedIn, routes, defaultRoute };
}
