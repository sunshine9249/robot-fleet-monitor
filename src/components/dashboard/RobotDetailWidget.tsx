import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { Icon } from "@iconify/react";
import {
  EventTypeLabel,
  MissionTypeLabel,
  Page,
  PagePath,
  RobotStateLabel,
  RobotTypeLabel,
  SiteFloor,
  formatDuration,
  formatRelative,
} from "core";
import {
  BatteryMeter,
  HEALTH_COLOR,
  HealthBadge,
  ROBOT_TYPE_ICON,
  SEVERITY_COLOR,
  type RobotView,
} from "components/common/robot";
import type { Mission } from "core";
import styles from "./RobotDetailWidget.module.scss";

interface RobotDetailWidgetProps {
  view: RobotView;
  mission: Mission | null;
  floors: SiteFloor[];
  initialPosition: { pX: number; pY: number };
  onClose: () => void;
  onPositionChange?: (position: { pX: number; pY: number }) => void;
  resetSignal?: number;
}

/** 지도에서 고른 로봇의 요약. 끌어서 옮길 수 있습니다 */
export function RobotDetailWidget({
  view,
  mission,
  floors,
  initialPosition,
  onClose,
  onPositionChange,
  resetSignal,
}: RobotDetailWidgetProps) {
  const history = useHistory();
  const { robot, telemetry, health, openEvents } = view;
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ pX: 0, pY: 0 });
  const firstReset = useRef(true);

  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    setPosition(initialPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if ((event.target as HTMLElement).closest("button, a")) return;
      setDragging(true);
      offset.current = {
        pX: event.clientX - position.pX,
        pY: event.clientY - position.pY,
      };
    },
    [position],
  );

  useEffect(() => {
    if (!dragging) return;
    let latest = position;
    const move = (event: MouseEvent) => {
      latest = {
        pX: event.clientX - offset.current.pX,
        pY: event.clientY - offset.current.pY,
      };
      setPosition(latest);
    };
    const up = () => {
      setDragging(false);
      onPositionChange?.(latest);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const floor = floors.find((item) => item.id === telemetry?.floorId);
  const latestEvent = openEvents[0];

  return (
    <div
      className={styles.widget}
      style={{
        left: position.pX,
        top: position.pY,
        borderColor: HEALTH_COLOR[health],
      }}
      onMouseDown={handleMouseDown}
      role="dialog"
      aria-label={`${robot.name} 요약`}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.iconWrap}>
            <Icon icon={ROBOT_TYPE_ICON[robot.type]} width={24} height={24} />
          </span>
          <div>
            <div className={styles.title}>{robot.name}</div>
            <div className={styles.subtitle}>
              {RobotTypeLabel[robot.type]} · {robot.model}
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <HealthBadge health={health} size="s" />
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      </div>

      {telemetry ? (
        <dl className={styles.info}>
          <dt>상태</dt>
          <dd>
            {RobotStateLabel[telemetry.state]}
            {telemetry.errorCode && (
              <span className={styles.error}> · {telemetry.errorCode}</span>
            )}
          </dd>
          <dt>위치</dt>
          <dd>
            {telemetry.transit
              ? `엘리베이터 이동 중 → ${floors.find((item) => item.id === telemetry.transit?.toFloorId)?.name ?? ""}`
              : `${floor?.name ?? "-"} ${floor?.label ?? ""}`}
          </dd>
          <dt>배터리</dt>
          <dd>
            <BatteryMeter
              battery={telemetry.battery}
              charging={telemetry.charging}
              width={110}
            />
          </dd>
          <dt>속도 · 모터</dt>
          <dd>
            {telemetry.speed.toFixed(2)} m/s · {telemetry.motorTemp.toFixed(1)}
            °C
          </dd>
          <dt>임무</dt>
          <dd>
            {mission ? (
              <>
                {MissionTypeLabel[mission.type]} {mission.origin} →{" "}
                {mission.destination}
                <div className={styles.progress}>
                  <span
                    style={{ width: `${Math.round(mission.progress * 100)}%` }}
                  />
                </div>
              </>
            ) : (
              "없음"
            )}
          </dd>
          {!telemetry.online && (
            <>
              <dt>마지막 수신</dt>
              <dd>{formatRelative(telemetry.timestamp)}</dd>
            </>
          )}
          {telemetry.online && (
            <>
              <dt>가동</dt>
              <dd>{formatDuration(telemetry.uptime)}</dd>
            </>
          )}
        </dl>
      ) : (
        <p className={styles.empty}>실시간 값을 기다리는 중입니다.</p>
      )}

      {latestEvent && (
        <div
          className={styles.event}
          style={{ borderLeftColor: SEVERITY_COLOR[latestEvent.severity] }}
        >
          <strong>{EventTypeLabel[latestEvent.type]}</strong>
          {openEvents.length > 1 && ` 외 ${openEvents.length - 1}건`} ·{" "}
          {formatRelative(latestEvent.occurredAt)}
        </div>
      )}

      <button
        type="button"
        className={styles.more}
        onClick={() =>
          history.push(`${PagePath[Page.Monitoring][1]}?robotId=${robot.id}`)
        }
      >
        실시간 모니터링에서 보기 →
      </button>
    </div>
  );
}
