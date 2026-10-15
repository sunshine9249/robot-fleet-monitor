import React, { MouseEventHandler } from "react";
import { EuiButtonColor, EuiButtonProps, EuiButton } from "@elastic/eui";
import { useHistory } from "react-router-dom";
import { getRouterLinkProps } from "./EuiCustomLink";
import styles from "./EuiCustomButton.module.scss";
import classNames from "classnames";

export type EuiCustomButtonProps = EuiButtonProps & {
  href?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  onMouseOver?: MouseEventHandler<HTMLAnchorElement>;
  onMouseLeave?: MouseEventHandler<HTMLAnchorElement>;
  color?: EuiButtonColor;
  title?: string;
  target?: React.HTMLAttributeAnchorTarget;
  grow?: false | number;
  download?: any;
};

export function EuiCustomButton(props: EuiCustomButtonProps) {
  const {
    href,
    color = "primary",
    className,
    onClick,
    onMouseOver,
    fill = true,
    isDisabled,
    size = "m",
    grow = false,
    style,
    download,
  } = props;

  const history = useHistory();

  return (
    <EuiButton
      {...props}
      {...(href ? { ...getRouterLinkProps(history, href) } : onClick)}
      className={classNames(
        styles.button,
        color && styles[`backgroundColor${color}`],
        styles[fill ? "fill" : "noFill"],
        styles[isDisabled ? "disabled" : "enabled"],
        styles[size],
        className,
      )}
      style={grow ? { flexGrow: grow, ...style } : { flexGrow: 0, ...style }}
      download={download}
    />
  );
}
