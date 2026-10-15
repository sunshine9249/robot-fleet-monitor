import { useCallback, useContext } from "react";
import { EuiButton, EuiGlobalToastList } from "@elastic/eui";
import { ToastContext } from "../contexts/ToastContext";
import { useEventStream } from "../telemetry/hooks";
import { EventSeverity, EventType } from "../types/robot";
import styles from "./EventAlert.module.scss";

/** 바로 알리지 않는 이벤트 — 스스로 풀리거나 정보성인 것 */
const QUIET_TYPES = new Set([EventType.CollisionRisk, EventType.MissionFailed]);

/**
 * 새 이벤트를 화면 오른쪽 아래 알림으로 띄웁니다.
 * 위험은 항상, 주의는 스스로 풀리는 종류를 빼고 띄웁니다.
 * 헤더 아이콘에서 알림을 끄면 새 이벤트는 토스트로 띄우지 않습니다.
 */
export function EventAlert() {
  const {
    toasts,
    addToast,
    addAlertToast,
    handleDismiss,
    clearAllToasts,
    alertsEnabled,
    setAlertsEnabled,
  } = useContext(ToastContext);

  useEventStream((event, change) => {
    if (!alertsEnabled) return;
    if (change !== "created") return;
    if (event.severity === EventSeverity.Info) return;
    if (
      event.severity === EventSeverity.Warning &&
      QUIET_TYPES.has(event.type)
    ) {
      return;
    }
    addAlertToast(event);
  });

  const onClearAll = useCallback(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    clearAllToasts();
  }, [clearAllToasts]);

  const onTurnOff = useCallback(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    setAlertsEnabled(false);
    addToast("info", {
      title: "알림을 껐습니다",
      error: "오른쪽 상단 알림 아이콘에서 다시 켤 수 있습니다.",
    });
  }, [addToast, setAlertsEnabled]);

  // 토스트가 없으면 목록도 버튼도 남기지 않습니다
  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastWrap}>
      {/* EUI 내장 "Clear all" 은 토스트가 사라져도 남는 일이 있어 끄고 아래 버튼을 씁니다 */}
      <EuiGlobalToastList
        className={styles.toastList}
        toasts={toasts}
        dismissToast={handleDismiss}
        toastLifeTimeMs={8000}
        showClearAllButtonAt={0}
      />
      <div className={styles.actions}>
        {toasts.length >= 3 && (
          <EuiButton size="s" color="danger" onClick={onClearAll}>
            알림 모두 삭제
          </EuiButton>
        )}
        {alertsEnabled && (
          <EuiButton size="s" color="text" onClick={onTurnOff}>
            알림 끄기
          </EuiButton>
        )}
      </div>
    </div>
  );
}
