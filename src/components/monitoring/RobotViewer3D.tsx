/* eslint react/no-unknown-property: "off" */

import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { RobotHealth, RobotType } from "core";
import { HEALTH_COLOR } from "components/common/robot";
import { RobotModel } from "components/model/robot/RobotModel";

interface RobotViewer3DProps {
  type: RobotType;
  health: RobotHealth;
  active: boolean;
}

/** 로봇 모델을 돌려 볼 수 있는 작은 뷰어. 상태 등 색이 종합 상태를 따라갑니다 */
export function RobotViewer3D({ type, health, active }: RobotViewer3DProps) {
  return (
    <Canvas
      camera={{ position: [1.9, 1.3, 1.9], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <group position={[0, -0.45, 0]}>
        <RobotModel
          type={type}
          statusColor={HEALTH_COLOR[health]}
          active={active}
          blinking={health === RobotHealth.Danger}
        />
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.35}
          scale={3}
          blur={2.4}
          far={1.5}
        />
      </group>
      <OrbitControls
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={1.2}
        minDistance={1.6}
        maxDistance={5}
        target={[0, 0.05, 0]}
      />
    </Canvas>
  );
}
