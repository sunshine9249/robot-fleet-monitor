/* eslint react/no-unknown-property: "off" */

import type { SiteElevator, SiteFloor } from "core";
import { ELEVATOR, FLOOR } from "./constants";
import { getTextTexture } from "./textures";

interface Elevator3DProps {
  elevator: SiteElevator;
  floors: SiteFloor[];
  heightGap: number;
}

/** 반투명 샤프트와 층마다 문. 로봇이 타면 샤프트 안을 오르내리는 모습이 보입니다 */
export function Elevator3D({ elevator, floors, heightGap }: Elevator3DProps) {
  const served = floors.filter((floor) => elevator.floorIds.includes(floor.id));
  if (served.length < 2) return null;

  const minLevel = Math.min(...served.map((floor) => floor.level));
  const maxLevel = Math.max(...served.map((floor) => floor.level));
  const bottom = minLevel * heightGap + FLOOR.thickness;
  const top = maxLevel * heightGap + FLOOR.thickness + heightGap * 0.55;
  const height = top - bottom;
  const doorHeight = heightGap * 0.32;
  const label = getTextTexture(elevator.name, {
    width: 128,
    height: 48,
    fontSize: 28,
    color: "#ffffff",
  });

  return (
    <group position={[elevator.x, 0, elevator.z]}>
      <mesh position={[0, bottom + height / 2, 0]}>
        <boxGeometry args={[ELEVATOR.width, height, ELEVATOR.depth]} />
        <meshStandardMaterial
          color={ELEVATOR.color}
          transparent
          opacity={ELEVATOR.opacity}
          depthWrite={false}
        />
      </mesh>
      {[
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ].map(([sx, sz]) => (
        <mesh
          key={`${sx}${sz}`}
          position={[
            (sx * ELEVATOR.width) / 2,
            bottom + height / 2,
            (sz * ELEVATOR.depth) / 2,
          ]}
        >
          <boxGeometry args={[0.06, height, 0.06]} />
          <meshStandardMaterial color={ELEVATOR.frameColor} />
        </mesh>
      ))}
      {served.map((floor) => {
        const floorTop = floor.level * heightGap + FLOOR.thickness;
        return (
          <group
            key={floor.id}
            position={[0, floorTop + doorHeight / 2, ELEVATOR.depth / 2 + 0.02]}
          >
            <mesh>
              <planeGeometry args={[ELEVATOR.width * 0.7, doorHeight]} />
              <meshStandardMaterial color="#252a38" transparent opacity={0.7} />
            </mesh>
            <mesh position={[0, doorHeight / 2 + 0.35, 0.01]}>
              <planeGeometry args={[1.2, 0.45]} />
              <meshBasicMaterial color="#181b24" />
            </mesh>
            <mesh position={[0, doorHeight / 2 + 0.35, 0.02]}>
              <planeGeometry args={[1.1, 0.4]} />
              <meshBasicMaterial map={label} transparent />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
