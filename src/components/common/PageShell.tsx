import React from "react";
import classNames from "classnames";
import styles from "./PageShell.module.scss";

interface PageShellProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 제목 오른쪽 (주요 버튼) */
  actions?: React.ReactNode;
  /** 제목 아래 요약 지표 줄 */
  summary?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** 목록·관리 화면 공통 틀: 제목 줄 + 흰 패널 */
export function PageShell({
  title,
  description,
  actions,
  summary,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={classNames(styles.page, className)}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      {summary && <div className={styles.summary}>{summary}</div>}
      <section className={styles.panel}>{children}</section>
    </div>
  );
}

/** 요약 지표 하나 */
export function SummaryStat({
  label,
  value,
  tone = "default",
  onClick,
  active = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "default" | "danger" | "warning" | "success";
  onClick?: () => void;
  active?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={classNames(styles.stat, styles[tone], {
        [styles.clickable]: Boolean(onClick),
        [styles.active]: active,
      })}
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
    >
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </Tag>
  );
}
