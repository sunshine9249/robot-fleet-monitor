import React from "react";
import classNames from "classnames";
import styles from "./SensorPanel.module.scss";
import { RobotHealth } from "core";
import { HealthBadge } from "./robot/RobotBadges";

/**
 * 상태 패널 격자.
 *
 * 패널은 모두 `SensorPanel` 한 종류로 그리고, 크기는 `span` 으로만 정합니다.
 * 칸 수를 바꾸고 싶으면 `columns` 만 조정하면 됩니다.
 *
 * ```tsx
 * <SensorPanelGrid columns={4}>
 *   <SensorPanelSection title="구동부" tag="모터 컨트롤러" />
 *   <SensorPanel title="모터 온도" subtitle="좌·우 평균">…</SensorPanel>
 *   <SensorPanel title="배터리 추이" span={3}>…</SensorPanel>
 *   <SensorPanel title="임무 이력" span="full">…</SensorPanel>
 * </SensorPanelGrid>
 * ```
 */
export function SensorPanelGrid({
  columns = 4,
  minColumnWidth,
  gap,
  className,
  children,
}: {
  /**
   * 격자 칸 수. "auto" 면 너비에 맞춰 칸 수가 바뀝니다 —
   * 이벤트 상세처럼 폭이 들쭉날쭉한 자리에 씁니다.
   * @default 4
   */
  columns?: number | "auto";
  /** columns="auto" 일 때 한 칸 최소 너비(px) @default 220 */
  minColumnWidth?: number;
  /** 칸 사이 간격(px) @default 16 */
  gap?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const isAuto = columns === "auto";

  return (
    <div
      className={classNames(
        styles.grid,
        { [styles.gridAuto]: isAuto },
        className,
      )}
      style={
        {
          ...(isAuto ? {} : { "--sensor-grid-columns": columns }),
          ...(minColumnWidth === undefined
            ? {}
            : { "--sensor-grid-min-column": `${minColumnWidth}px` }),
          ...(gap === undefined ? {} : { "--sensor-grid-gap": `${gap}px` }),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

/**
 * 구역 제목 ("구동부  모터 컨트롤러").
 * 기본은 한 줄 전체지만, 제목 둘이 한 줄에 나란히 서는 자리에서는
 * 아래 패널과 같은 `span` 을 주면 칸이 맞습니다.
 */
export function SensorPanelSection({
  title,
  tag,
  span = "full",
}: {
  title: React.ReactNode;
  tag?: React.ReactNode;
  span?: number | "full";
}) {
  return (
    <div
      className={styles.sectionTitle}
      style={{ gridColumn: span === "full" ? "1 / -1" : `span ${span}` }}
    >
      <span className={styles.sectionTitleText}>{title}</span>
      {tag && <span className={styles.sectionTitleTag}>{tag}</span>}
    </div>
  );
}

export type SensorPanelHeadline = {
  /** 값 앞에 붙는 이름 */
  label?: React.ReactNode;
  /** 크게 보여줄 대표값 ("42.3°C", "78%") */
  value: React.ReactNode;
  status?: RobotHealth;
  /** 뱃지 뒤 통계 문구 ("최소 10.0 · 최대 24.4 …") */
  stats?: React.ReactNode;
};

export type SensorPanelGauge = {
  /** 정상 범위 대비 채움 비율(0~100). 범위를 벗어난 값은 잘라 그립니다 */
  percent: number;
  /** @default "normal" */
  status?: RobotHealth | null;
  /** 바 아래 한 줄 ("주의 70°C · 위험 85°C") */
  caption?: React.ReactNode;
};

export type SensorPanelProps = {
  /** 생략하면 머리말 없이 본문만 그립니다 (구역 제목이 대신하는 경우) */
  title?: React.ReactNode;
  /** 제목 아래 보조 설명 ("실시간") */
  subtitle?: React.ReactNode;
  /** 오른쪽 위 출처 태그 */
  tag?: React.ReactNode;
  /** 대표값 줄. 값만 있는 카드도 이걸로 그립니다 */
  headline?: SensorPanelHeadline;
  /** 대표값 아래 게이지 바. 정상 범위가 숫자로 있을 때만 넘깁니다 */
  gauge?: SensorPanelGauge;
  /** 본문 (게이지 바, 좌우 편차, 파형 차트 등) */
  children?: React.ReactNode;
  /** 아래 줄 왼쪽 (범례 등) */
  footer?: React.ReactNode;
  /** 아래 줄 오른쪽 (정상범위 설정 버튼 등) */
  actions?: React.ReactNode;
  /** 격자에서 차지할 칸 수. "full" 이면 한 줄 전체 @default 1 */
  span?: number | "full";
  /** 세로로 차지할 줄 수 @default 1 */
  rowSpan?: number;
  className?: string;
};

export default function SensorPanel({
  title,
  subtitle,
  tag,
  headline,
  gauge,
  children,
  footer,
  actions,
  span = 1,
  rowSpan = 1,
  className,
}: SensorPanelProps) {
  return (
    <div
      className={classNames(styles.panel, className)}
      style={{
        gridColumn: span === "full" ? "1 / -1" : `span ${span}`,
        gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
      }}
    >
      {(title || subtitle || tag) && (
        <div className={styles.header}>
          <div>
            {title && <div className={styles.title}>{title}</div>}
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          {tag && (
            <div className={styles.tag}>
              <span className={styles.tagDot} />
              {tag}
            </div>
          )}
        </div>
      )}

      {headline && (
        <div className={styles.headline}>
          {headline.label && (
            <span className={styles.headlineLabel}>{headline.label}</span>
          )}
          <span className={styles.headlineValue}>{headline.value}</span>
          {headline.status !== undefined && (
            <HealthBadge health={headline.status} size="s" />
          )}
          {headline.stats && (
            <span className={styles.headlineStats}>{headline.stats}</span>
          )}
        </div>
      )}

      {gauge && (
        <div className={styles.gauge}>
          <div className={styles.gaugeTrack}>
            <div
              className={classNames(styles.gaugeFill, {
                [styles.gaugeFillWarning]: gauge.status === RobotHealth.Warning,
                [styles.gaugeFillDanger]: gauge.status === RobotHealth.Danger,
              })}
              style={{ width: `${Math.min(Math.max(gauge.percent, 0), 100)}%` }}
            />
          </div>
          {gauge.caption && (
            <div className={styles.gaugeCaption}>{gauge.caption}</div>
          )}
        </div>
      )}

      {children && (
        <div
          className={classNames(styles.body, { [styles.bodyTight]: !title })}
        >
          {children}
        </div>
      )}

      {(footer || actions) && (
        <div className={styles.footer}>
          <div>{footer}</div>
          {actions && <div>{actions}</div>}
        </div>
      )}
    </div>
  );
}
