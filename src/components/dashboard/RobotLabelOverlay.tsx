import { HealthDot, type RobotView } from "components/common/robot";
import { RobotHealth } from "core";
import type { ScreenPosition } from "./building3d";
import styles from "./RobotLabelOverlay.module.scss";

interface RobotLabelOverlayProps {
  views: RobotView[];
  positions: ScreenPosition[];
  selectedId: number | null;
  hiddenIds?: Set<number>;
  onSelect: (robotId: number) => void;
}

/** 3D 지도 위 로봇 이름표. 가까운 이름표가 먼 것을 가리면 먼 것을 숨깁니다 */
export function RobotLabelOverlay({
  views,
  positions,
  selectedId,
  hiddenIds,
  onSelect,
}: RobotLabelOverlayProps) {
  const visible = positions.filter((position) => position.visible);
  const occluded = new Set<number>();
  for (const position of visible) {
    for (const other of visible) {
      if (other.id === position.id) continue;
      const overlaps =
        Math.abs(position.pX - other.pX) < 64 &&
        Math.abs(position.pY - other.pY) < 22;
      if (overlaps && other.pZ < position.pZ && position.id !== selectedId) {
        occluded.add(position.id);
      }
    }
  }

  return (
    <div className={styles.overlay}>
      {views.map(({ robot, telemetry, health }) => {
        const position = visible.find((item) => item.id === robot.id);
        if (!position || occluded.has(robot.id) || hiddenIds?.has(robot.id)) {
          return null;
        }
        const selected = robot.id === selectedId;
        return (
          <button
            type="button"
            key={robot.id}
            className={`${styles.label} ${selected ? styles.selected : ""}`}
            style={{ left: position.pX, top: position.pY }}
            onClick={() => onSelect(robot.id)}
          >
            <HealthDot health={health} pulse={health === RobotHealth.Danger} />
            <span className={styles.name}>{robot.name}</span>
            {telemetry && (
              <span className={styles.battery}>
                {telemetry.battery.toFixed(0)}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
