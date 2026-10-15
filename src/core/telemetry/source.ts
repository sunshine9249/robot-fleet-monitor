import type {
  RobotEvent,
  RobotTelemetry,
  TelemetrySample,
} from "../types/robot";

/**
 * 실시간 값 공급원.
 *
 * 화면은 이 인터페이스만 압니다. 구현은 브라우저 안 시뮬레이터(src/mock/fleet)이고,
 * 화면이 시뮬레이터 코드를 직접 알지 않도록 이 인터페이스로 나눠 두었습니다.
 *
 * 구독은 로봇 단위로 나뉘어 있어서, 한 로봇 값이 바뀌어도 그 로봇을 보는
 * 컴포넌트만 다시 그려집니다.
 */
export interface TelemetrySource {
  /** 전체 로봇의 최신 값. 값이 바뀔 때마다 새 Map 으로 바뀝니다 */
  getFleet(): ReadonlyMap<number, RobotTelemetry>;
  getTelemetry(robotId: number): RobotTelemetry | undefined;
  /** 최근 추이 (오래된 것부터) */
  getHistory(robotId: number): TelemetrySample[];

  subscribeFleet(
    listener: (fleet: ReadonlyMap<number, RobotTelemetry>) => void,
  ): () => void;
  subscribeRobot(
    robotId: number,
    listener: (telemetry: RobotTelemetry) => void,
  ): () => void;
  /** 새 이벤트 발생·상태 변경 알림 */
  subscribeEvents(
    listener: (event: RobotEvent, change: "created" | "updated") => void,
  ): () => void;
}

/** Provider 밖에서 쓰였을 때의 빈 공급원 */
export const emptyTelemetrySource: TelemetrySource = {
  getFleet: () => new Map(),
  getTelemetry: () => undefined,
  getHistory: () => [],
  subscribeFleet: () => () => undefined,
  subscribeRobot: () => () => undefined,
  subscribeEvents: () => () => undefined,
};
