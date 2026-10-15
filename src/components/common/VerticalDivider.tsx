import classNames from "classnames";
import styles from "./VerticalDivider.module.scss";

interface VerticalDividerProps {
  height?: number | string;
  backgroundColor?: string;
  margin?: "s";
  style?: React.CSSProperties;
}

export default function VerticalDivider({
  height,
  backgroundColor,
  margin,
  style,
}: VerticalDividerProps) {
  return height ? (
    <span
      className={classNames(styles.flexDivider, {
        [styles[`margin${margin}`]]: margin,
      })}
      style={{ ...style, height, backgroundColor }}
    />
  ) : (
    <span
      className={classNames(styles.divider, {
        [styles[`margin${margin}`]]: margin,
      })}
      style={{ ...style, backgroundColor }}
    >
      {"|"}
    </span>
  );
}
