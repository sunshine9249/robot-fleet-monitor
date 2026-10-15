import React from "react";
import { useHistory } from "react-router-dom";
import { EuiHeaderLogoProps, EuiHeaderLogo } from "@elastic/eui";
import { getRouterLinkProps } from "./EuiCustomLink";

export type EuiCustomHeaderLogoProps = EuiHeaderLogoProps;

export function EuiCustomHeaderLogo(props: EuiCustomHeaderLogoProps) {
  const history = useHistory();
  return (
    <EuiHeaderLogo {...props} {...getRouterLinkProps(history, props.href)} />
  );
}
