import { useCallback, useState } from "react";
import moment from "moment";
import {
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  htmlIdGenerator,
} from "@elastic/eui";
import type { EuiGlobalToastItem } from "../components/eui/EuiTypes";
import { EuiCustomLink } from "../components/eui/EuiCustomLink";
import { EventSeverity, EventTypeLabel, type RobotEvent } from "../types/robot";
import styles from "./useToast.module.scss";
import { Icon } from "@iconify/react/dist/iconify.js";
import { LINE_MD_ICONS, MD_SYMBOLS_ICONS } from "../../icons";

export type CustomToastProp = { title: string; error?: string };

const ALERTS_ENABLED_KEY = "alertToastEnabled";

function readAlertsEnabled() {
  try {
    return window.localStorage.getItem(ALERTS_ENABLED_KEY) !== "false";
  } catch {
    return true;
  }
}

export function useToast() {
  const [toasts, setToasts] = useState<EuiGlobalToastItem[]>([]);
  /** 화면 알림(토스트) 표시 여부. 헤더 아이콘에서 켜고 끕니다 */
  const [alertsEnabled, setAlertsEnabledState] = useState(readAlertsEnabled);

  const setAlertsEnabled = useCallback((enabled: boolean) => {
    setAlertsEnabledState(enabled);
    try {
      window.localStorage.setItem(ALERTS_ENABLED_KEY, String(enabled));
    } catch {
      // 저장이 막혀 있어도 현재 세션에서는 동작합니다
    }
    if (!enabled) setToasts([]);
  }, []);

  const addToast = useCallback(
    (
      type:
        | "success"
        | "error"
        | "warning"
        | "info"
        | "registerError"
        | "sendError",
      custom: CustomToastProp,
    ) => {
      const id = htmlIdGenerator()();
      const timestamp = `${moment().format("HH:mm:ss")} ${moment().fromNow()}`;

      let color;
      let icon;
      let desc;
      const titleText = custom.title;

      if (type === "success") {
        color = "success";
        icon = (
          <Icon
            icon={MD_SYMBOLS_ICONS.circleCheck}
            width={20}
            height={20}
            color={"green"}
          />
        );
        desc = (
          <EuiText
            className={styles.date}
            size={"xs"}
            color={"#94a3b8"}
            textAlign="right"
          >
            {timestamp}
          </EuiText>
        );
      } else {
        desc = (
          <>
            <EuiText
              className={styles.desc}
              size={"xs"}
              color={"#e2e8f0"}
              textAlign="right"
            >
              {custom.error || "오류가 발생했습니다."}
            </EuiText>
            <EuiText
              className={styles.date}
              size={"xs"}
              color={"#94a3b8"}
              textAlign="right"
            >
              {timestamp}
            </EuiText>
          </>
        );

        if (type === "error") {
          color = "danger";
          icon = (
            <Icon
              icon={LINE_MD_ICONS.alertCircle}
              width={20}
              height={20}
              color="#f43f5e"
            />
          );
        } else if (type === "warning") {
          color = "warning";
          icon = (
            <Icon
              icon={LINE_MD_ICONS.alertTriangle}
              width={20}
              height={20}
              color="#f59e0b"
            />
          );
        } else if (type === "info") {
          color = "accent";
          icon = (
            <Icon
              icon={LINE_MD_ICONS.alertCircle}
              width={20}
              height={20}
              color="#7c77f4"
            />
          );
        }
      }

      const baseToast: EuiGlobalToastItem = {
        id,
        color,
        title: (
          <EuiFlexGroup direction="row" gutterSize={"xs"}>
            <EuiFlexItem grow={false}>{icon}</EuiFlexItem>
            <EuiText size={"s"}>{titleText}</EuiText>
          </EuiFlexGroup>
        ),
        text: desc,
      };

      setToasts((prev) => [...prev, baseToast]);
    },
    [],
  );

  /** 로봇 이벤트 알림. 같은 이벤트는 한 번만 띄웁니다 */
  const addAlertToast = useCallback((event: RobotEvent) => {
    const critical = event.severity === EventSeverity.Critical;
    const id = `event-${event.id}`;
    setToasts((toasts) =>
      toasts.some((toast) => toast.id === id)
        ? toasts
        : [
            ...toasts,
            {
              id,
              title: (
                <EuiFlexGroup direction="row" gutterSize={"xs"}>
                  <Icon
                    icon={LINE_MD_ICONS.alertTriangle}
                    width={20}
                    height={20}
                    color={critical ? "#f43f5e" : "#f59e0b"}
                  />
                  <EuiText size="s">
                    <b>
                      {event.robotName} · {EventTypeLabel[event.type]}
                    </b>
                  </EuiText>
                </EuiFlexGroup>
              ),
              text: (
                <>
                  <EuiText className={styles.desc} size={"s"} color="subdued">
                    {event.message}
                  </EuiText>
                  <EuiText className={styles.desc} size={"s"}>
                    <EuiCustomLink href={`/events/${event.id}`}>
                      이벤트 보기
                    </EuiCustomLink>
                  </EuiText>
                  <EuiText
                    className={styles.date}
                    size={"xs"}
                    color={"#94a3b8"}
                    textAlign="right"
                  >
                    {moment(event.occurredAt).format("HH:mm:ss")}
                  </EuiText>
                </>
              ),
              color: critical ? "danger" : "warning",
              toastLifeTimeMs: critical ? 15000 : 8000,
            },
          ],
    );
  }, []);

  const handleDismiss = useCallback((toast: EuiGlobalToastItem) => {
    setToasts((prev) => prev.filter((toasts) => toasts.id !== toast.id));
  }, []);

  const clearAllToasts = useCallback(() => setToasts([]), []);

  return {
    toasts,
    addToast,
    setToasts,
    addAlertToast,
    handleDismiss,
    clearAllToasts,
    alertsEnabled,
    setAlertsEnabled,
  };
}
