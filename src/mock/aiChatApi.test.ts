import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { setupServer } from "msw/node";
import { db } from "./db";
import { handlers } from "./handlers";

vi.mock("./fleet", () => ({
  getFleetSimulator: () => ({
    getEvents: () => [],
    getTelemetry: (robotId: number) => ({
      robotId,
      state: "IDLE",
      battery: 82,
      charging: false,
      motorTemp: 36,
      rssi: -55,
      online: true,
      floorId: 1,
    }),
    getActiveMissions: () => [],
  }),
}));

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

async function login(username: string, password: string) {
  const response = await fetch("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = (await response.json()) as { accessToken: string };
  return data.accessToken;
}

async function requestChat(
  token: string,
  robotId: number,
  method = "GET",
  question?: string,
  beforeId?: string,
) {
  const response = await fetch(
    `http://localhost/api/robots/${robotId}/chat${
      beforeId === undefined ? "" : `?beforeId=${beforeId}`
    }`,
    {
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(question === undefined ? {} : { body: JSON.stringify({ question }) }),
    },
  );
  return {
    status: response.status,
    data: (await response.json()) as {
      answer?: string;
      hasMore?: boolean;
      messages?: {
        role: string;
        text: string;
        userId?: number;
        userName?: string;
      }[];
    },
  };
}

const server = setupServer(...handlers);

describe("robot AI chat API", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());

  beforeEach(() => {
    db.robotChatHistories = [];
    vi.stubGlobal("localStorage", createStorage());
    vi.stubGlobal("sessionStorage", createStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shares each robot history across users and keeps robot histories separate", async () => {
    const adminToken = await login("admin", "admin1234");
    const operatorToken = await login("operator", "operator1234");

    const posted = await requestChat(
      adminToken,
      1,
      "POST",
      "현재 상태를 진단해줘",
    );
    expect(posted.status).toBe(200);
    expect(posted.data.messages).toHaveLength(2);
    expect(posted.data.messages?.[0]).toMatchObject({
      role: "user",
      userId: 1,
      userName: "김관리",
    });
    expect(posted.data.messages?.[1]).toMatchObject({ role: "assistant" });
    expect(posted.data.messages?.[1]).not.toHaveProperty("userId");

    expect((await requestChat(adminToken, 1)).data.messages).toHaveLength(2);
    expect((await requestChat(adminToken, 2)).data.messages).toHaveLength(0);
    expect((await requestChat(operatorToken, 1)).data.messages).toHaveLength(2);
  });

  it("returns the latest 15 messages and pages older messages by cursor", async () => {
    const token = await login("admin", "admin1234");
    db.robotChatHistories = [
      {
        robotId: 1,
        messages: Array.from({ length: 35 }, (_, index) => ({
          id: index + 1,
          role: index % 2 === 0 ? "user" : "assistant",
          text: `message-${index + 1}`,
          createdAt: index + 1,
          ...(index % 2 === 0 ? { userId: 1, userName: "김관리" } : {}),
        })) as (typeof db.robotChatHistories)[number]["messages"],
      },
    ];

    const latest = await requestChat(token, 1);
    expect(latest.data.messages?.map(({ text }) => text)).toEqual(
      Array.from({ length: 15 }, (_, index) => `message-${index + 21}`),
    );
    expect(latest.data.hasMore).toBe(true);

    const previous = await requestChat(token, 1, "GET", undefined, "21");
    expect(previous.data.messages?.map(({ text }) => text)).toEqual(
      Array.from({ length: 15 }, (_, index) => `message-${index + 6}`),
    );
    expect(previous.data.hasMore).toBe(true);

    const oldest = await requestChat(token, 1, "GET", undefined, "6");
    expect(oldest.data.messages?.map(({ text }) => text)).toEqual(
      Array.from({ length: 5 }, (_, index) => `message-${index + 1}`),
    );
    expect(oldest.data.hasMore).toBe(false);
  });

  it("rejects blank questions and unknown robot IDs", async () => {
    const token = await login("admin", "admin1234");

    expect((await requestChat(token, 1, "POST", "  ")).status).toBe(400);
    expect((await requestChat(token, -1)).status).toBe(404);
    expect(
      (await requestChat(token, 1, "GET", undefined, "invalid")).status,
    ).toBe(400);
  });
});
