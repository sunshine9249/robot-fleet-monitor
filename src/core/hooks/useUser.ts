import { useState, useEffect, useCallback } from "react";
import { baseApi, HTTPError } from "../utils/api";
import { auth } from "../utils/auth";
import type { UserInfo } from "../types/user";

export type { UserInfo };

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

/** 로그인한 사용자 정보. CoreContext 가 로그인 뒤 한 번만 부릅니다 */
export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorResponse, setErrorResponse] = useState<ApiError | null>(null);

  const getUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorResponse(null);
    try {
      setUser(await baseApi.get("/api/user/me").json<UserInfo>());
    } catch (error) {
      if (error instanceof HTTPError) {
        setErrorResponse(await error.response.json<ApiError>());
      } else if (error instanceof Error) {
        setError(error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getUser();
  }, [getUser]);

  const logout = useCallback(async () => {
    // 상태는 비울 필요가 없습니다. 토큰이 사라지면 화면 트리 전체가 내려갑니다.
    await auth.logout();
  }, []);

  return {
    user,
    setUser,
    logout,
    reload: getUser,
    loading,
    error,
    errorResponse,
  };
}
