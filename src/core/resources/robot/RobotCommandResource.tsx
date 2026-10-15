import { useApi } from "../../hooks/useApi";
import { useMutation } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { RobotCommand } from "../../types/robot";

export type RobotCommandResource = ResourceType<typeof RobotCommandResource>;

/** 원격 제어 명령 전송. 결과(상태 변화)는 실시간 값으로 돌아옵니다 */
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RobotCommandResource = registerResource(
  {
    id: Resource.RobotCommandResource,
    name: ResourceName[Resource.RobotCommandResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error, setError } = useMutation(
      async (robotId: number, command: RobotCommand) => {
        await api.post(`/api/robots/${robotId}/command`, { json: { command } });
      },
    );
    return {
      sendCommand: run,
      loading,
      error,
      clearError: () => setError(null),
    };
  },
);
