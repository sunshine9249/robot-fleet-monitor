import type { MouseEventHandler, ReactNode } from "react";
import classNames from "classnames";
import { Icon } from "@iconify/react";
import { IconifyIcon } from "@iconify/react/dist/iconify.js";
import styles from "./EuiCustomBadge.module.scss";

/**
 * 배지 톤. EUI 시맨틱 컬러 이름을 그대로 받아서 쓰던 호출부를 유지하기 위해
 * `secondary`(구 EUI success 별칭)와 `text` 도 함께 받습니다.
 *
 * `grey` / `dark` 는 중립 계열을 한 단계씩 진하게 쓰는 톤입니다.
 * (`default` < `grey` < `dark`) 상태 배지의 "정지", "통신이상"처럼
 * 회색이지만 서로 구분돼야 하는 경우에 씁니다.
 */
export type EuiCustomBadgeTone =
  | "primary"
  | "success"
  | "secondary"
  | "warning"
  | "yellow"
  | "orange"
  | "danger"
  | "accent"
  | "subdued"
  | "text"
  | "grey"
  | "dark"
  | "default";

const TONES = new Set<string>([
  "primary",
  "success",
  "secondary",
  "warning",
  "yellow",
  "orange",
  "danger",
  "accent",
  "subdued",
  "text",
  "grey",
  "dark",
  "default",
]);

export type EuiCustomBadgeProps = {
  /** 톤 이름. 모르는 값이면 중립(default)으로 떨어집니다. */
  color?: string;
  children?: ReactNode;
  className?: string;
  /** 네이티브 툴팁 */
  title?: string;
  /** iconify 아이콘. 주면 dot 대신 아이콘이 붙습니다. */
  iconType?: IconifyIcon;
  /** 아이콘을 라벨 앞/뒤 어디에 둘지 (기본 left) */
  customIconSide?: "left" | "right";
  /**
   * 앞에 붙는 상태 점.
   * 기본값은 "아이콘이 없으면 켬" — 배지는 항상 dot 이나 아이콘 중 하나를 답니다.
   */
  withDot?: boolean;
  /**
   * 같은 톤 안에서 더 심각한 상태를 굵은 글씨로 구분합니다(고장·화재·비상정지 등).
   * 색을 새로 만들지 않고 강조하기 위한 장치라 톤과 조합해서 씁니다.
   */
  strong?: boolean;
  /**
   * 주의·위험·에러처럼 눈길을 끌어야 하는 상태에서 배지를 깜빡입니다.
   * 톤만으로 정하지 않는 이유: warning 톤은 수동 운전처럼 이상이 아닌 상태에도 씁니다.
   */
  blink?: boolean;
  onClick?: MouseEventHandler<HTMLSpanElement>;
};

/**
 * 공통 배지.
 *
 * 디자인 규칙: **밝은 배경 + 진한 글씨**, 그리고 앞의 dot 또는 앞/뒤 아이콘 중 하나를
 * 반드시 답니다. 색은 `_color.scss` 의 `$appStatusColor*` / `$appColor*` 토큰에서만
 * 가져오고 호출부에서 hex 를 넘기지 않습니다.
 *
 * `EuiBadge` 를 감싸던 것을 span 으로 바꿨습니다. EuiBadge 는 모르는 `color` 값을
 * **CSS 색 문자열로 취급**해서 배경에 그대로 칠하는데, 이 리포에서 실제로 쓰이던
 * `color="text"` / `color="secondary"` 가 거기에 걸려 진한 배경 배지로 나오고 있었습니다
 * (규칙 위반). 또 `iconType` 이 EuiBadge 의 동명 prop 으로도 흘러들어가
 * EUI 아이콘 렌더를 건드리고 있었습니다.
 */
export function EuiCustomBadge({
  color = "default",
  children,
  className,
  title,
  iconType,
  customIconSide = "left",
  withDot,
  strong = false,
  blink = false,
  onClick,
}: EuiCustomBadgeProps) {
  const tone = TONES.has(color) ? color : "default";
  const showDot = withDot ?? !iconType;

  const icon = iconType ? (
    <Icon icon={iconType} width={12} height={12} className={styles.icon} />
  ) : null;

  return (
    <span
      className={classNames(
        styles.badge,
        styles[`color${tone}`],
        { [styles.strong]: strong, [styles.blink]: blink },
        className,
      )}
      title={title}
      onClick={onClick}
    >
      {showDot && <span className={styles.dot} />}
      {customIconSide === "left" && icon}
      <span className={styles.label}>{children}</span>
      {customIconSide === "right" && icon}
    </span>
  );
}
