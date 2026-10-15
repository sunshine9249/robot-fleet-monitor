import { EuiHeader, EuiFlexGroup } from "@elastic/eui";
import MainHeaderList from "./MainHeaderList";
import styles from "./AppHeader.module.scss";

export default function AppHeader() {
  return (
    <EuiHeader className={styles.header}>
      <EuiFlexGroup direction="column" gutterSize="none">
        <MainHeaderList />
      </EuiFlexGroup>
    </EuiHeader>
  );
}
