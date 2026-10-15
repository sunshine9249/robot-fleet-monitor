/**
 * 로봇 플릿 도메인 타입.
 *
 * 화면·리소스·목 API(MSW)가 모두 이 파일의 타입을 공유합니다.
 */

// ---------------------------------------------------------------------------
// 로봇
// ---------------------------------------------------------------------------

/** 로봇 종류 */
export enum RobotType {
  /** 물품 배송 */
  Delivery = "DELIVERY",
  /** 방문객 안내 */
  Guide = "GUIDE",
  /** 바닥 청소 */
  Cleaning = "CLEANING",
}

export const RobotTypeLabel: Record<RobotType, string> = {
  [RobotType.Delivery]: "배송",
  [RobotType.Guide]: "안내",
  [RobotType.Cleaning]: "청소",
};

/**
 * 종합 상태. 실시간 값(상태·배터리·온도)과 미해결 이벤트로 정합니다.
 * 판정 규칙은 `resolveRobotHealth` 한 곳에만 둡니다.
 */
export enum RobotHealth {
  Normal = "NORMAL",
  Warning = "WARNING",
  Danger = "DANGER",
  Offline = "OFFLINE",
}

export const RobotHealthLabel: Record<RobotHealth, string> = {
  [RobotHealth.Normal]: "정상",
  [RobotHealth.Warning]: "주의",
  [RobotHealth.Danger]: "위험",
  [RobotHealth.Offline]: "오프라인",
};

/** 운행 상태 (로봇이 지금 무엇을 하고 있는지) */
export enum RobotState {
  Idle = "IDLE",
  Moving = "MOVING",
  Working = "WORKING",
  Charging = "CHARGING",
  RidingElevator = "RIDING_ELEVATOR",
  /** 장애물 등으로 잠시 멈춤. 스스로 풀리면 다시 이동합니다 */
  Paused = "PAUSED",
  /** 운영자가 원격으로 멈춤 */
  Held = "HELD",
  EmergencyStop = "EMERGENCY_STOP",
  Error = "ERROR",
  Offline = "OFFLINE",
}

export const RobotStateLabel: Record<RobotState, string> = {
  [RobotState.Idle]: "대기",
  [RobotState.Moving]: "주행 중",
  [RobotState.Working]: "작업 중",
  [RobotState.Charging]: "충전 중",
  [RobotState.RidingElevator]: "엘리베이터 탑승",
  [RobotState.Paused]: "일시 정지",
  [RobotState.Held]: "원격 정지",
  [RobotState.EmergencyStop]: "비상 정지",
  [RobotState.Error]: "오류",
  [RobotState.Offline]: "통신 끊김",
};

export interface Robot {
  id: number;
  /** 화면에 쓰는 이름 (예: DLV-01) */
  name: string;
  serialNo: string;
  type: RobotType;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  /** 대기·충전하는 층 */
  homeFloorId: number;
  /** 전용 충전 스테이션 */
  dockId: number;
  /** YYYY-MM-DD */
  installedAt: string;
  memo: string | null;
  createdAt: number;
}

export interface RobotListItem extends Robot {
  overallStatus: RobotHealth;
  state: RobotState;
  battery: number | null;
  floorId: number | null;
  /** 오늘 끝낸 임무 수 */
  todayMissionCount: number;
  /** 누적 주행거리 (km) */
  odometerKm: number;
  /** 미해결 이벤트 수 */
  openEventCount: number;
}

export type RobotFormData = Omit<Robot, "id" | "createdAt">;

// ---------------------------------------------------------------------------
// 실시간 텔레메트리
// ---------------------------------------------------------------------------

export interface RobotPose {
  x: number;
  z: number;
  /** 진행 방향 (라디안, +X 축 기준 반시계) */
  heading: number;
}

