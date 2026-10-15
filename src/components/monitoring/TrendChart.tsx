import {
  Axis,
  Chart,
  LIGHT_THEME,
  LineSeries,
  PartialTheme,
  Position,
  ScaleType,
  Settings,
  timeFormatter,
} from "@elastic/charts";
import type { TelemetrySample } from "core";

export interface TrendSeries {
  key: keyof Omit<TelemetrySample, "timestamp">;
  label: string;
  color: string;
  /** 오른쪽 축을 쓰면 단위가 다른 두 값을 한 차트에 그릴 수 있습니다 */
  axis?: "left" | "right";
}

interface TrendChartProps {
  data: TelemetrySample[];
  series: TrendSeries[];
  height?: number;
  leftDomain?: { min: number; max: number };
  rightDomain?: { min: number; max: number };
  leftFormat?: (value: number) => string;
  rightFormat?: (value: number) => string;
}

const theme: PartialTheme = {
  chartMargins: { top: 4, bottom: 0, left: 0, right: 0 },
  axes: {
    tickLabel: { fontSize: 10, fill: "#94a3b8" },
    gridLine: { horizontal: { visible: true, stroke: "#252a38", dash: [0] } },
  },
  lineSeriesStyle: {
    line: { strokeWidth: 2 },
    point: { visible: false },
  },
  legend: { labelOptions: { maxLines: 1 } },
};

const hhmm = timeFormatter("HH:mm");

/** 최근 텔레메트리 추이 */
export function TrendChart({
  data,
  series,
  height = 180,
  leftDomain,
  rightDomain,
  leftFormat = (value) => String(Math.round(value)),
  rightFormat = (value) => String(Math.round(value)),
}: TrendChartProps) {
  const hasRight = series.some((item) => item.axis === "right");
  return (
    <Chart size={{ height }}>
      <Settings
        baseTheme={LIGHT_THEME}
        theme={theme}
        showLegend={true}
        legendPosition={Position.Top}
        locale="ko"
      />
      <Axis id="time" position={Position.Bottom} tickFormat={hhmm} ticks={5} />
      <Axis
        id="left"
        groupId="left"
        position={Position.Left}
        domain={leftDomain}
        tickFormat={leftFormat}
        ticks={4}
      />
      {hasRight && (
        <Axis
          id="right"
          groupId="right"
          position={Position.Right}
          domain={rightDomain}
          tickFormat={rightFormat}
          ticks={4}
        />
      )}
      {series.map((item) => (
        <LineSeries
          key={item.key}
          id={item.label}
          name={item.label}
          groupId={item.axis ?? "left"}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor="timestamp"
          yAccessors={[item.key]}
          data={data}
          color={item.color}
        />
      ))}
    </Chart>
  );
}
