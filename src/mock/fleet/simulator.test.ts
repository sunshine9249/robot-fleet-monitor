import { describe, expect, it } from "vitest";
import {
  EventStatus,
  EventType,
  RobotCommand,
  RobotState,
} from "core/types/robot";
import { SITE_MAP } from "../site";
import { SEED_ROBOTS } from "../robots";
import { FleetSimulator } from "./simulator";

describe("FleetSimulator", () => {
  const simulator = new FleetSimulator(SITE_MAP, SEED_ROBOTS);

  it("모든 로봇의 실시간 값을 만듭니다", () => {
    expect(simulator.getFleet().size).toBe(SEED_ROBOTS.length);
    for (const telemetry of simulator.getFleet().values()) {
      expect(telemetry.battery).toBeGreaterThanOrEqual(0);
      expect(telemetry.battery).toBeLessThanOrEqual(100);
    }
  });

  it("DLV-04 는 통신이 끊긴 채로 시작하고 이벤트가 열려 있습니다", () => {
    const robot = SEED_ROBOTS.find((item) => item.name === "DLV-04");
    const telemetry = simulator.getTelemetry(robot?.id ?? 0);
    expect(telemetry?.online).toBe(false);
    expect(telemetry?.state).toBe(RobotState.Offline);
    const open = simulator
      .getEvents()
      .filter(
        (event) =>
          event.robotId === robot?.id &&
          event.type === EventType.CommunicationLost &&
          event.status === EventStatus.Open,
      );
    expect(open.length).toBe(1);
  });

  it("미리 돌리는 동안 임무와 이력이 쌓입니다", () => {
    expect(simulator.getMissions().length).toBeGreaterThan(10);
    expect(simulator.getHistory(SEED_ROBOTS[0].id).length).toBeGreaterThan(100);
  });

  it("통신이 끊긴 로봇에는 명령을 보낼 수 없습니다", () => {
    const robot = SEED_ROBOTS.find((item) => item.name === "DLV-04");
    expect(() =>
      simulator.sendCommand(robot?.id ?? 0, RobotCommand.Hold),
    ).toThrow();
  });

  it("원격 정지 후 재개하면 하던 상태로 돌아갑니다", () => {
    const target = [...simulator.getFleet().values()].find(
      (telemetry) =>
        telemetry.online &&
        telemetry.state !== RobotState.RidingElevator &&
        telemetry.state !== RobotState.Held &&
        telemetry.state !== RobotState.EmergencyStop &&
        telemetry.state !== RobotState.Error,
    );
    expect(target).toBeDefined();
    if (!target) return;
    const before = target.state;
    simulator.sendCommand(target.robotId, RobotCommand.Hold);
    expect(simulator.getTelemetry(target.robotId)?.state).toBe(RobotState.Held);
    simulator.sendCommand(target.robotId, RobotCommand.Resume);
    expect(simulator.getTelemetry(target.robotId)?.state).toBe(before);
  });
});
