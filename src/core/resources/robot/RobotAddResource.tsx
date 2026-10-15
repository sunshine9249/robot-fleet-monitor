import { useApi } from "../../hooks/useApi";
import { useMutation } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { RobotFormData, RobotListItem } from "../../types/robot";

export type RobotAddResource = ResourceType<typeof RobotAddResource>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RobotAddResource = registerResource(
  {
    id: Resource.RobotAddResource,
    name: ResourceName[Resource.RobotAddResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation((data: RobotFormData) =>
      api.post("/api/robots", { json: data }).json<RobotListItem>(),
    );
    return { addRobot: run, loading, error };
  },
);
