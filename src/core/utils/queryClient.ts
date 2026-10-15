import { QueryClient } from "@tanstack/react-query";

/**
 * 서버 상태 캐시.
 *
 * - 실패는 화면이 `error` 로 보여 주므로 자동 재시도를 끕니다.
 * - 창을 다시 눌렀다고 폼 화면 아래 데이터가 바뀌지 않도록 포커스 재요청을 끕니다.
 *   (목록·대시보드는 필요한 곳에서 `reload` 나 주기 요청을 직접 합니다.)
 * - 사용자가 바뀌면 이전 사용자 데이터가 남지 않도록 로그아웃 때 `clear()` 합니다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
