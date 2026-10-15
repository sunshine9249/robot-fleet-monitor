/* eslint react/no-unknown-property: "off" */

import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  type MutableRefObject,
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";
import {
  RobotHealth,
  RobotTelemetry,
  RobotType,
  SiteMap,
  useFleetTelemetryRef,
} from "core";
import { BuildingFloor } from "./BuildingFloor";
import { Elevator3D } from "./Elevator3D";
import { FloorLabel } from "./FloorLabel";
import { RobotMarker } from "./RobotMarker";
import { RouteLine } from "./RouteLine";
import { CAMERA, COLORS, FLOOR, LIGHTING } from "./constants";
import type { ScreenPosition } from "./types";

export interface Building3DMapHandle {
  reset: () => void;
}

export interface MapRobot {
  id: number;
  type: RobotType;
  health: RobotHealth;
}

interface CameraControllerProps {
  targetY: number;
  onCameraInteract?: () => void;
  onCompassRotationChange?: (rotation: number) => void;
  resetHandlerRef: MutableRefObject<(() => void) | null>;
}

function CameraController({
  targetY,
  onCameraInteract,
  onCompassRotationChange,
  resetHandlerRef,
}: CameraControllerProps) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);
  const hasInteractedRef = useRef(false);
  const directionRef = useRef(new THREE.Vector3());
  const previousRotationRef = useRef<number | null>(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    const reset = () => {
      const target = new THREE.Vector3(0, targetY + CAMERA.targetOffsetY, 0);
      camera.position.set(
        target.x + CAMERA.offset.posX,
        target.y + CAMERA.offset.posY,
        target.z + CAMERA.offset.posZ,
      );
      controls.target.copy(target);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.zoom = CAMERA.initialZoom;
        camera.updateProjectionMatrix();
      }
      controls.update();
    };

    reset();
    controls.enableDamping = true;
    controls.dampingFactor = CAMERA.dampingFactor;
    controls.minDistance = CAMERA.minDistance;
    controls.maxDistance = CAMERA.maxDistance;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.enablePan = true;
    controls.panSpeed = CAMERA.panSpeed;
    controlsRef.current = controls;

    const handleStart = () => {
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true;
        onCameraInteract?.();
      }
    };
    controls.addEventListener("start", handleStart);

    const handleReset = () => {
      reset();
      hasInteractedRef.current = false;
    };
    resetHandlerRef.current = handleReset;

    return () => {
      controls.removeEventListener("start", handleStart);
      if (resetHandlerRef.current === handleReset) {
        resetHandlerRef.current = null;
      }
      controls.dispose();
    };
  }, [camera, gl, targetY, onCameraInteract, resetHandlerRef]);

  useFrame(() => {
    controlsRef.current?.update();
    if (!onCompassRotationChange) return;

    // 북쪽을 -z 로 보고 화면 위 나침반 각도를 계산합니다
    camera.getWorldDirection(directionRef.current);
    const heading = THREE.MathUtils.radToDeg(
      Math.atan2(directionRef.current.x, -directionRef.current.z),
    );
    const previous = previousRotationRef.current;
    const next =
      previous === null
        ? heading
        : previous +
          (THREE.MathUtils.euclideanModulo(heading - previous + 180, 360) -
            180);
    if (previous === null || Math.abs(next - previous) >= 0.25) {
      previousRotationRef.current = next;
      onCompassRotationChange(next);
    }
  });

  return null;
}

/** 로봇이 그려진 위치를 화면 좌표로 바꿔 HTML 라벨이 따라가게 합니다 */
function ScreenPositionTracker({
  positionsRef,
  onPositionsChange,
}: {
  positionsRef: MutableRefObject<Map<number, THREE.Vector3>>;
  onPositionsChange: (positions: ScreenPosition[]) => void;
}) {
  const { camera, size } = useThree();
  const previousRef = useRef("");
  const vector = useRef(new THREE.Vector3());

  useFrame(() => {
    const positions: ScreenPosition[] = [];
    for (const [id, position] of positionsRef.current) {
      vector.current.copy(position);
      vector.current.y += 2.6;
      vector.current.project(camera);
      positions.push({
        id,
        pX: Math.round((vector.current.x * 0.5 + 0.5) * size.width),
        pY: Math.round((-vector.current.y * 0.5 + 0.5) * size.height),
        pZ: vector.current.z,
        visible: vector.current.z < 1,
      });
    }
    const key = JSON.stringify(positions);
    if (key !== previousRef.current) {
      previousRef.current = key;
      onPositionsChange(positions);
    }
  });

  return null;
}

