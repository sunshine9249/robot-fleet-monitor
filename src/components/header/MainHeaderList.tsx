import React, { useContext, useMemo } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import {
  EuiText,
  EuiFlexItem,
  EuiFlexGroup,
  EuiHeaderSection,
  EuiHeaderSectionItem,
} from "@elastic/eui";
import { useHistory, useLocation } from "react-router-dom";
import {
  PageContext,
  Section,
  SidebarTreePage,
  IconComponentType,
  getRouterLinkProps,
} from "core";
import classNames from "classnames";
import { HeaderSettings } from "./HeaderSettings";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { HeaderAlarm } from "./HeaderAlarm";
import { HeaderToastToggle } from "./HeaderToastToggle";
import appStyles from "../../styles/appStyles.module.scss";
import { SERVICE_NAME } from "../../config";
import { Logo } from "./Logo";

import styles from "./MainHeaderList.module.scss";

/** 상단 메뉴에 올리는 섹션. 기본 정보·시스템은 설정(톱니) 메뉴로 들어갑니다 */
const TOP_SECTIONS = new Set<number>([
  Section.Dashboard,
  Section.Monitoring,
  Section.Events,
]);

export default function MainHeaderList() {
  const { sidebar, headerSubtitle } = useContext(PageContext);
  const { pathname } = useLocation();
  const history = useHistory();

  const menus = useMemo(
    () =>
      sidebar
        .flat()
        .flatMap((item) => ("children" in item ? item.children : [item]))
        .filter(
          (page) =>
            page.section !== undefined && TOP_SECTIONS.has(page.section),
        ),
    [sidebar],
  );

  return (
    <EuiFlexGroup
      className={styles.headerRow}
      alignItems="center"
      gutterSize="none"
      responsive={false}
      justifyContent="spaceBetween"
    >
      <EuiHeaderSection grow={true} className={styles.leftSection}>
        <EuiHeaderSectionItem className={styles.logoWrap}>
          <button
            type="button"
            className={styles.logoButton}
            {...getRouterLinkProps(history, "/")}
          >
            <Logo size={26} />
            <span className={styles.logoText}>{SERVICE_NAME}</span>
          </button>
          {/* 상단 메뉴에 없는 화면만 자기 이름을 여기에 답니다 */}
          {headerSubtitle && (
            <span className={styles.headerSubtitle}>{headerSubtitle}</span>
          )}
        </EuiHeaderSectionItem>
      </EuiHeaderSection>
      <EuiHeaderSection className={styles.navWrap}>
        <EuiHeaderSectionItem>
          <nav aria-label="주 메뉴">
            <EuiFlexGroup
              gutterSize="none"
              responsive={false}
              className={styles.menuGroup}
            >
              {menus.map((page) => (
                <MenuItem
                  key={page.path}
                  page={page}
                  icon={page.icon}
                  title={page.title}
                  active={pathname.startsWith(page.path)}
                />
              ))}
            </EuiFlexGroup>
          </nav>
        </EuiHeaderSectionItem>
      </EuiHeaderSection>
      <EuiHeaderSection grow={true} className={styles.rightSection}>
        <div className={styles.iconWrap}>
          <HeaderToastToggle />
          <HeaderAlarm />
          <HeaderUserMenu />
          <HeaderSettings />
        </div>
      </EuiHeaderSection>
    </EuiFlexGroup>
  );
}

export function MenuItem({
  page,
  icon,
  title,
  active,
}: {
  page: SidebarTreePage;
  icon?: IconComponentType;
  title: React.ReactNode;
  active: boolean;
}) {
  const history = useHistory();

  let iconEl;
  if (typeof icon === "function") {
    const SvgIcon = icon;
    iconEl = <SvgIcon style={{ width: 20, height: 20 }} />;
  } else if (icon) {
    iconEl = <IconifyIcon icon={icon} style={{ width: 20, height: 20 }} />;
  }

  return (
    <EuiFlexItem>
      <button
        {...getRouterLinkProps(history, page.path)}
        aria-current={active ? "page" : undefined}
      >
        <EuiFlexGroup
          alignItems="center"
          responsive={false}
          className={classNames(styles.menuWrap, {
            [styles.active]: active,
          })}
        >
          {iconEl}
          <EuiText
            size="xs"
            className={classNames(styles.menuItem, appStyles.weightMediumP)}
          >
            {title}
          </EuiText>
        </EuiFlexGroup>
      </button>
    </EuiFlexItem>
  );
}
