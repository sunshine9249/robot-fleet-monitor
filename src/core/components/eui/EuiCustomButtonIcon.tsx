import React, { MouseEventHandler } from "react";
import { EuiButtonColor, EuiLoadingSpinner } from "@elastic/eui";
import { useHistory } from "react-router-dom";
import { getRouterLinkProps } from "./EuiCustomLink";
import classNames from "classnames";
import styles from "./EuiCustomButtonIcon.module.scss";

export type EuiCustomButtonIconProps = {
  href?: string;
  icon?: React.ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;

  title?: string;
  color?: EuiButtonColor;
  isDisabled?: boolean;
  className?: string;
  fill?: boolean;
  size?: "s" | "m";
  isLoading?: boolean;
  ariaLabel?: string;
};

export function EuiCustomButtonIcon(props: EuiCustomButtonIconProps) {
  const {
    href,
    onClick,
    icon,
    color = "primary",
    isDisabled = false,
    className,
    size = "m",
    fill,
    title,
    isLoading,
    ariaLabel,
  } = props;
  const history = useHistory();

  return (
    <button
      {...props}
      {...(href ? { ...getRouterLinkProps(history, href) } : onClick)}
      className={
        classNames()
        // styles.button,
        // styles[`backgroundColor${color}`],
        // styles[fill ? "fill" : "noFill"],
        // styles[isDisabled ? "disabled" : "enabled"],
        // styles[size],
        // className,
        // "buttonAnimationGlobal",
      }
      title={title}
      onClick={onClick}
      aria-label={ariaLabel || "button"}
    >
      {isLoading ? <EuiLoadingSpinner size="s" /> : icon}
    </button>
  );
}
