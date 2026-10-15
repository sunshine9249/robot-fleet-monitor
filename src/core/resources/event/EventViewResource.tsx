import { useCallback, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { useQuery } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { RobotEvent } from "../../types/robot";

export type EventViewResource = ResourceType<typeof EventViewResource>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const EventViewResource = registerResource(
  {
    id: Resource.EventViewResource,
    name: ResourceName[Resource.EventViewResource],
  },
  () => {
    const api = useApi();
    const [eventId, setEventId] = useState<number | null>(null);
    const fetcher = useCallback(
      (id: number) => api.get(`/api/events/${id}`).json<RobotEvent>(),
      [api],
    );
    const query = useQuery("eventView", eventId, fetcher);
    return { ...query, eventId, setEventId };
  },
);
