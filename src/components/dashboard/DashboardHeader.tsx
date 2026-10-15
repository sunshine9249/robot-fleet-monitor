import VerticalDivider from "components/common/VerticalDivider";
import { HEALTH_COLOR, batteryColor } from "components/common/robot";
import { RobotHealth, RobotHealthLabel, type DashboardSummary } from "core";
import styles from "./DashboardHeader.module.scss";

export interface FleetSummary {
  total: number;
  counts: Record<RobotHealth, number>;
  /** 임무 수행 중 */
  busy: number;
  charging: number;
  /** 통신 정상 로봇의 평균 배터리 */
  averageBattery: number | null;
  /** 가동률: 통신 정상이고 위험이 아닌 로봇 비율 */
  availability: number;
}

interface DashboardHeaderProps {
  fleet: FleetSummary;
  summary: DashboardSummary | null;
  panelsHidden: boolean;
  onTogglePanels: () => void;
  onHealthClick?: (health: RobotHealth) => void;
}

function rateColor(rate: number) {
  if (rate >= 90) return HEALTH_COLOR[RobotHealth.Normal];
  if (rate >= 60) return HEALTH_COLOR[RobotHealth.Warning];
  return HEALTH_COLOR[RobotHealth.Danger];
}

export function DashboardHeader({
  fleet,
  summary,
  panelsHidden,
  onTogglePanels,
  onHealthClick,
}: DashboardHeaderProps) {
  const color = rateColor(fleet.availability);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.equipmentTotal}>
          <button
            type="button"
            className={`${styles.panelToggleButton} ${panelsHidden ? styles.panelToggleActive : ""}`}
            onClick={onTogglePanels}
            title={panelsHidden ? "패널 보이기" : "패널 숨기기"}
            aria-pressed={panelsHidden}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              {[
                [2, 2],
                [12, 2],
                [2, 12],
                [12, 12],
              ].map(([x, y]) => (
                <rect
                  key={`${x}${y}`}
                  x={x}
                  y={y}
                  width="6"
                  height="6"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          </button>
          <div className={styles.stack}>
            <span className={styles.labelSmall}>전체 로봇</span>
            <span className={styles.valueMain}>{fleet.total}대</span>
          </div>
        </div>

        <div className={styles.operationRate}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${fleet.availability}%`, background: color }}
            />
          </div>
          <div className={styles.progressInfo}>
            <span className={styles.labelSmall}>가동률</span>
            <span className={styles.progressValue} style={{ color }}>
              {fleet.availability.toFixed(1)}%
            </span>
          </div>
        </div>

        <VerticalDivider height={32} backgroundColor="#D3DAE6" />

        <div className={styles.stack}>
          <span className={styles.labelSmall}>로봇 현황</span>
          <div className={styles.statusGroup}>
            {Object.values(RobotHealth).map((health) => (
              <button
                type="button"
                key={health}
                className={styles.statusItem}
                onClick={() => onHealthClick?.(health)}
                title={`${RobotHealthLabel[health]} 로봇 보기`}
              >
                <span
                  className={styles.statusDot}
                  style={{ background: HEALTH_COLOR[health] }}
                />
                <span className={styles.statusText}>
                  {RobotHealthLabel[health]}
                </span>
                <span className={styles.statusCount}>
                  {fleet.counts[health]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <VerticalDivider height={32} backgroundColor="#D3DAE6" />

        <div className={styles.stack}>
          <span className={styles.labelSmall}>운행</span>
          <span className={styles.valueMain}>
            임무 {fleet.busy}
            <span className={styles.valueSub}> · 충전 {fleet.charging}</span>
          </span>
        </div>

        <div className={styles.stack}>
          <span className={styles.labelSmall}>평균 배터리</span>
          <span
            className={styles.valueMain}
            style={{
              color:
                fleet.averageBattery !== null
                  ? batteryColor(fleet.averageBattery)
                  : undefined,
            }}
          >
            {fleet.averageBattery !== null
              ? `${fleet.averageBattery.toFixed(0)}%`
              : "-"}
          </span>
        </div>

        <VerticalDivider height={32} backgroundColor="#D3DAE6" />

        <div className={styles.stack}>
          <span className={styles.labelSmall}>오늘 완료 임무</span>
          <span className={styles.valueMain}>
            {summary ? `${summary.todayMissionCount}건` : "-"}
          </span>
        </div>

        <div className={styles.stack}>
          <span className={styles.labelSmall}>오늘 이벤트</span>
          <span className={styles.valueMain}>
            {summary ? `${summary.todayEventCount}건` : "-"}
            {summary && summary.todayCriticalCount > 0 && (
              <span className={styles.critical}>
                {" "}
                · 위험 {summary.todayCriticalCount}
              </span>
            )}
          </span>
        </div>
      </div>
    </header>
  );
}