export interface RobotTelemetry {
  robotId: number;
  timestamp: number;
  online: boolean;
  state: RobotState;
  floorId: number;
  pose: RobotPose;
  /** 0 ~ 100 */
  battery: number;
  charging: boolean;
  /** m/s */
  speed: number;
  /** 구동 모터 온도 °C */
  motorTemp: number;
  /** 0 ~ 100 */
  cpuLoad: number;
  /** Wi-Fi 신호 dBm (-30 좋음 ~ -90 나쁨) */
  rssi: number;
  lidarOk: boolean;
  eStop: boolean;
  missionId: number | null;
  /** 진행 중인 임무의 남은 경로 (지도 좌표) */
  route: { floorId: number; x: number; z: number }[];
  /**
   * 엘리베이터로 층을 옮기는 중일 때만 채워집니다.
   * 그동안 `floorId` 는 출발층이고, 도착하면 도착층으로 바뀝니다.
   */
  transit: {
    elevatorId: number;
    fromFloorId: number;
    toFloorId: number;
    /** 0 ~ 1 */
    progress: number;
  } | null;
  errorCode: string | null;
  /** 누적 주행거리 (m) */
  odometer: number;
  /** 누적 가동시간 (초) */
  uptime: number;
}

/** 추이 차트용 표본 */
export interface TelemetrySample {
  timestamp: number;
  battery: number;
  speed: number;
  motorTemp: number;
  cpuLoad: number;
  rssi: number;
}

export enum RobotCommand {
  /** 원격 정지 */
  Hold = "HOLD",
  /** 원격 정지·일시정지 해제 */
  Resume = "RESUME",
  /** 하던 일을 그만두고 충전 스테이션으로 */
  ReturnToDock = "RETURN_TO_DOCK",
  /** 비상 정지·오류 해제 (현장 확인 후) */
  Reset = "RESET",
}

export const RobotCommandLabel: Record<RobotCommand, string> = {
  [RobotCommand.Hold]: "원격 정지",
  [RobotCommand.Resume]: "재개",
  [RobotCommand.ReturnToDock]: "복귀",
  [RobotCommand.Reset]: "오류 해제",
};

// ---------------------------------------------------------------------------
// 임무
// ---------------------------------------------------------------------------

export enum MissionType {
  Delivery = "DELIVERY",
  Guide = "GUIDE",
  Cleaning = "CLEANING",
  Charge = "CHARGE",
}

export const MissionTypeLabel: Record<MissionType, string> = {
  [MissionType.Delivery]: "배송",
  [MissionType.Guide]: "안내",
  [MissionType.Cleaning]: "청소",
  [MissionType.Charge]: "충전 복귀",
};

export enum MissionStatus {
  InProgress = "IN_PROGRESS",
  Completed = "COMPLETED",
  Failed = "FAILED",
  Canceled = "CANCELED",
}

export const MissionStatusLabel: Record<MissionStatus, string> = {
  [MissionStatus.InProgress]: "진행 중",
  [MissionStatus.Completed]: "완료",
  [MissionStatus.Failed]: "실패",
  [MissionStatus.Canceled]: "취소",
};

export interface Mission {
  id: number;
  robotId: number;
  type: MissionType;
  status: MissionStatus;
  /** 출발지 이름 */
  origin: string;
  /** 목적지 이름 */
  destination: string;
  /** 0 ~ 1 */
  progress: number;
  createdAt: number;
  finishedAt: number | null;
}

// ---------------------------------------------------------------------------
// 이벤트
// ---------------------------------------------------------------------------

export enum EventType {
  CollisionRisk = "COLLISION_RISK",
  ObstacleBlocked = "OBSTACLE_BLOCKED",
  LowBattery = "LOW_BATTERY",
  EmergencyStop = "EMERGENCY_STOP",
  LocalizationLost = "LOCALIZATION_LOST",
  MotorOverheat = "MOTOR_OVERHEAT",
  CommunicationLost = "COMMUNICATION_LOST",
  ElevatorTimeout = "ELEVATOR_TIMEOUT",
  MissionFailed = "MISSION_FAILED",
}

export const EventTypeLabel: Record<EventType, string> = {
  [EventType.CollisionRisk]: "충돌 위험",
  [EventType.ObstacleBlocked]: "경로 막힘",
  [EventType.LowBattery]: "배터리 부족",
  [EventType.EmergencyStop]: "비상 정지",
  [EventType.LocalizationLost]: "위치 인식 실패",
  [EventType.MotorOverheat]: "모터 과열",
  [EventType.CommunicationLost]: "통신 끊김",
  [EventType.ElevatorTimeout]: "엘리베이터 대기 초과",
  [EventType.MissionFailed]: "임무 실패",
};

export enum EventSeverity {
  Critical = "CRITICAL",
  Warning = "WARNING",
  Info = "INFO",
}

export const EventSeverityLabel: Record<EventSeverity, string> = {
  [EventSeverity.Critical]: "위험",
  [EventSeverity.Warning]: "주의",
  [EventSeverity.Info]: "정보",
};

