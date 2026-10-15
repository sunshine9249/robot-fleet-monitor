import { useMemo } from "react";
import { RobotHealth, RobotTelemetry, SiteMap, WaypointKind } from "core";
import { HEALTH_COLOR } from "components/common/robot";
import styles from "./FloorMap2D.module.scss";

interface FloorMap2DProps {
  site: SiteMap;
  floorId: number;
  /** 주인공 로봇 */
  robotId: number | null;
  telemetry?: RobotTelemetry;
  health: RobotHealth;
  /** 같은 층 다른 로봇 (회색 점) */
  others?: { id: number; name: string; telemetry: RobotTelemetry }[];
  /** 이벤트 발생 위치처럼 따로 찍을 점 */
  marker?: { x: number; z: number; color: string; label?: string };
  className?: string;
}

const PADDING = 2;

/**
 * 한 층의 평면도. 위에서 내려다본 모습이고 위쪽이 북쪽(-z)입니다.
 * 좌표를 그대로 SVG 에 쓰므로 단위는 m 입니다.
 */
export function FloorMap2D({
  site,
  floorId,
  robotId,
  telemetry,
  health,
  others = [],
  marker,
  className,
}: FloorMap2DProps) {
  const floor = site.floors.find((item) => item.id === floorId);
  const zones = site.zones.filter((zone) => zone.floorId === floorId);
  const docks = site.docks.filter((dock) => dock.floorId === floorId);
  const corridor = site.waypoints.filter(
    (waypoint) =>
      waypoint.floorId === floorId && waypoint.kind === WaypointKind.Path,
  );

  const route = useMemo(() => {
    if (!telemetry || telemetry.floorId !== floorId) return "";
    const points = [
      { x: telemetry.pose.x, z: telemetry.pose.z },
      ...telemetry.route.filter((point, idx, list) => {
        // 이 층 구간만, 층이 바뀌기 전까지
        const firstOther = list.findIndex((item) => item.floorId !== floorId);
        return (
          point.floorId === floorId && (firstOther === -1 || idx < firstOther)
        );
      }),
    ];
    return points.map((point) => `${point.x},${point.z}`).join(" ");
  }, [telemetry, floorId]);

  if (!floor) return null;

  const minX = -floor.width / 2 - PADDING;
  const minZ = -floor.depth / 2 - PADDING;
  const width = floor.width + PADDING * 2;
  const height = floor.depth + PADDING * 2;
  const color = HEALTH_COLOR[health];
  const onThisFloor =
    telemetry && telemetry.floorId === floorId && !telemetry.transit;

  return (
    <svg
      className={`${styles.map} ${className ?? ""}`}
      viewBox={`${minX} ${minZ} ${width} ${height}`}
      role="img"
      aria-label={`${floor.name} 평면도`}
    >
      <rect
        x={-floor.width / 2}
        y={-floor.depth / 2}
        width={floor.width}
        height={floor.depth}
        rx={0.6}
        className={styles.floor}
      />
      {corridor.length > 1 && (
        <rect
          x={Math.min(...corridor.map((point) => point.x)) - 2}
          y={-1.6}
          width={
            Math.max(...corridor.map((point) => point.x)) -
            Math.min(...corridor.map((point) => point.x)) +
            4
          }
          height={3.2}
          className={styles.corridor}
        />
      )}
      {zones.map((zone) => (
        <g key={zone.id}>
          <rect
            x={zone.x - zone.width / 2}
            y={zone.z - zone.depth / 2}
            width={zone.width}
            height={zone.depth}
            rx={0.3}
            className={styles.zone}
          />
          <text x={zone.x} y={zone.z} className={styles.zoneLabel}>
            {zone.name}
          </text>
        </g>
      ))}
      {site.elevators
        .filter((elevator) => elevator.floorIds.includes(floorId))
        .map((elevator) => (
          <g key={elevator.id}>
            <rect
              x={elevator.x - 1.3}
              y={elevator.z - 1.3}
              width={2.6}
              height={2.6}
              className={styles.elevator}
            />
            <text
              x={elevator.x}
              y={elevator.z}
              className={styles.elevatorLabel}
            >
              {elevator.name}
            </text>
          </g>
        ))}
      {docks.map((dock) => (
        <g key={dock.id}>
          <rect
            x={dock.x - 0.6}
            y={dock.z - 0.25}
            width={1.2}
            height={0.5}
            className={styles.dock}
          />
          <text x={dock.x} y={dock.z + 1.3} className={styles.dockLabel}>
            {dock.name}
          </text>
        </g>
      ))}

      {route && <polyline points={route} className={styles.route} />}

      {others.map(({ id, name, telemetry: other }) =>
        id === robotId || other.floorId !== floorId || other.transit ? null : (
          <g
            key={id}
            transform={`translate(${other.pose.x} ${other.pose.z})`}
            className={styles.other}
          >
            <circle r={0.7} />
            <text y={-1.1}>{name}</text>
          </g>
        ),
      )}

      {marker && (
        <g transform={`translate(${marker.x} ${marker.z})`}>
          <circle
            r={1.6}
            className={styles.markerHalo}
            style={{ fill: marker.color }}
          />
          <circle r={0.55} style={{ fill: marker.color }} />
          {marker.label && (
            <text y={-2} className={styles.markerLabel}>
              {marker.label}
            </text>
          )}
        </g>
      )}

      {onThisFloor && (
        <g
          className={styles.robot}
          transform={`translate(${telemetry.pose.x} ${telemetry.pose.z}) rotate(${(-telemetry.pose.heading * 180) / Math.PI})`}
        >
          <circle r={2.2} className={styles.halo} style={{ fill: color }} />
          <circle r={0.95} style={{ fill: color }} className={styles.body} />
          <path d="M1.5 0 L0.6 -0.65 L0.6 0.65 Z" className={styles.heading} />
        </g>
      )}
    </svg>
  );
}
