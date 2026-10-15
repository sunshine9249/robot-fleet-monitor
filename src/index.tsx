import "./includes";
import "./styles";

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ReactRouter5Adapter } from "use-query-params/adapters/react-router-5";
import { QueryParamProvider } from "use-query-params";
import moment from "moment";

import App from "./App";

moment.locale("ko");

/**
 * 서버 없이 돌아가는 데모 앱입니다. MSW 서비스 워커(목 API)와 플릿 시뮬레이터를 켠 뒤
 * 화면을 그립니다.
 */
async function bootstrap() {
  const [{ startMockServer }, { getFleetSimulator }] = await Promise.all([
    import("./mock/browser"),
    import("./mock/fleet"),
  ]);
  // 서비스 워커가 준비된 뒤에 화면을 그려야 첫 요청도 목 서버가 받습니다
  await startMockServer();
  const telemetry = getFleetSimulator();

  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Invalid root");
  }

  createRoot(container).render(
    <BrowserRouter>
      <QueryParamProvider adapter={ReactRouter5Adapter}>
        <App telemetry={telemetry} />
      </QueryParamProvider>
    </BrowserRouter>,
  );
}

bootstrap();
