import classNames from "classnames";
import { Icon } from "@iconify/react";
import {
  EventSeverity,
  EventSeverityLabel,
  EventStatus,
  EventStatusLabel,
  RobotHealth,
  RobotHealthLabel,
  RobotState,
  RobotStateLabel,
  RobotType,
  RobotTypeLabel,
} from "core";
import {
  EVENT_STATUS_COLOR,
  HEALTH_COLOR,
  ROBOT_STATE_ICON,
  ROBOT_TYPE_ICON,
  SEVERITY_COLOR,
  batteryColor,
} from "./status";
import { MD_SYMBOLS_ICONS } from "../../../icons";
import styles from "./RobotBadges.module.scss";

/** 종합 상태 — 점 + 글자 */
export function HealthBadge({
  health,
  size = "m",
}: {
  health: RobotHealth;
  size?: "s" | "m";
}) {
  return (
    <span
      className={classNames(styles.pill, styles[size])}
      style={{
        color:
          health === RobotHealth.Warning ? "#8A6100" : HEALTH_COLOR[health],
        background: `${HEALTH_COLOR[health]}1F`,
      }}
    >
      <span
        className={styles.dot}
        style={{ background: HEALTH_COLOR[health] }}
      />
      {RobotHealthLabel[health]}
    </span>
  );
}

/** 지도 마커처럼 글자 없이 점만 */
export function HealthDot({
  health,
  pulse = false,
}: {
  health: RobotHealth;
  pulse?: boolean;
}) {
  return (
    <span
      className={classNames(styles.dot, { [styles.pulse]: pulse })}
      style={{ background: HEALTH_COLOR[health], color: HEALTH_COLOR[health] }}
      aria-label={RobotHealthLabel[health]}
      role="img"
    />
  );
}

export function RobotStateText({ state }: { state: RobotState }) {
  return (
    <span className={styles.inline}>
      <Icon icon={ROBOT_STATE_ICON[state]} width={15} height={15} />
      {RobotStateLabel[state]}
    </span>
  );
}

export function RobotTypeText({
  type,
  iconOnly = false,
}: {
  type: RobotType;
  iconOnly?: boolean;
}) {
  return (
    <span className={styles.inline} title={`${RobotTypeLabel[type]} 로봇`}>
      <Icon icon={ROBOT_TYPE_ICON[type]} width={16} height={16} />
      {!iconOnly && RobotTypeLabel[type]}
    </span>
  );
}

/** 배터리 막대 + 숫자 */
export function BatteryMeter({
  battery,
  charging = false,
  width = 44,
  showValue = true,
}: {
  battery: number | null | undefined;
  charging?: boolean;
  width?: number;
  showValue?: boolean;
}) {
  if (battery === null || battery === undefined) {
    return <span className={styles.muted}>-</span>;
  }
  const value = Math.max(0, Math.min(100, battery));
  return (
    <span
      className={styles.battery}
      title={`배터리 ${value.toFixed(0)}%${charging ? " · 충전 중" : ""}`}
    >
      <span className={styles.batteryShell} style={{ width }}>
        <span
          className={styles.batteryFill}
          style={{ width: `${value}%`, background: batteryColor(value) }}
        />
      </span>
      {showValue && (
        <span className={styles.batteryValue}>{value.toFixed(0)}%</span>
      )}
      {charging && (
        <Icon
          icon={MD_SYMBOLS_ICONS.bolt}
          width={14}
          height={14}
          className={styles.charging}
          aria-label="충전 중"
        />
      )}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: EventSeverity }) {
  const color = SEVERITY_COLOR[severity];
  return (
    <span
      className={classNames(styles.pill, styles.s)}
      style={{
        color: severity === EventSeverity.Warning ? "#8A6100" : color,
        background: `${color}1F`,
      }}
    >
      {EventSeverityLabel[severity]}
    </span>
  );
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const color = EVENT_STATUS_COLOR[status];
  return (
    <span
      className={styles.inline}
      style={{ color: status === EventStatus.Acknowledged ? "#8A6100" : color }}
    >
      <span
        className={classNames(styles.dot, {
          [styles.hollow]: status === EventStatus.Resolved,
        })}
        style={{
          background: status === EventStatus.Resolved ? "transparent" : color,
          borderColor: color,
        }}
      />
      {EventStatusLabel[status]}
    </span>
  );
}
