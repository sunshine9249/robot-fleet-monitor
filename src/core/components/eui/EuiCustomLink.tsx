import React from "react";
import * as H from "history";
import { EuiLink, EuiLinkAnchorProps } from "@elastic/eui";
import { useHistory } from "react-router-dom";

const isModifiedEvent = (event: React.MouseEvent) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

const isLeftClickEvent = (event: React.MouseEvent) => event.button === 0;

export function getRouterLinkProps(
  history: H.History,
  href?: string,
  callback?: React.MouseEventHandler,
  disabled?: boolean,
  state?: any,
) {
  function onClick(event: React.MouseEvent) {
    // if (!href) return;
    if (event.defaultPrevented || disabled) return;

    // If target prop is set (e.g. to "_blank"), let browser handle link.
    if (event.currentTarget.getAttribute("target")) {
      return;
    }

    if (isModifiedEvent(event) || !isLeftClickEvent(event)) {
      return;
    }

    // Prevent regular link behavior, which causes a browser refresh.
    event.preventDefault();

    // Stop event propagation
    event.stopPropagation();

    // Push the route to the history.
    if (href) history.push(href, state);

    if (typeof callback === "function") {
      callback(event);
    }
  }

  return { href, onClick };
}

export type EuiCustomLinkProps = EuiLinkAnchorProps & {
  as?: "a" | "button";
  color?: string;
  disabled?: boolean;
  size?: "xs";
};

export function EuiCustomLink(props: EuiCustomLinkProps) {
  const history = useHistory();

  const { disabled, size, ...rest } = props;

  return (
    <EuiLink
      {...rest}
      {...getRouterLinkProps(history, props.href, props.onClick, disabled)}
      {...(props.as === "button" && { href: undefined })}
      style={{
        ...props.style,
        ...(disabled && {
          "cursor": "not-allowed",
          "color": "#98a2b3",
          "-webkit-text-decoration": "none !important",
        }),
        ...(size === "xs" && { fontSize: "11px" }),
      }}
    />
  );
}