export enum EventStatus {
  /** 발생 후 아무도 확인하지 않음 */
  Open = "OPEN",
  /** 운영자가 확인함 */
  Acknowledged = "ACKNOWLEDGED",
  /** 조치 완료 */
  Resolved = "RESOLVED",
}

export const EventStatusLabel: Record<EventStatus, string> = {
  [EventStatus.Open]: "미확인",
  [EventStatus.Acknowledged]: "확인",
  [EventStatus.Resolved]: "조치 완료",
};

export interface RobotEvent {
  id: number;
  robotId: number;
  robotName: string;
  type: EventType;
  severity: EventSeverity;
  status: EventStatus;
  floorId: number;
  position: { x: number; z: number };
  message: string;
  occurredAt: number;
  acknowledgedAt: number | null;
  resolvedAt: number | null;
  /** 조치 내용 */
  note: string | null;
  /** 발생 시점의 주요 값 */
  snapshot: {
    state: RobotState;
    battery: number;
    speed: number;
    motorTemp: number;
  };
}

// ---------------------------------------------------------------------------
// 시설 지도
// ---------------------------------------------------------------------------

export interface SiteFloor {
  id: number;
  /** 층 표기 (예: 1F) */
  name: string;
  /** 용도 (예: 로비) */
  label: string;
  /** 아래층부터 0, 1, 2 ... */
  level: number;
  width: number;
  depth: number;
}

export enum WaypointKind {
  /** 목적지가 될 수 있는 장소 */
  Poi = "POI",
  /** 경로 연결점 */
  Path = "PATH",
  /** 엘리베이터 탑승 지점 */
  Elevator = "ELEVATOR",
  /** 충전 스테이션 앞 */
  Dock = "DOCK",
}

export interface Waypoint {
  id: string;
  name: string;
  floorId: number;
  x: number;
  z: number;
  kind: WaypointKind;
}

export interface SiteElevator {
  id: number;
  name: string;
  x: number;
  z: number;
  floorIds: number[];
}

export interface SiteDock {
  id: number;
  name: string;
  floorId: number;
  x: number;
  z: number;
  /** 이 스테이션 앞 경유점 */
  waypointId: string;
}

/** 출입구·회의실 같은 공간 표시용 구역 */
export interface SiteZone {
  id: string;
  name: string;
  floorId: number;
  x: number;
  z: number;
  width: number;
  depth: number;
}

export interface SiteMap {
  id: number;
  name: string;
  address: string;
  floors: SiteFloor[];
  elevators: SiteElevator[];
  docks: SiteDock[];
  zones: SiteZone[];
  waypoints: Waypoint[];
  /** 같은 층 경유점끼리의 연결 (양방향) */
  edges: [string, string][];
}

// ---------------------------------------------------------------------------
// 판정 규칙
// ---------------------------------------------------------------------------

export const BATTERY_WARNING = 20;
export const BATTERY_CRITICAL = 10;
export const MOTOR_TEMP_WARNING = 70;
export const MOTOR_TEMP_CRITICAL = 85;

/**
 * 종합 상태 판정.
 * 대시보드·목록·모니터링이 같은 규칙을 써야 색이 어긋나지 않으므로 이 함수만 씁니다.
 */
export function resolveRobotHealth(
  telemetry: Pick<
    RobotTelemetry,
    "online" | "state" | "battery" | "motorTemp"
  > | null,
  openEvents: { severity: EventSeverity }[] = [],
): RobotHealth {
  if (!telemetry || !telemetry.online) return RobotHealth.Offline;
  if (
    telemetry.state === RobotState.EmergencyStop ||
    telemetry.state === RobotState.Error ||
    telemetry.battery <= BATTERY_CRITICAL ||
    telemetry.motorTemp >= MOTOR_TEMP_CRITICAL ||
    openEvents.some((event) => event.severity === EventSeverity.Critical)
  ) {
    return RobotHealth.Danger;
  }
  if (
    telemetry.battery <= BATTERY_WARNING ||
    telemetry.motorTemp >= MOTOR_TEMP_WARNING ||
    telemetry.state === RobotState.Held ||
    openEvents.some((event) => event.severity === EventSeverity.Warning)
  ) {
    return RobotHealth.Warning;
  }
  return RobotHealth.Normal;
}
