import classNames from "classnames";

import styles from "./Viewer3DControls.module.scss";

export type Viewer3DResetButtonProps = {
  onClick: () => void;
  /** 자리를 잡는 클래스. 이 컴포넌트는 모양만 그리고 position 은 호출부가 정합니다 */
  className?: string;
};

/**
 * 3D 뷰어 시점 초기화 버튼.
 *
 * 3D 화면마다 같은 버튼을 씁니다.
 */
export function Viewer3DResetButton({
  onClick,
  className,
}: Viewer3DResetButtonProps) {
  return (
    <div className={classNames(styles.resetBox, className)}>
      <button type="button" className={styles.resetButton} onClick={onClick}>
        시점 초기화
      </button>
    </div>
  );
}
