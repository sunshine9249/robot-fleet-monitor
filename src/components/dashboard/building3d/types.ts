/** 3D 좌표를 화면 좌표로 바꾼 결과 (라벨 오버레이용) */
export interface ScreenPosition {
  id: number;
  pX: number;
  pY: number;
  /** 깊이 (작을수록 카메라에 가까움) */
  pZ: number;
  visible: boolean;
}
