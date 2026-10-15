import { useApi } from "../../hooks/useApi";
import { useMutation } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { UserInfo } from "../../types/user";

export type PersonalEditResource = ResourceType<typeof PersonalEditResource>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const PersonalEditResource = registerResource(
  {
    id: Resource.PersonalEditResource,
    name: ResourceName[Resource.PersonalEditResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation(
      (data: Pick<UserInfo, "name" | "email" | "contact" | "jobPosition">) =>
        api.put("/api/user/me", { json: data }).json<UserInfo>(),
    );
    return { updateMe: run, loading, error };
  },
);

export type PasswordChangeResource = ResourceType<
  typeof PasswordChangeResource
>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const PasswordChangeResource = registerResource(
  {
    id: Resource.PasswordChangeResource,
    name: ResourceName[Resource.PasswordChangeResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation(
      async (currentPassword: string, newPassword: string) => {
        await api.put("/api/user/me/password", {
          json: { currentPassword, newPassword },
        });
      },
    );
    return { changePassword: run, loading, error };
  },
);
