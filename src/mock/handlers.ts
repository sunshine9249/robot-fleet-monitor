import { delay as networkDelay, http } from "msw";
import { Buffer } from "buffer/";
import { Resource } from "core/resources/resource";
import { Page } from "core/types/pages";
import {
  EventSeverity,
  EventStatus,
  EventType,
  MissionStatus,
  Robot,
  RobotCommand,
  RobotEvent,
  RobotFormData,
  RobotListItem,
  RobotType,
  resolveRobotHealth,
} from "core/types/robot";
import type {
  Role,
  RoleFormData,
  UserFormData,
  UserInfo,
  UserListItem,
} from "core/types/user";
import { answer } from "./assistant";
import { db, MockUser, nextId, persist } from "./db";
import { getFleetSimulator } from "./fleet";
import { SITE_MAP } from "./site";

/**
 * 목 API 서버의 요청 처리기 (MSW 핸들러).
 *
 * 브라우저에서는 서비스 워커(`mock/browser.ts`)가, 테스트에서는 `setupServer` 가
 * 이 핸들러로 `/api/*` 요청을 받습니다. 화면 코드는 진짜 서버를 부르듯
 * `api.get("/api/robots")` 를 그대로 쓰고, 목이 있는지 알지 못합니다.
 */

// ---------------------------------------------------------------------------
// 응답 도우미
// ---------------------------------------------------------------------------

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const STATUS_TEXT: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
};

