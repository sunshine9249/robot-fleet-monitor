// ============================================================
// 3D 건물 지도 설정
// 시설 데이터(층·방·경유점)를 뺀 캔버스 기본값입니다.
// 좌표 단위는 m (시설 지도와 같은 단위)
// ============================================================

export const CAMERA = {
  fov: 30,
  near: 0.1,
  far: 800,
  /** 대상(건물 중심) 기준 카메라 위치 */
  offset: { posX: -58, posY: 62, posZ: 92 },
  /** 대상 높이 보정 (음수면 건물이 화면에서 위로 올라감) */
  targetOffsetY: -1,
  initialZoom: 1,
  minDistance: 20,
  maxDistance: 220,
  dampingFactor: 0.08,
  panSpeed: 0.8,
};

export const FLOOR = {
  /** 층간 간격 */
  heightGap: 9,
  thickness: 0.6,
  edgeOpacity: 0.7,
  /** 층 바닥 투명도 — 아래층 로봇이 비쳐 보이도록 */
  opacity: 0.55,
  /** 선택한 층만 볼 때 다른 층 투명도 */
  dimmedOpacity: 0.08,
  material: {
    roughness: 0.85,
    metalness: 0.02,
  },
  corridorWidth: 3.2,
};

export const ZONE = {
  wallHeight: 0.9,
  opacity: 0.55,
};

export const ELEVATOR = {
  width: 2.6,
  depth: 2.6,
  holePadding: 0.3,
  color: "#252a38",
  opacity: 0.18,
  frameColor: "#647084",
};

export const DOCK = {
  width: 1.1,
  depth: 0.4,
  height: 0.8,
  color: "#252a38",
  lightColor: "#00e5ff",
};

export const ROBOT = {
  /** 마커 크기 배율 (실제보다 크게 그려야 지도에서 보입니다) */
  scale: 2.3,
  /** 실시간 값 사이를 메우는 보간 속도 (클수록 빨리 따라감) */
  followRate: 6,
  dimmedOpacity: 0.25,
};

export const FLOOR_LABEL = {
  xOffset: -5.5,
  yOffset: 1.6,
  zOffset: 9,
  scaleX: 7,
  scaleY: 3.5,
  mainFontSize: 52,
  subFontSize: 30,
  subTextColor: "#94a3b8",
  canvas: { width: 260, height: 130, textX: 6, textY: 8, subTextY: 72 },
};

export const LIGHTING = {
  ambient: { intensity: 0.8, color: "#c8c4d6" },
  main: {
    position: { posX: 35, posY: 60, posZ: 35 },
    intensity: 0.9,
    color: "#e2e8f0",
  },
  fill: {
    position: { posX: -30, posY: 25, posZ: -30 },
    intensity: 0.3,
    color: "#181b24",
  },
  hemisphere: { skyColor: "#c8c4d6", groundColor: "#0d0e14", intensity: 0.45 },
};

export const COLORS = {
  floorTop: "#181b24",
  floorSide: "#121319",
  floorEdge: "#3a3d4b",
  corridor: "#0d0e14",
  zone: "#1e2230",
  zoneEdge: "#464553",
  zoneLabel: "#c8c4d6",
  route: "#00e5ff",
  bgTop: "#121319",
  bgBottom: "#0d0e14",
  floorLabel: "#e2e8f0",
};

export const DETAIL_WIDGET = {
  offsetY: 60,
};
