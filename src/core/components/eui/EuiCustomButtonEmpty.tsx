import React, { MouseEventHandler } from "react";
import {
  EuiButtonColor,
  EuiButtonEmpty,
  EuiButtonEmptyProps,
} from "@elastic/eui";
import { useHistory } from "react-router-dom";
import { getRouterLinkProps } from "./EuiCustomLink";
import classNames from "classnames";
import styles from "./EuiCustomButtonEmpty.module.scss";

export type EuiCustomButtonEmptyProps = EuiButtonEmptyProps & {
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
};

export function EuiCustomButtonEmpty(props: EuiCustomButtonEmptyProps) {
  const {
    href,
    color = "primary",
    className,
    onClick,
    isDisabled,
    size = "m",
    grow = false,
    style,
  } = props;

  const history = useHistory();
  return (
    <EuiButtonEmpty
      {...props}
      {...(href ? { ...getRouterLinkProps(history, href) } : onClick)}
      className={classNames(
        styles.button,
        color && styles[color],
        // styles[fill ? "fill" : "noFill"],
        styles[isDisabled ? "disabled" : "enabled"],
        styles[size],
        className,
      )}
      style={
        grow
          ? { ...style, flexGrow: grow || 0 }
          : { ...style, width: "min-content" }
      }
    />
  );
}
