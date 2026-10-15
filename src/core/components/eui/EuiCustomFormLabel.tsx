import { EuiFormLabelProps, EuiFormLabel } from "@elastic/eui";
import styles from "./EuiCustomFormLabel.module.scss";

export type EuiCustomFormLabelProps = EuiFormLabelProps & {
  required?: boolean;
};

export function EuiCustomFormLabel(props: EuiCustomFormLabelProps) {
  const { required = false } = props;
  return (
    <EuiFormLabel className={styles[`required${required}`]}>
      <span>{props.children}</span>
    </EuiFormLabel>
  );
}
