import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { EuiLoadingSpinner } from "@elastic/eui";
import classNames from "classnames";
import { Icon } from "@iconify/react";
import { MD_SYMBOLS_ICONS } from "../../../icons";
import { EuiCustomAvatar, UserContext } from "core";
import type { AIChatAskResource, AIChatMessageData } from "core";

import styles from "./AIAssistantChat.module.scss";

const ROBOT_CHAT_SUGGESTIONS = [
  "현재 상태를 진단해줘",
  "배터리와 모터 온도는 괜찮아?",
  "지금 어디에 있어?",
  "진행 중인 임무를 알려줘",
  "최근 이벤트가 있어?",
  "비상 정지 해제 방법",
];

type AIAssistantMessage = AIChatMessageData;

export type AIAssistantChatProps = {
  chatResource: AIChatAskResource;
  robotId: number;
};

const ERROR_ANSWER = "답변을 받아오지 못했습니다. 잠시 후 다시 시도해 주세요.";

function EmptyState({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className={styles.empty}>
      <Icon
        icon={MD_SYMBOLS_ICONS.autoAwesome}
        width={40}
        height={40}
        className={styles.emptyIcon}
      />
      <span className={styles.emptyText}>
        선택한 로봇의 상태를 보고 답해 드려요. 무엇이든 물어보세요.
      </span>
      <div className={styles.suggestions}>
        {ROBOT_CHAT_SUGGESTIONS.map((question) => (
          <button
            type="button"
            key={question}
            className={styles.suggestion}
            onClick={() => onPick(question)}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className={classNames(styles.message, styles.messageAssistant)}>
      <EuiCustomAvatar name="로봇" size="s" initialsLength={2} />
      <div className={classNames(styles.bubble, styles.bubbleAssistant)}>
        <span className={styles.typing} aria-label="답변을 작성하고 있습니다">
          <i className={styles.typingDot} />
          <i className={styles.typingDot} />
          <i className={styles.typingDot} />
        </span>
      </div>
    </div>
  );
}

const colorMap = [
  "#f05959",
  "#ff7044",
  "#f5a200",
  "#82b320",
  "#43ac9c",
  "#118da8",
  "#0195b6",
  "#527dd9",
  "#9e54e3",
];
const colorBrightMap = [
  "#EFD6DC",
  "#DCEEFF",
  "#D9F4E7",
  "#FFE8CC",
  "#E6DBFF",
  "#D9F0F0",
  "#FFDCEB",
  "#E2ECD6",
  "#F2D9FA",
  "#FFF0BF",
  "#D9E7FF",
  "#F9DDCC",
];
function MessageRow({ message }: { message: AIAssistantMessage }) {
  const isUser = message.role === "user";
  // userName의 첫 세글자를 기준으로 색상을 결정하는 로직. colorMap 에서 가져오기
  const userColor =
    message.role === "user" && message.userName
      ? colorMap[
          message.userName
            .slice(0, 3)
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
            colorMap.length
        ]
      : null;
  return (
    <div
      className={classNames(styles.message, {
        [styles.messageUser]: isUser,
        [styles.messageAssistant]: !isUser,
      })}
    >
      {!isUser && <EuiCustomAvatar name="로봇" size="s" initialsLength={2} />}
      <div className={styles.messageContent}>
        {isUser && (
          <p className={styles.messageSpeaker}>
            <EuiCustomAvatar
              name={message.userName ?? "U"}
              size="xs"
              initialsLength={1}
              color={userColor ?? "#999"}
              className={styles.avatarUser}
            />
            {message.userName ?? "사용자"} · ID {message.userId ?? "-"}
          </p>
        )}
        <div
          className={classNames(styles.bubble, {
            [styles.bubbleUser]: isUser,
            [styles.bubbleAssistant]: !isUser,
          })}
          style={isUser ? { backgroundColor: userColor ?? "#999" } : undefined}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}

/** 선택한 로봇에 연결된 대화와 기록을 표시합니다. */
export default function AIAssistantChat({
  chatResource,
  robotId,
}: AIAssistantChatProps) {
  const [messages, setMessages] = useState<AIAssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderHistoryError, setOlderHistoryError] = useState<string | null>(
    null,
  );
  const { user } = useContext(UserContext);
  const { ask, loadHistory, loading: answering } = chatResource;
  const messagesRef = useRef<HTMLDivElement>(null);
  const nextLocalIdRef = useRef(-1);
  const historyRequestRef = useRef(0);
  const loadingOlderRef = useRef(false);
  const pendingPrependScrollRef = useRef<{
    height: number;
    top: number;
  } | null>(null);
  const scrollToBottomRef = useRef(true);

  useLayoutEffect(() => {
    const list = messagesRef.current;
    if (!list) return;

    const previous = pendingPrependScrollRef.current;
    if (previous) {
      list.scrollTop = previous.top + list.scrollHeight - previous.height;
      pendingPrependScrollRef.current = null;
    } else if (scrollToBottomRef.current) {
      list.scrollTop = list.scrollHeight;
      scrollToBottomRef.current = false;
    }
  }, [messages, answering]);

  const refreshHistory = useCallback(async () => {
    const requestId = ++historyRequestRef.current;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const page = await loadHistory(robotId);
      if (historyRequestRef.current === requestId) {
        scrollToBottomRef.current = true;
        setMessages(page.messages);
        setHasMoreHistory(page.hasMore);
      }
    } catch (error) {
      if (historyRequestRef.current === requestId) {
        setHistoryError(
          error instanceof Error
            ? error.message
            : "대화 기록을 불러오지 못했습니다.",
        );
      }
    } finally {
      if (historyRequestRef.current === requestId) setHistoryLoading(false);
    }
  }, [loadHistory, robotId]);

  useEffect(() => {
    void refreshHistory();
    return () => {
      historyRequestRef.current += 1;
    };
  }, [refreshHistory]);

  const loadOlderHistory = useCallback(async () => {
    const beforeId = messages[0]?.id;
    if (!hasMoreHistory || beforeId === undefined || loadingOlderRef.current) {
      return;
    }

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    setOlderHistoryError(null);
    try {
      const page = await loadHistory(robotId, beforeId);
      const list = messagesRef.current;
      if (list && page.messages.length > 0) {
        pendingPrependScrollRef.current = {
          height: list.scrollHeight,
          top: list.scrollTop,
        };
        const existingIds = new Set(messages.map((message) => message.id));
        const olderMessages = page.messages.filter(
          (message) => !existingIds.has(message.id),
        );
        setMessages((previous) => [...olderMessages, ...previous]);
      }
      setHasMoreHistory(page.hasMore);
    } catch (error) {
      setOlderHistoryError(
        error instanceof Error
          ? error.message
          : "이전 대화를 불러오지 못했습니다.",
      );
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [hasMoreHistory, loadHistory, messages, robotId]);

  const handleSend = useCallback(
    async (preset?: string) => {
      const question = (preset ?? draft).trim();
      if (!question || answering || historyLoading || !user) return;

      const pendingMessage: AIAssistantMessage = {
        id: nextLocalIdRef.current--,
        role: "user",
        text: question,
        createdAt: Date.now(),
        userId: user.id,
        userName: user.name,
      };
      scrollToBottomRef.current = true;
      setMessages((previous) => [...previous, pendingMessage]);
      setDraft("");

      try {
        const response = await ask(robotId, question);
        scrollToBottomRef.current = true;
        setMessages((previous) => [
          ...previous.filter((message) => message.id !== pendingMessage.id),
          ...response.messages,
        ]);
      } catch (error) {
        scrollToBottomRef.current = true;
        setMessages((previous) => [
          ...previous,
          {
            id: nextLocalIdRef.current--,
            role: "assistant",
            text:
              error instanceof Error && error.message
                ? `${ERROR_ANSWER}\n${error.message}`
                : ERROR_ANSWER,
            createdAt: Date.now(),
          },
        ]);
      }
    },
    [answering, ask, draft, historyLoading, robotId, user],
  );

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div
          className={styles.messages}
          ref={messagesRef}
          onScroll={(event) => {
            if (event.currentTarget.scrollTop <= 24) {
              void loadOlderHistory();
            }
          }}
        >
          {loadingOlder && (
            <div className={styles.olderHistoryStatus}>
              <EuiLoadingSpinner size="s" />
              <span>이전 대화를 불러오는 중...</span>
            </div>
          )}
          {olderHistoryError && (
            <div className={styles.olderHistoryStatus} role="alert">
              <span>{olderHistoryError}</span>
              <button type="button" onClick={() => void loadOlderHistory()}>
                다시 시도
              </button>
            </div>
          )}
          {historyLoading ? (
            <div className={styles.historyLoading}>
              <EuiLoadingSpinner size="m" />
            </div>
          ) : historyError ? (
            <div className={styles.historyError} role="alert">
              <span>{historyError}</span>
              <button type="button" onClick={() => void refreshHistory()}>
                다시 시도
              </button>
            </div>
          ) : messages.length === 0 && !answering ? (
            <EmptyState onPick={handleSend} />
          ) : (
            <>
              {hasMoreHistory && (
                <div className={styles.olderHistoryHint}>
                  위로 스크롤하면 이전 대화를 불러옵니다
                </div>
              )}
              {messages.map((message) => (
                <MessageRow key={message.id} message={message} />
              ))}
              {answering && <TypingBubble />}
            </>
          )}
        </div>

        <div className={styles.composer}>
          <input
            className={styles.input}
            value={draft}
            placeholder="예: 현재 로봇 상태를 진단해줘"
            disabled={historyLoading || !user}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="button"
            className={styles.sendButton}
            aria-label="질문 보내기"
            disabled={!draft.trim() || answering || historyLoading || !user}
            onClick={() => handleSend()}
          >
            <Icon icon={MD_SYMBOLS_ICONS.send} width={18} height={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
