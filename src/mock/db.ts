import { Resource } from "core/resources/resource";
import type { AIChatMessageData } from "core/resources/robot/AIChatAskResource";
import { Page } from "core/types/pages";
import type { Robot } from "core/types/robot";
import type { Role } from "core/types/user";
import { SEED_ROBOTS } from "./robots";
import { migrateLegacyRole } from "./legacyRoles";

/**
 * 목 API(MSW 핸들러)의 저장소.
 *
 * 로봇·사용자·역할은 브라우저 localStorage 에 남겨 새로고침해도 유지됩니다.
 * 이벤트·임무는 시뮬레이터가 메모리에 들고 있어 새로고침하면 새로 시작합니다.
 * 처음 상태로 되돌리려면 콘솔에서 `localStorage.removeItem("rfm.mock.db")`.
 */

export interface MockUser {
  id: number;
  username: string;
  password: string;
  name: string;
  email: string | null;
  contact: string | null;
  jobPosition: string | null;
  roleId: number;
  lastLoginAt: number | null;
  createdAt: number;
}

export type RobotChatMessage = AIChatMessageData;

export interface RobotChatHistory {
  robotId: number;
  messages: RobotChatMessage[];
}

interface MockDatabase {
  version: number;
  robots: Robot[];
  users: MockUser[];
  roles: Omit<Role, "userCount">[];
  robotChatHistories: RobotChatHistory[];
}

const STORAGE_KEY = "rfm.mock.db";
const VERSION = 2;

const ALL_PAGES = Object.values(Page);
const ALL_RESOURCES = Object.values(Resource);

function seed(): MockDatabase {
  const createdAt = Date.parse("2025-03-01T09:00:00+09:00");
  return {
    version: VERSION,
    robots: SEED_ROBOTS,
    robotChatHistories: [],
    roles: [
      {
        id: 1,
        name: "관리자",
        description: "모든 화면과 기능을 사용할 수 있습니다.",
        isSystem: true,
        pages: ALL_PAGES,
        resources: ALL_RESOURCES,
        createdAt,
      },
      {
        id: 2,
        name: "운영자",
        description: "관제와 원격 제어, 이벤트 조치를 담당합니다.",
        isSystem: false,
        pages: [Page.Dashboard, Page.Monitoring, Page.Events, Page.Robots],
        resources: [
          Resource.AIChatAskResource,
          Resource.RobotListResource,
          Resource.RobotViewResource,
          Resource.RobotCommandResource,
          Resource.MissionListResource,
          Resource.SiteMapResource,
          Resource.EventListResource,
          Resource.EventViewResource,
          Resource.EventUpdateResource,
          Resource.DashboardSummaryResource,
          Resource.PersonalEditResource,
          Resource.PasswordChangeResource,
        ],
        createdAt,
      },
      {
        id: 3,
        name: "조회 전용",
        description: "화면을 볼 수만 있고 제어·조치는 할 수 없습니다.",
        isSystem: false,
        pages: [Page.Dashboard, Page.Monitoring, Page.Events],
        resources: [
          Resource.RobotListResource,
          Resource.RobotViewResource,
          Resource.MissionListResource,
          Resource.SiteMapResource,
          Resource.EventListResource,
          Resource.EventViewResource,
          Resource.DashboardSummaryResource,
          Resource.PasswordChangeResource,
        ],
        createdAt,
      },
    ],
    users: [
      {
        id: 1,
        username: "admin",
        password: "admin1234",
        name: "김관리",
        email: "admin@example.com",
        contact: "010-0000-0001",
        jobPosition: "시설관리팀장",
        roleId: 1,
        lastLoginAt: null,
        createdAt,
      },
      {
        id: 2,
        username: "operator",
        password: "operator1234",
        name: "이운영",
        email: "operator@example.com",
        contact: "010-0000-0002",
        jobPosition: "관제 담당",
        roleId: 2,
        lastLoginAt: null,
        createdAt: createdAt + 86400000,
      },
      {
        id: 3,
        username: "viewer",
        password: "viewer1234",
        name: "박조회",
        email: null,
        contact: null,
        jobPosition: "협력사",
        roleId: 3,
        lastLoginAt: null,
        createdAt: createdAt + 2 * 86400000,
      },
    ],
  };
}

function load(): MockDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDatabase & {
        robotChatHistories?: (RobotChatHistory & { userId?: number })[];
      };
      // 버전 1 은 권한이 숫자 id 였습니다. 역할만 문자열 키로 옮기고 나머지는 그대로 씁니다
      if (parsed.version === 1) {
        parsed.roles = parsed.roles.map((role) => migrateLegacyRole(role));
        parsed.version = VERSION;
      }
      if (parsed.version === VERSION) {
        const historiesByRobot = new Map<
          number,
          { userId?: number; messages: RobotChatMessage[] }[]
        >();
        for (const history of parsed.robotChatHistories ?? []) {
          const histories = historiesByRobot.get(history.robotId) ?? [];
          histories.push({
            userId: history.userId,
            messages: history.messages ?? [],
          });
          historiesByRobot.set(history.robotId, histories);
        }

        parsed.robotChatHistories = [...historiesByRobot].map(
          ([robotId, histories]) => {
            const ordered = histories.flatMap((history, historyIndex) =>
              history.messages.map((message, messageIndex) => ({
                message,
                userId: history.userId,
                order: historyIndex * 1_000_000 + messageIndex,
              })),
            );
            ordered.sort(
              (left, right) =>
                left.message.createdAt - right.message.createdAt ||
                left.order - right.order,
            );
            const messages = ordered.map(({ message, userId }, index) => {
              if (message.role !== "user") {
                return { ...message, id: index + 1 };
              }
              const author = parsed.users.find((user) => user.id === userId);
              return {
                ...message,
                id: index + 1,
                userId: message.userId ?? author?.id ?? 0,
                userName:
                  message.userName ?? author?.name ?? "알 수 없는 사용자",
              };
            });
            return { robotId, messages };
          },
        );
        return parsed;
      }
    }
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등)이면 시드로 시작합니다
  }
  return seed();
}

export const db: MockDatabase = load();

/** 관리자 역할은 새로 생긴 화면·리소스까지 항상 전부 갖습니다 */
for (const role of db.roles) {
  if (role.isSystem) {
    role.pages = ALL_PAGES;
    role.resources = ALL_RESOURCES;
  }
}

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // 무시: 다음 새로고침 때 시드로 돌아갈 뿐입니다
  }
}

export function nextId(items: { id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}
