import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EventListResource,
  EventStatus,
  RobotEvent,
  RobotHealth,
  RobotListItem,
  RobotTelemetry,
  hasPermission,
  resolveRobotHealth,
  useApi,
  useEventStream,
  useFleetTelemetry,
} from "core";

/**
 * 아직 조치가 끝나지 않은 이벤트 (미확인 + 확인).
 * 새 이벤트가 생기거나 상태가 바뀌면 다시 받습니다.
 */
export function useOpenEvents(): RobotEvent[] {
  const api = useApi();
  const allowed = hasPermission(EventListResource);
  const [events, setEvents] = useState<RobotEvent[]>([]);
  const timerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!allowed) return;
    try {
      const searchParams = new URLSearchParams({
        pageSize: "500",
        sort: "occurredAt",
        order: "desc",
      });
      searchParams.append("status", EventStatus.Open);
      searchParams.append("status", EventStatus.Acknowledged);
      const result = await api
        .get("/api/events", { searchParams })
        .json<{ items: RobotEvent[] }>();
      setEvents(result.items);
    } catch {
      // 다음 이벤트 때 다시 시도합니다
    }
  }, [api, allowed]);

  useEffect(() => {
    load();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [load]);

  useEventStream(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(load, 400);
  });

  return events;
}

export interface RobotView {
  robot: RobotListItem;
  telemetry: RobotTelemetry | undefined;
  health: RobotHealth;
  openEvents: RobotEvent[];
}

/**
 * 로봇 목록(DB) + 실시간 값 + 미해결 이벤트를 합친 화면용 모델.
 * 종합 상태는 서버 값 대신 실시간 값으로 다시 판정해서, 목록을 다시 받지 않아도
 * 색이 바로 바뀝니다.
 */
export function useFleetView(
  robots: RobotListItem[],
  intervalMs = 1000,
): { views: RobotView[]; openEvents: RobotEvent[] } {
  const fleet = useFleetTelemetry(intervalMs);
  const openEvents = useOpenEvents();

  const views = useMemo(
    () =>
      robots.map((robot) => {
        const telemetry = fleet.get(robot.id);
        const events = openEvents.filter((event) => event.robotId === robot.id);
        return {
          robot,
          telemetry,
          health: resolveRobotHealth(telemetry ?? null, events),
          openEvents: events,
        };
      }),
    [robots, fleet, openEvents],
  );

  return { views, openEvents };
}
