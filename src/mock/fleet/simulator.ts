import {
  BATTERY_WARNING,
  EventSeverity,
  EventStatus,
  EventType,
  Mission,
  MissionStatus,
  MissionType,
  MOTOR_TEMP_WARNING,
  Robot,
  RobotCommand,
  RobotEvent,
  RobotState,
  RobotTelemetry,
  RobotType,
  SiteMap,
  TelemetrySample,
  WaypointKind,
} from "core/types/robot";
import { createRandom, Random } from "../random";
import { WaypointGraph } from "./graph";

// ---------------------------------------------------------------------------
// 설정
// ---------------------------------------------------------------------------

/** 실제 시간 대비 움직임 배속. 데모가 지루하지 않도록 조금 빠르게 돌립니다 */
const MOTION_SPEED = 2.5;
const TICK_MS = 250;
/** 화면을 처음 열었을 때 이미 이만큼 운영된 것처럼 미리 돌려 둡니다 */
const WARMUP_MS = 25 * 60 * 1000;
const HISTORY_INTERVAL_MS = 4000;
const HISTORY_LIMIT = 450; // 30분

const CRUISE_SPEED: Record<RobotType, number> = {
  [RobotType.Delivery]: 1.2,
  [RobotType.Guide]: 0.9,
  [RobotType.Cleaning]: 0.5,
};

/** 초당 발생 확률 (주행 중일 때) */
const HAZARD_RATE = {
  obstacle: 0.0006,
  collision: 0.00025,
  localization: 0.00003,
  emergencyStop: 0.00002,
};

const OPERATOR_NOTE: Record<EventType, string> = {
  [EventType.CollisionRisk]: "주변 상황 확인. 이상 없음.",
  [EventType.ObstacleBlocked]: "통로 적치물 정리 요청.",
  [EventType.LowBattery]: "충전 완료 확인.",
  [EventType.EmergencyStop]: "현장 확인 후 비상정지 해제.",
  [EventType.LocalizationLost]: "수동으로 위치 재지정 후 해제.",
  [EventType.MotorOverheat]: "냉각 후 재투입. 정기점검 때 구동부 확인 예정.",
  [EventType.CommunicationLost]: "AP 상태 확인.",
  [EventType.ElevatorTimeout]: "엘리베이터 관리실 공유.",
  [EventType.MissionFailed]: "요청자에게 재요청 안내.",
};

/** CLN-02 처럼 구동부에 문제가 있는 로봇. 주행할수록 모터가 더 뜨거워집니다 */
const WORN_MOTOR_ROBOT_NAMES = new Set(["CLN-02"]);
/** 처음부터 통신이 끊긴 로봇 */
const OFFLINE_ROBOT_NAMES = new Set(["DLV-04"]);

// ---------------------------------------------------------------------------
// 내부 상태
// ---------------------------------------------------------------------------

type Step =
  | { kind: "go"; target: string; working?: boolean }
  | { kind: "wait"; seconds: number; state: RobotState }
  | { kind: "completeMission" };

interface SimRobot {
  robot: Robot;
  telemetry: RobotTelemetry;
  /** 마지막으로 지난 경유점 */
  nodeId: string;
  steps: Step[];
  path: string[];
  waitRemaining: number;
  /** 일시 정지(장애물) 남은 시간 */
  pauseRemaining: number;
  pauseEventId: number | null;
  /** 원격 정지 전에 하던 상태 */
  heldFrom: RobotState | null;
  ride: { remaining: number; total: number; targetNode: string } | null;
  rideEventId: number | null;
  mission: Mission | null;
  missionStepTotal: number;
  nextMissionAt: number;
  lowBatteryReported: boolean;
  overheatReported: boolean;
  lastHistoryAt: number;
  history: TelemetrySample[];
}

export type FleetListener = (
  fleet: ReadonlyMap<number, RobotTelemetry>,
) => void;
export type RobotListener = (telemetry: RobotTelemetry) => void;
export type EventListener = (
  event: RobotEvent,
  change: "created" | "updated",
) => void;

const daysSince = (from: number, to: number) =>
  Math.max(0, (to - from) / (24 * 3600 * 1000));

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// ---------------------------------------------------------------------------
// 시뮬레이터
// ---------------------------------------------------------------------------

/**
 * 브라우저 안에서 도는 로봇 플릿 시뮬레이터.
 *
 * 실제 서비스라면 로봇이 서버로 올리는 값을 웹소켓으로 받겠지만, 이 데모는 서버
 * 없이 돌아야 하므로 같은 모양의 값을 여기서 만듭니다. 화면은 `TelemetrySource`
 * 인터페이스로만 접근하므로, 나중에 웹소켓 구현으로 바꿔 끼워도 화면 코드는
 * 그대로입니다.
 */
export class FleetSimulator {
  private readonly graph: WaypointGraph;
  private readonly random: Random;
  private readonly robots = new Map<number, SimRobot>();
  private readonly events: RobotEvent[] = [];
  private readonly missions: Mission[] = [];
  private nextEventId = 1;
  private nextMissionId = 1;
  private now: number;
  private timer: number | null = null;

  private snapshot: ReadonlyMap<number, RobotTelemetry> = new Map();
  private readonly fleetListeners = new Set<FleetListener>();
  private readonly robotListeners = new Map<number, Set<RobotListener>>();
  private readonly eventListeners = new Set<EventListener>();

