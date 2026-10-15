import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { NumberParam, useQueryParam } from "use-query-params";
import { EuiCallOut, EuiEmptyPrompt, EuiLoadingSpinner } from "@elastic/eui";
import {
  BATTERY_WARNING,
  EventTypeLabel,
  AIChatAskResource,
  MissionListResource,
  MOTOR_TEMP_CRITICAL,
  MOTOR_TEMP_WARNING,
  Page,
  PagePath,
  RobotCommandResource,
  RobotHealth,
  RobotListResource,
  RobotState,
  RobotStateLabel,
  RobotTypeLabel,
  SelectorContext,
  SiteMapResource,
  ToastContext,
  formatDuration,
  formatRelative,
  thousandSeparator,
  useRobotTelemetry,
  useTelemetryHistory,
} from "core";
import SensorPanel, {
  SensorPanelGrid,
  SensorPanelSection,
} from "components/common/SensorPanel";
import {
  BatteryMeter,
  HealthBadge,
  RobotTypeText,
  SEVERITY_COLOR,
  batteryColor,
  useFleetView,
} from "components/common/robot";
import { FloorMap2D } from "./FloorMap2D";
import { MissionHistory } from "./MissionHistory";
import { RobotControlBar } from "./RobotControlBar";
import { RobotSelector } from "./RobotSelector";
import { RobotViewer3D } from "./RobotViewer3D";
import { TrendChart } from "./TrendChart";
import AIAssistantChat from "components/robots/ai/AIAssistantChat";
import styles from "./MonitoringView.module.scss";

interface MonitoringViewProps {
  robotListResource: RobotListResource;
  siteMapResource: SiteMapResource;
  missionListResource: MissionListResource | null;
  commandResource: RobotCommandResource | null;
  aiChatResource: AIChatAskResource | null;
}

function healthOfValue(value: number, warning: number, danger: number) {
  if (value >= danger) return RobotHealth.Danger;
  if (value >= warning) return RobotHealth.Warning;
  return RobotHealth.Normal;
}

