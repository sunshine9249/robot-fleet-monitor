import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  RobotEvent,
  RobotTelemetry,
  TelemetrySample,
} from "../types/robot";
import { TelemetryContext } from "./TelemetryContext";

/** 로봇 한 대의 실시간 값. 그 로봇 값이 바뀔 때만 다시 그립니다 */
export function useRobotTelemetry(
  robotId: number | null | undefined,
): RobotTelemetry | undefined {
  const source = useContext(TelemetryContext);
  const subscribe = useCallback(
    (onChange: () => void) =>
      robotId == null
        ? () => undefined
        : source.subscribeRobot(robotId, onChange),
    [source, robotId],
  );
  const getSnapshot = useCallback(
    () => (robotId == null ? undefined : source.getTelemetry(robotId)),
    [source, robotId],
  );
  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * 전체 로봇의 실시간 값.
 *
 * 공급원은 1초에 여러 번 갱신하지만 목록·집계 화면은 그렇게 자주 그릴 필요가
 * 없어서 `intervalMs` 간격으로만 반영합니다. 3D 지도처럼 매 프레임 움직여야 하는
 * 곳은 `useFleetTelemetryRef` 를 쓰세요.
 */
export function useFleetTelemetry(
  intervalMs = 1000,
): ReadonlyMap<number, RobotTelemetry> {
  const source = useContext(TelemetryContext);
  const [fleet, setFleet] = useState(() => source.getFleet());

  useEffect(() => {
    setFleet(source.getFleet());
    let pending: ReadonlyMap<number, RobotTelemetry> | null = null;
    const unsubscribe = source.subscribeFleet((next) => {
      pending = next;
    });
    const timer = window.setInterval(() => {
      if (pending) {
        setFleet(pending);
        pending = null;
      }
    }, intervalMs);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [source, intervalMs]);

  return fleet;
}

/**
 * 다시 그리지 않고 최신 값만 ref 로 받습니다.
 * three.js `useFrame` 안에서 읽어 부드럽게 움직이는 용도입니다.
 */
export function useFleetTelemetryRef() {
  const source = useContext(TelemetryContext);
  const ref = useRef<ReadonlyMap<number, RobotTelemetry>>(source.getFleet());
  useEffect(() => {
    ref.current = source.getFleet();
    return source.subscribeFleet((next) => {
      ref.current = next;
    });
  }, [source]);
  return ref;
}

/** 최근 추이. `intervalMs` 마다 새 배열로 갱신합니다 */
export function useTelemetryHistory(
  robotId: number | null | undefined,
  intervalMs = 4000,
): TelemetrySample[] {
  const source = useContext(TelemetryContext);
  const read = useCallback(
    () => (robotId == null ? [] : [...source.getHistory(robotId)]),
    [source, robotId],
  );
  const [history, setHistory] = useState<TelemetrySample[]>(read);

  useEffect(() => {
    setHistory(read());
    const timer = window.setInterval(() => setHistory(read()), intervalMs);
    return () => window.clearInterval(timer);
  }, [read, intervalMs]);

  return history;
}

/** 새로 생긴·바뀐 이벤트를 받습니다. 콜백은 최신 것을 씁니다 */
export function useEventStream(
  onEvent: (event: RobotEvent, change: "created" | "updated") => void,
) {
  const source = useContext(TelemetryContext);
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(
    () =>
      source.subscribeEvents((event, change) =>
        callbackRef.current(event, change),
      ),
    [source],
  );
}
