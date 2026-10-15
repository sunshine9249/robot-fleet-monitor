import { useApi } from "../../hooks/useApi";
import { useMutation } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";
import type { EventStatus, RobotEvent } from "../../types/robot";

export type EventUpdateResource = ResourceType<typeof EventUpdateResource>;

/** 이벤트 확인·조치 완료 처리와 조치 내용 기록 */
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const EventUpdateResource = registerResource(
  {
    id: Resource.EventUpdateResource,
    name: ResourceName[Resource.EventUpdateResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation(
      (
        eventId: number,
        patch: { status?: EventStatus; note?: string | null },
      ) =>
        api.patch(`/api/events/${eventId}`, { json: patch }).json<RobotEvent>(),
    );
    return { updateEvent: run, loading, error };
  },
);
