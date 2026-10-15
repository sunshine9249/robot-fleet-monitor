import { Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import createCache from "@emotion/cache";

import { EuiProvider, EuiContext } from "@elastic/eui";
import {
  CoreContext,
  TelemetryContext,
  TelemetrySource,
  queryClient,
} from "core";
import { LoginPage } from "pages";
import { strings } from "strings";
import { euiOverrides } from "./styles/euiColorOverride";

import GlobalLayout from "core/components/GlobalLayout";

const emotionCache = createCache({
  key: "rfm",
  container: document.querySelector(
    `meta[name="emotion-style-insert"]`,
  ) as HTMLElement,
});

const i18n = {
  mapping: strings["ko-KR"],
};

export default function App({ telemetry }: { telemetry: TelemetrySource }) {
  return (
    <EuiProvider colorMode="dark" cache={emotionCache} modify={euiOverrides}>
      <EuiContext i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <TelemetryContext.Provider value={telemetry}>
            <Route path="/login" component={LoginPage} />

            <CoreContext>
              <Route path="/" component={GlobalLayout} />
            </CoreContext>
          </TelemetryContext.Provider>
        </QueryClientProvider>
      </EuiContext>
    </EuiProvider>
  );
}
