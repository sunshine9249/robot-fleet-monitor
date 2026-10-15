import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EuiCallOut, EuiLoadingSpinner } from "@elastic/eui";
import {
  MissionListResource,
  MissionStatus,
  RobotHealth,
  RobotListResource,
  SelectorContext,
  SiteMapResource,
  DashboardSummaryResource,
  useRobotTelemetry,
} from "core";
import { useFleetView } from "components/common/robot";
import { Viewer3DResetButton } from "components/model/controls/Viewer3DResetButton";
import { Viewer3DHint } from "components/model/controls/Viewer3DHint";
import {
  Building3DMap,
  DETAIL_WIDGET,
  type Building3DMapHandle,
  type ScreenPosition,
} from "./building3d";
import { DashboardHeader, type FleetSummary } from "./DashboardHeader";
import { EventFeedPanel } from "./EventFeedPanel";
import { RobotListCard } from "./RobotListCard";
import { RobotLabelOverlay } from "./RobotLabelOverlay";
import { RobotDetailWidget } from "./RobotDetailWidget";
import styles from "./DashboardView.module.scss";

interface DashboardViewProps {
  robotListResource: RobotListResource;
  siteMapResource: SiteMapResource;
  summaryResource: DashboardSummaryResource | null;
  missionListResource: MissionListResource | null;
}

