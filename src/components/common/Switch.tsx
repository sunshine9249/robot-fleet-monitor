import { EuiFlexItem } from "@elastic/eui";

import styles from "./Switch.module.scss";
import classNames from "classnames";

export type SwitchProps = {
  onClick: () => void;
  checked: boolean;
  leftLabel?: React.ReactNode;
  rightLabel?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  title?: string;
  alignItems?: "center" | "flex-start" | "flex-end";
};

export function Switch({
  onClick,
  checked,
  leftLabel,
  rightLabel,
  disabled,
  className,
  title,
  alignItems = "center",
}: SwitchProps) {
  return (
    <EuiFlexItem
      grow={false}
      className={classNames(styles.container, className)}
      style={{ alignItems }}
    >
      {leftLabel && <div className={styles.label}>{leftLabel}</div>}
      <div className={styles.switchContainer} title={title}>
        <div
          className={classNames(
            styles.switch,
            checked ? styles.on : styles.off,
            { [styles.disabled]: disabled },
          )}
          onClick={() => {
            if (!disabled) onClick();
          }}
        >
          <div className={styles.switchHandle}></div>
          <span className={styles.switchText}>{checked ? "ON" : "OFF"}</span>
        </div>
      </div>
      {rightLabel && <div className={styles.label}>{rightLabel}</div>}
    </EuiFlexItem>
  );
}
