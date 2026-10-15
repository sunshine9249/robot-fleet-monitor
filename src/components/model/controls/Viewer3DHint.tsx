import { Fragment } from "react";
import classNames from "classnames";
import { EuiIcon } from "@elastic/eui";

import styles from "./Viewer3DControls.module.scss";

export type Viewer3DHintProps = {
  /**
   * 더블클릭 안내를 함께 보여줄지.
   *
   * 회전 중심을 옮길 수 있는 뷰어에서만 켭니다.
   */
  withDoubleClick?: boolean;
  /** 자리를 잡는 클래스. 이 컴포넌트는 모양만 그리고 position 은 호출부가 정합니다 */
  className?: string;
};

/** 마우스 어느 부분을 쓰는 조작인지 */
type MouseButton = "left" | "wheel" | "right";

/**
 * 3D 뷰어 조작 안내.
 *
 * 대시보드 건물 지도와 로봇 뷰어가 같은 것을 씁니다.
 *
 * 평상시에는 물음표 아이콘만 있는 동그란 표시로 접혀 있다가, 마우스를 올리면
 * 설명이 펼쳐집니다 — 늘 펼쳐 두면 3D 화면을 가립니다. 펼침은 CSS `:hover` 로만
 * 하고 상태를 들지 않습니다(마우스가 빠질 때 다시 접히는 처리가 필요 없습니다).
 * 키보드·터치로도 열 수 있도록 포커스를 받게 해 두고 `:focus-within` 에서도
 * 같이 펼칩니다.
 */
export function Viewer3DHint({
  withDoubleClick = false,
  className,
}: Viewer3DHintProps) {
  const items: { button: MouseButton; label: string }[] = [
    { button: "left", label: "드래그: 회전" },
    { button: "wheel", label: "스크롤: 확대/축소" },
    ...(withDoubleClick
      ? [{ button: "left" as const, label: "더블클릭: 회전 중심 이동" }]
      : []),
    { button: "right", label: "우클릭+드래그: 이동" },
  ];

  return (
    <div
      className={classNames(styles.hint, className)}
      tabIndex={0}
      role="note"
      aria-label="3D 조작 안내"
    >
      <EuiIcon
        type="questionInCircle"
        size="m"
        color="subdued"
        className={styles.hintIcon}
      />
      <span className={styles.hintItems}>
        {items.map((item, index) => (
          // 항목은 고정 목록이라 문구가 곧 식별자입니다.
          <Fragment key={item.label}>
            {index > 0 && <span className={styles.divider}>·</span>}
            <MouseIcon button={item.button} />
            <span>{item.label}</span>
          </Fragment>
        ))}
      </span>
    </div>
  );
}

/** 마우스 실루엣 — 쓰는 부분만 강조색으로 칠합니다 */
function MouseIcon({ button }: { button: MouseButton }) {
  return (
    <svg
      width="12"
      height="18"
      viewBox="0 0 12 18"
      fill="none"
      className={styles.mouseIcon}
      aria-hidden="true"
    >
      <rect
        x="1"
        y="1"
        width="10"
        height="16"
        rx="5"
        stroke="#9ca3af"
        strokeWidth="1.2"
        fill="white"
      />
      {/* 휠은 버튼 경계선 없이 가운데 알약만 그립니다 */}
      {button !== "wheel" && (
        <path d="M6 1V7" stroke="#9ca3af" strokeWidth="0.8" />
      )}
      {button === "left" && (
        <rect x="1.5" y="1.5" width="4" height="5" rx="1" fill="#818cf8" />
      )}
      {button === "right" && (
        <rect x="6.5" y="1.5" width="4" height="5" rx="1" fill="#818cf8" />
      )}
      {button === "wheel" && (
        <rect x="4" y="3" width="4" height="5" rx="2" fill="#818cf8" />
      )}
    </svg>
  );
}
