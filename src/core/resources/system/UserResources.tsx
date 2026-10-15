import { useCallback, useState } from "react";
import { useList, ListResolverParams } from "../../hooks/useList";
import { useApi } from "../../hooks/useApi";
import { useMutation, useQuery } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { UserFormData, UserListItem } from "../../types/user";

export type UserListResource = ResourceType<typeof UserListResource>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const UserListResource = registerResource(
  {
    id: Resource.UserListResource,
    name: ResourceName[Resource.UserListResource],
  },
  () => {
    const api = useApi();
    const [query, setQuery] = useState("");
    const [roleId, setRoleId] = useState<number | null>(null);
    const resolver = useCallback(
      (_api: unknown, params: ListResolverParams<UserListItem>) =>
        api.get("/api/users", {
          searchParams: {
            page: params.page,
            pageSize: params.pageSize,
            sort: String(params.sort),
            order: params.order,
            ...(query ? { query } : {}),
            ...(roleId !== null ? { roleId } : {}),
          },
        }),
      [api, query, roleId],
    );
    const list = useList<UserListItem>(resolver, {
      queryKey: ["users", { query, roleId }],
      sort: "id",
      order: "asc",
    });
    return { ...list, query, setQuery, roleId, setRoleId };
  },
);

export type UserViewResource = ResourceType<typeof UserViewResource>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const UserViewResource = registerResource(
  {
    id: Resource.UserViewResource,
    name: ResourceName[Resource.UserViewResource],
  },
  () => {
    const api = useApi();
    const [userId, setUserId] = useState<number | null>(null);
    const fetcher = useCallback(
      (id: number) => api.get(`/api/users/${id}`).json<UserListItem>(),
      [api],
    );
    return { ...useQuery("userView", userId, fetcher), userId, setUserId };
  },
);

export type UserAddResource = ResourceType<typeof UserAddResource>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const UserAddResource = registerResource(
  {
    id: Resource.UserAddResource,
    name: ResourceName[Resource.UserAddResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation((data: UserFormData) =>
      api.post("/api/users", { json: data }).json<UserListItem>(),
    );
    const checkUsername = useCallback(
      async (username: string) => {
        const result = await api
          .get("/api/users/check-username", { searchParams: { username } })
          .json<{ available: boolean }>();
        return result.available;
      },
      [api],
    );
    return { addUser: run, checkUsername, loading, error };
  },
);

export type UserEditResource = ResourceType<typeof UserEditResource>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const UserEditResource = registerResource(
  {
    id: Resource.UserEditResource,
    name: ResourceName[Resource.UserEditResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation(
      (userId: number, data: UserFormData) =>
        api.put(`/api/users/${userId}`, { json: data }).json<UserListItem>(),
    );
    return { editUser: run, loading, error };
  },
);

export type UserDeleteResource = ResourceType<typeof UserDeleteResource>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const UserDeleteResource = registerResource(
  {
    id: Resource.UserDeleteResource,
    name: ResourceName[Resource.UserDeleteResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation(async (ids: number[]) => {
      await api.delete(`/api/users/${ids.join(",")}`);
    });
    return { deleteUsers: run, loading, error };
  },
);
