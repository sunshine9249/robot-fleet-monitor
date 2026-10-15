import { useApi } from "../../hooks/useApi";
import { useMutation } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { RobotFormData, RobotListItem } from "../../types/robot";

export type RobotEditResource = ResourceType<typeof RobotEditResource>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RobotEditResource = registerResource(
  {
    id: Resource.RobotEditResource,
    name: ResourceName[Resource.RobotEditResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation(
      (robotId: number, data: RobotFormData) =>
        api.put(`/api/robots/${robotId}`, { json: data }).json<RobotListItem>(),
    );
    return { editRobot: run, loading, error };
  },
);
