import { useContext, useMemo } from "react";
import classNames from "classnames";
import { useHistory, useLocation } from "react-router";
import { EuiHeaderSectionItemButton } from "@elastic/eui";
import { Icon } from "@iconify/react";
import { LINE_MD_ICONS } from "../../icons/lineMd";

import { PageContext, Section } from "core";
import styles from "./HeaderSettings.module.scss";

const SETTINGS_SECTIONS = new Set<number>([Section.Basic, Section.System]);

/** 설정(로봇·사용자·권한 관리)으로 가는 버튼. 들어갈 화면이 없으면 숨깁니다 */
export function HeaderSettings() {
  const history = useHistory();
  const path = useLocation().pathname;
  const { sidebar } = useContext(PageContext);
  const active = path.startsWith("/system") || path.startsWith("/basic");

  const firstPage = useMemo(
    () =>
      sidebar
        .flat()
        .flatMap((item) => ("children" in item ? item.children : [item]))
        .find(
          (page) =>
            page.section !== undefined && SETTINGS_SECTIONS.has(page.section),
        ),
    [sidebar],
  );

  if (!firstPage) return null;

  return (
    <EuiHeaderSectionItemButton
      aria-label="설정"
      onClick={() => history.push(firstPage.path)}
      size="m"
      title="설정"
      className={classNames(styles.userMenuButton, {
        [styles.focused]: active,
      })}
    >
      <Icon
        icon={LINE_MD_ICONS.settings}
        width={24}
        height={24}
        color="#94a3b8"
      />
    </EuiHeaderSectionItemButton>
  );
}
