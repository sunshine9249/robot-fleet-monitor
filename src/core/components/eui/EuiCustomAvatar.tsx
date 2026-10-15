import {
  EuiAvatar,
  EuiAvatarProps,
  euiPaletteColorBlindBehindText,
} from "@elastic/eui";

import styles from "./EuiCustomAvatar.module.scss";
import classNames from "classnames";

type EuiCustomAvatarProps = Omit<EuiAvatarProps, "size"> & {
  size?: "m" | "s" | "xs";
  name: string;
  color?: string;
  shape?: "circle" | "square";
};

export function EuiCustomAvatar({
  name,
  size,
  color,
  shape = "circle",
  className,
  ...rest
}: EuiCustomAvatarProps) {
  const colors = euiPaletteColorBlindBehindText();
  const nameToNumber =
    (name.substring(0, 1).charCodeAt(0) % 10) % colors.length;
  // "xs" 는 EuiAvatar 에 없는 커스텀 사이즈라 className 으로 더 작은 width, height 를 주고,
  // m/s 는 전달받은 size 를 그대로 EuiAvatar 에 넘깁니다.
  const isCustomSize = size === "xs";

  // EuiAvatarProps 는 iconType/initials 가 배타적인 유니온이라 Omit 한 rest 와 맞지 않아 캐스팅합니다.
  const avatarProps = {
    ...rest,
    name,
    color: color ?? colors[nameToNumber],
    ...(size && !isCustomSize ? { size } : {}),
    className: classNames(
      styles.avatar,
      {
        [styles.xs]: isCustomSize,
        [styles.square]: shape === "square",
      },
      className,
    ),
  } as EuiAvatarProps;

  return <EuiAvatar {...avatarProps} />;
}
