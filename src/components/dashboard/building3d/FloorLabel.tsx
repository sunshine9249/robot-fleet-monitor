/* eslint react/no-unknown-property: "off" */

import type { SiteFloor } from "core";
import { COLORS, FLOOR_LABEL } from "./constants";
import { getTextTexture } from "./textures";

interface FloorLabelProps {
  floor: SiteFloor;
  heightGap: number;
  dimmed?: boolean;
}

/** 층 왼쪽 끝에 떠 있는 "1F 로비" 표지 */
export function FloorLabel({
  floor,
  heightGap,
  dimmed = false,
}: FloorLabelProps) {
  const { width, height, mainFontSize, subFontSize } = {
    ...FLOOR_LABEL.canvas,
    mainFontSize: FLOOR_LABEL.mainFontSize,
    subFontSize: FLOOR_LABEL.subFontSize,
  };
  const texture = getTextTexture(floor.name, {
    width,
    height,
    fontSize: mainFontSize,
    color: COLORS.floorLabel,
    weight: 700,
    sub: floor.label,
    subFontSize,
    subColor: FLOOR_LABEL.subTextColor,
    align: "left",
  });

  return (
    <sprite
      position={[
        -floor.width / 2 + FLOOR_LABEL.xOffset,
        floor.level * heightGap + FLOOR_LABEL.yOffset + 1.2,
        FLOOR_LABEL.zOffset,
      ]}
      scale={[FLOOR_LABEL.scaleX, FLOOR_LABEL.scaleY, 1]}
    >
      <spriteMaterial map={texture} transparent opacity={dimmed ? 0.3 : 1} />
    </sprite>
  );
}
