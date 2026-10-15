/* eslint react/no-unknown-property: "off" */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RobotType } from "core";

export interface RobotModelProps {
  type: RobotType;
  /** 상태 등 색 (종합 상태 색) */
  statusColor: string;
  /** 바퀴·팬이 도는지 */
  active?: boolean;
  /** 위험 상태면 상태 등이 깜박입니다 */
  blinking?: boolean;
  opacity?: number;
}

const BODY = "#f4f6f9";
const BASE = "#3a4352";
const ACCENT = "#0b5cad";
const SCREEN = "#1d6fd6";

/**
 * 단순화한 로봇 모델. 실제 기종 모양이 아니라 종류를 구분할 수 있을 정도로만
 * 그립니다. 앞쪽(+x)에 화면·센서가 있어 진행 방향을 알 수 있습니다.
 * 크기는 실제 m 기준(높이 0.4~1.2m)입니다.
 */
export function RobotModel({
  type,
  statusColor,
  active = false,
  blinking = false,
  opacity = 1,
}: RobotModelProps) {
  const lightRef = useRef<THREE.MeshStandardMaterial>(null);
  const spinRef = useRef<THREE.Group>(null);
  const transparent = opacity < 1;
  const color = useMemo(() => new THREE.Color(statusColor), [statusColor]);

  useFrame((state, delta) => {
    if (lightRef.current) {
      const pulse = blinking
        ? 0.4 + 0.6 * Math.abs(Math.sin(state.clock.elapsedTime * 4))
        : 1;
      lightRef.current.emissiveIntensity = 1.4 * pulse;
    }
    if (spinRef.current && active) {
      spinRef.current.rotation.y += delta * 6;
    }
  });

  const material = (
    hex: string,
    extra: Partial<THREE.MeshStandardMaterialParameters> = {},
  ) => (
    <meshStandardMaterial
      color={hex}
      roughness={0.55}
      metalness={0.05}
      transparent={transparent}
      opacity={opacity}
      {...extra}
    />
  );

  const statusRing = (y: number, radius: number) => (
    <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.025, 8, 32]} />
      <meshStandardMaterial
        ref={lightRef}
        color={color}
        emissive={color}
        emissiveIntensity={1.4}
        transparent={transparent}
        opacity={opacity}
      />
    </mesh>
  );

  if (type === RobotType.Cleaning) {
    return (
      <group>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.38, 0.4, 0.16, 32]} />
          {material(BASE)}
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.34, 0.37, 0.08, 32]} />
          {material(BODY)}
        </mesh>
        <mesh position={[0.05, 0.26, 0]} scale={[1, 0.35, 1]}>
          <sphereGeometry
            args={[0.22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          {material(ACCENT)}
        </mesh>
        {/* 앞 범퍼 센서 */}
        <mesh position={[0.36, 0.12, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.4]} />
          {material("#11161f")}
        </mesh>
        {/* 회전 브러시 */}
        <group ref={spinRef} position={[0.22, 0.015, 0.22]}>
          {[0, 1, 2].map((idx) => (
            <mesh
              key={idx}
              rotation={[0, (idx * Math.PI * 2) / 3, 0]}
              position={[0, 0, 0]}
            >
              <boxGeometry args={[0.18, 0.01, 0.02]} />
              {material("#7a8494")}
            </mesh>
          ))}
        </group>
        {statusRing(0.245, 0.35)}
      </group>
    );
  }

  if (type === RobotType.Guide) {
    return (
      <group>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.3, 0.32, 0.22, 32]} />
          {material(BASE)}
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.2, 0.27, 0.8, 32]} />
          {material(BODY)}
        </mesh>
        {/* 머리 + 화면 */}
        <mesh position={[0, 1.12, 0]}>
          <sphereGeometry args={[0.2, 24, 16]} />
          {material(BODY)}
        </mesh>
        <mesh position={[0.17, 1.12, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.24, 0.13]} />
          <meshStandardMaterial
            color={SCREEN}
            emissive={SCREEN}
            emissiveIntensity={0.8}
            transparent={transparent}
            opacity={opacity}
          />
        </mesh>
        {/* 가슴 터치스크린 */}
        <mesh position={[0.235, 0.75, 0]} rotation={[0, Math.PI / 2, -0.15]}>
          <planeGeometry args={[0.26, 0.2]} />
          <meshStandardMaterial
            color="#0e1f35"
            emissive={SCREEN}
            emissiveIntensity={0.35}
            transparent={transparent}
            opacity={opacity}
          />
        </mesh>
        {statusRing(0.25, 0.31)}
      </group>
    );
  }

  // 배송
  return (
    <group>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.62, 0.2, 0.5]} />
        {material(BASE)}
      </mesh>
      {[-0.2, 0.2].map((x) =>
        [-0.26, 0.26].map((z) => (
          <mesh
            key={`${x}${z}`}
            position={[x, 0.07, z]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />
            {material("#1b1f27")}
          </mesh>
        )),
      )}
      <mesh position={[-0.02, 0.55, 0]}>
        <boxGeometry args={[0.54, 0.66, 0.46]} />
        {material(BODY)}
      </mesh>
      {/* 서랍 두 칸 */}
      {[0.4, 0.68].map((y) => (
        <mesh key={y} position={[-0.29, y, 0]}>
          <boxGeometry args={[0.01, 0.24, 0.38]} />
          {material("#c9d1dc")}
        </mesh>
      ))}
      {/* 앞 화면 */}
      <mesh position={[0.255, 0.72, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.3, 0.16]} />
        <meshStandardMaterial
          color="#0e1f35"
          emissive={SCREEN}
          emissiveIntensity={0.5}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>
      {/* 라이다 */}
      <mesh position={[0.05, 0.93, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.1, 20]} />
        {material("#11161f")}
      </mesh>
      {statusRing(0.235, 0.37)}
    </group>
  );
}
