import { useApi } from "../../hooks/useApi";
import { useMutation } from "../../hooks/useRequest";
import { Resource, ResourceType, registerResource } from "../register";
import { ResourceName } from "../resourceName";

interface AIChatMessageBase {
  id: number;
  text: string;
  createdAt: number;
}

export type AIChatMessageData =
  | (AIChatMessageBase & { role: "assistant" })
  | (AIChatMessageBase & {
      role: "user";
      userId: number;
      userName: string;
    });

export interface AIChatHistoryData {
  messages: AIChatMessageData[];
  hasMore: boolean;
}

export interface AIChatAskData {
  answer: string;
  messages: [AIChatMessageData, AIChatMessageData];
}

export type AIChatAskResource = ResourceType<typeof AIChatAskResource>;

/** 로봇별 AI 대화 이력을 불러오고 질문을 저장합니다 */
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const AIChatAskResource = registerResource(
  {
    id: Resource.AIChatAskResource,
    name: ResourceName[Resource.AIChatAskResource],
  },
  () => {
    const api = useApi();
    const { run, loading, error } = useMutation(
      async (robotId: number, question: string) => {
        const data = await api
          .post(`/api/robots/${robotId}/chat`, {
            json: { question },
            timeout: 60000,
          })
          .json<AIChatAskData>();
        return data;
      },
    );
    const { run: loadHistory } = useMutation(
      async (robotId: number, beforeId?: number) => {
        const { messages, hasMore } = await api
          .get(`/api/robots/${robotId}/chat`, {
            searchParams:
              beforeId === undefined ? {} : { beforeId: String(beforeId) },
          })
          .json<AIChatHistoryData>();
        return { messages, hasMore };
      },
    );
    return { ask: run, loadHistory, loading, error };
  },
);
