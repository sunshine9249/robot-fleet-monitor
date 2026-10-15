import { describe, expect, it, vi } from "vitest";
import { SEED_ROBOTS } from "./robots";
import { answer } from "./assistant";

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

describe("robot AI chat mock", () => {
  const firstRobot = SEED_ROBOTS[0];

  it("keeps fleet-wide questions scoped to the selected robot", () => {
    const response = answer(firstRobot.id, "오늘 플릿 전체 요약을 알려줘");

    expect(response).toContain(firstRobot.name);
    expect(response).not.toContain("DLV-02");
  });

  it("does not disclose another robot when it is named in a question", () => {
    const response = answer(firstRobot.id, "DLV-02 상태 알려줘");

    expect(response).toContain(`${firstRobot.name} 전용`);
    expect(response).not.toContain("DLV-02");
  });

  it("returns a not-found response for an unknown robot", () => {
    expect(answer(-1, "현재 상태")).toBe("로봇을 찾을 수 없습니다.");
  });
});
