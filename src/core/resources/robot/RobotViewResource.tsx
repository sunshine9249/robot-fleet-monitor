import { useCallback, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { useQuery } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { RobotListItem } from "../../types/robot";

export type RobotViewResource = ResourceType<typeof RobotViewResource>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RobotViewResource = registerResource(
  {
    id: Resource.RobotViewResource,
    name: ResourceName[Resource.RobotViewResource],
  },
  () => {
    const api = useApi();
    const [robotId, setRobotId] = useState<number | null>(null);
    const fetcher = useCallback(
      (id: number) => api.get(`/api/robots/${id}`).json<RobotListItem>(),
      [api],
    );
    const query = useQuery("robotView", robotId, fetcher);
    return { ...query, robotId, setRobotId };
  },
);
