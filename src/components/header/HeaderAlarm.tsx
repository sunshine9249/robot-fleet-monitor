import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { EuiHeaderSectionItemButton, EuiNotificationBadge } from "@elastic/eui";
import { Icon } from "@iconify/react";
import {
  EventListResource,
  EventStatus,
  PagePath,
  Page,
  hasPermission,
  useApi,
  useEventStream,
} from "core";
import { LINE_MD_ICONS } from "../../icons/lineMd";
import styles from "./HeaderSettings.module.scss";

/** 미확인 이벤트 수. 새 이벤트가 생기거나 처리되면 다시 셉니다 */
export function HeaderAlarm() {
  const history = useHistory();
  const api = useApi();
  const allowed = hasPermission(EventListResource);
  const [count, setCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (!allowed) return;
    try {
      const result = await api
        .get("/api/events", {
          searchParams: { status: EventStatus.Open, pageSize: 1 },
        })
        .json<{ count: number }>();
      setCount(result.count);
    } catch {
      // 숫자를 못 받으면 이전 값을 그대로 둡니다
    }
  }, [api, allowed]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  // 이벤트가 몰려 와도 한 번만 세도록 잠깐 모았다가 부릅니다
  useEventStream(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(refresh, 600);
  });

  if (!allowed) return null;

  const label = count > 0 ? `미확인 이벤트 ${count}건` : "미확인 이벤트 없음";

  return (
    <EuiHeaderSectionItemButton
      aria-label={label}
      title={label}
      size="m"
      className={styles.userMenuButton}
      onClick={() =>
        history.push(`${PagePath[Page.Events][1]}?status=${EventStatus.Open}`)
      }
      notification={
        count > 0 ? (
          <EuiNotificationBadge color="accent">
            {count > 99 ? "99+" : count}
          </EuiNotificationBadge>
        ) : undefined
      }
    >
      <Icon
        icon={LINE_MD_ICONS.bellIcon}
        width={24}
        height={24}
        color="#94a3b8"
      />
    </EuiHeaderSectionItemButton>
  );
}
