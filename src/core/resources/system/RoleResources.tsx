import { useCallback, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { useMutation, useQuery } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { ListResponse } from "../../hooks/useList";
import type { Role, RoleFormData } from "../../types/user";

export type RoleListResource = ResourceType<typeof RoleListResource>;
/** 역할은 몇 개 되지 않아 한 번에 전부 받습니다 */
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RoleListResource = registerResource(
  {
    id: Resource.RoleListResource,
    name: ResourceName[Resource.RoleListResource],
  },
  () => {
    const api = useApi();
    const [active, setActive] = useState(false);
    const fetcher = useCallback(
      () => api.get("/api/roles").json<ListResponse<Role>>(),
      [api],
    );
    const query = useQuery("roleList", active ? true : null, fetcher);
    const { reload } = query;
    return {
      items: query.data?.items ?? [],
      loading: query.loading,
      error: query.error,
      reload,
      active,
      setActive,
    };
  },
);

export type RoleAddResource = ResourceType<typeof RoleAddResource>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RoleAddResource = registerResource(
  {
    id: Resource.RoleAddResource,
    name: ResourceName[Resource.RoleAddResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation((data: RoleFormData) =>
      api.post("/api/roles", { json: data }).json<Role>(),
    );
    return { addRole: run, loading, error };
  },
);

export type RoleEditResource = ResourceType<typeof RoleEditResource>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RoleEditResource = registerResource(
  {
    id: Resource.RoleEditResource,
    name: ResourceName[Resource.RoleEditResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation(
      (roleId: number, data: RoleFormData) =>
        api.put(`/api/roles/${roleId}`, { json: data }).json<Role>(),
    );
    return { editRole: run, loading, error };
  },
);

export type RoleDeleteResource = ResourceType<typeof RoleDeleteResource>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RoleDeleteResource = registerResource(
  {
    id: Resource.RoleDeleteResource,
    name: ResourceName[Resource.RoleDeleteResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation(async (roleId: number) => {
      await api.delete(`/api/roles/${roleId}`);
    });
    return { deleteRole: run, loading, error };
  },
);