export default function DashboardView({
  robotListResource,
  siteMapResource,
  summaryResource,
  missionListResource,
}: DashboardViewProps) {
  const { data: site, error: siteError } = siteMapResource;
  const { views } = useFleetView(robotListResource.items);
  const { setSelected } = useContext(SelectorContext);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [focusFloorId, setFocusFloorId] = useState<number | null>(null);
  const [healthFilter, setHealthFilter] = useState<RobotHealth | null>(null);
  const [listCollapsed, setListCollapsed] = useState(false);
  const [panelsHidden, setPanelsHidden] = useState(false);
  const [labelPositions, setLabelPositions] = useState<ScreenPosition[]>([]);
  const [compassRotation, setCompassRotation] = useState(0);
  const [widgetPosition, setWidgetPosition] = useState<{
    pX: number;
    pY: number;
  } | null>(null);
  const [widgetResetKey, setWidgetResetKey] = useState(0);
  const mapRef = useRef<Building3DMapHandle>(null);

  const selectedView =
    views.find((view) => view.robot.id === selectedId) ?? null;
  // 경로선은 자주 바뀌므로 선택한 로봇만 따로 구독합니다
  const selectedTelemetry = useRobotTelemetry(selectedId);

  const setMissionRobot = missionListResource?.setRobotId;
  useEffect(() => {
    setMissionRobot?.(selectedId);
  }, [selectedId, setMissionRobot]);
  const activeMission =
    missionListResource?.items.find(
      (mission) =>
        mission.robotId === selectedId &&
        mission.status === MissionStatus.InProgress,
    ) ?? null;

  const fleet = useMemo<FleetSummary>(() => {
    const counts = {
      [RobotHealth.Normal]: 0,
      [RobotHealth.Warning]: 0,
      [RobotHealth.Danger]: 0,
      [RobotHealth.Offline]: 0,
    };
    let busy = 0;
    let charging = 0;
    let batterySum = 0;
    let batteryCount = 0;
    for (const view of views) {
      counts[view.health] += 1;
      if (view.telemetry?.missionId != null) busy += 1;
      if (view.telemetry?.charging) charging += 1;
      if (view.telemetry?.online) {
        batterySum += view.telemetry.battery;
        batteryCount += 1;
      }
    }
    const total = views.length;
    const available = counts[RobotHealth.Normal] + counts[RobotHealth.Warning];
    return {
      total,
      counts,
      busy,
      charging,
      averageBattery: batteryCount ? batterySum / batteryCount : null,
      availability: total ? (available / total) * 100 : 0,
    };
  }, [views]);

  const mapRobots = useMemo(
    () =>
      views.map((view) => ({
        id: view.robot.id,
        type: view.robot.type,
        health: view.health,
      })),
    [views],
  );

  const handleSelect = useCallback(
    (robotId: number) => {
      setSelectedId((previous) => (previous === robotId ? null : robotId));
      const view = views.find((item) => item.robot.id === robotId);
      if (view) setSelected({ robot: { id: robotId, name: view.robot.name } });
    },
    [views, setSelected],
  );

  const handleHealthClick = useCallback((health: RobotHealth) => {
    setHealthFilter((previous) => (previous === health ? null : health));
    setListCollapsed(false);
    setPanelsHidden(false);
  }, []);

  const handleResetView = useCallback(() => {
    mapRef.current?.reset();
    setWidgetPosition(null);
    setFocusFloorId(null);
    setWidgetResetKey((previous) => previous + 1);
  }, []);

  // 층을 골라 보는 중이면 다른 층 로봇의 이름표는 숨깁니다
  const hiddenIds = useMemo(() => {
    if (focusFloorId === null) return undefined;
    return new Set(
      views
        .filter((view) => view.telemetry?.floorId !== focusFloorId)
        .map((view) => view.robot.id),
    );
  }, [views, focusFloorId]);

  return (
    <div className={styles.container}>
      <DashboardHeader
        fleet={fleet}
        summary={summaryResource?.data ?? null}
        panelsHidden={panelsHidden}
        onTogglePanels={() => setPanelsHidden((previous) => !previous)}
        onHealthClick={handleHealthClick}
      />

      <div className={styles.content}>
        <div
          className={`${styles.leftPanel} ${panelsHidden ? styles.panelHidden : ""}`}
        >
          <EventFeedPanel onRobotFocus={setSelectedId} />
        </div>

        <div className={styles.centerArea}>
          {siteError && (
            <EuiCallOut
              className={styles.callout}
              color="danger"
              title="시설 지도를 불러오지 못했습니다."
              role="alert"
            >
              {siteError}
            </EuiCallOut>
          )}

          <div
            className={`${styles.mapToolbar} ${panelsHidden ? styles.panelHidden : ""}`}
          >
            <div className={styles.toolbarInfo}>
              <h2 className={styles.siteName}>{site?.name}</h2>
              {site && (
                <div
                  className={styles.floorChips}
                  role="group"
                  aria-label="층 선택"
                >
                  <button
                    type="button"
                    aria-pressed={focusFloorId === null}
                    className={focusFloorId === null ? styles.chipActive : ""}
                    onClick={() => setFocusFloorId(null)}
                  >
                    전체
                  </button>
                  {[...site.floors].reverse().map((floor) => {
                    const count = views.filter(
                      (view) => view.telemetry?.floorId === floor.id,
                    ).length;
                    return (
                      <button
                        type="button"
                        key={floor.id}
                        aria-pressed={focusFloorId === floor.id}
                        className={
                          focusFloorId === floor.id ? styles.chipActive : ""
                        }
                        onClick={() =>
                          setFocusFloorId((previous) =>
                            previous === floor.id ? null : floor.id,
                          )
                        }
                        title={`${floor.name} ${floor.label}`}
                      >
                        {floor.name}
                        <span className={styles.chipCount}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className={styles.toolbarHint}>
                <Viewer3DHint />
              </div>
            </div>
            <Viewer3DResetButton onClick={handleResetView} />
          </div>

          <div
            className={`${styles.compassBox} ${panelsHidden ? styles.panelHidden : ""}`}
            role="img"
            aria-label="지도 방위"
          >
            <div
              className={styles.compassDial}
              style={{ transform: `rotate(${-compassRotation}deg)` }}
            >
              <span className={`${styles.compassDirection} ${styles.north}`}>
                N
              </span>
              <span className={`${styles.compassDirection} ${styles.east}`}>
                E
              </span>
              <span className={`${styles.compassDirection} ${styles.south}`}>
                S
              </span>
              <span className={`${styles.compassDirection} ${styles.west}`}>
                W
              </span>
              <span className={styles.compassCenter} />
            </div>
          </div>

          {site ? (
            <>
              <Building3DMap
                ref={mapRef}
                site={site}
                robots={mapRobots}
                selectedRobotId={selectedId}
                selectedTelemetry={selectedTelemetry}
                focusFloorId={focusFloorId}
                onRobotClick={handleSelect}
                onPositionsChange={setLabelPositions}
                onCompassRotationChange={setCompassRotation}
              />
              <RobotLabelOverlay
                views={views}
                positions={labelPositions}
                selectedId={selectedId}
                hiddenIds={hiddenIds}
                onSelect={handleSelect}
              />
            </>
          ) : (
            !siteError && (
              <div className={styles.loading}>
                <EuiLoadingSpinner size="xl" aria-label="지도 불러오는 중" />
              </div>
            )
          )}

          {selectedView && site && (
            <RobotDetailWidget
              view={selectedView}
              mission={activeMission}
              floors={site.floors}
              initialPosition={
                widgetPosition ?? {
                  pX: Math.max(16, window.innerWidth / 2 - 160),
                  pY: Math.max(
                    80,
                    window.innerHeight / 2 - 220 - DETAIL_WIDGET.offsetY,
                  ),
                }
              }
              onClose={() => setSelectedId(null)}
              onPositionChange={setWidgetPosition}
              resetSignal={widgetResetKey}
            />
          )}
        </div>

        <div
          className={`${styles.rightPanel} ${panelsHidden ? styles.panelHidden : ""}`}
        >
          <RobotListCard
            views={views}
            floors={site?.floors ?? []}
            loading={robotListResource.loading}
            selectedId={selectedId}
            healthFilter={healthFilter}
            onHealthFilterChange={setHealthFilter}
            onSelect={handleSelect}
            collapsed={listCollapsed}
            onCollapsedChange={setListCollapsed}
          />
        </div>
      </div>
    </div>
  );
}