export default function MonitoringView({
  robotListResource,
  siteMapResource,
  missionListResource,
  commandResource,
  aiChatResource,
}: MonitoringViewProps) {
  const history = useHistory();
  const { data: site } = siteMapResource;
  const { views } = useFleetView(robotListResource.items);
  const { selected, setSelected } = useContext(SelectorContext);
  const { addToast } = useContext(ToastContext);
  const [robotIdParam, setRobotIdParam] = useQueryParam("robotId", NumberParam);

  // 주소 → 지난번에 보던 로봇 → 첫 로봇 순으로 고릅니다
  const robotId =
    robotIdParam ??
    (views.some((view) => view.robot.id === selected.robot?.id)
      ? (selected.robot?.id ?? null)
      : (views[0]?.robot.id ?? null));

  const view = views.find((item) => item.robot.id === robotId) ?? null;
  const telemetry = useRobotTelemetry(robotId);
  const history30 = useTelemetryHistory(robotId);

  const setMissionRobot = missionListResource?.setRobotId;
  useEffect(() => {
    setMissionRobot?.(robotId);
  }, [robotId, setMissionRobot]);

  const handleSelect = useCallback(
    (id: number) => {
      setRobotIdParam(id, "replaceIn");
      const target = views.find((item) => item.robot.id === id);
      if (target) setSelected({ robot: { id, name: target.robot.name } });
    },
    [setRobotIdParam, setSelected, views],
  );

  const others = useMemo(
    () =>
      views
        .filter((item) => item.telemetry)
        .map((item) => ({
          id: item.robot.id,
          name: item.robot.name,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          telemetry: item.telemetry!,
        })),
    [views],
  );

  const [mapFloorId, setMapFloorId] = useState<number | null>(null);
  const followFloorId =
    telemetry?.transit?.toFloorId ?? telemetry?.floorId ?? null;
  const shownFloorId = mapFloorId ?? followFloorId;
  useEffect(() => setMapFloorId(null), [robotId]);

  if (robotListResource.loading && views.length === 0) {
    return (
      <div className={styles.center}>
        <EuiLoadingSpinner size="xl" />
      </div>
    );
  }

  if (views.length === 0) {
    return (
      <EuiEmptyPrompt
        iconType="search"
        title={<h2>등록된 로봇이 없습니다</h2>}
        body={<p>로봇 관리에서 로봇을 먼저 등록해 주세요.</p>}
      />
    );
  }

  const robot = view?.robot;
  const health = view?.health ?? RobotHealth.Offline;
  const floorName = (floorId?: number | null) =>
    site?.floors.find((floor) => floor.id === floorId)?.name ?? "-";
  const missions = missionListResource?.items ?? [];
  const activeMission = missions.find(
    (mission) => mission.id === telemetry?.missionId,
  );
  const active =
    telemetry?.state === RobotState.Moving ||
    telemetry?.state === RobotState.Working;

  return (
    <div className={styles.container}>
      <RobotSelector
        views={views}
        floors={site?.floors ?? []}
        selectedId={robotId}
        onSelect={handleSelect}
      />

      <main className={styles.main}>
        {!robot ? (
          <EuiEmptyPrompt title={<h2>로봇을 골라 주세요</h2>} />
        ) : (
          <>
            <header className={styles.header}>
              <div className={styles.identity}>
                <h1 className={styles.name}>{robot.name}</h1>
                <HealthBadge health={health} />
                <span className={styles.meta}>
                  <RobotTypeText type={robot.type} /> · {robot.manufacturer}{" "}
                  {robot.model} · S/N {robot.serialNo}
                </span>
              </div>
              <RobotControlBar
                robotName={robot.name}
                telemetry={telemetry}
                commandResource={commandResource}
                onResult={(ok, message) =>
                  addToast(ok ? "success" : "error", {
                    title: ok ? message : "명령을 보내지 못했습니다.",
                    error: ok ? undefined : message,
                  })
                }
              />
            </header>

            {telemetry && !telemetry.online && (
              <EuiCallOut
                color="danger"
                iconType="offline"
                size="s"
                className={styles.callout}
                title={`통신이 끊겼습니다 — ${formatRelative(telemetry.timestamp)} 마지막 수신. 아래 값은 마지막으로 받은 값입니다.`}
              />
            )}

            <div className={styles.scroll}>
              <SensorPanelGrid columns={4}>
                <SensorPanel
                  span={1}
                  rowSpan={2}
                  className={styles.modelPanel}
                  title="모델"
                  subtitle={`${RobotTypeLabel[robot.type]} 로봇 · 끌어서 돌려 보기`}
                >
                  <div className={styles.viewer}>
                    <RobotViewer3D
                      type={robot.type}
                      health={health}
                      active={active}
                    />
                  </div>
                  <div className={styles.viewerInfo}>
                    <BatteryMeter
                      battery={telemetry?.battery}
                      charging={telemetry?.charging}
                      width={80}
                    />
                    <span>펌웨어 {robot.firmwareVersion}</span>
                  </div>
                </SensorPanel>

                <SensorPanel
                  span={2}
                  rowSpan={2}
                  title="위치"
                  subtitle={
                    telemetry?.transit
                      ? `엘리베이터로 ${floorName(telemetry.transit.fromFloorId)} → ${floorName(telemetry.transit.toFloorId)} 이동 중`
                      : `${floorName(telemetry?.floorId)} · 실시간`
                  }
                  actions={
                    site && (
                      <div
                        className={styles.floorTabs}
                        role="group"
                        aria-label="층"
                      >
                        {[...site.floors].reverse().map((floor) => (
                          <button
                            type="button"
                            key={floor.id}
                            aria-pressed={shownFloorId === floor.id}
                            className={
                              shownFloorId === floor.id
                                ? styles.floorActive
                                : ""
                            }
                            onClick={() =>
                              setMapFloorId(
                                floor.id === followFloorId ? null : floor.id,
                              )
                            }
                          >
                            {floor.name}
                          </button>
                        ))}
                      </div>
                    )
                  }
                >
                  <div className={styles.mapBox}>
                    {site && shownFloorId !== null ? (
                      <FloorMap2D
                        site={site}
                        floorId={shownFloorId}
                        robotId={robot.id}
                        telemetry={telemetry}
                        health={health}
                        others={others}
                      />
                    ) : (
                      <EuiLoadingSpinner />
                    )}
                  </div>
                </SensorPanel>

                <SensorPanel
                  span={1}
                  rowSpan={2}
                  className={styles.chatPanel}
                  title="AI 채팅"
                  subtitle={`${robot.name} 상태 연결됨`}
                >
                  {aiChatResource ? (
                    <AIAssistantChat
                      key={robot.id}
                      chatResource={aiChatResource}
                      robotId={robot.id}
                    />
                  ) : (
                    <p className={styles.chatUnavailable}>
                      AI 채팅 권한이 없습니다.
                    </p>
                  )}
                </SensorPanel>

                <SensorPanel
                  title="배터리"
                  subtitle={telemetry?.charging ? "충전 중" : "사용 중"}
                  headline={{
                    value: (
                      <span
                        style={{
                          color: telemetry
                            ? batteryColor(telemetry.battery)
                            : undefined,
                        }}
                      >
                        {telemetry ? `${telemetry.battery.toFixed(0)}%` : "-"}
                      </span>
                    ),
                  }}
                  gauge={
                    telemetry && {
                      percent: telemetry.battery,
                      status:
                        telemetry.battery <= 10
                          ? RobotHealth.Danger
                          : telemetry.battery <= BATTERY_WARNING
                            ? RobotHealth.Warning
                            : RobotHealth.Normal,
                      caption: `주의 ${BATTERY_WARNING}% · 위험 10% 이하`,
                    }
                  }
                />

                <SensorPanel
                  title="모터 온도"
                  subtitle="구동부"
                  headline={{
                    value: telemetry
                      ? `${telemetry.motorTemp.toFixed(1)}°C`
                      : "-",
                    status: telemetry
                      ? healthOfValue(
                          telemetry.motorTemp,
                          MOTOR_TEMP_WARNING,
                          MOTOR_TEMP_CRITICAL,
                        )
                      : undefined,
                  }}
                  gauge={
                    telemetry && {
                      percent: (telemetry.motorTemp / 100) * 100,
                      status: healthOfValue(
                        telemetry.motorTemp,
                        MOTOR_TEMP_WARNING,
                        MOTOR_TEMP_CRITICAL,
                      ),
                      caption: `주의 ${MOTOR_TEMP_WARNING}°C · 위험 ${MOTOR_TEMP_CRITICAL}°C`,
                    }
                  }
                />

                <SensorPanel title="운행" subtitle="실시간">
                  <dl className={styles.facts}>
                    <dt>상태</dt>
                    <dd>
                      {telemetry ? RobotStateLabel[telemetry.state] : "-"}
                    </dd>
                    <dt>속도</dt>
                    <dd>
                      {telemetry ? `${telemetry.speed.toFixed(2)} m/s` : "-"}
                    </dd>
                    <dt>누적 주행</dt>
                    <dd>
                      {telemetry
                        ? `${thousandSeparator(Math.round(telemetry.odometer / 1000))} km`
                        : "-"}
                    </dd>
                    <dt>누적 가동</dt>
                    <dd>
                      {telemetry ? formatDuration(telemetry.uptime) : "-"}
                    </dd>
                  </dl>
                </SensorPanel>

                <SensorPanel title="시스템" subtitle="센서·통신">
                  <dl className={styles.facts}>
                    <dt>Wi-Fi</dt>
                    <dd>
                      {telemetry ? `${telemetry.rssi} dBm` : "-"}
                      {telemetry && telemetry.rssi < -75 && (
                        <span className={styles.warn}> 약함</span>
                      )}
                    </dd>
                    <dt>CPU</dt>
                    <dd>{telemetry ? `${telemetry.cpuLoad}%` : "-"}</dd>
                    <dt>LiDAR</dt>
                    <dd
                      className={
                        telemetry && !telemetry.lidarOk ? styles.danger : ""
                      }
                    >
                      {telemetry ? (telemetry.lidarOk ? "정상" : "이상") : "-"}
                    </dd>
                    <dt>비상정지</dt>
                    <dd className={telemetry?.eStop ? styles.danger : ""}>
                      {telemetry ? (telemetry.eStop ? "눌림" : "해제") : "-"}
                    </dd>
                    {telemetry?.errorCode && (
                      <>
                        <dt>오류 코드</dt>
                        <dd className={styles.danger}>{telemetry.errorCode}</dd>
                      </>
                    )}
                  </dl>
                </SensorPanel>

                <SensorPanelSection title="최근 30분 추이" tag="4초 간격" />
                <SensorPanel span={2} title="배터리 · 모터 온도">
                  <TrendChart
                    data={history30}
                    series={[
                      { key: "battery", label: "배터리(%)", color: "#10b981" },
                      {
                        key: "motorTemp",
                        label: "모터 온도(°C)",
                        color: "#f59e0b",
                        axis: "right",
                      },
                    ]}
                    leftDomain={{ min: 0, max: 100 }}
                    rightDomain={{ min: 20, max: 90 }}
                  />
                </SensorPanel>
                <SensorPanel span={2} title="속도 · Wi-Fi 신호">
                  <TrendChart
                    data={history30}
                    series={[
                      { key: "speed", label: "속도(m/s)", color: "#00e5ff" },
                      {
                        key: "rssi",
                        label: "Wi-Fi(dBm)",
                        color: "#7c77f4",
                        axis: "right",
                      },
                    ]}
                    leftDomain={{ min: 0, max: 1.5 }}
                    rightDomain={{ min: -95, max: -30 }}
                    leftFormat={(value) => value.toFixed(1)}
                  />
                </SensorPanel>

                <SensorPanelSection title="임무 · 이벤트" />

                <SensorPanel
                  span={2}
                  title="임무"
                  subtitle={
                    activeMission
                      ? `진행 중: ${activeMission.origin} → ${activeMission.destination}`
                      : "진행 중인 임무 없음"
                  }
                >
                  <MissionHistory
                    missions={missions}
                    loading={missionListResource?.loading ?? false}
                  />
                </SensorPanel>

                <SensorPanel
                  title="미해결 이벤트"
                  subtitle={`${view?.openEvents.length ?? 0}건`}
                  actions={
                    <button
                      type="button"
                      className={styles.link}
                      onClick={() =>
                        history.push(
                          `${PagePath[Page.Events][1]}?robotId=${robot.id}`,
                        )
                      }
                    >
                      이력 보기 →
                    </button>
                  }
                >
                  {view && view.openEvents.length > 0 ? (
                    <ul className={styles.events}>
                      {view.openEvents.slice(0, 5).map((event) => (
                        <li key={event.id}>
                          <button
                            type="button"
                            style={{
                              borderLeftColor: SEVERITY_COLOR[event.severity],
                            }}
                            onClick={() =>
                              history.push(
                                `${PagePath[Page.Events][1]}/${event.id}`,
                              )
                            }
                          >
                            <strong>{EventTypeLabel[event.type]}</strong>
                            <span>{formatRelative(event.occurredAt)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.none}>처리할 이벤트가 없습니다.</p>
                  )}
                </SensorPanel>
              </SensorPanelGrid>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
