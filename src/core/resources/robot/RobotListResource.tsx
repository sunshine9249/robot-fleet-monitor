import { useCallback, useState } from "react";
import { useList, ListResolverParams } from "../../hooks/useList";
import { useApi } from "../../hooks/useApi";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { RobotHealth, RobotListItem, RobotType } from "../../types/robot";

export type RobotListResource = ResourceType<typeof RobotListResource>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RobotListResource = registerResource(
  {
    id: Resource.RobotListResource,
    name: ResourceName[Resource.RobotListResource],
  },
  () => {
    const api = useApi();
    const [query, setQuery] = useState("");
    const [type, setType] = useState<RobotType | null>(null);
    const [status, setStatus] = useState<RobotHealth | null>(null);

    const resolver = useCallback(
      (_api: unknown, params: ListResolverParams<RobotListItem>) =>
        api.get("/api/robots", {
          searchParams: {
            page: params.page,
            pageSize: params.pageSize,
            sort: String(params.sort),
            order: params.order,
            ...(query ? { query } : {}),
            ...(type ? { type } : {}),
            ...(status ? { status } : {}),
          },
        }),
      [api, query, type, status],
    );

    const list = useList<RobotListItem>(resolver, {
      queryKey: ["robots", { query, type, status }],
      sort: "name",
      order: "asc",
      pageSize: 50,
    });

    return { ...list, query, setQuery, type, setType, status, setStatus };
  },
);
