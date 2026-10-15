import React from "react";
import { EuiFormRow } from "@elastic/eui";
import classNames from "classnames";
import styles from "./FormItem.module.scss";

export type FormItemProps = {
  label?: React.ReactNode;
  labelAppend?: React.ReactNode;
  children: React.ReactElement;
  fullWidth?: boolean;
  required?: boolean;
  isInvalid?: boolean;
  style?: React.CSSProperties;
  className?: string;
  helpText?: React.ReactNode | React.ReactNode[];
};

export function FormItem({
  children,
  required,
  className,
  fullWidth,
  isInvalid,
  ...props
}: FormItemProps) {
  return (
    <EuiFormRow
      {...props}
      className={classNames(
        styles.formItem,
        {
          [styles.required]: required,
          [styles.fullWidth]: fullWidth,
          [styles.isInvalid]: isInvalid,
        },
        className,
      )}
      fullWidth={fullWidth}
    >
      {children}
    </EuiFormRow>
  );
}
