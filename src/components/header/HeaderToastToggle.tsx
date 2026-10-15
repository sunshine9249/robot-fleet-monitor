import { useContext } from "react";
import { EuiHeaderSectionItemButton } from "@elastic/eui";
import { Icon } from "@iconify/react";
import { ToastContext } from "core";
import { MD_SYMBOLS_ICONS } from "../../icons";
import styles from "./HeaderSettings.module.scss";

/** 화면 알림(토스트) 표시를 켜고 끕니다. 꺼 두면 새 이벤트가 팝업으로 뜨지 않습니다 */
export function HeaderToastToggle() {
  const { alertsEnabled, setAlertsEnabled } = useContext(ToastContext);

  const label = alertsEnabled
    ? "화면 알림 끄기"
    : "화면 알림이 꺼져 있습니다. 눌러서 켜기";

  return (
    <EuiHeaderSectionItemButton
      aria-label={label}
      aria-pressed={alertsEnabled}
      title={label}
      size="m"
      className={styles.userMenuButton}
      onClick={() => setAlertsEnabled(!alertsEnabled)}
    >
      <Icon
        icon={
          alertsEnabled
            ? MD_SYMBOLS_ICONS.notifications
            : MD_SYMBOLS_ICONS.notificationsOff
        }
        width={24}
        height={24}
        color={alertsEnabled ? "#94a3b8" : "#f59e0b"}
      />
    </EuiHeaderSectionItemButton>
  );
}
