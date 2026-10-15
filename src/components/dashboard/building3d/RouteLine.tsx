/* eslint react/no-unknown-property: "off" */

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import type { RobotTelemetry, SiteFloor } from "core";
import { COLORS, FLOOR } from "./constants";

interface RouteLineProps {
  telemetry: RobotTelemetry;
  floors: SiteFloor[];
  heightGap: number;
}

/** 선택한 로봇이 앞으로 갈 경로. 층이 바뀌는 구간은 끊어서 층마다 따로 그립니다 */
export function RouteLine({ telemetry, floors, heightGap }: RouteLineProps) {
  const segments = useMemo(() => {
    const yOf = (floorId: number) =>
      (floors.find((floor) => floor.id === floorId)?.level ?? 0) * heightGap +
      FLOOR.thickness +
      0.08;
    const result: [number, number, number][][] = [];
    let current: [number, number, number][] = [];
    let currentFloor = telemetry.floorId;
    if (!telemetry.transit) {
      current.push([telemetry.pose.x, yOf(currentFloor), telemetry.pose.z]);
    }
    for (const point of telemetry.route) {
      if (point.floorId !== currentFloor) {
        if (current.length > 1) result.push(current);
        current = [];
        currentFloor = point.floorId;
      }
      current.push([point.x, yOf(point.floorId), point.z]);
    }
    if (current.length > 1) result.push(current);
    return result;
  }, [telemetry, floors, heightGap]);

  return (
    <>
      {segments.map((points, idx) => (
        <Line
          key={idx}
          points={points}
          color={COLORS.route}
          lineWidth={3}
          dashed={true}
          dashSize={0.8}
          gapSize={0.5}
          transparent
          opacity={0.9}
        />
      ))}
    </>
  );
}