interface Building3DMapProps {
  site: SiteMap;
  robots: MapRobot[];
  /** 경로를 그릴 선택된 로봇의 실시간 값 */
  selectedTelemetry?: RobotTelemetry | null;
  selectedRobotId?: number | null;
  /** 이 층만 또렷하게 보여 줍니다. null 이면 전체 */
  focusFloorId?: number | null;
  onRobotClick?: (robotId: number) => void;
  onPositionsChange?: (positions: ScreenPosition[]) => void;
  onCameraInteract?: () => void;
  onCompassRotationChange?: (rotation: number) => void;
  onBackgroundClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Building3DMap = forwardRef<
  Building3DMapHandle,
  Building3DMapProps
>(function Building3DMap(
  {
    site,
    robots,
    selectedTelemetry,
    selectedRobotId,
    focusFloorId = null,
    onRobotClick,
    onPositionsChange,
    onCameraInteract,
    onCompassRotationChange,
    onBackgroundClick,
    className,
    style,
  },
  ref,
) {
  const heightGap = FLOOR.heightGap;
  const levels = site.floors.map((floor) => floor.level);
  const targetY = ((Math.min(...levels) + Math.max(...levels)) / 2) * heightGap;
  const resetHandlerRef = useRef<(() => void) | null>(null);
  const fleetRef = useFleetTelemetryRef();
  const positionsRef = useRef(new Map<number, THREE.Vector3>());

  useImperativeHandle(
    ref,
    () => ({ reset: () => resetHandlerRef.current?.() }),
    [],
  );

  // 목록에서 빠진 로봇의 위치는 지웁니다
  useEffect(() => {
    const ids = new Set(robots.map((robot) => robot.id));
    for (const id of positionsRef.current.keys()) {
      if (!ids.has(id)) positionsRef.current.delete(id);
    }
  }, [robots]);

  const floorOfRobot = (robotId: number) =>
    fleetRef.current.get(robotId)?.floorId ?? null;

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(180deg, ${COLORS.bgTop} 0%, ${COLORS.bgBottom} 100%)`,
        ...style,
      }}
    >
      <Canvas
        camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          scene.background = null;
        }}
        onPointerMissed={() => onBackgroundClick?.()}
      >
        <CameraController
          targetY={targetY}
          onCameraInteract={onCameraInteract}
          onCompassRotationChange={onCompassRotationChange}
          resetHandlerRef={resetHandlerRef}
        />

        <ambientLight
          intensity={LIGHTING.ambient.intensity}
          color={LIGHTING.ambient.color}
        />
        <directionalLight
          position={[
            LIGHTING.main.position.posX,
            LIGHTING.main.position.posY,
            LIGHTING.main.position.posZ,
          ]}
          intensity={LIGHTING.main.intensity}
          color={LIGHTING.main.color}
        />
        <directionalLight
          position={[
            LIGHTING.fill.position.posX,
            LIGHTING.fill.position.posY,
            LIGHTING.fill.position.posZ,
          ]}
          intensity={LIGHTING.fill.intensity}
          color={LIGHTING.fill.color}
        />
        <hemisphereLight
          color={LIGHTING.hemisphere.skyColor}
          groundColor={LIGHTING.hemisphere.groundColor}
          intensity={LIGHTING.hemisphere.intensity}
        />
        {/* 외부 HDR 없이 면광원으로 반사광을 만듭니다 */}
        <Environment resolution={64}>
          <Lightformer
            form="rect"
            intensity={6}
            position={[-30, 40, 15]}
            rotation={[Math.PI / 2, 0, 0.45]}
            scale={[60, 3, 1]}
          />
          <Lightformer
            intensity={0.8}
            position={[0, 30, 0]}
            rotation-x={-Math.PI / 2}
            scale={[45, 45, 1]}
          />
        </Environment>

        {site.floors.map((floor) => {
          const dimmed = focusFloorId !== null && focusFloorId !== floor.id;
          return (
            <group key={floor.id}>
              <BuildingFloor
                floor={floor}
                floors={site.floors}
                elevators={site.elevators}
                zones={site.zones.filter((zone) => zone.floorId === floor.id)}
                docks={site.docks.filter((dock) => dock.floorId === floor.id)}
                heightGap={heightGap}
                dimmed={dimmed}
              />
              <FloorLabel floor={floor} heightGap={heightGap} dimmed={dimmed} />
            </group>
          );
        })}

        {site.elevators.map((elevator) => (
          <Elevator3D
            key={elevator.id}
            elevator={elevator}
            floors={site.floors}
            heightGap={heightGap}
          />
        ))}

        {robots.map((robot) => (
          <RobotMarker
            key={robot.id}
            robotId={robot.id}
            type={robot.type}
            health={robot.health}
            floors={site.floors}
            elevators={site.elevators}
            heightGap={heightGap}
            fleetRef={fleetRef}
            positionsRef={positionsRef}
            selected={robot.id === selectedRobotId}
            dimmed={
              (selectedRobotId != null && robot.id !== selectedRobotId) ||
              (focusFloorId !== null && floorOfRobot(robot.id) !== focusFloorId)
            }
            onClick={onRobotClick}
          />
        ))}

        {selectedTelemetry && selectedTelemetry.route.length > 0 && (
          <RouteLine
            telemetry={selectedTelemetry}
            floors={site.floors}
            heightGap={heightGap}
          />
        )}

        {onPositionsChange && (
          <ScreenPositionTracker
            positionsRef={positionsRef}
            onPositionsChange={onPositionsChange}
          />
        )}
      </Canvas>
    </div>
  );
});
