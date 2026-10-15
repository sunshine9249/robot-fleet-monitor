import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * 브라우저용 목 서버. 서비스 워커가 `/api/*` 요청을 가로채 `handlers` 로 답합니다.
 * 워커 파일(`public/mockServiceWorker.js`)은 `msw init public` 으로 만든 것이라 직접 고치지 않습니다.
 */
export const worker = setupWorker(...handlers);

export function startMockServer() {
  return worker.start({
    // 정적 파일 등 목이 모르는 요청은 그대로 보냅니다
    onUnhandledRequest: "bypass",
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
}
