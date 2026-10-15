import {
  EventSeverity,
  EventStatus,
  RobotHealth,
  RobotState,
  RobotType,
} from "core";
import { MD_SYMBOLS_ICONS } from "../../../icons";

/** 화면 전체에서 같은 색을 쓰기 위한 상태 색. EUI Amsterdam 팔레트 기준 */
export const HEALTH_COLOR: Record<RobotHealth, string> = {
  [RobotHealth.Normal]: "#00BFB3",
  [RobotHealth.Warning]: "#F5A700",
  [RobotHealth.Danger]: "#BD271E",
  [RobotHealth.Offline]: "#98A2B3",
};

export const SEVERITY_COLOR: Record<EventSeverity, string> = {
  [EventSeverity.Critical]: "#BD271E",
  [EventSeverity.Warning]: "#F5A700",
  [EventSeverity.Info]: "#0077CC",
};

export const EVENT_STATUS_COLOR: Record<EventStatus, string> = {
  [EventStatus.Open]: "#BD271E",
  [EventStatus.Acknowledged]: "#F5A700",
  [EventStatus.Resolved]: "#69707D",
};

export const ROBOT_TYPE_ICON = {
  [RobotType.Delivery]: MD_SYMBOLS_ICONS.packageBox,
  [RobotType.Guide]: MD_SYMBOLS_ICONS.guide,
  [RobotType.Cleaning]: MD_SYMBOLS_ICONS.cleaning,
};

export const ROBOT_STATE_ICON: Record<
  RobotState,
  typeof MD_SYMBOLS_ICONS.robot
> = {
  [RobotState.Idle]: MD_SYMBOLS_ICONS.pause,
  [RobotState.Moving]: MD_SYMBOLS_ICONS.navigation,
  [RobotState.Working]: MD_SYMBOLS_ICONS.robot,
  [RobotState.Charging]: MD_SYMBOLS_ICONS.bolt,
  [RobotState.RidingElevator]: MD_SYMBOLS_ICONS.elevator,
  [RobotState.Paused]: MD_SYMBOLS_ICONS.pause,
  [RobotState.Held]: MD_SYMBOLS_ICONS.stop,
  [RobotState.EmergencyStop]: MD_SYMBOLS_ICONS.emergency,
  [RobotState.Error]: MD_SYMBOLS_ICONS.error,
  [RobotState.Offline]: MD_SYMBOLS_ICONS.cancel,
};

/** 배터리 색: 20% 이하 주의, 10% 이하 위험 */
export function batteryColor(battery: number) {
  if (battery <= 10) return HEALTH_COLOR[RobotHealth.Danger];
  if (battery <= 20) return HEALTH_COLOR[RobotHealth.Warning];
  return HEALTH_COLOR[RobotHealth.Normal];
}