  constructor(
    private readonly site: SiteMap,
    robots: Robot[],
    seed = 20261014,
  ) {
    this.graph = new WaypointGraph(site);
    this.random = createRandom(seed);
    this.now = Date.now() - WARMUP_MS;

    this.seedPastEvents(robots);
    robots.forEach((robot) => this.spawn(robot));

    // 미리 돌려 두기: 1초 간격으로 빠르게 진행
    const end = Date.now();
    while (this.now < end) {
      this.step(1000, Math.min(this.now + 1000, end));
      this.handleAsOperator(10 * 60 * 1000);
    }
    this.handleAsOperator(5 * 60 * 1000);
    this.publish();
  }

  // ---------------------------------------------------------------- 수명

  start() {
    if (this.timer !== null) return;
    let last = Date.now();
    this.timer = window.setInterval(() => {
      const current = Date.now();
      this.step(current - last, current);
      last = current;
      this.publish();
    }, TICK_MS);
  }

  stop() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  // ---------------------------------------------------------------- 조회

  getFleet() {
    return this.snapshot;
  }

  getTelemetry(robotId: number) {
    return this.snapshot.get(robotId);
  }

  getHistory(robotId: number): TelemetrySample[] {
    return this.robots.get(robotId)?.history ?? [];
  }

  getEvents(): RobotEvent[] {
    return this.events;
  }

  getEvent(id: number) {
    return this.events.find((event) => event.id === id);
  }

  getMissions(): Mission[] {
    return this.missions;
  }

  getMission(id: number) {
    return (
      this.missions.find((mission) => mission.id === id) ??
      [...this.robots.values()].find((sim) => sim.mission?.id === id)?.mission
    );
  }

  // ---------------------------------------------------------------- 구독

  subscribeFleet(listener: FleetListener) {
    this.fleetListeners.add(listener);
    return () => {
      this.fleetListeners.delete(listener);
    };
  }

  subscribeRobot(robotId: number, listener: RobotListener) {
    let listeners = this.robotListeners.get(robotId);
    if (!listeners) {
      listeners = new Set();
      this.robotListeners.set(robotId, listeners);
    }
    listeners.add(listener);
    return () => {
      listeners?.delete(listener);
    };
  }

