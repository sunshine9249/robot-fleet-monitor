import { useCallback, useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { useQuery } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { Mission } from "../../types/robot";
import type { ListResponse } from "../../hooks/useList";

export type MissionListResource = ResourceType<typeof MissionListResource>;

/** 로봇 한 대의 최근 임무. 화면이 열려 있는 동안 주기적으로 다시 받습니다 */
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const MissionListResource = registerResource(
  {
    id: Resource.MissionListResource,
    name: ResourceName[Resource.MissionListResource],
  },
  () => {
    const api = useApi();
    const [robotId, setRobotId] = useState<number | null>(null);
    const fetcher = useCallback(
      (id: number) =>
        api
          .get(`/api/robots/${id}/missions`, { searchParams: { pageSize: 30 } })
          .json<ListResponse<Mission>>(),
      [api],
    );
    const query = useQuery("robotMissions", robotId, fetcher);
    const { reload } = query;

    useEffect(() => {
      if (robotId === null) return;
      const timer = window.setInterval(reload, 5000);
      return () => window.clearInterval(timer);
    }, [robotId, reload]);

    return {
      items: query.data?.items ?? [],
      loading: query.loading,
      error: query.error,
      reload,
      robotId,
      setRobotId,
    };
  },
);
