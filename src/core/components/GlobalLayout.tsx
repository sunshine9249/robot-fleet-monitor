import { useLocation } from "react-router";
import { EuiFlexGroup, EuiFlexItem, EuiPage, EuiPageBody } from "@elastic/eui";
import { Routes } from "./Routes";
// eslint-disable-next-line import/no-restricted-paths
import { NotFoundPage } from "../../pages/NotFound";
// eslint-disable-next-line import/no-restricted-paths
import AppHeader from "../../components/header/AppHeader";
// eslint-disable-next-line import/no-restricted-paths
import { SystemSideNav } from "../../components/system/SystemSideNav";

import styles from "./GlobalLayout.module.scss";

/** 관리 화면(/basic, /system)은 왼쪽에 설정 메뉴를 붙입니다 */
const SETTINGS_PREFIXES = ["/basic", "/system"];

export default function GlobalLayout() {
  const path = useLocation().pathname;
  const isSettings = SETTINGS_PREFIXES.some((prefix) =>
    path.startsWith(prefix),
  );

  const content = isSettings ? (
    <SystemSideNav>
      <Routes notFound={NotFoundPage} />
    </SystemSideNav>
  ) : (
    <Routes notFound={NotFoundPage} />
  );

  return (
    <EuiFlexGroup
      direction="row"
      style={{ flex: 1, height: "100vh" }}
      responsive={false}
    >
      <AppHeader />
      <EuiFlexItem grow={1} className={styles.mainSection}>
        <EuiPage paddingSize="none" className="globalLayout_EuiPage">
          <EuiPageBody className="globalLayout_EuiPageBody">
            {content}
          </EuiPageBody>
        </EuiPage>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