  subscribeEvents(listener: EventListener) {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  // ---------------------------------------------------------------- 변경

  addRobot(robot: Robot) {
    this.spawn(robot);
    this.publish();
  }

  updateRobot(robot: Robot) {
    const sim = this.robots.get(robot.id);
    if (sim) sim.robot = robot;
  }

  removeRobot(robotId: number) {
    const sim = this.robots.get(robotId);
    if (sim?.mission) this.finishMission(sim, MissionStatus.Canceled);
    this.robots.delete(robotId);
    this.robotListeners.delete(robotId);
    this.publish();
  }

  updateEvent(
    id: number,
    patch: Partial<Pick<RobotEvent, "status" | "note">>,
  ): RobotEvent {
    const event = this.getEvent(id);
    if (!event) throw new Error("이벤트를 찾을 수 없습니다.");
    if (patch.note !== undefined) event.note = patch.note;
    if (patch.status && patch.status !== event.status) {
      event.status = patch.status;
      if (patch.status === EventStatus.Acknowledged) {
        event.acknowledgedAt = Date.now();
      }
      if (patch.status === EventStatus.Resolved) {
        event.acknowledgedAt ??= Date.now();
        event.resolvedAt = Date.now();
      }
    }
    this.emitEvent(event, "updated");
    return event;
  }

  sendCommand(robotId: number, command: RobotCommand) {
    const sim = this.robots.get(robotId);
    if (!sim) throw new Error("로봇을 찾을 수 없습니다.");
    const { telemetry } = sim;
    if (!telemetry.online) {
      throw new Error("통신이 끊긴 로봇에는 명령을 보낼 수 없습니다.");
    }

    switch (command) {
      case RobotCommand.Hold: {
        if (
          telemetry.state === RobotState.RidingElevator ||
          telemetry.state === RobotState.EmergencyStop ||
          telemetry.state === RobotState.Error ||
          telemetry.state === RobotState.Held
        ) {
          throw new Error("지금 상태에서는 원격 정지할 수 없습니다.");
        }
        sim.heldFrom = telemetry.state;
        telemetry.state = RobotState.Held;
        telemetry.speed = 0;
        break;
      }
      case RobotCommand.Resume: {
        if (telemetry.state === RobotState.Held) {
          telemetry.state = sim.heldFrom ?? RobotState.Idle;
          sim.heldFrom = null;
        } else if (telemetry.state === RobotState.Paused) {
          sim.pauseRemaining = 0;
        } else {
          throw new Error("정지 상태가 아닙니다.");
        }
        break;
      }
      case RobotCommand.ReturnToDock: {
        if (
          telemetry.state === RobotState.EmergencyStop ||
          telemetry.state === RobotState.Error
        ) {
          throw new Error("먼저 오류를 해제해야 합니다.");
        }
        if (telemetry.state === RobotState.RidingElevator) {
          throw new Error("엘리베이터에서 내린 뒤 다시 시도해 주세요.");
        }
        if (sim.mission) this.finishMission(sim, MissionStatus.Canceled);
        this.planReturn(sim);
        sim.heldFrom = null;
        sim.pauseRemaining = 0;
        telemetry.state = RobotState.Moving;
        break;
      }
      case RobotCommand.Reset: {
        if (
          telemetry.state !== RobotState.EmergencyStop &&
          telemetry.state !== RobotState.Error
        ) {
          throw new Error("해제할 오류가 없습니다.");
        }
        telemetry.state = RobotState.Idle;
        telemetry.eStop = false;
        telemetry.lidarOk = true;
        telemetry.errorCode = null;
        // 같은 로봇의 미확인 위험 이벤트는 확인 처리
        for (const event of this.events) {
          if (
            event.robotId === robotId &&
            event.status === EventStatus.Open &&
            event.severity === EventSeverity.Critical
          ) {
            this.updateEvent(event.id, { status: EventStatus.Acknowledged });
          }
        }
        this.planReturn(sim);
        break;
      }
    }
    this.publish();
  }

  // ---------------------------------------------------------------- 시뮬레이션

  /**
   * 미리 돌리는 동안에는 화면 앞에 운영자가 없으므로, 오래된 이벤트는 운영자가
   * 처리한 것으로 칩니다. 그렇지 않으면 화면을 여는 순간 멈춘 로봇만 가득합니다.
   */
  private handleAsOperator(olderThanMs: number) {
    for (const event of this.events) {
      if (event.status === EventStatus.Resolved) continue;
      if (this.now - event.occurredAt < olderThanMs) continue;
      if (event.type === EventType.CommunicationLost) continue;
      const sim = this.robots.get(event.robotId);
      if (
        sim &&
        (sim.telemetry.state === RobotState.EmergencyStop ||
          sim.telemetry.state === RobotState.Error)
      ) {
        this.sendCommand(sim.robot.id, RobotCommand.Reset);
      }
      event.status = EventStatus.Resolved;
      event.acknowledgedAt ??= event.occurredAt + 2 * 60 * 1000;
      event.resolvedAt = Math.min(this.now, event.occurredAt + 6 * 60 * 1000);
      event.note ??= OPERATOR_NOTE[event.type];
    }
  }

  private spawn(robot: Robot) {
    const dock = this.site.docks.find((item) => item.id === robot.dockId);
    const dockNode = dock
      ? this.graph.nodes.get(dock.waypointId)
      : this.graph.byKind(WaypointKind.Dock, robot.homeFloorId)[0];
    const startNode = dockNode ?? this.graph.nearest(robot.homeFloorId, -28, 0);

    const offline = OFFLINE_ROBOT_NAMES.has(robot.name);
    const lostNode = offline
      ? this.graph.nodes.get(`F${startNode.floorId}-C12`)
      : null;
    const node = lostNode ?? startNode;

    const sim: SimRobot = {
      robot,
      nodeId: node.id,
      steps: [],
      path: [],
      waitRemaining: 0,
      pauseRemaining: 0,
      pauseEventId: null,
      heldFrom: null,
      ride: null,
      rideEventId: null,
      mission: null,
      missionStepTotal: 0,
      nextMissionAt: this.now + this.random.range(5, 60) * 1000,
      lowBatteryReported: false,
      overheatReported: false,
      lastHistoryAt: 0,
      history: [],
      telemetry: {
        robotId: robot.id,
        timestamp: this.now,
        online: !offline,
        state: offline ? RobotState.Offline : RobotState.Charging,
        floorId: node.floorId,
        pose: {
          x: node.x,
          z: node.z + (offline ? 0.8 : 0),
          heading: Math.PI / 2,
        },
        battery: offline ? 41 : this.random.range(55, 98),
        charging: !offline,
        speed: 0,
        motorTemp: 31 + this.random.range(0, 3),
        cpuLoad: 15,
        rssi: -48,
        lidarOk: true,
        eStop: false,
        missionId: null,
        route: [],
        transit: null,
        errorCode: offline ? "NET-408" : null,
        odometer: daysSince(robot.createdAt, this.now) * 2800 + robot.id * 1300,
        uptime: daysSince(robot.createdAt, this.now) * 10 * 3600,
      },
    };
    this.robots.set(robot.id, sim);

    if (offline) {
      this.createEvent(sim, {
        type: EventType.CommunicationLost,
        severity: EventSeverity.Critical,
        message:
          "로봇과의 통신이 끊겼습니다. 마지막 위치를 확인하고 현장 점검이 필요합니다.",
        occurredAt: this.now - 8 * 60 * 1000,
      });
      sim.telemetry.timestamp = this.now - 8 * 60 * 1000;
    }
  }

  private step(dtMs: number, now: number) {
    this.now = now;
    const dt = (dtMs / 1000) * MOTION_SPEED;
    for (const sim of this.robots.values()) {
      if (!sim.telemetry.online) continue;
      this.stepRobot(sim, dt);
      this.updateVitals(sim, dt, dtMs / 1000);
      sim.telemetry.timestamp = now;
      if (now - sim.lastHistoryAt >= HISTORY_INTERVAL_MS) {
        sim.lastHistoryAt = now;
        sim.history.push({
          timestamp: now,
          battery: sim.telemetry.battery,
          speed: sim.telemetry.speed,
          motorTemp: sim.telemetry.motorTemp,
          cpuLoad: sim.telemetry.cpuLoad,
          rssi: sim.telemetry.rssi,
        });
        if (sim.history.length > HISTORY_LIMIT) sim.history.shift();
      }
    }
  }

  private stepRobot(sim: SimRobot, dt: number) {
    const { telemetry } = sim;

    switch (telemetry.state) {
      case RobotState.EmergencyStop:
      case RobotState.Error:
      case RobotState.Held:
        telemetry.speed = 0;
        return;
      case RobotState.Paused:
        telemetry.speed = 0;
        sim.pauseRemaining -= dt;
        if (sim.pauseRemaining <= 0) {
          telemetry.state = RobotState.Moving;
          if (sim.pauseEventId !== null) {
            this.autoResolve(
              sim.pauseEventId,
              "경로가 다시 열려 주행을 재개했습니다.",
            );
            sim.pauseEventId = null;
          }
        }
        return;
      case RobotState.RidingElevator:
        this.stepRide(sim, dt);
        return;
    }

    // 배터리가 바닥나기 전에 강제로 돌려보냅니다
    if (
      telemetry.battery <= 12 &&
      sim.mission &&
      sim.mission.type !== MissionType.Charge
    ) {
      this.finishMission(sim, MissionStatus.Canceled);
      this.planReturn(sim, true);
    }
    // 모터가 너무 뜨거우면 쉬게 합니다
    if (
      telemetry.motorTemp >= 80 &&
      sim.mission &&
      sim.mission.type !== MissionType.Charge
    ) {
      this.finishMission(sim, MissionStatus.Canceled);
      this.planReturn(sim, true);
    }

    if (sim.steps.length === 0) {
      this.idle(sim);
      return;
    }

    const current = sim.steps[0];
    if (current.kind === "completeMission") {
      sim.steps.shift();
      if (sim.mission) this.finishMission(sim, MissionStatus.Completed);
      return;
    }

    if (current.kind === "wait") {
      telemetry.state = current.state;
      telemetry.speed = 0;
      sim.waitRemaining -= dt;
      if (sim.waitRemaining <= 0) {
        sim.steps.shift();
        this.prepareStep(sim);
      }
      this.updateMissionProgress(sim);
      return;
    }

    // go
    if (sim.path.length === 0) {
      const path = this.graph.shortestPath(sim.nodeId, current.target);
      if (!path || path.length === 0) {
        sim.steps.shift();
        this.prepareStep(sim);
        return;
      }
      sim.path = path;
    }

    const nextId = sim.path[0];
    const edge = this.graph.edge(sim.nodeId, nextId);
    const nextNode = this.graph.nodes.get(nextId);
    if (!nextNode) {
      sim.path = [];
      return;
    }

    if (edge?.elevatorId !== undefined) {
      this.boardElevator(sim, edge.elevatorId, nextNode.id);
      return;
    }

    telemetry.state = current.working ? RobotState.Working : RobotState.Moving;
    telemetry.charging = false;
    const cruise = CRUISE_SPEED[sim.robot.type];
    telemetry.speed = clamp(
      telemetry.speed + (cruise - telemetry.speed) * Math.min(1, dt * 1.5),
      0,
      cruise,
    );

    const dx = nextNode.x - telemetry.pose.x;
    const dz = nextNode.z - telemetry.pose.z;
    const distance = Math.hypot(dx, dz);
    const travel = telemetry.speed * dt;
    if (distance > 0.001) {
      telemetry.pose.heading = Math.atan2(-dz, dx);
    }

    if (travel >= distance) {
      telemetry.pose.x = nextNode.x;
      telemetry.pose.z = nextNode.z;
      telemetry.odometer += distance;
      sim.nodeId = nextNode.id;
      sim.path.shift();
      if (sim.path.length === 0) {
        sim.steps.shift();
        this.prepareStep(sim);
      }
    } else {
      telemetry.pose.x += (dx / distance) * travel;
      telemetry.pose.z += (dz / distance) * travel;
      telemetry.odometer += travel;
    }

    this.updateMissionProgress(sim);
    this.rollHazards(sim, dt);
  }

  private stepRide(sim: SimRobot, dt: number) {
    const ride = sim.ride;
    const { telemetry } = sim;
    if (!ride || !telemetry.transit) {
      telemetry.state = RobotState.Moving;
      return;
    }
    ride.remaining -= dt;
    telemetry.transit.progress = clamp(1 - ride.remaining / ride.total, 0, 1);
    telemetry.speed = 0;
    telemetry.rssi = -82 + this.random.range(-4, 4);

    if (ride.remaining <= 0) {
      const target = this.graph.nodes.get(ride.targetNode);
      if (target) {
        telemetry.floorId = target.floorId;
        telemetry.pose.x = target.x;
        telemetry.pose.z = target.z;
        sim.nodeId = target.id;
      }
      sim.path.shift();
      sim.ride = null;
      telemetry.transit = null;
      telemetry.state = RobotState.Moving;
      if (sim.rideEventId !== null) {
        this.autoResolve(
          sim.rideEventId,
          "엘리베이터에 탑승해 이동을 마쳤습니다.",
        );
        sim.rideEventId = null;
      }
      if (sim.path.length === 0 && sim.steps[0]?.kind === "go") {
        sim.steps.shift();
        this.prepareStep(sim);
      }
    }
  }

  private boardElevator(sim: SimRobot, elevatorId: number, targetNode: string) {
    const { telemetry } = sim;
    const target = this.graph.nodes.get(targetNode);
    if (!target) return;
    const levelOf = (floorId: number) =>
      this.site.floors.find((floor) => floor.id === floorId)?.level ?? 0;
    const levels = Math.abs(
      levelOf(target.floorId) - levelOf(telemetry.floorId),
    );

    let total = this.random.range(6, 12) + levels * 4;
    if (this.random.chance(0.06)) {
      total += 25;
      const event = this.createEvent(sim, {
        type: EventType.ElevatorTimeout,
        severity: EventSeverity.Warning,
        message: `EV-${elevatorId} 호출 후 응답이 늦어 대기 중입니다.`,
      });
      sim.rideEventId = event.id;
    }

    sim.ride = { remaining: total, total, targetNode };
    telemetry.state = RobotState.RidingElevator;
    telemetry.speed = 0;
    telemetry.transit = {
      elevatorId,
      fromFloorId: telemetry.floorId,
      toFloorId: target.floorId,
      progress: 0,
    };
  }

  private idle(sim: SimRobot) {
    const { telemetry } = sim;
    telemetry.speed = 0;
    const dock = this.dockWaypoint(sim.robot);
    const atDock = dock !== null && sim.nodeId === dock;

    if (!atDock) {
      this.planReturn(sim);
      return;
    }

    telemetry.charging = telemetry.battery < 99.5;
    telemetry.state = telemetry.charging
      ? RobotState.Charging
      : RobotState.Idle;
    telemetry.route = [];

    const ready =
      telemetry.battery >= 45 &&
      telemetry.motorTemp < 55 &&
      this.now >= sim.nextMissionAt;
    if (ready) {
      this.startMission(sim);
    }
  }

  private rollHazards(sim: SimRobot, dt: number) {
    const { telemetry } = sim;
    if (
      telemetry.state !== RobotState.Moving &&
      telemetry.state !== RobotState.Working
    ) {
      return;
    }
    const roll = (rate: number) => this.random.chance(rate * dt);

    if (roll(HAZARD_RATE.emergencyStop)) {
      telemetry.state = RobotState.EmergencyStop;
      telemetry.eStop = true;
      telemetry.speed = 0;
      telemetry.errorCode = "SAF-001";
      if (sim.mission) this.finishMission(sim, MissionStatus.Failed);
      this.createEvent(sim, {
        type: EventType.EmergencyStop,
        severity: EventSeverity.Critical,
        message:
          "본체 비상정지 버튼이 눌렸습니다. 현장 확인 후 오류를 해제해 주세요.",
      });
      return;
    }
    if (roll(HAZARD_RATE.localization)) {
      telemetry.state = RobotState.Error;
      telemetry.lidarOk = false;
      telemetry.speed = 0;
      telemetry.errorCode = "NAV-214";
      if (sim.mission) this.finishMission(sim, MissionStatus.Failed);
      this.createEvent(sim, {
        type: EventType.LocalizationLost,
        severity: EventSeverity.Critical,
        message: "지도와 주변 환경이 맞지 않아 현재 위치를 잃었습니다.",
      });
      return;
    }
    if (roll(HAZARD_RATE.obstacle)) {
      telemetry.state = RobotState.Paused;
      telemetry.speed = 0;
      sim.pauseRemaining = this.random.range(10, 22);
      const event = this.createEvent(sim, {
        type: EventType.ObstacleBlocked,
        severity: EventSeverity.Warning,
        message: "진행 경로에 장애물이 있어 멈췄습니다.",
      });
      sim.pauseEventId = event.id;
      return;
    }
    if (roll(HAZARD_RATE.collision)) {
      telemetry.speed *= 0.2;
      const event = this.createEvent(sim, {
        type: EventType.CollisionRisk,
        severity: EventSeverity.Warning,
        message: "보행자가 1m 안으로 접근해 감속했습니다.",
      });
      this.autoResolve(event.id, "회피 주행으로 충돌 없이 지나갔습니다.");
    }
  }

  private updateVitals(sim: SimRobot, dt: number, realSeconds: number) {
    const { telemetry } = sim;
    const moving =
      telemetry.state === RobotState.Moving ||
      telemetry.state === RobotState.Working;
    const speedRatio = telemetry.speed / CRUISE_SPEED[sim.robot.type];

    // 배터리
    if (telemetry.charging) {
      telemetry.battery = clamp(telemetry.battery + 0.25 * dt, 0, 100);
    } else {
      const drain =
        telemetry.state === RobotState.Working
          ? sim.robot.type === RobotType.Cleaning
            ? 0.04
            : 0.02
          : moving
            ? 0.03
            : 0.008;
      telemetry.battery = clamp(telemetry.battery - drain * dt, 0, 100);
    }
    if (!telemetry.charging && telemetry.battery <= BATTERY_WARNING) {
      if (!sim.lowBatteryReported) {
        sim.lowBatteryReported = true;
        this.createEvent(sim, {
          type: EventType.LowBattery,
          severity: EventSeverity.Warning,
          message: `배터리가 ${Math.round(telemetry.battery)}% 남았습니다. 임무를 마치면 충전하러 갑니다.`,
        });
      }
    } else if (telemetry.battery > BATTERY_WARNING + 15) {
      sim.lowBatteryReported = false;
    }

    // 모터 온도
    const worn = WORN_MOTOR_ROBOT_NAMES.has(sim.robot.name);
    const target =
      30 + (moving ? 16 * speedRatio + (worn ? 28 : 0) : 0) + (worn ? 4 : 0);
    const rate = target > telemetry.motorTemp ? 0.012 : 0.02;
    telemetry.motorTemp += (target - telemetry.motorTemp) * rate * dt;
    if (telemetry.motorTemp >= MOTOR_TEMP_WARNING && !sim.overheatReported) {
      sim.overheatReported = true;
      this.createEvent(sim, {
        type: EventType.MotorOverheat,
        severity: EventSeverity.Warning,
        message: `구동 모터 온도가 ${telemetry.motorTemp.toFixed(1)}°C 입니다. 80°C 를 넘으면 자동으로 복귀합니다.`,
      });
    }

    // 연산 부하·통신
    telemetry.cpuLoad = clamp(
      16 +
        (moving ? 24 : telemetry.state === RobotState.RidingElevator ? 10 : 0) +
        this.random.range(-5, 9),
      3,
      99,
    );
    if (telemetry.state !== RobotState.RidingElevator) {
      const ap = telemetry.pose.x < 0 ? -16 : 16;
      const distance = Math.hypot(telemetry.pose.x - ap, telemetry.pose.z);
      telemetry.rssi = clamp(
        telemetry.rssi +
          (-38 - distance * 1.4 - telemetry.rssi) * 0.3 +
          this.random.range(-1, 1),
        -90,
        -30,
      );
    }

    telemetry.uptime += realSeconds;
    telemetry.missionId = sim.mission?.id ?? null;
    telemetry.route = this.routeOf(sim);
  }

  // ---------------------------------------------------------------- 임무

  private startMission(sim: SimRobot) {
    const { robot } = sim;
    const pois = this.graph.byKind(WaypointKind.Poi);
    const onFloor = (floorId: number) =>
      pois.filter((poi) => poi.floorId === floorId);

    let type: MissionType;
    let origin = this.graph.nodes.get(sim.nodeId);
    let destination = origin;
    const steps: Step[] = [];

    if (robot.type === RobotType.Cleaning) {
      type = MissionType.Cleaning;
      const corridor = this.graph
        .byKind(WaypointKind.Path, robot.homeFloorId)
        .sort((left, right) => left.x - right.x);
      const rooms = onFloor(robot.homeFloorId);
      const extra = [this.random.pick(rooms), this.random.pick(rooms)];
      steps.push({ kind: "go", target: corridor[0].id });
      for (const node of corridor)
        steps.push({ kind: "go", target: node.id, working: true });
      for (const room of extra)
        steps.push({ kind: "go", target: room.id, working: true });
      for (const node of [...corridor].reverse()) {
        steps.push({ kind: "go", target: node.id, working: true });
      }
      origin = corridor[0];
      destination = corridor[0];
      steps.push({ kind: "completeMission" });
    } else if (robot.type === RobotType.Guide) {
      type = MissionType.Guide;
      const desk =
        pois.find((poi) => poi.name === "안내 데스크") ??
        this.random.pick(pois);
      const candidates = pois.filter(
        (poi) => poi.id !== desk.id && poi.floorId !== 1,
      );
      origin = desk;
      destination = this.random.pick(candidates);
      steps.push(
        { kind: "go", target: desk.id },
        {
          kind: "wait",
          seconds: this.random.range(6, 12),
          state: RobotState.Working,
        },
        { kind: "go", target: destination.id },
        {
          kind: "wait",
          seconds: this.random.range(5, 9),
          state: RobotState.Working,
        },
        { kind: "completeMission" },
      );
    } else {
      type = MissionType.Delivery;
      const home = onFloor(robot.homeFloorId);
      origin = this.random.pick(home.length ? home : pois);
      const others = pois.filter(
        (poi) =>
          poi.id !== origin?.id &&
          (poi.floorId !== robot.homeFloorId || this.random.chance(0.3)),
      );
      destination = this.random.pick(others.length ? others : pois);
      steps.push(
        { kind: "go", target: origin.id },
        {
          kind: "wait",
          seconds: this.random.range(8, 14),
          state: RobotState.Working,
        },
        { kind: "go", target: destination.id },
        {
          kind: "wait",
          seconds: this.random.range(8, 14),
          state: RobotState.Working,
        },
        { kind: "completeMission" },
      );
    }

    const dock = this.dockWaypoint(robot);
    if (dock) steps.push({ kind: "go", target: dock });

    sim.steps = steps;
    sim.path = [];
    sim.missionStepTotal = steps.findIndex(
      (step) => step.kind === "completeMission",
    );
    sim.mission = {
      id: this.nextMissionId++,
      robotId: robot.id,
      type,
      status: MissionStatus.InProgress,
      origin: origin?.name ?? "-",
      destination: destination?.name ?? "-",
      progress: 0,
      createdAt: this.now,
      finishedAt: null,
    };
    sim.telemetry.charging = false;
    // 과열 이벤트는 임무 한 번에 한 번만 올립니다
    sim.overheatReported = false;
    this.prepareStep(sim);
  }

  private finishMission(sim: SimRobot, status: MissionStatus) {
    const mission = sim.mission;
    if (!mission) return;
    mission.status = status;
    mission.finishedAt = this.now;
    if (status === MissionStatus.Completed) mission.progress = 1;
    this.missions.push(mission);
    if (this.missions.length > 2000) this.missions.shift();
    sim.mission = null;
    sim.nextMissionAt = this.now + this.random.range(25, 110) * 1000;

    if (status === MissionStatus.Failed) {
      this.createEvent(sim, {
        type: EventType.MissionFailed,
        severity: EventSeverity.Info,
        message: `${mission.origin} → ${mission.destination} 임무를 마치지 못했습니다.`,
      });
    }
  }

  private planReturn(sim: SimRobot, charge = false) {
    const dock = this.dockWaypoint(sim.robot);
    sim.steps = dock ? [{ kind: "go", target: dock }] : [];
    sim.path = [];
    if (charge) {
      sim.mission = {
        id: this.nextMissionId++,
        robotId: sim.robot.id,
        type: MissionType.Charge,
        status: MissionStatus.InProgress,
        origin: this.graph.nodes.get(sim.nodeId)?.name ?? "-",
        destination:
          this.site.docks.find((item) => item.id === sim.robot.dockId)?.name ??
          "-",
        progress: 0,
        createdAt: this.now,
        finishedAt: null,
      };
      sim.steps.push({ kind: "completeMission" });
      sim.missionStepTotal = 1;
    }
  }

  private prepareStep(sim: SimRobot) {
    sim.path = [];
    const next = sim.steps[0];
    if (next?.kind === "wait") {
      sim.waitRemaining = next.seconds;
    }
  }

  private updateMissionProgress(sim: SimRobot) {
    if (!sim.mission || sim.missionStepTotal === 0) return;
    const remaining = sim.steps.findIndex(
      (step) => step.kind === "completeMission",
    );
    if (remaining === -1) return;
    sim.mission.progress = clamp(
      (sim.missionStepTotal - remaining) / sim.missionStepTotal,
      0,
      0.99,
    );
  }

  private dockWaypoint(robot: Robot): string | null {
    return (
      this.site.docks.find((dock) => dock.id === robot.dockId)?.waypointId ??
      null
    );
  }

  private routeOf(sim: SimRobot): RobotTelemetry["route"] {
    const nodes: string[] = [...sim.path];
    for (const step of sim.steps.slice(sim.path.length ? 1 : 0)) {
      if (step.kind !== "go") continue;
      const last = nodes[nodes.length - 1] ?? sim.nodeId;
      const path = this.graph.shortestPath(last, step.target);
      if (path) nodes.push(...path);
      if (nodes.length > 60) break;
    }
    return nodes
      .map((id) => this.graph.nodes.get(id))
      .filter((node): node is NonNullable<typeof node> => !!node)
      .map((node) => ({ floorId: node.floorId, x: node.x, z: node.z }));
  }

  // ---------------------------------------------------------------- 이벤트

  private createEvent(
    sim: SimRobot,
    init: {
      type: EventType;
      severity: EventSeverity;
      message: string;
      occurredAt?: number;
    },
  ): RobotEvent {
    const { telemetry } = sim;
    const event: RobotEvent = {
      id: this.nextEventId++,
      robotId: sim.robot.id,
      robotName: sim.robot.name,
      type: init.type,
      severity: init.severity,
      status: EventStatus.Open,
      floorId: telemetry.floorId,
      position: { x: telemetry.pose.x, z: telemetry.pose.z },
      message: init.message,
      occurredAt: init.occurredAt ?? this.now,
      acknowledgedAt: null,
      resolvedAt: null,
      note: null,
      snapshot: {
        state: telemetry.state,
        battery: Math.round(telemetry.battery * 10) / 10,
        speed: Math.round(telemetry.speed * 100) / 100,
        motorTemp: Math.round(telemetry.motorTemp * 10) / 10,
      },
    };
    this.events.push(event);
    this.emitEvent(event, "created");
    return event;
  }

  private autoResolve(eventId: number, note: string) {
    const event = this.getEvent(eventId);
    if (!event || event.status === EventStatus.Resolved) return;
    event.status = EventStatus.Resolved;
    event.acknowledgedAt ??= this.now;
    event.resolvedAt = this.now;
    event.note = `[자동] ${note}`;
    this.emitEvent(event, "updated");
  }

  private emitEvent(event: RobotEvent, change: "created" | "updated") {
    for (const listener of this.eventListeners) listener(event, change);
  }

  /** 지난 2주 이력. 이벤트 이력 화면이 비어 보이지 않게 채웁니다 */
  private seedPastEvents(robots: Robot[]) {
    const types: [EventType, EventSeverity, string, string][] = [
      [
        EventType.ObstacleBlocked,
        EventSeverity.Warning,
        "진행 경로에 장애물이 있어 멈췄습니다.",
        "카트가 복도에 방치돼 있어 치운 뒤 재개했습니다.",
      ],
      [
        EventType.CollisionRisk,
        EventSeverity.Warning,
        "보행자가 1m 안으로 접근해 감속했습니다.",
        "[자동] 회피 주행으로 충돌 없이 지나갔습니다.",
      ],
      [
        EventType.LowBattery,
        EventSeverity.Warning,
        "배터리가 19% 남았습니다. 임무를 마치면 충전하러 갑니다.",
        "충전 완료 확인.",
      ],
      [
        EventType.ElevatorTimeout,
        EventSeverity.Warning,
        "EV-2 호출 후 응답이 늦어 대기 중입니다.",
        "엘리베이터 점검 시간과 겹쳤습니다. 관리실 공유.",
      ],
      [
        EventType.LocalizationLost,
        EventSeverity.Critical,
        "지도와 주변 환경이 맞지 않아 현재 위치를 잃었습니다.",
        "전시관 가벽 위치 변경 반영해 지도 갱신.",
      ],
      [
        EventType.EmergencyStop,
        EventSeverity.Critical,
        "본체 비상정지 버튼이 눌렸습니다. 현장 확인 후 오류를 해제해 주세요.",
        "방문객이 호기심에 누름. 이상 없음 확인 후 해제.",
      ],
      [
        EventType.MotorOverheat,
        EventSeverity.Warning,
        "구동 모터 온도가 71.4°C 입니다. 80°C 를 넘으면 자동으로 복귀합니다.",
        "구동부 이물질 제거.",
      ],
      [
        EventType.MissionFailed,
        EventSeverity.Info,
        "물품 보관실 → 개발팀 임무를 마치지 못했습니다.",
        "수령인 부재로 반송.",
      ],
      [
        EventType.CommunicationLost,
        EventSeverity.Critical,
        "로봇과의 통신이 끊겼습니다. 마지막 위치를 확인하고 현장 점검이 필요합니다.",
        "AP 재부팅 후 복구.",
      ],
    ];
    const weights = [16, 22, 8, 6, 3, 2, 3, 5, 2];
    const totalWeight = weights.reduce((sum, value) => sum + value, 0);
    const pickType = () => {
      let roll = this.random.next() * totalWeight;
      for (let idx = 0; idx < types.length; idx += 1) {
        roll -= weights[idx];
        if (roll <= 0) return types[idx];
      }
      return types[0];
    };

    const live = robots;
    const start = this.now - 14 * 24 * 3600 * 1000;
    const count = 140;
    // 시뮬레이션 시작(미리 돌리기 시작점)보다 앞선 시각만 씁니다
    const times = Array.from({ length: count }, () => {
      const day = this.random.int(0, 14);
      const hour = this.random.int(7, 20);
      return (
        start +
        day * 24 * 3600 * 1000 +
        hour * 3600 * 1000 +
        this.random.int(0, 3599) * 1000
      );
    })
      .filter((time) => time < this.now - 10 * 60 * 1000)
      .sort((left, right) => left - right);

    for (const occurredAt of times) {
      const robot = this.random.pick(live);
      const [type, severity, message, note] = pickType();
      const floor = this.site.floors.find(
        (item) => item.id === robot.homeFloorId,
      );
      const resolvedDelay = this.random.int(1, 40) * 60 * 1000;
      this.events.push({
        id: this.nextEventId++,
        robotId: robot.id,
        robotName: robot.name,
        type,
        severity,
        status: EventStatus.Resolved,
        floorId: floor?.id ?? 1,
        position: { x: this.random.pick([-20, -12, 4, 12, 20]), z: 0 },
        message,
        occurredAt,
        acknowledgedAt: occurredAt + Math.min(resolvedDelay, 5 * 60 * 1000),
        resolvedAt: occurredAt + resolvedDelay,
        note,
        snapshot: {
          state: RobotState.Moving,
          battery: Math.round(this.random.range(15, 90)),
          speed: Math.round(this.random.range(0, 1.2) * 100) / 100,
          motorTemp: Math.round(this.random.range(34, 72) * 10) / 10,
        },
      });
    }
  }

  // ---------------------------------------------------------------- 발행

  private publish() {
    const next = new Map<number, RobotTelemetry>();
    for (const [id, sim] of this.robots) {
      const telemetry: RobotTelemetry = {
        ...sim.telemetry,
        pose: { ...sim.telemetry.pose },
        transit: sim.telemetry.transit ? { ...sim.telemetry.transit } : null,
        battery: Math.round(sim.telemetry.battery * 10) / 10,
        motorTemp: Math.round(sim.telemetry.motorTemp * 10) / 10,
        cpuLoad: Math.round(sim.telemetry.cpuLoad),
        rssi: Math.round(sim.telemetry.rssi),
        speed: Math.round(sim.telemetry.speed * 100) / 100,
      };
      next.set(id, telemetry);
      this.robotListeners.get(id)?.forEach((listener) => listener(telemetry));
    }
    this.snapshot = next;
    this.fleetListeners.forEach((listener) => listener(next));
  }

  /** 디버그용: 지금 진행 중인 임무 */
  getActiveMissions(): Mission[] {
    return [...this.robots.values()]
      .map((sim) => sim.mission)
      .filter((mission): mission is Mission => mission !== null);
  }
}
