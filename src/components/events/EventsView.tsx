import { useEffect, useMemo, useRef, useState } from "react";
import { Route } from "react-router-dom";
import {
  ArrayParam,
  NumberParam,
  StringParam,
  useQueryParams,
} from "use-query-params";
import { EuiSpacer } from "@elastic/eui";
import {
  EventListResource,
  EventSeverity,
  EventStatus,
  EventUpdateResource,
  EventViewResource,
  RobotListResource,
  SiteMapResource,
  useEventStream,
} from "core";
import { PageShell, SummaryStat } from "components/common/PageShell";
import { EventFilterBar, RangeKey, rangeOf } from "./EventFilterBar";
import { EventTable } from "./EventTable";
import { EventDetailFlyout } from "./EventDetailFlyout";

interface EventsViewProps {
  basePath: string;
  eventListResource: EventListResource;
  eventViewResource: EventViewResource;
  eventUpdateResource: EventUpdateResource | null;
  robotListResource: RobotListResource | null;
  siteMapResource: SiteMapResource;
}

export default function EventsView({
  basePath,
  eventListResource,
  eventViewResource,
  eventUpdateResource,
  robotListResource,
  siteMapResource,
}: EventsViewProps) {
  const { filter, setFilter, setActive, reload, summary } = eventListResource;
  const [params, setParams] = useQueryParams({
    status: ArrayParam,
    robotId: NumberParam,
    range: StringParam,
  });
  const [rangeKey, setRangeKey] = useState<RangeKey>(
    (params.range as RangeKey) ??
      (params.status || params.robotId ? "all" : "7d"),
  );

  // 주소의 조건(헤더 알림·모니터링에서 넘어온 경우)으로 시작합니다
  useEffect(() => {
    setFilter((previous) => ({
      ...previous,
      statuses: (params.status?.filter(Boolean) as EventStatus[]) ?? [],
      robotId: params.robotId ?? null,
      range: rangeOf(rangeKey),
    }));
    setActive(true);
    return () => setActive(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeRange = (key: RangeKey) => {
    setRangeKey(key);
    setFilter((previous) => ({ ...previous, range: rangeOf(key) }));
    setParams({ range: key }, "replaceIn");
  };

  // 새 이벤트가 생기면 목록을 다시 받습니다 (잠깐 모아서 한 번)
  const reloadTimer = useRef<number>();
  useEventStream(() => {
    window.clearTimeout(reloadTimer.current);
    reloadTimer.current = window.setTimeout(reload, 800);
  });
  useEffect(() => () => window.clearTimeout(reloadTimer.current), []);

  const robotItems = robotListResource?.items;
  const setRobotsActive = robotListResource?.setActive;
  useEffect(() => {
    setRobotsActive?.(true);
    return () => setRobotsActive?.(false);
  }, [setRobotsActive]);

  const onlyOpen =
    filter.statuses.length === 1 && filter.statuses[0] === EventStatus.Open;
  const onlyCritical =
    filter.severities.length === 1 &&
    filter.severities[0] === EventSeverity.Critical &&
    filter.statuses.length === 2;

  const summaryNode = useMemo(
    () => (
      <>
        <SummaryStat
          label="조회된 이벤트"
          value={`${eventListResource.count}건`}
        />
        <SummaryStat
          label="미확인"
          value={`${summary.open}건`}
          tone={summary.open > 0 ? "danger" : "default"}
          active={onlyOpen}
          onClick={() => {
            const next = onlyOpen ? [] : [EventStatus.Open];
            setFilter({ ...filter, statuses: next, severities: [] });
            setParams({ status: next }, "replaceIn");
          }}
        />
        <SummaryStat
          label="조치 안 된 위험"
          value={`${summary.critical}건`}
          tone={summary.critical > 0 ? "danger" : "default"}
          active={onlyCritical}
          onClick={() =>
            setFilter(
              onlyCritical
                ? { ...filter, severities: [], statuses: [] }
                : {
                    ...filter,
                    severities: [EventSeverity.Critical],
                    statuses: [EventStatus.Open, EventStatus.Acknowledged],
                  },
            )
          }
        />
      </>
    ),
    [
      eventListResource.count,
      summary,
      filter,
      onlyOpen,
      onlyCritical,
      setFilter,
      setParams,
    ],
  );

  return (
    <PageShell
      title="이벤트 이력"
      description="로봇이 올린 경보와 처리 내역입니다. 행을 누르면 위치와 처리 이력을 볼 수 있습니다."
      summary={summaryNode}
    >
      <EventFilterBar
        filter={filter}
        onChange={(next) => {
          setFilter(next);
          setParams(
            {
              robotId: next.robotId ?? undefined,
              status: next.statuses.length ? next.statuses : undefined,
            },
            "replaceIn",
          );
        }}
        robots={robotItems ?? []}
        rangeKey={rangeKey}
        onRangeKeyChange={changeRange}
      />
      <EuiSpacer size="m" />
      <EventTable
        basePath={basePath}
        eventListResource={eventListResource}
        floors={siteMapResource.data?.floors ?? []}
      />
      <Route path={`${basePath}/:eventId`}>
        <EventDetailFlyout
          basePath={basePath}
          site={siteMapResource.data}
          eventViewResource={eventViewResource}
          eventUpdateResource={eventUpdateResource}
          onChanged={reload}
        />
      </Route>
    </PageShell>
  );
}
