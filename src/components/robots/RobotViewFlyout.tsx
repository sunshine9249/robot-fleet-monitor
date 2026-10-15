import { useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiDescriptionList,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiTitle,
} from "@elastic/eui";
import {
  Page,
  PagePath,
  RobotStateLabel,
  RobotTypeLabel,
  RobotViewResource,
  SiteMap,
  formatDateTime,
  resolveRobotHealth,
  useRobotTelemetry,
} from "core";
import {
  ViewFlyout,
  ViewFlyoutBody,
  ViewFlyoutFooter,
  ViewFlyoutHeader,
} from "components/common/ViewFlyout";
import {
  BatteryMeter,
  HealthBadge,
  RobotTypeText,
} from "components/common/robot";

interface RobotViewFlyoutProps {
  basePath: string;
  site: SiteMap | null;
  robotViewResource: RobotViewResource;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (robotId: number) => void;
}

export function RobotViewFlyout({
  basePath,
  site,
  robotViewResource,
  canEdit,
  canDelete,
  onDelete,
}: RobotViewFlyoutProps) {
  const history = useHistory();
  const { robotId } = useParams<{ robotId: string }>();
  const { setRobotId, data: robot, error } = robotViewResource;
  const telemetry = useRobotTelemetry(Number(robotId));

  useEffect(() => {
    setRobotId(Number(robotId));
  }, [robotId, setRobotId]);

  const close = () => history.push(basePath);
  const dock = site?.docks.find((item) => item.id === robot?.dockId);
  const dockFloor = site?.floors.find((item) => item.id === dock?.floorId);
  const nowFloor = site?.floors.find((item) => item.id === telemetry?.floorId);

  return (
    <ViewFlyout onClose={close} size={520} aria-labelledby="robotViewTitle">
      {!robot || robot.id !== Number(robotId) ? (
        <ViewFlyoutBody>
          {error ? (
            <EuiCallOut color="danger" title={error} />
          ) : (
            <EuiLoadingSpinner size="l" />
          )}
        </ViewFlyoutBody>
      ) : (
        <>
          <ViewFlyoutHeader
            id="robotViewTitle"
            title={robot.name}
            subtitle={`${RobotTypeLabel[robot.type]} 로봇 · ${robot.manufacturer} ${robot.model}`}
            rightSection={
              <HealthBadge health={resolveRobotHealth(telemetry ?? null, [])} />
            }
          />
          <ViewFlyoutBody>
            <EuiTitle size="xxs">
              <h3>지금 상태</h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiDescriptionList
              type="column"
              compressed={true}
              columnWidths={[1, 2]}
              listItems={[
                {
                  title: "운행",
                  description: telemetry
                    ? RobotStateLabel[telemetry.state]
                    : "-",
                },
                {
                  title: "위치",
                  description: nowFloor
                    ? `${nowFloor.name} ${nowFloor.label}`
                    : "-",
                },
                {
                  title: "배터리",
                  description: (
                    <BatteryMeter
                      battery={telemetry?.battery}
                      charging={telemetry?.charging}
                      width={100}
                    />
                  ),
                },
                {
                  title: "오늘 끝낸 임무",
                  description: `${robot.todayMissionCount}건`,
                },
                {
                  title: "누적 주행",
                  description: `${robot.odometerKm.toLocaleString()} km`,
                },
              ]}
            />

            <EuiSpacer size="l" />
            <EuiTitle size="xxs">
              <h3>등록 정보</h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiDescriptionList
              type="column"
              compressed={true}
              columnWidths={[1, 2]}
              listItems={[
                {
                  title: "종류",
                  description: <RobotTypeText type={robot.type} />,
                },
                { title: "시리얼 번호", description: robot.serialNo },
                { title: "펌웨어", description: robot.firmwareVersion || "-" },
                {
                  title: "충전 스테이션",
                  description: dock
                    ? `${dock.name} (${dockFloor?.name} ${dockFloor?.label})`
                    : "-",
                },
                { title: "설치일", description: robot.installedAt },
                {
                  title: "등록일",
                  description: formatDateTime(robot.createdAt, "YYYY-MM-DD"),
                },
                { title: "메모", description: robot.memo || "-" },
              ]}
            />
          </ViewFlyoutBody>
          <ViewFlyoutFooter
            left={
              <>
                <EuiButtonEmpty
                  size="s"
                  onClick={() =>
                    history.push(
                      `${PagePath[Page.Monitoring][1]}?robotId=${robot.id}`,
                    )
                  }
                >
                  모니터링
                </EuiButtonEmpty>
                <EuiButtonEmpty
                  size="s"
                  onClick={() =>
                    history.push(
                      `${PagePath[Page.Events][1]}?robotId=${robot.id}&range=all`,
                    )
                  }
                >
                  이벤트 이력
                </EuiButtonEmpty>
              </>
            }
          >
            {canDelete && (
              <EuiButton
                size="s"
                color="danger"
                onClick={() => onDelete(robot.id)}
              >
                삭제
              </EuiButton>
            )}
            {canEdit && (
              <EuiButton
                size="s"
                fill={true}
                onClick={() => history.push(`${basePath}/${robot.id}/edit`)}
              >
                수정
              </EuiButton>
            )}
          </ViewFlyoutFooter>
        </>
      )}
    </ViewFlyout>
  );
}
