import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { EuiLoadingSpinner } from "@elastic/eui";
import {
  EventListResource,
  EventStatus,
  EventTypeLabel,
  Page,
  PagePath,
  RobotEvent,
  formatRelative,
  hasPermission,
  useApi,
  useCurrentTime,
  useEventStream,
} from "core";
import { EventStatusBadge, SEVERITY_COLOR } from "components/common/robot";
import styles from "./EventFeedPanel.module.scss";

const LIMIT = 30;

/** 대시보드 왼쪽 실시간 이벤트 피드 */
export function EventFeedPanel({
  onRobotFocus,
}: {
  onRobotFocus?: (robotId: number) => void;
}) {
  const api = useApi();
  const history = useHistory();
  const allowed = hasPermission(EventListResource);
  const [events, setEvents] = useState<RobotEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyOpen, setOnlyOpen] = useState(false);
  // 상대 시간("3분 전")이 흘러가도록 1분마다 다시 그립니다
  useCurrentTime("YYYY-MM-DD HH:mm");

  const load = useCallback(async () => {
    if (!allowed) return;
    try {
      const result = await api
        .get("/api/events", {
          searchParams: { pageSize: LIMIT, sort: "occurredAt", order: "desc" },
        })
        .json<{ items: RobotEvent[] }>();
      setEvents(result.items);
    } finally {
      setLoading(false);
    }
  }, [api, allowed]);

  useEffect(() => {
    load();
  }, [load]);

  useEventStream((event, change) => {
    setEvents((previous) => {
      if (change === "created") {
        return [{ ...event }, ...previous].slice(0, LIMIT);
      }
      return previous.map((item) =>
        item.id === event.id ? { ...event } : item,
      );
    });
  });

  if (!allowed) return null;

  const visible = onlyOpen
    ? events.filter((event) => event.status !== EventStatus.Resolved)
    : events;

  return (
    <section className={styles.panel} aria-label="실시간 이벤트">
      <div className={styles.header}>
        <span className={styles.title}>
          <span className={styles.live} aria-hidden="true" />
          실시간 이벤트
        </span>
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!onlyOpen}
            className={!onlyOpen ? styles.activeTab : ""}
            onClick={() => setOnlyOpen(false)}
          >
            전체
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={onlyOpen}
            className={onlyOpen ? styles.activeTab : ""}
            onClick={() => setOnlyOpen(true)}
          >
            미해결
          </button>
        </div>
      </div>

      <ol className={styles.list}>
        {loading && events.length === 0 && (
          <li className={styles.empty}>
            <EuiLoadingSpinner size="m" />
          </li>
        )}
        {!loading && visible.length === 0 && (
          <li className={styles.empty}>표시할 이벤트가 없습니다.</li>
        )}
        {visible.map((event) => (
          <li key={event.id}>
            <button
              type="button"
              className={styles.item}
              style={{ borderLeftColor: SEVERITY_COLOR[event.severity] }}
              onClick={() => {
                onRobotFocus?.(event.robotId);
                history.push(`${PagePath[Page.Events][1]}/${event.id}`);
              }}
            >
              <div className={styles.itemTop}>
                <span className={styles.itemType}>
                  {EventTypeLabel[event.type]}
                </span>
                <time
                  className={styles.time}
                  dateTime={new Date(event.occurredAt).toISOString()}
                >
                  {formatRelative(event.occurredAt)}
                </time>
              </div>
              <div className={styles.itemMessage}>{event.message}</div>
              <div className={styles.itemBottom}>
                <span className={styles.robot}>{event.robotName}</span>
                <EventStatusBadge status={event.status} />
              </div>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
