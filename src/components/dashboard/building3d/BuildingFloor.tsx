/* eslint react/no-unknown-property: "off" */

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { SiteDock, SiteElevator, SiteFloor, SiteZone } from "core";
import { COLORS, DOCK, ELEVATOR, FLOOR, ZONE } from "./constants";
import { getTextTexture } from "./textures";

interface BuildingFloorProps {
  floor: SiteFloor;
  floors: SiteFloor[];
  elevators: SiteElevator[];
  zones: SiteZone[];
  docks: SiteDock[];
  heightGap: number;
  /** 다른 층을 골라 이 층을 흐리게 보여야 할 때 */
  dimmed?: boolean;
}

export function BuildingFloor({
  floor,
  floors,
  elevators,
  zones,
  docks,
  heightGap,
  dimmed = false,
}: BuildingFloorProps) {
  const y = floor.level * heightGap;
  const isBottom = floors.every((other) => floor.level <= other.level);
  const opacity = dimmed ? FLOOR.dimmedOpacity : FLOOR.opacity;

  // 엘리베이터 샤프트가 지나가는 자리만 바닥을 뚫습니다 (최하층 제외)
  const slab = useMemo(() => {
    const shape = new THREE.Shape();
    const hw = floor.width / 2;
    const hd = floor.depth / 2;
    shape.moveTo(-hw, -hd);
    shape.lineTo(hw, -hd);
    shape.lineTo(hw, hd);
    shape.lineTo(-hw, hd);
    shape.closePath();

    if (!isBottom) {
      for (const elevator of elevators) {
        if (!elevator.floorIds.includes(floor.id)) continue;
        const halfW = ELEVATOR.width / 2 + ELEVATOR.holePadding;
        const halfD = ELEVATOR.depth / 2 + ELEVATOR.holePadding;
        // Shape 의 y 축은 회전 뒤 -z 가 됩니다
        const hx = elevator.x;
        const hz = -elevator.z;
        const hole = new THREE.Path();
        hole.moveTo(hx - halfW, hz - halfD);
        hole.lineTo(hx + halfW, hz - halfD);
        hole.lineTo(hx + halfW, hz + halfD);
        hole.lineTo(hx - halfW, hz + halfD);
        hole.closePath();
        shape.holes.push(hole);
      }
    }

    const geometry = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: FLOOR.thickness,
      bevelEnabled: false,
    });
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, [floor.width, floor.depth, floor.id, elevators, isBottom]);

  const edges = useMemo(() => new THREE.EdgesGeometry(slab), [slab]);

  useEffect(
    () => () => {
      slab.dispose();
      edges.dispose();
    },
    [slab, edges],
  );

  const top = FLOOR.thickness + 0.01;

  return (
    <group position={[0, y, 0]}>
      <mesh geometry={slab} userData={{ floorOccluder: true }}>
        <meshStandardMaterial
          color={COLORS.floorTop}
          roughness={FLOOR.material.roughness}
          metalness={FLOOR.material.metalness}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial
          color={COLORS.floorEdge}
          transparent
          opacity={dimmed ? 0.2 : FLOOR.edgeOpacity}
        />
      </lineSegments>

      {/* 복도 */}
      <mesh position={[0, top, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[floor.width - 2, FLOOR.corridorWidth]} />
        <meshBasicMaterial
          color={COLORS.corridor}
          transparent
          opacity={dimmed ? 0.1 : 0.85}
          depthWrite={false}
        />
      </mesh>

      {!dimmed &&
        zones.map((zone) => <Zone key={zone.id} zone={zone} top={top} />)}

      {docks.map((dock) => (
        <Dock key={dock.id} dock={dock} top={top} dimmed={dimmed} />
      ))}
    </group>
  );
}

function Zone({ zone, top }: { zone: SiteZone; top: number }) {
  const texture = getTextTexture(zone.name, {
    width: 256,
    height: 64,
    fontSize: 40,
    weight: 700,
    color: COLORS.zoneLabel,
  });
  const edges = useMemo(
    () =>
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(zone.width, ZONE.wallHeight, zone.depth),
      ),
    [zone.width, zone.depth],
  );

  return (
    <group position={[zone.x, top, zone.z]}>
      <mesh position={[0, ZONE.wallHeight / 2, 0]}>
        <boxGeometry args={[zone.width, ZONE.wallHeight, zone.depth]} />
        <meshStandardMaterial
          color={COLORS.zone}
          transparent
          opacity={ZONE.opacity * 0.5}
          depthWrite={false}
        />
      </mesh>
      <lineSegments geometry={edges} position={[0, ZONE.wallHeight / 2, 0]}>
        <lineBasicMaterial color={COLORS.zoneEdge} transparent opacity={0.6} />
      </lineSegments>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[zone.width - 0.6, (zone.width - 0.6) / 4]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

function Dock({
  dock,
  top,
  dimmed,
}: {
  dock: SiteDock;
  top: number;
  dimmed: boolean;
}) {
  const label = getTextTexture(dock.name, {
    width: 128,
    height: 48,
    fontSize: 26,
    color: "#252a38",
  });
  return (
    <group position={[dock.x, top, dock.z]}>
      <mesh position={[0, DOCK.height / 2, 0]}>
        <boxGeometry args={[DOCK.width, DOCK.height, DOCK.depth]} />
        <meshStandardMaterial
          color={DOCK.color}
          transparent
          opacity={dimmed ? 0.15 : 1}
        />
      </mesh>
      <mesh position={[0, DOCK.height * 0.7, -DOCK.depth / 2 - 0.01]}>
        <planeGeometry args={[DOCK.width * 0.6, 0.12]} />
        <meshBasicMaterial
          color={DOCK.lightColor}
          transparent
          opacity={dimmed ? 0.15 : 1}
        />
      </mesh>
      {!dimmed && (
        <mesh position={[0, 0.02, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.2, 0.8]} />
          <meshBasicMaterial map={label} transparent depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
