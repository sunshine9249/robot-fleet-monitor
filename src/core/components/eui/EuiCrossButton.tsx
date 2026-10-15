import { EuiIcon, EuiButtonEmpty, EuiButtonEmptyProps } from "@elastic/eui";
import classNames from "classnames";

export const EuiCrossButton = ({
  style,
  className,
  ...rest
}: EuiButtonEmptyProps) => {
  return (
    <EuiButtonEmpty
      className={classNames("euiFormControlLayoutClearButton", className)}
      style={{ flexShrink: 0, padding: 0, ...style }}
      {...rest}
    >
      <EuiIcon type="cross" className="euiFormControlLayoutClearButton__icon" />
    </EuiButtonEmpty>
  );
};
