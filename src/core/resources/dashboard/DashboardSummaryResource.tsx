import { useCallback, useEffect } from "react";
import { useApi } from "../../hooks/useApi";
import { useQuery } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { EventType } from "../../types/robot";

export interface DashboardSummary {
  todayEventCount: number;
  todayCriticalCount: number;
  todayMissionCount: number;
  todayFailedMissionCount: number;
  openEventCount: number;
  eventTypeCounts: { type: EventType; count: number }[];
}

export type DashboardSummaryResource = ResourceType<
  typeof DashboardSummaryResource
>;

/**
 * 대시보드 상단의 오늘 집계.
 * 실시간 값(로봇 상태·배터리)은 텔레메트리로 직접 세고, 이력이 필요한 집계만 여기서 받습니다.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const DashboardSummaryResource = registerResource(
  {
    id: Resource.DashboardSummaryResource,
    name: ResourceName[Resource.DashboardSummaryResource],
  },
  () => {
    const api = useApi();
    const fetcher = useCallback(
      () => api.get("/api/dashboard/summary").json<DashboardSummary>(),
      [api],
    );
    const query = useQuery("dashboardSummary", true, fetcher);
    const { reload } = query;

    useEffect(() => {
      const timer = window.setInterval(reload, 15000);
      return () => window.clearInterval(timer);
    }, [reload]);

    return query;
  },
);
