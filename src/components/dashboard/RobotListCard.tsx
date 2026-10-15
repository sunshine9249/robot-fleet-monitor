import { useHistory } from "react-router-dom";
import { EuiIcon, EuiLoadingSpinner } from "@elastic/eui";
import {
  Page,
  PagePath,
  RobotHealth,
  RobotHealthLabel,
  RobotStateLabel,
  SiteFloor,
} from "core";
import {
  BatteryMeter,
  HealthBadge,
  RobotTypeText,
  type RobotView,
} from "components/common/robot";
import styles from "./RobotListCard.module.scss";

interface RobotListCardProps {
  views: RobotView[];
  floors: SiteFloor[];
  loading: boolean;
  selectedId: number | null;
  healthFilter: RobotHealth | null;
  onHealthFilterChange: (health: RobotHealth | null) => void;
  onSelect: (robotId: number) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const HEALTH_ORDER = [
  RobotHealth.Danger,
  RobotHealth.Offline,
  RobotHealth.Warning,
  RobotHealth.Normal,
];

export function RobotListCard({
  views,
  floors,
  loading,
  selectedId,
  healthFilter,
  onHealthFilterChange,
  onSelect,
  collapsed,
  onCollapsedChange,
}: RobotListCardProps) {
  const history = useHistory();
  const visible = views
    .filter((view) => !healthFilter || view.health === healthFilter)
    .sort(
      (left, right) =>
        HEALTH_ORDER.indexOf(left.health) -
          HEALTH_ORDER.indexOf(right.health) ||
        left.robot.name.localeCompare(right.robot.name),
    );
  const floorName = (floorId?: number) =>
    floors.find((floor) => floor.id === floorId)?.name ?? "-";
  const countLabel =
    loading && views.length === 0 ? "불러오는 중..." : `총 ${views.length}대`;

  if (collapsed) {
    return (
      <div className={`${styles.card} ${styles.collapsed}`}>
        <div className={styles.collapsedHeader}>
          <span className={styles.title}>로봇 목록</span>
          <span className={styles.count}>{countLabel}</span>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => onCollapsedChange(false)}
          >
            펼치기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card} aria-busy={loading}>
      <div className={styles.cardHeader}>
        <div className={styles.headerRow}>
          <span className={styles.title}>로봇 목록</span>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => onCollapsedChange(true)}
          >
            접기
          </button>
        </div>
        <div className={styles.headerRow}>
          <span className={styles.count}>
            {healthFilter
              ? `${RobotHealthLabel[healthFilter]} ${visible.length}대`
              : countLabel}
            {healthFilter && (
              <button
                type="button"
                className={styles.clearFilter}
                onClick={() => onHealthFilterChange(null)}
              >
                전체 보기
              </button>
            )}
          </span>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => history.push(PagePath[Page.Robots][1])}
          >
            관리 <EuiIcon type="gear" size="s" />
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {loading && views.length === 0 ? (
          <div className={styles.loading} role="status">
            <EuiLoadingSpinner size="l" aria-label="로봇 목록 불러오는 중" />
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>해당하는 로봇이 없습니다.</div>
        ) : (
          visible.map(({ robot, telemetry, health, openEvents }) => (
            <button
              type="button"
              key={robot.id}
              className={`${styles.item} ${robot.id === selectedId ? styles.selected : ""}`}
              onClick={() => onSelect(robot.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>
                  <RobotTypeText type={robot.type} iconOnly={true} />
                  {robot.name}
                </span>
                <HealthBadge health={health} size="s" />
              </div>
              <div className={styles.itemMeta}>
                {telemetry ? RobotStateLabel[telemetry.state] : "-"} ·{" "}
                {floorName(telemetry?.floorId)}
                {openEvents.length > 0 && (
                  <span className={styles.eventCount}>
                    이벤트 {openEvents.length}
                  </span>
                )}
              </div>
              <BatteryMeter
                battery={telemetry?.battery}
                charging={telemetry?.charging}
                width={120}
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
