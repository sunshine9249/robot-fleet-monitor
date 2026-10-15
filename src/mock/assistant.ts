import {
  EventStatus,
  EventTypeLabel,
  MissionTypeLabel,
  RobotHealthLabel,
  RobotStateLabel,
  RobotTypeLabel,
  resolveRobotHealth,
} from "core/types/robot";
import { db } from "./db";
import { getFleetSimulator } from "./fleet";
import { SITE_MAP } from "./site";

const floorName = (floorId: number) =>
  SITE_MAP.floors.find((floor) => floor.id === floorId)?.name ?? "-";

function robotRows() {
  const simulator = getFleetSimulator();
  const openEvents = simulator
    .getEvents()
    .filter((event) => event.status !== EventStatus.Resolved);
  return db.robots.map((robot) => {
    const telemetry = simulator.getTelemetry(robot.id) ?? null;
    const events = openEvents.filter((event) => event.robotId === robot.id);
    const mission = simulator
      .getActiveMissions()
      .find((item) => item.robotId === robot.id);
    return {
      robot,
      telemetry,
      events,
      mission,
      health: resolveRobotHealth(telemetry, events),
    };
  });
}

function describeRobot(robotId: number) {
  const row = robotRows().find((item) => item.robot.id === robotId);
  if (!row) return "로봇을 찾을 수 없습니다.";
  const { robot, telemetry, events, mission, health } = row;
  if (!telemetry) return `${robot.name}은(는) 아직 실시간 값이 없습니다.`;

  const lines = [
    `${robot.name} (${RobotTypeLabel[robot.type]} 로봇) — ${RobotHealthLabel[health]}`,
    `• 상태: ${RobotStateLabel[telemetry.state]} · ${floorName(telemetry.floorId)}`,
    `• 배터리 ${telemetry.battery.toFixed(0)}%${telemetry.charging ? " (충전 중)" : ""} · 모터 ${telemetry.motorTemp.toFixed(1)}°C · Wi-Fi ${telemetry.rssi} dBm`,
  ];
  if (mission) {
    lines.push(
      `• 임무: ${MissionTypeLabel[mission.type]} ${mission.origin} → ${mission.destination} (${Math.round(mission.progress * 100)}%)`,
    );
  }
  if (events.length) {
    lines.push(
      `• 미해결 이벤트 ${events.length}건: ${events
        .slice(-3)
        .map((event) => EventTypeLabel[event.type])
        .join(", ")}`,
    );
  }
  if (!telemetry.online) {
    lines.push(
      "",
      "통신이 끊겨 마지막으로 받은 값입니다. 마지막 위치 주변 Wi-Fi AP 상태를 먼저 확인하고, 로봇 전원이 켜져 있는지 현장에서 확인해 주세요.",
    );
  }
  return lines.join("\n");
}

const GUIDES: [RegExp, string][] = [
  [
    /비상\s*정지|e-?stop/i,
    [
      "비상 정지가 걸린 로봇은 이렇게 처리해 주세요.",
      "",
      "1. 실시간 모니터링에서 해당 로봇 카메라·위치로 주변에 사람이 없는지 먼저 봅니다.",
      "2. 현장 담당자가 로봇 상단의 비상정지 버튼을 돌려서 풀어 줍니다.",
      "3. 모니터링 화면의 [오류 해제]를 누르면 로봇이 충전 스테이션으로 돌아갑니다.",
      "4. 이벤트 이력에서 원인과 조치 내용을 남겨 주세요.",
    ].join("\n"),
  ],
  [
    /위치\s*(인식|상실|잃)|localization/i,
    [
      "위치 인식 실패는 보통 가구·가벽처럼 지도와 다른 물체가 생겼을 때 납니다.",
      "",
      "1. 로봇 주변에 새로 놓인 물건이 있는지 확인합니다.",
      "2. 로봇을 가까운 복도 교차점으로 옮긴 뒤 [오류 해제]를 누릅니다.",
      "3. 같은 자리에서 반복되면 그 구역 지도를 다시 만들어야 합니다.",
    ].join("\n"),
  ],
  [
    /엘리베이터/,
    "엘리베이터 대기가 길어지면 로봇은 계속 호출을 유지합니다. 점검·청소로 엘리베이터가 운행 중지된 시간이 있다면 그 시간대 다층 임무는 미뤄 두는 것이 좋습니다.",
  ],
];

export function answer(robotId: number, question: string): string {
  const row = robotRows().find((item) => item.robot.id === robotId);
  if (!row) return "로봇을 찾을 수 없습니다.";

  const text = question.trim();
  const namedRobot = text.match(/\b(DLV|GDE|CLN)-?\d{2}\b/i)?.[0];
  if (namedRobot) {
    const normalized = namedRobot.toUpperCase().replace(/^([A-Z]+)-?/, "$1-");
    if (normalized !== row.robot.name.toUpperCase()) {
      return `이 대화는 ${row.robot.name} 전용입니다. 다른 로봇의 대화는 해당 로봇을 선택해 주세요.`;
    }
  }

  if (/오늘|플릿|전체\s*로봇|다른\s*로봇/.test(text)) {
    return `이 대화는 ${row.robot.name} 전용입니다. 전체 플릿 요약 대신 이 로봇의 상태를 알려 드릴게요.\n\n${describeRobot(robotId)}`;
  }
  for (const [pattern, guide] of GUIDES) {
    if (pattern.test(text)) return guide;
  }

  const { telemetry, events, mission } = row;
  if (!telemetry) return `${row.robot.name}은(는) 아직 실시간 값이 없습니다.`;
  if (/배터리|충전/.test(text)) {
    return `${row.robot.name} 배터리는 ${telemetry.battery.toFixed(0)}%${telemetry.charging ? "이며 현재 충전 중" : ""}입니다.`;
  }
  if (/온도|모터|과열/.test(text)) {
    const status =
      telemetry.motorTemp >= 85
        ? "위험"
        : telemetry.motorTemp >= 70
          ? "주의"
          : "정상";
    return `${row.robot.name} 모터 온도는 ${telemetry.motorTemp.toFixed(1)}°C로 ${status} 상태입니다. 70°C 이상은 주의, 85°C 이상은 위험 기준입니다.`;
  }
  if (/어디|위치|층/.test(text)) {
    return `${row.robot.name}은(는) ${floorName(telemetry.floorId)}에 있으며 현재 ${RobotStateLabel[telemetry.state]} 상태입니다.`;
  }
  if (/임무|작업/.test(text)) {
    return mission
      ? `${row.robot.name}은(는) ${MissionTypeLabel[mission.type]} 임무를 수행 중입니다. ${mission.origin}에서 ${mission.destination} 방향으로 ${Math.round(mission.progress * 100)}% 진행했습니다.`
      : `${row.robot.name}은(는) 현재 진행 중인 임무가 없습니다.`;
  }
  if (/이벤트|오류|고장|문제|이상|진단|상태|위험|주의|확인/.test(text)) {
    return events.length
      ? `${describeRobot(robotId)}\n\n미해결 이벤트 ${events.length}건을 확인해 주세요.`
      : describeRobot(robotId);
  }

  return [
    `이 대화는 ${row.robot.name} 전용입니다. 현재 로봇의 상태를 바탕으로 답해 드릴게요.`,
    "",
    '예: "현재 상태를 진단해줘", "배터리와 모터 온도는 괜찮아?", "지금 어디에 있어?"',
    "",
    describeRobot(robotId),
  ].join("\n");
}
