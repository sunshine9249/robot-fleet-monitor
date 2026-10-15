import { RecursivePartial } from "@elastic/eui";
import {
  PartialTheme,
  LineSeriesStyle,
  AreaSeriesStyle,
  BarSeriesStyle,
} from "@elastic/charts";

export const chartColorMap = [
  "#00e5ff",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#7c77f4",
];

export const crosshairTheme: PartialTheme = {
  crosshair: {
    crossLine: {
      stroke: "rgba(148,163,184,0.6)",
      strokeWidth: 1,
      visible: true,
      dash: [2, 0],
    },
  },
};

export const chartSeriesStyle = (
  colorIdx: number,
): {
  area: RecursivePartial<AreaSeriesStyle>;
  bar: RecursivePartial<BarSeriesStyle>;
  line: RecursivePartial<LineSeriesStyle>;
  avgLine: RecursivePartial<LineSeriesStyle>;
} => {
  return {
    area: {
      area: { fill: chartColorMap[colorIdx], opacity: 1 },
      line: { visible: false },
      point: {
        visible: false,
        strokeWidth: 1,
        opacity: 0,
        radius: 0,
      },
    },
    bar: {
      rect: { fill: chartColorMap[colorIdx], opacity: 1, widthPixel: 20 },
      rectBorder: { visible: false, strokeWidth: 0 },
      displayValue: {
        alignment: { horizontal: "left", vertical: "bottom" },
      },
    },
    line: {
      line: {
        visible: true,
        stroke: chartColorMap[colorIdx],
        strokeWidth: 2,
        opacity: 1,
      },
      point: {
        visible: false,
        strokeWidth: 1,
        opacity: 0,
        radius: 0,
      },
    },
    avgLine: {
      line: {
        visible: true,
        stroke: chartColorMap[3],
        strokeWidth: 2,
        opacity: 1,
      },
      point: {
        visible: false,
        strokeWidth: 1,
        opacity: 0,
        radius: 0,
      },
    },
  };
};
