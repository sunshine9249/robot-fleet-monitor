import { useState } from "react";
import { EuiFieldSearch } from "@elastic/eui";
import { RobotHealth, RobotStateLabel, SiteFloor } from "core";
import {
  BatteryMeter,
  HealthDot,
  RobotTypeText,
  type RobotView,
} from "components/common/robot";
import styles from "./RobotSelector.module.scss";

interface RobotSelectorProps {
  views: RobotView[];
  floors: SiteFloor[];
  selectedId: number | null;
  onSelect: (robotId: number) => void;
}

/** 모니터링 화면 왼쪽 로봇 목록 */
export function RobotSelector({
  views,
  floors,
  selectedId,
  onSelect,
}: RobotSelectorProps) {
  const [query, setQuery] = useState("");
  const visible = views.filter(
    ({ robot }) =>
      !query ||
      robot.name.toLowerCase().includes(query.toLowerCase()) ||
      robot.model.toLowerCase().includes(query.toLowerCase()),
  );
  const floorName = (floorId?: number) =>
    floors.find((floor) => floor.id === floorId)?.name ?? "-";

  return (
    <nav className={styles.panel} aria-label="로봇 선택">
      <div className={styles.header}>
        <span className={styles.title}>로봇</span>
        <span className={styles.count}>{views.length}대</span>
      </div>
      <div className={styles.search}>
        <EuiFieldSearch
          compressed={true}
          placeholder="이름·모델 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          fullWidth={true}
          aria-label="로봇 검색"
        />
      </div>
      <ul className={styles.list}>
        {visible.map(({ robot, telemetry, health }) => (
          <li key={robot.id}>
            <button
              type="button"
              className={`${styles.item} ${robot.id === selectedId ? styles.active : ""}`}
              aria-current={robot.id === selectedId ? "true" : undefined}
              onClick={() => onSelect(robot.id)}
            >
              <div className={styles.row}>
                <HealthDot
                  health={health}
                  pulse={health === RobotHealth.Danger}
                />
                <span className={styles.name}>{robot.name}</span>
                <RobotTypeText type={robot.type} iconOnly={true} />
                <span className={styles.floor}>
                  {floorName(telemetry?.floorId)}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.state}>
                  {telemetry ? RobotStateLabel[telemetry.state] : "-"}
                </span>
                <BatteryMeter
                  battery={telemetry?.battery}
                  charging={telemetry?.charging}
                  width={40}
                />
              </div>
            </button>
          </li>
        ))}
        {visible.length === 0 && (
          <li className={styles.empty}>검색 결과가 없습니다.</li>
        )}
      </ul>
    </nav>
  );
}
