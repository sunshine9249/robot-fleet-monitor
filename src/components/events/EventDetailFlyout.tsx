import { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFormRow,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiTextArea,
  EuiTitle,
} from "@elastic/eui";
import {
  EventStatus,
  EventTypeLabel,
  EventUpdateResource,
  EventViewResource,
  Page,
  PagePath,
  RobotHealth,
  RobotStateLabel,
  SiteMap,
  ToastContext,
  formatDateTime,
  formatDuration,
  useEventStream,
} from "core";
import {
  EventStatusBadge,
  HEALTH_COLOR,
  SEVERITY_COLOR,
  SeverityBadge,
} from "components/common/robot";
import {
  ViewFlyout,
  ViewFlyoutBody,
  ViewFlyoutFooter,
  ViewFlyoutHeader,
} from "components/common/ViewFlyout";
import { FloorMap2D } from "components/monitoring/FloorMap2D";
import styles from "./EventDetailFlyout.module.scss";

interface EventDetailFlyoutProps {
  basePath: string;
  site: SiteMap | null;
  eventViewResource: EventViewResource;
  eventUpdateResource: EventUpdateResource | null;
  onChanged: () => void;
}

export function EventDetailFlyout({
  basePath,
  site,
  eventViewResource,
  eventUpdateResource,
  onChanged,
}: EventDetailFlyoutProps) {
  const history = useHistory();
  const { eventId } = useParams<{ eventId: string }>();
  const { setEventId, data: event, loading, error, reload } = eventViewResource;
  const { addToast } = useContext(ToastContext);
  const [note, setNote] = useState("");

  useEffect(() => {
    setEventId(Number(eventId));
    return () => setEventId(null);
  }, [eventId, setEventId]);

  useEffect(() => {
    setNote(event?.note ?? "");
  }, [event?.id, event?.note]);

  // 열어 둔 사이 상태가 바뀌면(자동 해소 등) 다시 받습니다
  useEventStream((changed) => {
    if (changed.id === Number(eventId)) reload();
  });

  const close = () => history.push(`${basePath}${history.location.search}`);

  const update = async (status?: EventStatus) => {
    if (!eventUpdateResource || !event) return;
    try {
      await eventUpdateResource.updateEvent(event.id, {
        ...(status ? { status } : {}),
        note: note.trim() || null,
      });
      addToast("success", {
        title:
          status === EventStatus.Resolved
            ? "조치 완료로 처리했습니다."
            : status === EventStatus.Acknowledged
              ? "확인 처리했습니다."
              : "조치 내용을 저장했습니다.",
      });
      reload();
      onChanged();
    } catch (caught) {
      addToast("error", {
        title: "처리하지 못했습니다.",
        error: (caught as Error).message,
      });
    }
  };

  const floor = site?.floors.find((item) => item.id === event?.floorId);

  return (
    <ViewFlyout onClose={close} size={560} aria-labelledby="eventDetailTitle">
      {!event ? (
        <ViewFlyoutBody>
          {error ? (
            <EuiCallOut color="danger" title={error} />
          ) : (
            <div className={styles.center}>
              <EuiLoadingSpinner size="l" />
            </div>
          )}
        </ViewFlyoutBody>
      ) : (
        <>
          <ViewFlyoutHeader
            id="eventDetailTitle"
            title={EventTypeLabel[event.type]}
            subtitle={`#${event.id} · ${event.robotName} · ${formatDateTime(event.occurredAt)}`}
            rightSection={
              <div className={styles.badges}>
                <SeverityBadge severity={event.severity} />
                <EventStatusBadge status={event.status} />
              </div>
            }
          />
          <ViewFlyoutBody>
            <p
              className={styles.message}
              style={{ borderLeftColor: SEVERITY_COLOR[event.severity] }}
            >
              {event.message}
            </p>

            <EuiSpacer size="m" />
            <EuiTitle size="xxs">
              <h3>발생 위치</h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <div className={styles.map}>
              {site && floor ? (
                <FloorMap2D
                  site={site}
                  floorId={floor.id}
                  robotId={null}
                  health={RobotHealth.Normal}
                  marker={{
                    x: event.position.x,
                    z: event.position.z,
                    color: SEVERITY_COLOR[event.severity],
                    label: event.robotName,
                  }}
                />
              ) : (
                loading && <EuiLoadingSpinner />
              )}
            </div>
            <p className={styles.caption}>
              {floor ? `${floor.name} ${floor.label}` : "-"} · (
              {event.position.x.toFixed(1)}, {event.position.z.toFixed(1)}) m
            </p>

            <EuiSpacer size="m" />
            <EuiTitle size="xxs">
              <h3>발생 시점 값</h3>
            </EuiTitle>
            <dl className={styles.snapshot}>
              <div>
                <dt>상태</dt>
                <dd>{RobotStateLabel[event.snapshot.state]}</dd>
              </div>
              <div>
                <dt>배터리</dt>
                <dd>{event.snapshot.battery}%</dd>
              </div>
              <div>
                <dt>속도</dt>
                <dd>{event.snapshot.speed} m/s</dd>
              </div>
              <div>
                <dt>모터 온도</dt>
                <dd>{event.snapshot.motorTemp}°C</dd>
              </div>
            </dl>

            <EuiSpacer size="m" />
            <EuiTitle size="xxs">
              <h3>처리 이력</h3>
            </EuiTitle>
            <ol className={styles.timeline}>
              <li style={{ color: SEVERITY_COLOR[event.severity] }}>
                <strong>발생</strong> {formatDateTime(event.occurredAt)}
              </li>
              <li className={event.acknowledgedAt ? "" : styles.pending}>
                <strong>확인</strong>{" "}
                {event.acknowledgedAt
                  ? `${formatDateTime(event.acknowledgedAt)} (${formatDuration((event.acknowledgedAt - event.occurredAt) / 1000)} 뒤)`
                  : "아직"}
              </li>
              <li
                className={event.resolvedAt ? "" : styles.pending}
                style={
                  event.resolvedAt
                    ? { color: HEALTH_COLOR[RobotHealth.Normal] }
                    : undefined
                }
              >
                <strong>조치 완료</strong>{" "}
                {event.resolvedAt
                  ? `${formatDateTime(event.resolvedAt)} (${formatDuration((event.resolvedAt - event.occurredAt) / 1000)} 뒤)`
                  : "아직"}
              </li>
            </ol>

            <EuiSpacer size="m" />
            <EuiFormRow label="조치 내용" fullWidth={true}>
              <EuiTextArea
                fullWidth={true}
                rows={3}
                value={note}
                maxLength={500}
                placeholder={
                  eventUpdateResource
                    ? "현장 확인 결과와 조치 내용을 남겨 주세요."
                    : "조치 내용을 남길 권한이 없습니다."
                }
                readOnly={!eventUpdateResource}
                onChange={(changeEvent) => setNote(changeEvent.target.value)}
              />
            </EuiFormRow>
          </ViewFlyoutBody>
          <ViewFlyoutFooter
            left={
              <EuiButtonEmpty
                size="s"
                onClick={() =>
                  history.push(
                    `${PagePath[Page.Monitoring][1]}?robotId=${event.robotId}`,
                  )
                }
              >
                {event.robotName} 모니터링 →
              </EuiButtonEmpty>
            }
          >
            {eventUpdateResource && (
              <>
                {event.status === EventStatus.Open && (
                  <EuiButton
                    size="s"
                    onClick={() => update(EventStatus.Acknowledged)}
                    isLoading={eventUpdateResource.loading}
                  >
                    확인 처리
                  </EuiButton>
                )}
                {event.status !== EventStatus.Resolved ? (
                  <EuiButton
                    size="s"
                    fill={true}
                    onClick={() => update(EventStatus.Resolved)}
                    isLoading={eventUpdateResource.loading}
                  >
                    조치 완료
                  </EuiButton>
                ) : (
                  <EuiButton
                    size="s"
                    onClick={() => update()}
                    isLoading={eventUpdateResource.loading}
                    isDisabled={note === (event.note ?? "")}
                  >
                    조치 내용 저장
                  </EuiButton>
                )}
              </>
            )}
          </ViewFlyoutFooter>
        </>
      )}
    </ViewFlyout>
  );
}
