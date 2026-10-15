import { useCallback, useState } from "react";
import { useList, ListResolverParams } from "../../hooks/useList";
import { useApi } from "../../hooks/useApi";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type {
  EventSeverity,
  EventStatus,
  EventType,
  RobotEvent,
} from "../../types/robot";

export interface EventListFilter {
  query: string;
  robotId: number | null;
  types: EventType[];
  severities: EventSeverity[];
  statuses: EventStatus[];
  /** [시작, 끝] (ms). null 이면 전체 기간 */
  range: [number, number] | null;
}

export const EMPTY_EVENT_FILTER: EventListFilter = {
  query: "",
  robotId: null,
  types: [],
  severities: [],
  statuses: [],
  range: null,
};

export type EventListResource = ResourceType<typeof EventListResource>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const EventListResource = registerResource(
  {
    id: Resource.EventListResource,
    name: ResourceName[Resource.EventListResource],
  },
  () => {
    const api = useApi();
    const [filter, setFilter] = useState<EventListFilter>(EMPTY_EVENT_FILTER);

    const resolver = useCallback(
      (_api: unknown, params: ListResolverParams<RobotEvent>) => {
        const searchParams = new URLSearchParams({
          page: String(params.page),
          pageSize: String(params.pageSize),
          sort: String(params.sort),
          order: params.order,
        });
        if (filter.query) searchParams.set("query", filter.query);
        if (filter.robotId !== null) {
          searchParams.set("robotId", String(filter.robotId));
        }
        filter.types.forEach((value) => searchParams.append("type", value));
        filter.severities.forEach((value) =>
          searchParams.append("severity", value),
        );
        filter.statuses.forEach((value) =>
          searchParams.append("status", value),
        );
        if (filter.range) {
          searchParams.set("from", String(filter.range[0]));
          searchParams.set("to", String(filter.range[1]));
        }
        return api.get("/api/events", { searchParams });
      },
      [api, filter],
    );

    const list = useList<RobotEvent>(resolver, {
      queryKey: ["events", filter],
      sort: "occurredAt",
      order: "desc",
      pageSize: 20,
    });

    const summary = (list.additionalData?.summary ?? {
      open: 0,
      critical: 0,
    }) as { open: number; critical: number };

    return { ...list, filter, setFilter, summary };
  },
);