function json(data: unknown, status = 200) {
  return new Response(data === undefined ? null : JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(error: HttpError) {
  return json(
    {
      statusCode: error.status,
      error: STATUS_TEXT[error.status] ?? "Error",
      message: error.message,
    },
    error.status,
  );
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// 인증
// ---------------------------------------------------------------------------

const SESSION_KEY = "rfm.mock.session";
const TOKEN_TTL = 60 * 60 * 1000;

function base64Url(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function issueToken(user: MockUser) {
  const role = db.roles.find((item) => item.id === user.roleId);
  const exp = Date.now() + TOKEN_TTL;
  const payload = {
    sub: user.id,
    pages: role?.pages ?? [],
    resources: [Resource.AuthResource, ...(role?.resources ?? [])],
    exp: Math.floor(exp / 1000),
  };
  const token = [
    base64Url(JSON.stringify({ alg: "none", typ: "JWT" })),
    base64Url(JSON.stringify(payload)),
    "mock",
  ].join(".");
  return {
    accessToken: token,
    accessTokenExp: exp,
    defaultRoute: "/dashboard",
  };
}

function readSession(): number | null {
  try {
    const raw =
      sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(userId: number | null, remember = false) {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    if (userId !== null) {
      (remember ? localStorage : sessionStorage).setItem(
        SESSION_KEY,
        String(userId),
      );
    }
  } catch {
    // 저장소를 못 쓰면 새로고침할 때 다시 로그인하면 됩니다
  }
}

function currentUser(request: Request): MockUser {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  try {
    const payload = JSON.parse(
      Buffer.from(
        token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString(),
    ) as { sub: number; exp: number };
    const user = db.users.find((item) => item.id === payload.sub);
    if (user && payload.exp * 1000 > Date.now()) return user;
  } catch {
    // 아래에서 401
  }
  throw new HttpError(401, "로그인이 필요합니다.");
}

function requireResource(user: MockUser, resource: Resource) {
  const role = db.roles.find((item) => item.id === user.roleId);
  if (!role?.resources.includes(resource)) {
    throw new HttpError(403, "이 작업을 할 권한이 없습니다.");
  }
}

// ---------------------------------------------------------------------------
// 변환
// ---------------------------------------------------------------------------

function toUserInfo(user: MockUser): UserInfo {
  const role = db.roles.find((item) => item.id === user.roleId);
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    contact: user.contact,
    jobPosition: user.jobPosition,
    role: { id: role?.id ?? 0, name: role?.name ?? "-" },
  };
}

function toUserListItem(user: MockUser): UserListItem {
  return {
    ...toUserInfo(user),
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

function toRole(role: Omit<Role, "userCount">): Role {
  return {
    ...role,
    userCount: db.users.filter((user) => user.roleId === role.id).length,
  };
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function openEvents() {
  return getFleetSimulator()
    .getEvents()
    .filter((event) => event.status !== EventStatus.Resolved);
}

function toRobotListItem(robot: Robot): RobotListItem {
  const simulator = getFleetSimulator();
  const telemetry = simulator.getTelemetry(robot.id) ?? null;
  const events = openEvents().filter((event) => event.robotId === robot.id);
  const today = startOfToday();
  return {
    ...robot,
    overallStatus: resolveRobotHealth(telemetry, events),
    state: telemetry?.state ?? ("OFFLINE" as RobotListItem["state"]),
    battery: telemetry?.battery ?? null,
    floorId: telemetry?.floorId ?? null,
    todayMissionCount: simulator
      .getMissions()
      .filter(
        (mission) =>
          mission.robotId === robot.id &&
          mission.status === MissionStatus.Completed &&
          (mission.finishedAt ?? 0) >= today,
      ).length,
    odometerKm: Math.round((telemetry?.odometer ?? 0) / 100) / 10,
    openEventCount: events.length,
  };
}

// ---------------------------------------------------------------------------
// 목록 공통
// ---------------------------------------------------------------------------

function paginate<T>(items: T[], params: URLSearchParams) {
  const sort = params.get("sort");
  const order = params.get("order") === "asc" ? 1 : -1;
  const sorted = sort
    ? [...items].sort((left, right) => {
        const leftValue = (left as any)[sort];
        const rightValue = (right as any)[sort];
        if (leftValue === rightValue) return 0;
        if (leftValue === null || leftValue === undefined) return 1;
        if (rightValue === null || rightValue === undefined) return -1;
        return leftValue > rightValue ? order : -order;
      })
    : items;
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = Math.max(1, Number(params.get("pageSize") ?? 20));
  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize),
    count: sorted.length,
  };
}

const includes = (value: string | null | undefined, query: string) =>
  (value ?? "").toLowerCase().includes(query.toLowerCase());

// ---------------------------------------------------------------------------
// 라우트
// ---------------------------------------------------------------------------

type Handler = (context: {
  request: Request;
  params: Record<string, string>;
  query: URLSearchParams;
  body: any;
}) => unknown | Promise<unknown>;

const routes: { method: string; path: string; handler: Handler }[] = [];

function route(method: string, path: string, handler: Handler) {
  routes.push({ method, path, handler });
}

// auth ---------------------------------------------------------------------

route("POST", "/api/auth/login", ({ body }) => {
  const user = db.users.find(
    (item) =>
      item.username === body?.username && item.password === body?.password,
  );
  if (!user) {
    throw new HttpError(401, "아이디 또는 비밀번호가 올바르지 않습니다.");
  }
  user.lastLoginAt = Date.now();
  persist();
  writeSession(user.id, Boolean(body?.remember));
  return issueToken(user);
});

route("POST", "/api/auth/renew", () => {
  const userId = readSession();
  const user = db.users.find((item) => item.id === userId);
  if (!user) throw new HttpError(401, "세션이 만료되었습니다.");
  return issueToken(user);
});

route("POST", "/api/auth/logout", () => {
  writeSession(null);
  return { result: true };
});

// me -----------------------------------------------------------------------

route("GET", "/api/user/me", ({ request }) => toUserInfo(currentUser(request)));

route("PUT", "/api/user/me", ({ request, body }) => {
  const user = currentUser(request);
  requireResource(user, Resource.PersonalEditResource);
  Object.assign(user, {
    name: body.name ?? user.name,
    email: body.email ?? null,
    contact: body.contact ?? null,
    jobPosition: body.jobPosition ?? null,
  });
  persist();
  return toUserInfo(user);
});

route("PUT", "/api/user/me/password", ({ request, body }) => {
  const user = currentUser(request);
  requireResource(user, Resource.PasswordChangeResource);
  if (body.currentPassword !== user.password) {
    throw new HttpError(400, "현재 비밀번호가 맞지 않습니다.");
  }
  user.password = body.newPassword;
  persist();
  return { result: true };
});

// site ---------------------------------------------------------------------

route("GET", "/api/site", ({ request }) => {
  currentUser(request);
  return SITE_MAP;
});

// robots -------------------------------------------------------------------

route("GET", "/api/robots", ({ request, query }) => {
  requireResource(currentUser(request), Resource.RobotListResource);
  const text = query.get("query") ?? "";
  const type = query.get("type");
  const status = query.get("status");
  const floorId = query.get("floorId");
  const items = db.robots
    .map(toRobotListItem)
    .filter(
      (robot) =>
        (!text ||
          includes(robot.name, text) ||
          includes(robot.serialNo, text) ||
          includes(robot.model, text)) &&
        (!type || robot.type === type) &&
        (!status || robot.overallStatus === status) &&
        (!floorId || robot.floorId === Number(floorId)),
    );
  return paginate(items, query);
});

route("GET", "/api/robots/:id", ({ request, params }) => {
  requireResource(currentUser(request), Resource.RobotViewResource);
  const robot = db.robots.find((item) => item.id === Number(params.id));
  if (!robot) throw new HttpError(404, "로봇을 찾을 수 없습니다.");
  return toRobotListItem(robot);
});

route("GET", "/api/robots/:id/chat", ({ request, params, query }) => {
  const user = currentUser(request);
  requireResource(user, Resource.AIChatAskResource);
  const robotId = Number(params.id);
  if (!db.robots.some((robot) => robot.id === robotId)) {
    throw new HttpError(404, "로봇을 찾을 수 없습니다.");
  }
  const beforeIdParam = query.get("beforeId");
  const beforeId =
    beforeIdParam === null ? null : Number.parseInt(beforeIdParam, 10);
  if (
    beforeIdParam !== null &&
    (beforeId === null || !Number.isSafeInteger(beforeId) || beforeId <= 0)
  ) {
    throw new HttpError(400, "대화 기록 커서가 올바르지 않습니다.");
  }
  const allMessages =
    db.robotChatHistories.find((item) => item.robotId === robotId)?.messages ??
    [];
  const eligibleMessages =
    beforeId === null
      ? allMessages
      : allMessages.filter((message) => message.id < beforeId);
  const messages = eligibleMessages.slice(-15);
  return {
    messages,
    hasMore: eligibleMessages.length > messages.length,
  };
});

route("POST", "/api/robots/:id/chat", async ({ request, params, body }) => {
  const user = currentUser(request);
  requireResource(user, Resource.AIChatAskResource);
  const robotId = Number(params.id);
  if (!db.robots.some((robot) => robot.id === robotId)) {
    throw new HttpError(404, "로봇을 찾을 수 없습니다.");
  }
  const question =
    typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) throw new HttpError(400, "질문을 입력해 주세요.");

  await delay(500 + Math.random() * 700);
  const history = db.robotChatHistories.find(
    (item) => item.robotId === robotId,
  ) ?? {
    robotId,
    messages: [],
  };
  if (!db.robotChatHistories.includes(history)) {
    db.robotChatHistories.push(history);
  }

  const userMessage = {
    id: nextId(history.messages),
    role: "user" as const,
    text: question,
    createdAt: Date.now(),
    userId: user.id,
    userName: user.name,
  };
  const answerText = answer(robotId, question);
  const assistantMessage = {
    id: nextId([...history.messages, userMessage]),
    role: "assistant" as const,
    text: answerText,
    createdAt: Date.now(),
  };
  history.messages.push(userMessage, assistantMessage);
  persist();
  return { answer: answerText, messages: [userMessage, assistantMessage] };
});

function validateRobot(body: Partial<RobotFormData>, id?: number) {
  if (!body.name?.trim())
    throw new HttpError(400, "로봇 이름을 입력해 주세요.");
  if (db.robots.some((robot) => robot.name === body.name && robot.id !== id)) {
    throw new HttpError(409, "같은 이름의 로봇이 이미 있습니다.");
  }
  if (!Object.values(RobotType).includes(body.type as RobotType)) {
    throw new HttpError(400, "로봇 종류를 선택해 주세요.");
  }
  if (!SITE_MAP.docks.some((dock) => dock.id === body.dockId)) {
    throw new HttpError(400, "충전 스테이션을 선택해 주세요.");
  }
}

route("POST", "/api/robots", ({ request, body }) => {
  requireResource(currentUser(request), Resource.RobotAddResource);
  validateRobot(body);
  const dock = SITE_MAP.docks.find((item) => item.id === body.dockId);
  const robot: Robot = {
    ...body,
    id: nextId(db.robots),
    homeFloorId: dock?.floorId ?? body.homeFloorId,
    createdAt: Date.now(),
  };
  db.robots.push(robot);
  persist();
  getFleetSimulator().addRobot(robot);
  return toRobotListItem(robot);
});

route("PUT", "/api/robots/:id", ({ request, params, body }) => {
  requireResource(currentUser(request), Resource.RobotEditResource);
  const robot = db.robots.find((item) => item.id === Number(params.id));
  if (!robot) throw new HttpError(404, "로봇을 찾을 수 없습니다.");
  validateRobot(body, robot.id);
  const dock = SITE_MAP.docks.find((item) => item.id === body.dockId);
  Object.assign(robot, body, {
    id: robot.id,
    createdAt: robot.createdAt,
    homeFloorId: dock?.floorId ?? robot.homeFloorId,
  });
  persist();
  getFleetSimulator().updateRobot(robot);
  return toRobotListItem(robot);
});

route("DELETE", "/api/robots/:id", ({ request, params }) => {
  requireResource(currentUser(request), Resource.RobotDeleteResource);
  const ids = params.id.split(",").map(Number);
  for (const id of ids) {
    const index = db.robots.findIndex((item) => item.id === id);
    if (index === -1) continue;
    db.robots.splice(index, 1);
    db.robotChatHistories = db.robotChatHistories.filter(
      (history) => history.robotId !== id,
    );
    getFleetSimulator().removeRobot(id);
  }
  persist();
  return { result: true };
});

route("POST", "/api/robots/:id/command", ({ request, params, body }) => {
  requireResource(currentUser(request), Resource.RobotCommandResource);
  if (!Object.values(RobotCommand).includes(body?.command)) {
    throw new HttpError(400, "알 수 없는 명령입니다.");
  }
  try {
    getFleetSimulator().sendCommand(Number(params.id), body.command);
  } catch (error) {
    throw new HttpError(409, (error as Error).message);
  }
  return { result: true };
});

route("GET", "/api/robots/:id/missions", ({ request, params, query }) => {
  requireResource(currentUser(request), Resource.MissionListResource);
  const robotId = Number(params.id);
  const simulator = getFleetSimulator();
  const items = [
    ...simulator.getActiveMissions(),
    ...simulator.getMissions(),
  ].filter((mission) => mission.robotId === robotId);
  return paginate(
    items,
    new URLSearchParams({
      sort: "createdAt",
      order: "desc",
      pageSize: query.get("pageSize") ?? "20",
      page: query.get("page") ?? "1",
    }),
  );
});

// events -------------------------------------------------------------------

route("GET", "/api/events", ({ request, query }) => {
  requireResource(currentUser(request), Resource.EventListResource);
  const text = query.get("query") ?? "";
  const robotId = query.get("robotId");
  const types = query.getAll("type");
  const severities = query.getAll("severity");
  const statuses = query.getAll("status");
  const from = Number(query.get("from") ?? 0);
  const to = Number(query.get("to") ?? Infinity);
  const all = getFleetSimulator().getEvents();
  const items = all.filter(
    (event) =>
      (!text ||
        includes(event.robotName, text) ||
        includes(event.message, text) ||
        includes(event.note, text)) &&
      (!robotId || event.robotId === Number(robotId)) &&
      (types.length === 0 || types.includes(event.type)) &&
      (severities.length === 0 || severities.includes(event.severity)) &&
      (statuses.length === 0 || statuses.includes(event.status)) &&
      event.occurredAt >= from &&
      event.occurredAt <= to,
  );
  return {
    ...paginate(items, query),
    summary: {
      open: all.filter((event) => event.status === EventStatus.Open).length,
      critical: all.filter(
        (event) =>
          event.status !== EventStatus.Resolved &&
          event.severity === EventSeverity.Critical,
      ).length,
    },
  };
});

route("GET", "/api/events/:id", ({ request, params }) => {
  requireResource(currentUser(request), Resource.EventViewResource);
  const event = getFleetSimulator().getEvent(Number(params.id));
  if (!event) throw new HttpError(404, "이벤트를 찾을 수 없습니다.");
  return event;
});

route("PATCH", "/api/events/:id", ({ request, params, body }) => {
  requireResource(currentUser(request), Resource.EventUpdateResource);
  const patch: Partial<Pick<RobotEvent, "status" | "note">> = {};
  if (body.status !== undefined) {
    if (!Object.values(EventStatus).includes(body.status)) {
      throw new HttpError(400, "알 수 없는 처리 상태입니다.");
    }
    patch.status = body.status;
  }
  if (body.note !== undefined) patch.note = body.note || null;
  try {
    return getFleetSimulator().updateEvent(Number(params.id), patch);
  } catch (error) {
    throw new HttpError(404, (error as Error).message);
  }
});

// dashboard ----------------------------------------------------------------

route("GET", "/api/dashboard/summary", ({ request }) => {
  requireResource(currentUser(request), Resource.DashboardSummaryResource);
  const simulator = getFleetSimulator();
  const today = startOfToday();
  const events = simulator
    .getEvents()
    .filter((event) => event.occurredAt >= today);
  const missions = simulator
    .getMissions()
    .filter((mission) => (mission.finishedAt ?? 0) >= today);
  return {
    todayEventCount: events.length,
    todayCriticalCount: events.filter(
      (event) => event.severity === EventSeverity.Critical,
    ).length,
    todayMissionCount: missions.filter(
      (mission) => mission.status === MissionStatus.Completed,
    ).length,
    todayFailedMissionCount: missions.filter(
      (mission) => mission.status === MissionStatus.Failed,
    ).length,
    openEventCount: openEvents().length,
    eventTypeCounts: Object.values(EventType).map((type) => ({
      type,
      count: events.filter((event) => event.type === type).length,
    })),
  };
});

// users --------------------------------------------------------------------

route("GET", "/api/users", ({ request, query }) => {
  requireResource(currentUser(request), Resource.UserListResource);
  const text = query.get("query") ?? "";
  const roleId = query.get("roleId");
  const items = db.users
    .filter(
      (user) =>
        (!text ||
          includes(user.name, text) ||
          includes(user.username, text) ||
          includes(user.email, text)) &&
        (!roleId || user.roleId === Number(roleId)),
    )
    .map(toUserListItem);
  return paginate(items, query);
});

route("GET", "/api/users/check-username", ({ request, query }) => {
  currentUser(request);
  const username = query.get("username") ?? "";
  return { available: !db.users.some((user) => user.username === username) };
});

route("GET", "/api/users/:id", ({ request, params }) => {
  requireResource(currentUser(request), Resource.UserViewResource);
  const user = db.users.find((item) => item.id === Number(params.id));
  if (!user) throw new HttpError(404, "사용자를 찾을 수 없습니다.");
  return toUserListItem(user);
});

function validateUser(body: Partial<UserFormData>, id?: number) {
  if (!body.username?.trim())
    throw new HttpError(400, "아이디를 입력해 주세요.");
  if (
    db.users.some((user) => user.username === body.username && user.id !== id)
  ) {
    throw new HttpError(409, "이미 쓰고 있는 아이디입니다.");
  }
  if (!body.name?.trim()) throw new HttpError(400, "이름을 입력해 주세요.");
  if (!db.roles.some((role) => role.id === body.roleId)) {
    throw new HttpError(400, "권한을 선택해 주세요.");
  }
}

route("POST", "/api/users", ({ request, body }) => {
  requireResource(currentUser(request), Resource.UserAddResource);
  validateUser(body);
  if (!body.password || body.password.length < 8) {
    throw new HttpError(400, "비밀번호는 8자 이상이어야 합니다.");
  }
  const user: MockUser = {
    id: nextId(db.users),
    username: body.username,
    password: body.password,
    name: body.name,
    email: body.email ?? null,
    contact: body.contact ?? null,
    jobPosition: body.jobPosition ?? null,
    roleId: body.roleId,
    lastLoginAt: null,
    createdAt: Date.now(),
  };
  db.users.push(user);
  persist();
  return toUserListItem(user);
});

route("PUT", "/api/users/:id", ({ request, params, body }) => {
  const me = currentUser(request);
  requireResource(me, Resource.UserEditResource);
  const user = db.users.find((item) => item.id === Number(params.id));
  if (!user) throw new HttpError(404, "사용자를 찾을 수 없습니다.");
  validateUser(body, user.id);
  if (user.id === me.id && body.roleId !== user.roleId) {
    throw new HttpError(400, "내 권한은 직접 바꿀 수 없습니다.");
  }
  Object.assign(user, {
    username: body.username,
    name: body.name,
    email: body.email ?? null,
    contact: body.contact ?? null,
    jobPosition: body.jobPosition ?? null,
    roleId: body.roleId,
  });
  persist();
  return toUserListItem(user);
});

route("DELETE", "/api/users/:id", ({ request, params }) => {
  const me = currentUser(request);
  requireResource(me, Resource.UserDeleteResource);
  const ids = params.id.split(",").map(Number);
  if (ids.includes(me.id))
    throw new HttpError(400, "내 계정은 삭제할 수 없습니다.");
  db.users = db.users.filter((user) => !ids.includes(user.id));
  persist();
  return { result: true };
});

// roles --------------------------------------------------------------------

route("GET", "/api/roles", ({ request, query }) => {
  requireResource(currentUser(request), Resource.RoleListResource);
  return paginate(
    db.roles.map(toRole),
    new URLSearchParams({
      pageSize: query.get("pageSize") ?? "100",
      sort: "id",
      order: "asc",
    }),
  );
});

route("GET", "/api/roles/:id", ({ request, params }) => {
  requireResource(currentUser(request), Resource.RoleListResource);
  const role = db.roles.find((item) => item.id === Number(params.id));
  if (!role) throw new HttpError(404, "권한을 찾을 수 없습니다.");
  return toRole(role);
});

function sanitizeRole(body: Partial<RoleFormData>, id?: number) {
  const name = body.name?.trim();
  if (!name) throw new HttpError(400, "권한 이름을 입력해 주세요.");
  if (db.roles.some((role) => role.name === name && role.id !== id)) {
    throw new HttpError(409, "같은 이름의 권한이 이미 있습니다.");
  }
  const pages = (body.pages ?? []).filter((page) =>
    Object.values(Page).includes(page),
  );
  const resources = (body.resources ?? []).filter((resource) =>
    Object.values(Resource).includes(resource),
  );
  return { name, description: body.description ?? null, pages, resources };
}

route("POST", "/api/roles", ({ request, body }) => {
  requireResource(currentUser(request), Resource.RoleAddResource);
  const role = {
    id: nextId(db.roles),
    isSystem: false,
    createdAt: Date.now(),
    ...sanitizeRole(body),
  };
  db.roles.push(role);
  persist();
  return toRole(role);
});

route("PUT", "/api/roles/:id", ({ request, params, body }) => {
  requireResource(currentUser(request), Resource.RoleEditResource);
  const role = db.roles.find((item) => item.id === Number(params.id));
  if (!role) throw new HttpError(404, "권한을 찾을 수 없습니다.");
  const next = sanitizeRole(body, role.id);
  if (role.isSystem) {
    // 관리자 권한은 이름·설명만 바꿀 수 있습니다
    Object.assign(role, { name: next.name, description: next.description });
  } else {
    Object.assign(role, next);
  }
  persist();
  return toRole(role);
});

route("DELETE", "/api/roles/:id", ({ request, params }) => {
  requireResource(currentUser(request), Resource.RoleDeleteResource);
  const role = db.roles.find((item) => item.id === Number(params.id));
  if (!role) throw new HttpError(404, "권한을 찾을 수 없습니다.");
  if (role.isSystem)
    throw new HttpError(400, "관리자 권한은 삭제할 수 없습니다.");
  if (db.users.some((user) => user.roleId === role.id)) {
    throw new HttpError(
      400,
      "이 권한을 쓰는 사용자가 있어 삭제할 수 없습니다.",
    );
  }
  db.roles = db.roles.filter((item) => item.id !== role.id);
  persist();
  return { result: true };
});

// ---------------------------------------------------------------------------
// MSW 핸들러
// ---------------------------------------------------------------------------

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/**
 * 위에서 등록한 라우트를 MSW 핸들러로 바꿉니다.
 * 경로 앞의 `*` 는 어느 origin 이든 받겠다는 뜻이라, 브라우저(같은 origin)와
 * 테스트(`http://localhost`)에서 같은 핸들러를 씁니다.
 */
export const handlers = [
  ...routes.map(({ method, path, handler }) =>
    http[method.toLowerCase() as HttpMethod](
      `*${path}`,
      async ({ request, params }) => {
        // 실제 네트워크처럼 약간 기다립니다 (브라우저에서만 기다리고 Node 에서는 거의 즉시)
        await networkDelay();
        const url = new URL(request.url);
        try {
          let body: any = undefined;
          if (method !== "GET" && method !== "HEAD") {
            const text = await request.text();
            body = text ? JSON.parse(text) : {};
          }
          const result = await handler({
            request,
            params: params as Record<string, string>,
            query: url.searchParams,
            body,
          });
          return json(result);
        } catch (error) {
          if (error instanceof HttpError) return errorResponse(error);
          // eslint-disable-next-line no-console
          console.error("[mock]", method, url.pathname, error);
          return json(
            {
              statusCode: 500,
              error: "Internal Server Error",
              message: String(error),
            },
            500,
          );
        }
      },
    ),
  ),
  // 목에 없는 /api 경로는 404
  http.all("*/api/*", ({ request }) =>
    errorResponse(
      new HttpError(
        404,
        `${request.method} ${new URL(request.url).pathname} 는 목 서버에 없습니다.`,
      ),
    ),
  ),
];
