import React from "react";
import { emptyTelemetrySource, TelemetrySource } from "./source";

/**
 * 공급원 객체 자체는 앱이 사는 동안 바뀌지 않으므로, 이 컨텍스트 값이 바뀌어
 * 화면 전체가 다시 그려지는 일은 없습니다. 값 변화는 각 훅의 구독으로만 전달됩니다.
 */
export const TelemetryContext =
  React.createContext<TelemetrySource>(emptyTelemetrySource);
