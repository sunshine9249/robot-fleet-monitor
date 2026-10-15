import { EuiRadioGroup, EuiRadioGroupProps } from "@elastic/eui";
import styles from "./EuiRadioGroupInline.module.scss";

type EuiRadioGroupInlineProps = EuiRadioGroupProps;

export function EuiRadioGroupInline(props: EuiRadioGroupInlineProps) {
  return <EuiRadioGroup {...props} className={styles.viewOption} />;
}
