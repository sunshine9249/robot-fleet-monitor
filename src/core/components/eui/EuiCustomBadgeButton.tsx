import { MouseEventHandler, ReactNode } from "react";
import { IconifyIcon } from "@iconify/react/dist/iconify.js";
import classNames from "classnames";
import { EuiCustomBadge } from "./EuiCustomBadge";
import { EuiButtonSize } from "./EuiTypes";
import styles from "./EuiCustomBadgeButton.module.scss";

type EuiCustomBadgeButtonProps = {
  title: string | ReactNode;
  size?: EuiButtonSize;
  iconType?: IconifyIcon;
  customIconSide?: "left" | "right";
  className?: string;
  onClick?: MouseEventHandler<HTMLSpanElement>;
};

/**
 * 눌리는 배지(필터 칩 등).
 *
 * 예전에는 `EuiBadge` 에 `#F2F4F7` / `#484C58` 을 직접 넣어 다른 배지들과 색·모양이
 * 따로 놀았습니다. 이제 공통 배지를 쓰고, 이 컴포넌트는 "테두리 + 커서" 만 얹습니다.
 */
export default function EuiCustomBadgeButton({
  title,
  size,
  iconType,
  customIconSide = "left",
  className,
  onClick,
}: EuiCustomBadgeButtonProps) {
  return (
    <EuiCustomBadge
      color="default"
      iconType={iconType}
      customIconSide={customIconSide}
      withDot={false}
      onClick={onClick}
      className={classNames(
        styles.badge,
        { [styles.small]: size === "s" },
        className,
      )}
    >
      {title}
    </EuiCustomBadge>
  );
}
