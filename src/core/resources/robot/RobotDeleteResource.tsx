import { useApi } from "../../hooks/useApi";
import { useMutation } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";

export type RobotDeleteResource = ResourceType<typeof RobotDeleteResource>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RobotDeleteResource = registerResource(
  {
    id: Resource.RobotDeleteResource,
    name: ResourceName[Resource.RobotDeleteResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation(async (ids: number[]) => {
      await api.delete(`/api/robots/${ids.join(",")}`);
    });
    return { deleteRobots: run, loading, error };
  },
);
