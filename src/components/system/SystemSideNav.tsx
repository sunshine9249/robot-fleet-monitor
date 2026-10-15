import { useContext } from "react";
import { useHistory, useLocation } from "react-router";
import {
  EuiListGroupItem,
  EuiListGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiSpacer,
} from "@elastic/eui";
import { PageContext, SidebarTreePage, Section } from "core";
import classNames from "classnames";
import { Icon as IconifyIcon } from "@iconify/react";

import styles from "./SystemSideNav.module.scss";

const GROUPS: { section: Section; title: string }[] = [
  { section: Section.Basic, title: "기본 정보" },
  { section: Section.System, title: "시스템" },
];

/**
 * 설정 화면 왼쪽 메뉴.
 * 권한이 있는 화면만 사이드바 트리에 들어오므로, 여기서는 섹션별로 나눠 그리기만 합니다.
 */
export function SystemSideNav({ children }: { children: React.ReactNode }) {
  const { sidebar } = useContext(PageContext);
  const history = useHistory();
  const { pathname } = useLocation();

  const pagesOf = (section: Section): SidebarTreePage[] =>
    sidebar
      .flat()
      .flatMap((item) => ("children" in item ? item.children : [item]))
      .filter((page) => page.section === section);

  return (
    <EuiFlexGroup gutterSize="none" responsive={false}>
      <EuiFlexItem grow={false}>
        <nav className={styles.nav} aria-label="설정 메뉴">
          {GROUPS.map(({ section, title }) => {
            const pages = pagesOf(section);
            if (pages.length === 0) return null;
            return (
              <div key={section} className={styles.group}>
                <EuiTitle size="xxxs" className={styles.groupTitle}>
                  <h3>{title}</h3>
                </EuiTitle>
                <EuiSpacer size="xs" />
                <EuiListGroup flush={true} gutterSize="s">
                  {pages.map((page) => (
                    <EuiListGroupItem
                      key={page.path}
                      onClick={() => history.push(page.path)}
                      label={page.title}
                      className={classNames(styles.listItem, {
                        [styles.active]: pathname.startsWith(page.path),
                      })}
                      icon={
                        page.icon && typeof page.icon !== "function" ? (
                          <IconifyIcon icon={page.icon} width={18} />
                        ) : undefined
                      }
                    />
                  ))}
                </EuiListGroup>
              </div>
            );
          })}
        </nav>
      </EuiFlexItem>
      <EuiFlexItem grow={6}>
        <div className={styles.content}>{children}</div>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
