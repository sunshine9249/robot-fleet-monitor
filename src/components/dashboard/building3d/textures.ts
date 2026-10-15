import * as THREE from "three";

const FONT = `-apple-system, BlinkMacSystemFont, "Pretendard", "Apple SD Gothic Neo", sans-serif`;
const cache = new Map<string, THREE.CanvasTexture>();

/** 캔버스에 글자를 그려 텍스처로 만듭니다. 같은 글자는 다시 만들지 않습니다 */
export function getTextTexture(
  text: string,
  options: {
    width?: number;
    height?: number;
    fontSize?: number;
    color?: string;
    weight?: number;
    sub?: string;
    subColor?: string;
    subFontSize?: number;
    align?: "left" | "center";
  } = {},
): THREE.CanvasTexture {
  const {
    width = 256,
    height = 64,
    fontSize = 28,
    color = "#e2e8f0",
    weight = 600,
    sub,
    subColor = "#94a3b8",
    subFontSize = Math.round(fontSize * 0.6),
    align = "center",
  } = options;
  const key = JSON.stringify([
    text,
    width,
    height,
    fontSize,
    color,
    weight,
    sub,
    subColor,
    subFontSize,
    align,
  ]);
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = align;
  ctx.textBaseline = sub ? "alphabetic" : "middle";
  ctx.fillStyle = color;
  ctx.font = `${weight} ${fontSize}px ${FONT}`;
  const x = align === "center" ? width / 2 : 6;
  if (sub) {
    ctx.fillText(text, x, height * 0.5);
    ctx.font = `400 ${subFontSize}px ${FONT}`;
    ctx.fillStyle = subColor;
    ctx.fillText(sub, x, height * 0.5 + subFontSize * 1.3);
  } else {
    ctx.fillText(text, x, height / 2, width - 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  cache.set(key, texture);
  return texture;
}
