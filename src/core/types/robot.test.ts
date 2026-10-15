import { describe, expect, it } from "vitest";
import {
  EventSeverity,
  RobotHealth,
  RobotState,
  resolveRobotHealth,
} from "./robot";

const base = {
  online: true,
  state: RobotState.Moving,
  battery: 80,
  motorTemp: 40,
};

describe("resolveRobotHealth", () => {
  it("실시간 값이 없거나 통신이 끊기면 오프라인", () => {
    expect(resolveRobotHealth(null)).toBe(RobotHealth.Offline);
    expect(resolveRobotHealth({ ...base, online: false })).toBe(
      RobotHealth.Offline,
    );
  });

  it("비상 정지·오류·배터리 10% 이하는 위험", () => {
    expect(
      resolveRobotHealth({ ...base, state: RobotState.EmergencyStop }),
    ).toBe(RobotHealth.Danger);
    expect(resolveRobotHealth({ ...base, battery: 9 })).toBe(
      RobotHealth.Danger,
    );
  });

  it("배터리 20% 이하·모터 70°C 이상·주의 이벤트는 주의", () => {
    expect(resolveRobotHealth({ ...base, battery: 18 })).toBe(
      RobotHealth.Warning,
    );
    expect(resolveRobotHealth({ ...base, motorTemp: 72 })).toBe(
      RobotHealth.Warning,
    );
    expect(
      resolveRobotHealth(base, [{ severity: EventSeverity.Warning }]),
    ).toBe(RobotHealth.Warning);
  });

  it("위험 이벤트가 열려 있으면 값이 정상이어도 위험", () => {
    expect(
      resolveRobotHealth(base, [{ severity: EventSeverity.Critical }]),
    ).toBe(RobotHealth.Danger);
  });

  it("그 밖에는 정상", () => {
    expect(resolveRobotHealth(base)).toBe(RobotHealth.Normal);
  });
});
