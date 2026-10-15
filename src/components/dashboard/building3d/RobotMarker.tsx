/* eslint react/no-unknown-property: "off" */

import { MutableRefObject, useRef } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  RobotHealth,
  RobotState,
  RobotTelemetry,
  RobotType,
  SiteElevator,
  SiteFloor,
} from "core";
import { RobotModel } from "components/model/robot/RobotModel";
import { HEALTH_COLOR } from "components/common/robot";
import { FLOOR, ROBOT } from "./constants";

interface RobotMarkerProps {
  robotId: number;
  type: RobotType;
  health: RobotHealth;
  floors: SiteFloor[];
  elevators: SiteElevator[];
  heightGap: number;
  fleetRef: MutableRefObject<ReadonlyMap<number, RobotTelemetry>>;
  /** 화면 위치 계산을 위해 지금 그려진 위치를 여기에 적습니다 */
  positionsRef: MutableRefObject<Map<number, THREE.Vector3>>;
  selected: boolean;
  dimmed: boolean;
  onClick?: (robotId: number) => void;
}

function shortestAngle(from: number, to: number) {
  const diff = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  return diff < -Math.PI ? diff + Math.PI * 2 : diff;
}

/**
 * 지도 위 로봇 한 대.
 *
 * 실시간 값은 초당 4번 정도 오므로 그 사이를 매 프레임 보간해서 움직입니다.
 * 위치는 React 상태가 아니라 ref 로 읽어서, 움직일 때마다 다시 그리지 않습니다.
 */
export function RobotMarker({
  robotId,
  type,
  health,
  floors,
  elevators,
  heightGap,
  fleetRef,
  positionsRef,
  selected,
  dimmed,
  onClick,
}: RobotMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const initialized = useRef(false);
  const target = useRef(new THREE.Vector3());
  const telemetry = fleetRef.current.get(robotId);
  const active =
    telemetry?.state === RobotState.Moving ||
    telemetry?.state === RobotState.Working;

  useFrame((_state, delta) => {
    const group = groupRef.current;
    const body = bodyRef.current;
    const current = fleetRef.current.get(robotId);
    if (!group || !body || !current) return;

    const levelOf = (floorId: number) =>
      floors.find((floor) => floor.id === floorId)?.level ?? 0;
    const floorY = (floorId: number) =>
      levelOf(floorId) * heightGap + FLOOR.thickness;

    if (current.transit) {
      const elevator = elevators.find(
        (item) => item.id === current.transit?.elevatorId,
      );
      const fromY = floorY(current.transit.fromFloorId);
      const toY = floorY(current.transit.toFloorId);
      // 문 열리고 타는 시간·내리는 시간을 앞뒤로 두고 가운데에서 이동합니다
      const progress = THREE.MathUtils.smoothstep(
        current.transit.progress,
        0.2,
        0.8,
      );
      target.current.set(
        elevator?.x ?? current.pose.x,
        fromY + (toY - fromY) * progress,
        elevator?.z ?? current.pose.z,
      );
    } else {
      target.current.set(
        current.pose.x,
        floorY(current.floorId),
        current.pose.z,
      );
    }

    if (!initialized.current) {
      group.position.copy(target.current);
      body.rotation.y = current.pose.heading;
      initialized.current = true;
    } else {
      const amount = 1 - Math.exp(-ROBOT.followRate * delta);
      // 층을 옮긴 직후처럼 멀리 떨어졌으면 바로 옮깁니다
      if (group.position.distanceTo(target.current) > 12) {
        group.position.copy(target.current);
      } else {
        group.position.lerp(target.current, amount);
      }
      body.rotation.y +=
        shortestAngle(body.rotation.y, current.pose.heading) * amount;
    }

    let stored = positionsRef.current.get(robotId);
    if (!stored) {
      stored = new THREE.Vector3();
      positionsRef.current.set(robotId, stored);
    }
    stored.copy(group.position);
  });

  const color = HEALTH_COLOR[health];
  const opacity = dimmed ? ROBOT.dimmedOpacity : 1;

  return (
    <group
      ref={groupRef}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onClick?.(robotId);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = onClick ? "pointer" : "default";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      {/* 선택 표시 */}
      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.45, 40]} />
          <meshBasicMaterial color="#7c77f4" transparent opacity={0.85} />
        </mesh>
      )}
      {/* 상태 원판 — 멀리서도 상태가 보이게 */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.22 * opacity}
          depthWrite={false}
        />
      </mesh>
      <group ref={bodyRef} scale={ROBOT.scale}>
        <RobotModel
          type={type}
          statusColor={color}
          active={active}
          blinking={health === RobotHealth.Danger}
          opacity={opacity}
        />
      </group>
    </group>
  );
}
