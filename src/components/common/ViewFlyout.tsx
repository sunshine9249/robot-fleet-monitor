import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  useCallback,
  CSSProperties,
} from "react";
import { useHistory } from "react-router-dom";
import {
  EuiTitle,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFlyoutSize,
} from "@elastic/eui";
import classNames from "classnames";

import styles from "./ViewFlyout.module.scss";

export type ViewFlyoutProps = {
  /**
   * 닫기 동작. 문자열이면 해당 경로로 이동하고, 생략하면 뒤로 가기.
   * (ViewModal 과 같은 규칙)
   */
  "onClose"?: (() => void) | string;
  "size"?: EuiFlyoutSize | CSSProperties["width"];
  "maxWidth"?: boolean | number | string;
  "paddingSize"?: "none" | "s" | "m" | "l";
  "ownFocus"?: boolean;
  "className"?: string;
  "children"?: React.ReactNode;
  "aria-labelledby"?: string;
};

/**
 * 상세보기 공통 flyout.
 * 이 프로젝트의 상세 화면은 modal 이 아니라 flyout 으로 구현한다.
 * 목록을 그대로 둔 채 오른쪽에서 상세가 열려야 하기 때문이다.
 */
export function ViewFlyout({
  onClose,
  size = "l",
  maxWidth = false,
  paddingSize = "l",
  ownFocus = true,
  className,
  children,
  ...rest
}: ViewFlyoutProps) {
  const history = useHistory();

  const handleClose = useCallback(() => {
    if (typeof onClose === "string") {
      history.push(onClose);
    } else if (onClose) {
      onClose();
    } else {
      history.goBack();
    }
  }, [history, onClose]);

  return (
    <EuiFlyout
      {...rest}
      onClose={handleClose}
      size={size}
      maxWidth={maxWidth}
      paddingSize={paddingSize}
      ownFocus={ownFocus}
      className={classNames(styles.flyout, className)}
    >
      {children}
    </EuiFlyout>
  );
}

export type ViewFlyoutHeaderProps = Omit<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
  "title"
> & {
  title?: React.ReactNode;
  /** 제목 아래 한 줄 요약 (예: "DLV-01 · 1F · 주행 중") */
  subtitle?: React.ReactNode;
  /** 제목 줄 오른쪽에 붙일 요소 */
  rightSection?: React.ReactNode;
  /** 헤더 아래에 붙는 탭 등 */
  bottomSection?: React.ReactNode;
};

export function ViewFlyoutHeader({
  title,
  subtitle,
  rightSection,
  bottomSection,
  className,
  ...rest
}: ViewFlyoutHeaderProps) {
  return (
    <EuiFlyoutHeader hasBorder={false} className={styles.headerWrap}>
      <div {...rest} className={classNames(styles.header, className)}>
        <div
          className={classNames(styles.headerMain, {
            [styles.hasBottom]: Boolean(bottomSection),
          })}
        >
          <div className={styles.headerTitleArea}>
            {title && (
              <EuiTitle size="s">
                <h2 className={styles.title}>{title}</h2>
              </EuiTitle>
            )}
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          {rightSection && (
            <div className={styles.headerRight}>{rightSection}</div>
          )}
        </div>
        {bottomSection && (
          <div className={styles.headerBottom}>{bottomSection}</div>
        )}
      </div>
    </EuiFlyoutHeader>
  );
}

export type ViewFlyoutBodyProps = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  padding?: number;
};

export function ViewFlyoutBody({
  className,
  padding,
  children,
  ...rest
}: ViewFlyoutBodyProps) {
  return (
    <EuiFlyoutBody className={classNames(styles.bodyWrap, className)}>
      <div
        {...rest}
        className={classNames(styles.body, className)}
        style={{ ...rest.style, ...(padding !== undefined ? { padding } : {}) }}
      >
        {children}
      </div>
    </EuiFlyoutBody>
  );
}

export type ViewFlyoutFooterProps = {
  /** 왼쪽에 놓이는 요소 (보통 "닫기") */
  left?: React.ReactNode;
  /** 오른쪽에 놓이는 요소들 (보통 주요 액션) */
  children?: React.ReactNode;
  className?: string;
};

export function ViewFlyoutFooter({
  left,
  children,
  className,
}: ViewFlyoutFooterProps) {
  return (
    <EuiFlyoutFooter className={styles.footerWrap}>
      <div className={classNames(styles.footer, className)}>
        <div className={styles.footerLeft}>{left}</div>
        <div className={styles.footerRight}>{children}</div>
      </div>
    </EuiFlyoutFooter>
  );
}
